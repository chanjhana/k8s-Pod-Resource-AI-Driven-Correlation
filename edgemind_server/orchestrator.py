"""
orchestrator.py — AI reasoning layer using Qwen3:8b via Ollama.

Receives a CorrelatedSignalBundle from the correlation filter.
Uses Qwen3's tool-calling capability to investigate:
  - query_prometheus: check metric context
  - get_pod_logs: confirm error cause
  - get_kubernetes_events: detect lifecycle issues

Returns a structured OrchestratorResult with root cause, causal chain,
confidence score, and NLP insight in operator language.

NOTE: Qwen3:8b thinking mode is enabled — the 'thinking' field in the
response captures the model's internal reasoning. This is surfaced to the
dashboard as the "AI reasoning" panel.
"""

import json
import logging
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from edgemind_server.correlation_filter import CorrelatedSignalBundle
from edgemind_server.dependency_graph import DependencyGraph
from edgemind_server.tools import TOOL_DEFINITIONS, execute_tool

log = logging.getLogger(__name__)

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:8b")
MAX_TOOL_TURNS = 4
OLLAMA_TIMEOUT = 300  # 5 minutes — Qwen3 with thinking is slow


@dataclass
class OrchestratorResult:
    root_cause_pod: str
    causal_chain: List[str]        # ordered pod sequence
    alert_type: str                 # "cascade" | "contention" | "lifecycle"
    confidence: float               # 0.0 to 1.0
    insight: str                    # NLP summary in operator language
    recommendation: str
    thinking: Optional[str] = None  # Qwen3's internal reasoning
    tool_calls_made: List[str] = field(default_factory=list)
    analysis_duration_s: float = 0.0
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return {
            "root_cause_pod": self.root_cause_pod,
            "causal_chain": self.causal_chain,
            "alert_type": self.alert_type,
            "confidence": self.confidence,
            "insight": self.insight,
            "recommendation": self.recommendation,
            "thinking": self.thinking,
            "tool_calls_made": self.tool_calls_made,
            "analysis_duration_s": round(self.analysis_duration_s, 1),
            "timestamp": self.timestamp,
        }

    def confidence_label(self) -> str:
        if self.confidence >= 0.9:
            return "HIGH"
        elif self.confidence >= 0.7:
            return "MEDIUM-HIGH"
        elif self.confidence >= 0.5:
            return "MEDIUM"
        else:
            return "LOW — flagged for manual investigation"


SYSTEM_PROMPT_TEMPLATE = """You are EdgeMind, an AI orchestrator for industrial pump station monitoring on ABB Edgenius.

Your job is to analyze correlated anomaly findings from 4 monitoring agents (cpu, memory, storage, network_log) and identify the ROOT CAUSE of the issue.

{dependency_graph}

CONFIDENCE SCORING RULES:
- ≥ 0.9: Multi-agent agreement (2+ agents) AND temporal ordering matches pipeline topology
- 0.7-0.9: Two agents agree, causal chain is plausible but may have gaps
- 0.5-0.7: Single agent or ambiguous evidence, multiple explanations possible
- < 0.5: Insufficient evidence — flag for manual investigation

INVESTIGATION APPROACH:
1. Read the findings carefully — what pods are affected and what anomaly types?
2. Use query_prometheus to check pods NOT flagged but likely in the causal chain
3. Use get_pod_logs to confirm the error cause behind metric anomalies
4. Use get_kubernetes_events if lifecycle issues (OOMKill, restarts, eviction) are suspected
5. Determine which pod is the ROOT CAUSE and trace the causal chain

ALERT TYPES:
- "cascade": fault propagated from one pod downstream (e.g. sensor flood → collector → historian)
- "contention": two pods competing for same resource (e.g. PVC-2 contention)
- "lifecycle": OOMKill, crash loop, eviction

OUTPUT FORMAT — you MUST end with a JSON block in this exact format:
```json
{{
  "root_cause_pod": "<pod name>",
  "causal_chain": ["<pod1>", "<pod2>", "<pod3>"],
  "alert_type": "cascade|contention|lifecycle",
  "confidence": 0.0,
  "insight": "<2-3 sentences in plain English for a field engineer, NO Kubernetes jargon>",
  "recommendation": "<1 sentence action>"
}}
```

OPERATOR LANGUAGE RULES for insight:
- Say "Pump 2 sensor" not "sensor-sim-2"
- Say "data collection service" not "opc-ua-collector"
- Say "data historian" not "data-historian-influxdb2"
- Say "feature computation service" not "feature-extractor"
- Say "health scoring service" not "health-scorer"
- Say "alert service" not "alert-manager"
- Say "bulk export service" not "batch-sync"
"""


