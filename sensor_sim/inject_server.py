"""
inject_server.py — Person C's deliverable (real implementation).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fault-injection HTTP API for ONE sensor-sim container. Replaces the earlier
stub. Person B's main.py wires this in via create_inject_app(fault_state),
passing the single shared FaultState; this module mutates that object and
never touches OPC-UA.

Phase-0 contract (owned by pump_config.py):

  POST /inject   body: {"mode": "<mode>", "duration_s": 300}
                 pump_id is fixed per container by the PUMP_ID env var — it is
                 NOT part of the request body.
                 200 → {"ok": true, "active_fault": "<mode>|null"}
                 422 → unknown mode (lists valid modes)

  GET  /status   → {"pump_id", "active_fault", "elapsed_s", "flood", "readings"}
  GET  /modes    → {"pump_id", "valid_modes": [...]}
  GET  /health   → {"status": "ok", "pump_id": "..."}

Division of responsibility (Phase-0 split):
  A produces values  → compute_reading(), FaultState (pure).
  B publishes them   → owns the FaultState instance, reads it in emit_loop.
  C controls when    → THIS module mutates FaultState via the HTTP API.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from fault_engine import FaultState, compute_reading
from pump_config import (
    INJECT_CLEAR_MODE,
    INJECT_DEFAULT_DURATION_S,
    valid_inject_modes,
)

log = logging.getLogger(__name__)

# pump_id is fixed per container (same env var main.py reads). Defaults to pump1.
PUMP_ID: str = os.environ.get("PUMP_ID", "pump1").lower()


class InjectRequest(BaseModel):
    """POST /inject body. `pump_id` is intentionally absent — see module docs."""

    mode: str = Field(..., description="fault name from FAULT_DEFS, or 'clear'")
    duration_s: int = Field(
        default=INJECT_DEFAULT_DURATION_S,
        ge=0,
        description="intended fault duration in seconds (advisory; engine clamps)",
    )


def create_inject_app(fault_state: FaultState) -> FastAPI:
    """
    Build the FastAPI app whose routes share the given FaultState.

    Person B calls this from main.py with the ONE shared FaultState instance so
    that /inject writes are visible to the OPC-UA emit loop on the next tick.
    """
    app = FastAPI(
        title=f"EdgeMind sensor-sim inject API — {PUMP_ID}",
        description="Fault injection endpoint for one pump-station sensor sim.",
        version="1.0.0",
    )

    @app.post("/inject")
    async def handle_inject(req: InjectRequest):
        """Activate a fault, toggle flood, or clear back to normal operation."""
        mode = req.mode.strip()

        if mode == INJECT_CLEAR_MODE:
            fault_state.clear()
            log.info("inject: cleared fault on %s", PUMP_ID)
            return {"ok": True, "active_fault": fault_state.mode}

        if mode not in valid_inject_modes():
            raise HTTPException(
                status_code=422,
                detail={
                    "error": f"unknown mode {mode!r}",
                    "valid_modes": valid_inject_modes(),
                },
            )

        # FaultState.activate() handles flood internally (it sets the flood flag
        # for RATE_ONLY faults), so a single call covers every fault mode.
        try:
            fault_state.activate(mode, req.duration_s)
        except ValueError as exc:  # defensive; should not occur after validation
            raise HTTPException(status_code=422, detail=str(exc))

        log.info(
            "inject: activated mode=%s duration_s=%d on %s (flood=%s)",
            mode, req.duration_s, PUMP_ID, fault_state.flood,
        )
        return {"ok": True, "active_fault": fault_state.mode}

    @app.get("/status")
    async def status():
        """Current fault state plus a live reading for quick eyeballing."""
        elapsed = fault_state.elapsed_s()
        reading = compute_reading(PUMP_ID, fault_state, t=elapsed)
        return {
            "pump_id": PUMP_ID,
            "active_fault": fault_state.mode,
            "flood": fault_state.flood,
            "elapsed_s": round(elapsed, 2),
            "readings": reading,
        }

    @app.get("/modes")
    async def modes():
        """Discovery endpoint: every accepted /inject mode for this container."""
        return {"pump_id": PUMP_ID, "valid_modes": valid_inject_modes()}

    @app.get("/health")
    async def health():
        """Liveness probe for docker-compose / k8s readiness checks."""
        return {"status": "ok", "pump_id": PUMP_ID}

    return app
