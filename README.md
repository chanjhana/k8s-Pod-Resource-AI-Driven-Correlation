# EdgeMind — Multi-Agent AI for Pod Resource Correlation
### Industrial Pump Station Condition Monitoring on ABB Edgenius (k3s/k3d)

EdgeMind is an **infra-only anomaly detection system** for Kubernetes-based industrial workloads. It runs 4 domain agents that read standard infrastructure metrics (CPU, memory, network, filesystem, PVC) from Prometheus — zero modification to the monitored workload, zero custom instrumentation.

When correlated faults occur across pods, EdgeMind publishes structured findings to Redis with evidence, baseline values, and ETAs. A Claude AI orchestrator layer (Phase 2) correlates findings across agents to surface root-cause chains.

---

## Architecture

```
┌─────────────────────────── pump-station namespace ───────────────────────────┐
│                                                                               │
│  sensor-sim-1 ──┐                                                             │
│  sensor-sim-2 ──┼──► opc-ua-collector ──► data-historian (InfluxDB)          │
│  sensor-sim-3 ──┘         │                      │                            │
│                            │              feature-extractor                   │
│                            │                      │                            │
│                            │              health-scorer ──► alert-manager     │
│                            │                      │                            │
│                            └──────────────► batch-sync ──► mock-upload        │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── monitoring namespace ─────────────────────────────┐
│                                                                               │
│  Prometheus (node-exporter + kube-state-metrics)                              │
│       │                                                                        │
│       ▼                                                                        │
│  edgemind-agents ──► Redis (edgemind:findings)                                │
│    ├── CPU agent                                                               │
│    ├── Memory agent                                                            │
│    ├── Storage agent                                                           │
│    └── Network + Log agent                                                    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

Three OPC-UA pump simulators feed a 9-pod pipeline. EdgeMind watches the whole stack from the outside using Prometheus metrics — no sidecars, no SDK changes, no workload involvement.

---

## Pipeline Components

| Component | Role | Tech |
|---|---|---|
| **sensor-sim-1/2/3** | OPC-UA pump simulators with fault injection API | asyncua, FastAPI |
| **opc-ua-collector** | Subscribes to OPC-UA, writes to InfluxDB | asyncua, influxdb-client |
| **data-historian** | Time-series store | InfluxDB 2.x |
| **feature-extractor** | Computes bearing health, vibration trend, temp rate | scipy, numpy |
| **health-scorer** | Classifies pump state (HEALTHY/WARNING/CRITICAL) | pure Python |
| **alert-manager** | Enriches alerts, deduplicates, writes JSONL to PVC-2 | FastAPI |
| **batch-sync** | Bulk Parquet export to PVC-2, simulates cloud upload | pandas, pyarrow |
| **mock-upload** | Simulated cloud upload endpoint | FastAPI |

---

## EdgeMind Detection Agents

All agents read from **Prometheus only** — no direct connection to InfluxDB, no workload APIs.

### CPU Agent
Detects: `cpu_spike` · `cpu_throttle` · `cpu_contention`

Z-score anomaly detection over a 75-sample rolling window. Requires 2 consecutive cycles above threshold before firing (suppresses single-scrape noise). Classifies as node-level contention when multiple pods spike simultaneously with low CPU idle ratio.

### Memory Agent
Detects: `memory_leak` · `pre_oom` · `oomkill` · `node_pressure` · `memory_step`

Linear regression (scipy.stats.linregress) over a 20-sample window to compute RSS slope in MB/min. OOMKill classified by checking pre-restart working_set/limit ratio. PRE_OOM includes ETA projection at current growth rate.

### Storage Agent
Detects: `io_saturation` · `write_burst` · `pvc_fill` · `pvc_contention` · `restart_io`

Z-score on write rate window for burst detection. Linear regression on PVC used_bytes for time-to-full forecast. PVC-to-pod mapping built from Kubernetes API, refreshed every 5 minutes (immediate on startup). Contention detected when ≥2 pods with high I/O share the same PVC.

### Network + Log Agent
Detects: `network_flood` · `packet_drop` · `dependency_confirm` · `log_error_surge` · `timeout_pattern` · `pump_health_crit` · `crash_loop` · `k8s_oomkill`

P75 baseline for flood detection. Dependency confirmation by correlating TX spike on one pod with RX spike on another within a lag window. Parses health-scorer structured logs for pump-level fault signatures. Watches Kubernetes events for CrashLoopBackOff, OOMKilling, BackOff.

---

## Finding Schema

Every finding published to Redis includes:

```json
{
  "finding_id": "uuid",
  "timestamp": "2026-06-13T15:54:44+00:00",
  "agent": "cpu | memory | storage | network_log",
  "anomaly_type": "cpu_spike",
  "severity": "warning | critical | info",
  "pod": "opc-ua-collector",
  "namespace": "pump-station",
  "current_value": 0.82,
  "baseline_value": 0.05,
  "deviation": "Z-score 4.2σ above 75-cycle baseline",
  "evidence": ["...", "..."],
  "affected_pods": [],
  "pvc_name": null,
  "eta_minutes": null
}
```

---

## Fault Scenarios (for demo)

| ID | Fault | What gets detected |
|---|---|---|
| **IC1** | `bearing_fault` on pump2 → health-scorer writes → feature-extractor reads | CPU spike + memory leak on feature-extractor; InfluxDB bulk read contention |
| **IC2** | `flood` on pump2 → opc-ua-collector overwhelmed → alert-manager + batch-sync compete on PVC-2 | Network flood, write burst, PVC contention |
| **IC3** | `flood` + fault export → batch-sync 500MB–1GB write | Storage I/O saturation, PVC fill TTF forecast |

Fault injection via HTTP API on each sensor-sim container:
```bash
# Inject bearing fault on pump 2
kubectl exec -n pump-station \
  $(kubectl get pod -n pump-station -l app=sensor-sim-2 -o jsonpath='{.items[0].metadata.name}') \
  -- curl -s -X POST http://localhost:8081/inject \
  -H 'Content-Type: application/json' \
  -d '{"mode":"bearing_fault","duration_s":300}'
