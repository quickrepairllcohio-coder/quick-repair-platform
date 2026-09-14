#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
for app in customer-mobile technician-mobile; do
  P="$ROOT/apps/$app/package.json"
  E="$ROOT/apps/$app/eas.json"
  C="$ROOT/apps/$app/app.config.js"
  test -f "$P" || { echo "FAIL: $P"; fail=1; continue; }
  test -f "$E" || { echo "FAIL: $E"; fail=1; }
  test -f "$C" || { echo "FAIL: $C"; fail=1; }
  node -e "const p=require(process.argv[1]); if(p.dependencies.expo!=='~57.0.0'||p.dependencies.react!=='19.2.3'||p.dependencies['react-native']!=='0.86.0') process.exit(1)" "$P" \
    && echo "$app: Expo/RN alignment PASS" || { echo "$app: Expo/RN alignment FAIL"; fail=1; }
  node -e "const e=require(process.argv[1]); for(const k of ['development','preview','production']) if(!e.build[k]) process.exit(1)" "$E" \
    && echo "$app: EAS profiles PASS" || { echo "$app: EAS profiles FAIL"; fail=1; }
done
if command -v eas >/dev/null 2>&1; then
  echo "EAS CLI detected: $(eas --version)"
else
  echo "NOTE: EAS CLI not installed in this environment; cloud build not executed."
fi
if command -v npx >/dev/null 2>&1; then
  echo "Node/npm toolchain detected."
fi
if [ "$fail" -ne 0 ]; then exit 1; fi
echo "MOBILE BUILD CHECK: PASS (static/configuration only)"
