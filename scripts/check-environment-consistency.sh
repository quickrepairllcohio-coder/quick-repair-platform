#!/bin/bash
echo "Checking environment consistency across all applications..."

if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "ERROR: Missing Supabase environment variables."
  exit 1
fi

if [ "$EXPO_PUBLIC_SUPABASE_URL" != "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "CRITICAL ERROR: Environment mismatch!"
  echo "Mobile apps and Admin web are pointing to DIFFERENT Supabase projects."
  exit 1
fi

echo "Environment consistency verified. All apps point to the same data plane."
exit 0