class Orchestrator:
    def __init__(self, dependency_graph: DependencyGraph):
        self._graph = dependency_graph
        self._http = httpx.Client(timeout=OLLAMA_TIMEOUT)

    def _build_system_prompt(self) -> str:
        return SYSTEM_PROMPT_TEMPLATE.format(
            dependency_graph=self._graph.to_prompt_text()
        )

    def _build_user_message(self, bundle: CorrelatedSignalBundle) -> str:
        findings_text = json.dumps(bundle.findings, indent=2, default=str)
        return f"""CORRELATED ANOMALY BUNDLE:
Trigger reason: {bundle.trigger_reason}
Unique agents that fired: {', '.join(bundle.unique_agents)}
Affected pods: {', '.join(bundle.unique_pods)}
Finding count: {len(bundle.findings)}
Severity counts: {bundle.severity_counts}

FINDINGS:
{findings_text}

Investigate this event. Use tools to gather additional context, then provide your analysis."""

    def _call_ollama(self, messages: List[Dict]) -> Dict[str, Any]:
        """Make one call to Ollama API."""
        payload = {
            "model": OLLAMA_MODEL,
            "messages": messages,
            "tools": TOOL_DEFINITIONS,
            "stream": False,
            "options": {
                "temperature": 0.1,  # Low temperature for consistent analysis
                "num_ctx": 8192,
            },
        }
        resp = self._http.post(
            f"{OLLAMA_URL}/api/chat",
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()

    def _extract_json_result(self, content: str) -> Optional[Dict]:
        """Extract the JSON result block from the model's text response."""
        import re
        # Look for ```json ... ``` block
        match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        # Try raw JSON
        try:
            start = content.rfind("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
        except json.JSONDecodeError:
            pass
        return None

    def analyze(self, bundle: CorrelatedSignalBundle) -> OrchestratorResult:
        """Run the full orchestrator analysis. Synchronous — call in thread pool."""
        start_time = time.time()
        self._graph.refresh()

        messages = [
            {"role": "system", "content": self._build_system_prompt()},
            {"role": "user", "content": self._build_user_message(bundle)},
        ]

        tool_calls_made = []
        thinking_output = None
        final_content = ""

        for turn in range(MAX_TOOL_TURNS + 1):
            log.info("Orchestrator turn %d/%d", turn + 1, MAX_TOOL_TURNS + 1)
            try:
                response = self._call_ollama(messages)
            except Exception as e:
                log.error("Ollama API error: %s", e)
                break

            message = response.get("message", {})
            content = message.get("content", "")
            thinking = message.get("thinking", "")
            tool_calls = message.get("tool_calls", [])

            if thinking and not thinking_output:
                thinking_output = thinking

            # Add assistant message to conversation
            messages.append({"role": "assistant", "content": content})

            # If no tool calls, this is the final response
            if not tool_calls:
                final_content = content
                break

            # Execute each tool call
            for tc in tool_calls:
                func = tc.get("function", {})
                tool_name = func.get("name", "")
                tool_args = func.get("arguments", {})
                if isinstance(tool_args, str):
                    try:
                        tool_args = json.loads(tool_args)
                    except json.JSONDecodeError:
                        tool_args = {}

                log.info("Tool call: %s(%s)", tool_name, list(tool_args.keys()))
                tool_calls_made.append(tool_name)
                result = execute_tool(tool_name, tool_args)

                # Add tool result to conversation
                messages.append({
                    "role": "tool",
                    "content": result,
                })

        # Parse the JSON result from final content
        result_json = self._extract_json_result(final_content)
        duration = time.time() - start_time

        if result_json:
            return OrchestratorResult(
                root_cause_pod=result_json.get("root_cause_pod", "unknown"),
                causal_chain=result_json.get("causal_chain", []),
                alert_type=result_json.get("alert_type", "cascade"),
                confidence=float(result_json.get("confidence", 0.5)),
                insight=result_json.get("insight", "Analysis complete."),
                recommendation=result_json.get("recommendation", "Investigate manually."),
                thinking=thinking_output,
                tool_calls_made=tool_calls_made,
                analysis_duration_s=duration,
            )
        else:
            # Fallback if JSON parsing failed
            log.warning("Could not parse orchestrator JSON result")
            return OrchestratorResult(
                root_cause_pod=bundle.unique_pods[0] if bundle.unique_pods else "unknown",
                causal_chain=bundle.unique_pods,
                alert_type="cascade",
                confidence=0.4,
                insight=f"Anomalies detected across {len(bundle.unique_pods)} pods. Manual investigation recommended.",
                recommendation="Review pod logs and Prometheus metrics for affected pods.",
                thinking=thinking_output,
                tool_calls_made=tool_calls_made,
                analysis_duration_s=duration,
            )

    def close(self):
        self._http.close()
