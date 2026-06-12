"""
tests/test_inject.py — Person C's inject API tests (no Docker needed).

Uses FastAPI's TestClient against a freshly built app sharing a real
FaultState, so the full A→C contract is exercised in-process:
  POST /inject mutates FaultState; GET /status reflects it via compute_reading.

Run:
    cd sensor_sim
    pytest tests/test_inject.py -v
"""

from __future__ import annotations

import os
import sys

import pytest

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from fastapi.testclient import TestClient

from fault_engine import FaultState
from inject_server import create_inject_app
from pump_config import valid_inject_modes


@pytest.fixture
def client_and_state():
    """Fresh FaultState + app per test so state never leaks between tests."""
    fault_state = FaultState()
    app = create_inject_app(fault_state)
    return TestClient(app), fault_state


def test_health_ok(client_and_state):
    client, _ = client_and_state
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_modes_lists_all_valid_modes(client_and_state):
    client, _ = client_and_state
    r = client.get("/modes")
    assert r.status_code == 200
    assert set(r.json()["valid_modes"]) == set(valid_inject_modes())


def test_inject_bearing_fault_activates_state(client_and_state):
    client, fault_state = client_and_state
    r = client.post("/inject", json={"mode": "bearing_fault", "duration_s": 300})
    assert r.status_code == 200
    assert r.json() == {"ok": True, "active_fault": "bearing_fault"}
    assert fault_state.mode == "bearing_fault"
    assert fault_state.flood is False


def test_inject_flood_sets_flood_flag(client_and_state):
    client, fault_state = client_and_state
    r = client.post("/inject", json={"mode": "flood"})
    assert r.status_code == 200
    assert r.json()["active_fault"] == "flood"
    assert fault_state.flood is True


def test_clear_returns_to_normal(client_and_state):
    client, fault_state = client_and_state
    client.post("/inject", json={"mode": "flood"})
    r = client.post("/inject", json={"mode": "clear"})
    assert r.status_code == 200
    assert r.json()["active_fault"] is None
    assert fault_state.mode is None
    assert fault_state.flood is False


def test_unknown_mode_returns_422(client_and_state):
    client, _ = client_and_state
    r = client.post("/inject", json={"mode": "not_a_real_fault"})
    assert r.status_code == 422
    assert "valid_modes" in r.json()["detail"]


def test_status_reflects_active_fault_and_readings(client_and_state):
    client, _ = client_and_state
    client.post("/inject", json={"mode": "bearing_fault", "duration_s": 300})
    r = client.get("/status")
    assert r.status_code == 200
    body = r.json()
    assert body["active_fault"] == "bearing_fault"
    assert body["flood"] is False
    # readings carry the 5 params + timestamp
    for key in ("vibration_axial", "temperature", "rpm", "timestamp"):
        assert key in body["readings"]


def test_default_duration_applied(client_and_state):
    client, fault_state = client_and_state
    client.post("/inject", json={"mode": "bearing_fault"})  # no duration_s
    from pump_config import INJECT_DEFAULT_DURATION_S
    assert fault_state.duration_s == INJECT_DEFAULT_DURATION_S
