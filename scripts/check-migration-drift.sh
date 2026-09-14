#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Quick Repair migration integrity check"
python3 - <<'PY'
from pathlib import Path
files=sorted(Path('supabase/migrations').glob('*.sql'))
seen=set()
for f in files:
    prefix=f.name.split('_',1)[0]
    if not prefix.isdigit():
        raise SystemExit(f'Invalid migration filename: {f.name}')
    if prefix in seen:
        raise SystemExit(f'Duplicate migration version: {prefix}')
    seen.add(prefix)
print(f'Local migration set: {len(files)} files; versions unique and ordered.')
PY

if command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI detected. To compare against a linked remote project, run:"
  echo "  supabase link --project-ref <PROJECT_REF>"
  echo "  supabase db diff --linked"
else
  echo "Supabase CLI not installed; remote drift comparison is deferred to the linked environment."
fi
