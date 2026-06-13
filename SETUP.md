# EdgeMind — Setup & Deployment Guide

## How state persistence works

Understanding this saves a lot of pain:

| Action | Outcome | Need to redeploy? |
|---|---|---|
| `k3d cluster stop edgemind` → `k3d cluster start edgemind` | etcd state in Docker volumes — all pods preserved | **No.** Pods come back automatically within ~30s |
| Mac sleep / wake (OrbStack running) | Same as stop/start — OrbStack keeps the VM alive | **No** |
| OrbStack VM restart (Settings → restart) | k3d containers restart, Docker volumes intact, etcd preserved | **No** |
| `k3d cluster delete edgemind` → `k3d cluster create` | etcd wiped, fresh cluster | **Yes — full redeploy** |
| Cluster creation after resource crash | Fresh cluster (this is what happened during the crash) | **Yes — full redeploy** |

**TL;DR:** Only a cluster deletion requires redeploy. Stop/start is safe.

---

## Day-to-day workflow

```bash
# Morning
k3d cluster start edgemind
kubectl get pods -n pump-station   # all Running within ~30s
kubectl get pods -n monitoring     # edgemind-agents, prometheus, redis

# End of day
k3d cluster stop edgemind
```

Check findings are flowing:
```bash
kubectl exec -n monitoring \
  $(kubectl get pod -n monitoring -l app=redis -o jsonpath='{.items[0].metadata.name}') \
  -- redis-cli LLEN edgemind:findings
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| OrbStack | latest | https://orbstack.dev |
| k3d | ≥ 5.x | `brew install k3d` |
| kubectl | any | `brew install kubectl` |
| helm | ≥ 3.x | `brew install helm` |
| Docker | bundled with OrbStack | — |

**OrbStack memory:** Set to ≥ 6 GB in OrbStack → Settings → System → Memory. The full stack uses ~3.4 GB at limits, ~1.8 GB at requests. Running below 6 GB causes the Prometheus operator to OOMKill repeatedly.

---

## First-time deploy

### Step 1 — Build all images

Run from repo root:

```bash
docker build -t edgemind/sensor-sim:dev      ./sensor_sim/
docker build -t edgemind/opc-ua-collector:dev -f opc_ua_collector/Dockerfile .
docker build -t edgemind/feature-extractor:dev -f feature_extractor/Dockerfile .
docker build -t edgemind/health-scorer:dev    -f health_scorer/Dockerfile .
docker build -t edgemind/alert-manager:dev    -f alert_manager/Dockerfile .
docker build -t edgemind/batch-sync:dev       -f batch_sync/Dockerfile .
docker build -t edgemind/mock-upload:dev      -f mock_upload/Dockerfile .
docker build -t edgemind/agents:dev           -f edgemind_agents/Dockerfile .
```

### Step 2 — Create cluster

```bash
k3d cluster create edgemind \
    --agents 0 \
    --k3s-arg "--disable=traefik@server:0"

kubectl config use-context k3d-edgemind
kubectl wait --for=condition=Ready node --all --timeout=60s
```

### Step 3 — Import images

k3d's container runtime is isolated from your local Docker daemon. Images must be explicitly imported after every cluster creation.

```bash
k3d image import \
    edgemind/sensor-sim:dev \
    edgemind/opc-ua-collector:dev \
    edgemind/feature-extractor:dev \
    edgemind/health-scorer:dev \
    edgemind/alert-manager:dev \
    edgemind/batch-sync:dev \
    edgemind/mock-upload:dev \
    edgemind/agents:dev \
    -c edgemind
```

This step is only needed after cluster creation, not after stop/start.

### Step 4 — Namespaces

```bash
kubectl apply -f k8s/namespaces.yaml
```

### Step 5 — Pump-station services

```bash
kubectl apply -f k8s/pump-station/00-pvc.yaml
kubectl apply -f k8s/pump-station/01-secrets.yaml
kubectl apply -f k8s/pump-station/02-resource-quota.yaml
kubectl apply -f k8s/pump-station/

kubectl rollout status deployment -n pump-station --timeout=120s
kubectl get pods -n pump-station   # expect 10/10 Running
```

### Step 6 — Prometheus stack

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    --set alertmanager.enabled=false \
    --set grafana.enabled=false \
    --set prometheus.prometheusSpec.retention=2h \
    --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
    --set prometheus.prometheusSpec.resources.limits.memory=512Mi \
    --wait --timeout=120s
```

Scale down the operator after Prometheus is running — it reconciles CRDs but isn't needed for scraping, and consumes memory that causes OOMKills on a constrained node:

```bash
kubectl scale deployment monitoring-kube-prometheus-operator -n monitoring --replicas=0
```

### Step 7 — Redis + EdgeMind agents

```bash
kubectl apply -f k8s/monitoring/

kubectl rollout status deployment/redis -n monitoring --timeout=60s
kubectl rollout status deployment/edgemind-agents -n monitoring --timeout=120s
kubectl get pods -n monitoring
```

### One-command alternative

```bash
bash deploy.sh              # builds images + full deploy from scratch
bash deploy.sh --skip-build # skips docker build, assumes images already built
```

