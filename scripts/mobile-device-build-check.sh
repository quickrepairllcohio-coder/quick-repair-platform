#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
for app in customer-mobile technician-mobile; do
  file="$ROOT/apps/$app/eas.json"
  node -e "const x=require(process.argv[1]); if(!x.build['device-test']||x.build['device-test'].distribution!=='internal'||x.build['device-test'].android?.buildType!=='apk') process.exit(1)" "$file" || { echo "FAIL: $app device-test profile"; fail=1; }
  grep -q 'build:android:test' "$ROOT/apps/$app/package.json" || { echo "FAIL: $app build script"; fail=1; }
done
if [ "$fail" -eq 0 ]; then echo 'Mobile device build check: PASS'; else exit 1; fi
