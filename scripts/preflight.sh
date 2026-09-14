#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail=0
for f in package.json apps/admin-web/package.json apps/customer-mobile/package.json apps/technician-mobile/package.json; do test -f "$f" || { echo "FAIL: missing $f"; fail=1; }; done
if grep -RInE '"[^"]+": "\^|"[^"]+": "latest' apps/*/package.json >/tmp/qr-unpinned-hits 2>/dev/null; then echo 'FAIL: caret/latest dependency found'; cat /tmp/qr-unpinned-hits; fail=1; else echo 'PASS: direct app dependency versions are deterministic'; fi
for app in customer-mobile technician-mobile; do test -f "apps/$app/tsconfig.json" || { echo "FAIL: $app missing tsconfig.json"; fail=1; }; done
test -f supabase/migrations/202609130031_final_production_hardening.sql || { echo 'FAIL: final hardening migration missing'; fail=1; }
if [ "$fail" -ne 0 ]; then exit 1; fi
echo 'PREFLIGHT STATIC CHECK: PASS'
