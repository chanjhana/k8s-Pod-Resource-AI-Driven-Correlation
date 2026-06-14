"""
dependency_graph.py — auto-discovers pod dependency topology from K8s metadata.

Reads Service and Endpoint objects from pump-station namespace.
Builds a directed graph: pod A → pod B if A's service endpoints include B.

Also encodes the known pipeline topology from the design doc as a fallback
in case the K8s discovery doesn't capture all edges (e.g. OPC-UA traffic
doesn't go through K8s Services).
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional

from kubernetes import client as k8s_client

log = logging.getLogger(__name__)

REFRESH_INTERVAL_S = 300  # 5 minutes

# Known pipeline from design doc — these edges always exist
# regardless of K8s Service topology
KNOWN_PIPELINE = [
    ("sensor-sim-1", "opc-ua-collector"),
    ("sensor-sim-2", "opc-ua-collector"),
    ("sensor-sim-3", "opc-ua-collector"),
    ("opc-ua-collector", "data-historian-influxdb2"),
    ("data-historian-influxdb2", "feature-extractor"),
    ("data-historian-influxdb2", "batch-sync"),
    ("feature-extractor", "data-historian-influxdb2"),  # writes back
    ("feature-extractor", "health-scorer"),             # via InfluxDB
    ("health-scorer", "alert-manager"),
    ("health-scorer", "batch-sync"),
    ("batch-sync", "mock-upload"),
]

# Pod role descriptions for LLM context
POD_ROLES = {
    "sensor-sim-1": "OPC-UA pump simulator for Pump 1 (primary, 75kW). Emits vibration, temperature, RPM at 1Hz.",
    "sensor-sim-2": "OPC-UA pump simulator for Pump 2 (secondary, 45kW). Primary fault injection target. Can flood at 10Hz.",
    "sensor-sim-3": "OPC-UA pump simulator for Pump 3 (dosing, 7.5kW, 960RPM). Different baseline from pumps 1-2.",
    "opc-ua-collector": "Subscribes to all 3 OPC-UA sensors. Single process — natural bottleneck during flood. Writes to InfluxDB.",
    "data-historian-influxdb2": "InfluxDB 2.x time-series database. Stores pump_telemetry, pump_features, pump_health. Periodic TSM compaction creates I/O spikes.",
    "feature-extractor": "Reads 5min telemetry from InfluxDB every 30s. Computes bearing health, vibration trend, axial dominance. Writes pump_features.",
    "health-scorer": "Reads pump_features every 30s. Classifies HEALTHY/WARNING/CRITICAL. Triggers alert-manager and batch-sync on threshold crossing.",
    "alert-manager": "Receives alerts from health-scorer. Enriches and writes JSONL to PVC-2. Exposes REST API for dashboard.",
    "batch-sync": "Bulk Parquet export to PVC-2. Triggered by health-scorer on fault. Fault exports are 50-100MB (up to 1GB at 10Hz).",
    "mock-upload": "Simulates cloud upload endpoint. Receives Parquet from batch-sync, discards bytes.",
}


class DependencyGraph:
    def __init__(self, k8s_v1: Optional[k8s_client.CoreV1Api] = None):
        self._k8s = k8s_v1
        self._edges: List[tuple] = list(KNOWN_PIPELINE)
        self._last_refresh: float = 0.0
        self._graph_json: dict = self._build_json()

    def _discover_from_k8s(self) -> List[tuple]:
        """Discover edges from K8s Service/Endpoint objects."""
        if self._k8s is None:
            return []
        try:
            edges = []
            services = self._k8s.list_namespaced_service("pump-station")
            endpoints = self._k8s.list_namespaced_endpoints("pump-station")

            ep_map = {ep.metadata.name: ep for ep in endpoints.items}

            for svc in services.items:
                svc_name = svc.metadata.name
                ep = ep_map.get(svc_name)
                if not ep or not ep.subsets:
                    continue
                # Pods that expose this service
                for subset in ep.subsets:
                    for addr in (subset.addresses or []):
                        if addr.target_ref:
                            pod_name_prefix = addr.target_ref.name.rsplit("-", 2)[0]
                            # Callers of this service → pod edges
                            # (We can't know callers from K8s, so use known pipeline)
                            edges.append((svc_name, pod_name_prefix))
            return edges
        except Exception as e:
            log.warning("K8s dependency discovery failed: %s", e)
            return []

    def _build_json(self) -> dict:
        nodes = set()
        for src, dst in self._edges:
            nodes.add(src)
            nodes.add(dst)

        return {
            "nodes": [
                {
                    "id": n,
                    "role": POD_ROLES.get(n, "Unknown pod"),
                }
                for n in sorted(nodes)
            ],
            "edges": [
                {"source": src, "target": dst}
                for src, dst in self._edges
            ],
        }

    def refresh(self) -> None:
        """Refresh graph from K8s (called periodically)."""
        now = time.monotonic()
        if now - self._last_refresh < REFRESH_INTERVAL_S:
            return
        discovered = self._discover_from_k8s()
        # Merge with known pipeline (no duplicates)
        all_edges = set(KNOWN_PIPELINE) | set(discovered)
        self._edges = list(all_edges)
        self._graph_json = self._build_json()
        self._last_refresh = now
        log.info("Dependency graph refreshed: %d nodes, %d edges",
                 len(self._graph_json["nodes"]), len(self._edges))

    def to_json(self) -> dict:
        return self._graph_json

    def to_prompt_text(self) -> str:
        """Return a concise text description for inclusion in LLM system prompt."""
        lines = ["PIPELINE DEPENDENCY GRAPH (A → B means A sends data to B):"]
        for src, dst in self._edges:
            lines.append(f"  {src} → {dst}")
        lines.append("")
        lines.append("POD ROLES:")
        for pod, role in POD_ROLES.items():
            lines.append(f"  {pod}: {role}")
        return "\n".join(lines)
