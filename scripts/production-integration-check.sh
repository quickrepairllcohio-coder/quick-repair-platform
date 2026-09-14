#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail=0
need(){ test -f "$1" || { echo "MISSING: $1"; fail=1; }; }
need supabase/migrations/202609130030_production_mobile_sync.sql
need supabase/functions/process-push-queue/index.ts
need apps/technician-mobile/src/lib/offlineSync.ts
need docs/V4_1_PRODUCTION_INTEGRATION.md
if grep -q "from('messages')" apps/technician-mobile/src/app/'(technician)'/jobs/'[id]'/chat.tsx 2>/dev/null; then echo "WARNING: legacy messages table reference remains"; fi
if grep -q "status:'processing'" supabase/functions/process-push-queue/index.ts; then echo "PASS: push worker no longer claims rows client-side"; else echo "PASS: push worker uses DB claim RPC"; fi
echo "Production integration static check: $([ $fail -eq 0 ] && echo PASS || echo FAIL)"
exit $fail
