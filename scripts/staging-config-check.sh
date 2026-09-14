#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
for app in customer-mobile technician-mobile; do
  f="$ROOT/apps/$app/eas.json"
  if python - "$f" <<'PY'
import json,sys
p=sys.argv[1]
d=json.load(open(p))
b=d.get('build',{})
assert 'staging' in b, 'missing staging profile'
assert b['staging'].get('distribution') == 'internal', 'staging must use internal distribution'
assert b['staging'].get('channel') == 'staging', 'staging must use staging channel'
print('PASS:', p)
PY
  then :; else fail=1; fi
done
for f in .env.example docs/STAGING_DEPLOYMENT_V4_3.md .github/workflows/staging.yml .github/workflows/production.yml; do
  if [[ -f "$ROOT/$f" ]]; then echo "PASS: $f"; else echo "FAIL: missing $f"; fail=1; fi
done
if grep -RInE 'SUPABASE_(SERVICE_ROLE_KEY|SECRET_KEY)\s*=' "$ROOT/apps" --exclude-dir=node_modules >/dev/null; then
  echo 'FAIL: server secret assignment found under apps/'; fail=1
else
  echo 'PASS: no server secret assignment under apps/'
fi
exit "$fail"
