#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Quick Repair launch gate"
for f in docs/LAUNCH_EXECUTION_PLAN.md docs/PRODUCTION_ENVIRONMENT_CHECKLIST.md docs/OPERATIONS_DAILY_CHECKLIST.md; do
  test -f "$ROOT/$f" || { echo "Missing $f"; exit 1; }
done
if find "$ROOT" -type f \( -name '*.env' -o -name '.env.local' \) -print -quit | grep -q .; then
  echo "WARNING: environment file found; verify no production secrets are committed."
fi
echo "Launch documentation gate: PASS"
echo "External service and real-device gates must be executed in staging/production."
