#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail=0
check(){ if "$@" >/dev/null 2>&1; then echo "PASS: $*"; else echo "FAIL: $*"; fail=1; fi; }
check test -f apps/customer-mobile/eas.json
check test -f apps/technician-mobile/eas.json
check test -f apps/customer-mobile/app.config.js
check test -f apps/technician-mobile/app.config.js
check grep -q '"production"' apps/customer-mobile/eas.json
check grep -q '"production"' apps/technician-mobile/eas.json
check grep -q 'com.quickrepair.customer' apps/customer-mobile/app.config.js
check grep -q 'com.quickrepair.technician' apps/technician-mobile/app.config.js
check grep -q 'track.*internal' apps/customer-mobile/eas.json
check grep -q 'SUPABASE_SECRET_KEY' .env.example
check grep -q 'STRIPE_SECRET_KEY' .env.example
if grep -RInE 'SUPABASE_SECRET_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|AI_API_KEY|TWILIO_AUTH_TOKEN' apps --exclude='*.md' --exclude='*.example' >/tmp/qr-secret-hits 2>/dev/null; then
  echo 'FAIL: server secrets referenced directly by mobile source'
  cat /tmp/qr-secret-hits
  fail=1
else
  echo 'PASS: no server secret literals/references detected in mobile source'
fi
if [ "$fail" -ne 0 ]; then exit 1; fi
echo 'STORE RELEASE CHECK: PASS'