`deploy.sh` also handles the "already running" case — if the cluster is stopped it just starts it, if it's running it exits early.

---

## Verify everything is working

```bash
# 1. All pods running
kubectl get pods -n pump-station
kubectl get pods -n monitoring

# 2. Findings accumulating in Redis
kubectl exec -n monitoring \
  $(kubectl get pod -n monitoring -l app=redis -o jsonpath='{.items[0].metadata.name}') \
  -- redis-cli LLEN edgemind:findings

# 3. Sample a finding
kubectl exec -n monitoring \
  $(kubectl get pod -n monitoring -l app=redis -o jsonpath='{.items[0].metadata.name}') \
  -- redis-cli LRANGE edgemind:findings 0 0 \
  | python3 -m json.tool

# 4. Prometheus NOT scraping InfluxDB (infra-only claim)
kubectl port-forward svc/monitoring-kube-prometheus-prometheus 9090:9090 -n monitoring &
sleep 5
curl -s http://localhost:9090/api/v1/targets | python3 -c "
import sys, re
jobs = re.findall(r'\"job\":\"([^\"]+)\"', sys.stdin.read())
influx = [j for j in set(jobs) if 'influx' in j.lower()]
print('PASS — not scraping InfluxDB' if not influx else f'FAIL — {influx}')
"
kill %1
```

---

## Updating a single component

When you change agent code, only rebuild and reimport that image — no cluster recreation, no redeploy of other services:

```bash
# Example: update edgemind-agents
docker build -t edgemind/agents:dev -f edgemind_agents/Dockerfile .
k3d image import edgemind/agents:dev -c edgemind
kubectl rollout restart deployment/edgemind-agents -n monitoring
kubectl rollout status deployment/edgemind-agents -n monitoring
```

Same pattern for any pump-station service:

```bash
docker build -t edgemind/<service>:dev -f <service>/Dockerfile .
k3d image import edgemind/<service>:dev -c edgemind
kubectl rollout restart deployment/<service> -n pump-station
```

---

## Injecting faults for the demo

```bash
# Get the inject URL for a sensor sim
PUMP2_POD=$(kubectl get pod -n pump-station -l app=sensor-sim-2 -o jsonpath='{.items[0].metadata.name}')

# Bearing fault — axial vibration rises 0.8 → 4.8 mm/s over 5 min
kubectl exec -n pump-station $PUMP2_POD -- \
  curl -s -X POST http://localhost:8080/inject \
  -H 'Content-Type: application/json' \
  -d '{"mode":"bearing_fault","duration_s":300}'

# Flood mode — 10x emission rate, triggers batch-sync write burst + PVC contention
kubectl exec -n pump-station $PUMP2_POD -- \
  curl -s -X POST http://localhost:8081/inject \
  -H 'Content-Type: application/json' \
  -d '{"mode":"flood"}'

# Clear fault
kubectl exec -n pump-station $PUMP2_POD -- \
  curl -s -X POST http://localhost:8081/inject \
  -H 'Content-Type: application/json' \
  -d '{"mode":"clear"}'
```

Watch findings appear in Redis within one scrape interval (~15s):

```bash
watch -n 5 'kubectl exec -n monitoring \
  $(kubectl get pod -n monitoring -l app=redis -o jsonpath="{.items[0].metadata.name}") \
  -- redis-cli LLEN edgemind:findings'
```

---

## Troubleshooting

### ErrImageNeverPull
k3d uses `imagePullPolicy: Never` for `:dev` images. The image was not imported.
```bash
k3d image import edgemind/<service>:dev -c edgemind
kubectl rollout restart deployment/<service> -n <namespace>
```

### Redis CrashLoopBackOff — liveness probe timeout
The exec probe (`redis-cli ping`) times out under CPU throttling. The manifest uses `tcpSocket` instead — if you see this again, check `k8s/monitoring/redis.yaml` has:
```yaml
livenessProbe:
  tcpSocket:
    port: 6379
  timeoutSeconds: 5
```

### edgemind-agents restarts every ~60-70s
Probe timeout. Python startup takes ~10s under 200m CPU. Manifest should have:
```yaml
livenessProbe:
  initialDelaySeconds: 60
  timeoutSeconds: 5
readinessProbe:
  initialDelaySeconds: 20
  timeoutSeconds: 5
```

### prometheus-operator CrashLoopBackOff
OOMKill from memory pressure. Scale it down — it's not needed once Prometheus is running:
```bash
kubectl scale deployment monitoring-kube-prometheus-operator -n monitoring --replicas=0
```

### edgemind-agents ConnectionRefusedError on Redis startup
Timing race — agents pod started before Redis was ready. Just restart:
```bash
kubectl rollout restart deployment/edgemind-agents -n monitoring
```

### JSON parse error on Prometheus targets API
The `/api/v1/targets` response is ~300KB and contains control characters. Use regex instead of json.load:
```bash
curl -s http://localhost:9090/api/v1/targets | python3 -c "
import sys, re
jobs = re.findall(r'\"job\":\"([^\"]+)\"', sys.stdin.read())
print(set(jobs))
"
```