```

---

## Test Coverage

```
pytest edgemind_agents/tests/test_agents.py -v
# 23 tests — CPU (6), Memory (4), Storage (6), Network/Log (6), Schema (1)
# All agents mocked — no cluster required to run tests
```

```
pytest sensor_sim/tests/ -v          # 45 tests — fault engine, OPC-UA server, inject API
pytest feature_extractor/tests/ -v   # feature math
pytest health_scorer/tests/ -v       # scoring logic
pytest alert_manager/tests/ -v       # enrichment + dedup
pytest batch_sync/tests/ -v          # export state, parquet round-trip
```

---

## Repository Structure

```
k8s-Pod-Resource-AI-Driven-Correlation/
├── k8s/                         ← Kubernetes manifests
│   ├── namespaces.yaml
│   ├── pump-station/            ← 10 service manifests + PVC/secrets/quota
│   └── monitoring/              ← Redis, edgemind-agents, RBAC
├── edgemind_agents/             ← EdgeMind detection agents (Layer 1)
│   ├── agents/                  ← cpu, memory, storage, network_log, base
│   ├── anomaly_types.py
│   ├── models.py
│   └── tests/
├── sensor_sim/                  ← OPC-UA pump simulators (Layer 0)
├── opc_ua_collector/            ← OPC-UA → InfluxDB
├── feature_extractor/           ← InfluxDB → pump features
├── health_scorer/               ← features → pump health state
├── alert_manager/               ← health state → enriched alerts
├── batch_sync/                  ← fault-triggered Parquet export
├── mock_upload/                 ← simulated cloud upload endpoint
├── common/                      ← shared contract (schema, constants)
├── deploy.sh                    ← one-command cluster deploy
└── SETUP.md                     ← deployment and operations guide
```

---

## Project Status

| Layer | Component | Status |
|---|---|---|
| **Layer 0** | sensor-sim (3 pumps, OPC-UA + fault inject API) | ✅ Complete |
| **Layer 0** | opc-ua-collector (OPC-UA → InfluxDB) | ✅ Complete |
| **Layer 0** | data-historian (InfluxDB 2.x) | ✅ Running |
| **Layer 0** | feature-extractor | ✅ Complete |
| **Layer 0** | health-scorer | ✅ Complete |
| **Layer 0** | alert-manager | ✅ Complete |
| **Layer 0** | batch-sync + mock-upload | ✅ Complete |
| **Layer 1** | EdgeMind agents (4 agents, 23 finding types) | ✅ Complete |
| **Layer 1** | Finding schema (evidence, baseline, deviation, ETA) | ✅ Complete |
| **Layer 2** | Claude AI orchestrator (cross-agent correlation) | 🔲 Phase 2 |
| **Layer 2** | Dashboard / server | 🔲 Phase 2 |