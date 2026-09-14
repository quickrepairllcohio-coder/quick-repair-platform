#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
for app in apps/customer-mobile apps/technician-mobile; do
  test -f "$app/eas.json" || { echo "FAIL: missing $app/eas.json"; exit 1; }
  test -f "$app/app.config.js" || { echo "FAIL: missing $app/app.config.js"; exit 1; }
  test -f "$app/src/lib/mediaUpload.ts" || { echo "FAIL: missing media upload helper in $app"; exit 1; }
done
test -f supabase/functions/process-push-queue/index.ts
test -f supabase/migrations/202609130029_mobile_media_push_hardening.sql
echo "PRODUCTION MOBILE CHECK: PASS (configuration/static checks only)"
echo "Remote Supabase, EAS credentials, real-device tests, and trusted push scheduling are still required."
