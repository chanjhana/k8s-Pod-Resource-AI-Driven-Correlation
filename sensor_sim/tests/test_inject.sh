#!/usr/bin/env bash
# tests/test_inject.sh — Person C's integration smoke test.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Requires the containers to be running:  docker compose up --build
# Exercises the inject API on all three pumps over HTTP.
#
#   pump1 → :8080   pump2 → :8081   pump3 → :8082
#
# Usage:   bash tests/test_inject.sh
set -euo pipefail

P1=http://localhost:8080
P2=http://localhost:8081
P3=http://localhost:8082

pass=0; fail=0
check() {  # check <description> <command...>
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then echo "PASS  $desc"; pass=$((pass+1));
  else echo "FAIL  $desc"; fail=$((fail+1)); fi
}

echo "── health checks ───────────────────────────────────────────"
check "pump1 /health" curl -fs "$P1/health"
check "pump2 /health" curl -fs "$P2/health"
check "pump3 /health" curl -fs "$P3/health"

echo "── discover modes ─────────────────────────────────────────"
curl -fs "$P2/modes"; echo

echo "── single fault: bearing_fault on pump2 ───────────────────"
curl -fs -X POST "$P2/inject" -H 'Content-Type: application/json' \
  -d '{"mode":"bearing_fault","duration_s":300}'; echo
curl -fs "$P2/status"; echo

echo "── unknown mode is rejected (expect 422) ──────────────────"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$P2/inject" \
  -H 'Content-Type: application/json' -d '{"mode":"not_real"}')
if [ "$code" = "422" ]; then echo "PASS  unknown mode → 422"; pass=$((pass+1));
else echo "FAIL  unknown mode → $code (expected 422)"; fail=$((fail+1)); fi

echo "── clear pump2 ────────────────────────────────────────────"
curl -fs -X POST "$P2/inject" -H 'Content-Type: application/json' \
  -d '{"mode":"clear"}'; echo

echo "── flood on pump2, then clear ─────────────────────────────"
curl -fs -X POST "$P2/inject" -H 'Content-Type: application/json' \
  -d '{"mode":"flood"}'; echo
curl -fs "$P2/status"; echo
curl -fs -X POST "$P2/inject" -H 'Content-Type: application/json' \
  -d '{"mode":"clear"}'; echo

echo "── combined_cascade: flood on pump2 + overheat on pump3 ───"
curl -fs -X POST "$P2/inject" -H 'Content-Type: application/json' \
  -d '{"mode":"flood"}'; echo
curl -fs -X POST "$P3/inject" -H 'Content-Type: application/json' \
  -d '{"mode":"overheat","duration_s":300}'; echo

echo "── cleanup: clear all pumps ───────────────────────────────"
curl -fs -X POST "$P1/inject" -H 'Content-Type: application/json' -d '{"mode":"clear"}'; echo
curl -fs -X POST "$P2/inject" -H 'Content-Type: application/json' -d '{"mode":"clear"}'; echo
curl -fs -X POST "$P3/inject" -H 'Content-Type: application/json' -d '{"mode":"clear"}'; echo

echo
echo "════════════════════════════════════════════════════════════"
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
