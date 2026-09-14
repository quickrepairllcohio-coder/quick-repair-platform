#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
req=(
  "$ROOT/docs/STAGING_E2E_V4_2.md"
  "$ROOT/apps/customer-mobile/src/lib/notificationRouting.ts"
  "$ROOT/apps/customer-mobile/src/lib/mediaUpload.ts"
  "$ROOT/apps/customer-mobile/src/app/(customer)/requests/new.tsx"
  "$ROOT/supabase/functions/process-push-queue/index.ts"
)
for f in "${req[@]}"; do
  if [[ -f "$f" ]]; then echo "PASS: $f"; else echo "FAIL: missing $f"; fail=1; fi
done
python - <<'PY'
import json
from pathlib import Path
for p in [Path('apps/customer-mobile/package.json'), Path('apps/technician-mobile/package.json')]:
    json.loads(p.read_text()); print('PASS: JSON', p)
PY
if grep -RInE 'SUPABASE_(SERVICE_ROLE_KEY|SECRET_KEY)\s*=' apps/customer-mobile apps/technician-mobile --exclude-dir=node_modules >/dev/null; then
  echo 'FAIL: server secret pattern found in mobile app'; fail=1
else
  echo 'PASS: no server secret assignment in mobile apps'
fi
exit "$fail"
