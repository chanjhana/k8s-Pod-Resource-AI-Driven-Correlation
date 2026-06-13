#!/usr/bin/env bash
# deploy.sh — EdgeMind full cluster deploy
#
# Usage:
#   bash deploy.sh              # build images + full deploy
#   bash deploy.sh --skip-build # skip docker build (images already built)
#
# Run from repo root.

set -euo pipefail

CLUSTER_NAME="edgemind"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()  { echo -e "${RED}[error]${NC} $*"; exit 1; }

SKIP_BUILD=false
[[ "${1:-}" == "--skip-build" ]] && SKIP_BUILD=true

# ── 0. Sanity checks ─────────────────────────────────────────────────────────
command -v k3d     >/dev/null || die "k3d not found — brew install k3d"
command -v kubectl >/dev/null || die "kubectl not found — brew install kubectl"
command -v helm    >/dev/null || die "helm not found — brew install helm"
command -v docker  >/dev/null || die "docker not found"

# ── 1. Cluster: start if stopped, skip if already running ────────────────────
if k3d cluster list 2>/dev/null | grep -q "^${CLUSTER_NAME}"; then
    if k3d cluster list | grep "^${CLUSTER_NAME}" | grep -q "0/1"; then
        log "Starting existing cluster '${CLUSTER_NAME}' (state preserved)..."
        k3d cluster start "$CLUSTER_NAME"
        log "Done. Pods will be Running within ~30s."
        log "  kubectl get pods -n pump-station"
        log "  kubectl get pods -n monitoring"
        exit 0
    else
        warn "Cluster '${CLUSTER_NAME}' is already running. Nothing to do."
        warn "To force a full redeploy: k3d cluster delete ${CLUSTER_NAME} && bash deploy.sh"
        exit 0
    fi
fi

log "Creating k3d cluster '${CLUSTER_NAME}'..."
k3d cluster create "$CLUSTER_NAME" \
    --agents 0 \
    --k3s-arg "--disable=traefik@server:0"

kubectl config use-context "k3d-${CLUSTER_NAME}"
log "Waiting for node to be ready..."
kubectl wait --for=condition=Ready node --all --timeout=60s

# ── 2. Build images ───────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
    log "Building Docker images..."
    docker build -t edgemind/sensor-sim:dev      ./sensor_sim/
    docker build -t edgemind/opc-ua-collector:dev  -f opc_ua_collector/Dockerfile .
    docker build -t edgemind/feature-extractor:dev -f feature_extractor/Dockerfile .
    docker build -t edgemind/health-scorer:dev     -f health_scorer/Dockerfile .
    docker build -t edgemind/alert-manager:dev     -f alert_manager/Dockerfile .
    docker build -t edgemind/batch-sync:dev        -f batch_sync/Dockerfile .
    docker build -t edgemind/mock-upload:dev       -f mock_upload/Dockerfile .
    docker build -t edgemind/agents:dev            -f edgemind_agents/Dockerfile .
else
    warn "Skipping build — using existing local images."
fi

# ── 3. Import images into k3d ─────────────────────────────────────────────────
log "Importing images into k3d (this takes ~1-2 min)..."
k3d image import \
    edgemind/sensor-sim:dev \
    edgemind/opc-ua-collector:dev \
    edgemind/feature-extractor:dev \
    edgemind/health-scorer:dev \
    edgemind/alert-manager:dev \
    edgemind/batch-sync:dev \
    edgemind/mock-upload:dev \
    edgemind/agents:dev \
    -c "$CLUSTER_NAME"

# ── 4. Namespaces ─────────────────────────────────────────────────────────────
log "Creating namespaces..."
kubectl apply -f k8s/namespaces.yaml

# ── 4b. InfluxDB (data-historian) ────────────────────────────────────────────
log "Installing InfluxDB (data-historian)..."
helm repo add influxdata https://helm.influxdata.com/ 2>/dev/null || true
helm repo update

helm upgrade --install data-historian influxdata/influxdb2 \
    --namespace pump-station \
    --set adminUser.organization=edgemind \
    --set adminUser.bucket=pump_station \
    --set adminUser.token=edgemind-dev-token \
    --set persistence.size=2Gi \
    --set resources.limits.memory=512Mi \
    --set resources.limits.cpu=500m \
    --wait --timeout=120s

# ── 5. Pump-station ───────────────────────────────────────────────────────────
log "Deploying pump-station services..."
kubectl apply -f k8s/pump-station/00-pvc.yaml
kubectl apply -f k8s/pump-station/01-secrets.yaml
kubectl apply -f k8s/pump-station/02-resource-quota.yaml
kubectl apply -f k8s/pump-station/

log "Waiting for pump-station rollouts..."
kubectl rollout status deployment -n pump-station --timeout=120s

# ── 6. Prometheus stack ───────────────────────────────────────────────────────
log "Installing kube-prometheus-stack (helm)..."
helm repo add prometheus-community \
    https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo update

helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    --set alertmanager.enabled=false \
    --set grafana.enabled=false \
    --set prometheus.prometheusSpec.retention=2h \
    --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
    --set prometheus.prometheusSpec.resources.limits.memory=512Mi \
    --wait --timeout=180s

log "Scaling down prometheus-operator (not needed after Prometheus is running)..."
kubectl scale deployment monitoring-kube-prometheus-operator \
    -n monitoring --replicas=0

# ── 7. Monitoring stack ───────────────────────────────────────────────────────
log "Deploying Redis + edgemind-agents..."
kubectl apply -f k8s/monitoring/

log "Waiting for Redis..."
kubectl rollout status deployment/redis -n monitoring --timeout=60s

log "Waiting for edgemind-agents (up to 2 min for Python startup)..."
kubectl rollout status deployment/edgemind-agents -n monitoring --timeout=120s

# ── 8. Final status ───────────────────────────────────────────────────────────
echo ""
log "════════════════════════════════════════"
log "Cluster status:"
echo ""
kubectl get pods -n pump-station
echo ""
kubectl get pods -n monitoring
echo ""

REDIS_POD=$(kubectl get pod -n monitoring -l app=redis \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [[ -n "$REDIS_POD" ]]; then
    FINDINGS=$(kubectl exec -n monitoring "$REDIS_POD" \
        -- redis-cli LLEN edgemind:findings 2>/dev/null || echo "0")
    log "Findings in Redis: ${FINDINGS}"
fi

log "Deploy complete. See SETUP.md for next steps."