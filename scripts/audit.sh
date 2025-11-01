#!/bin/bash

# Audit script to check data layer conventions
# Returns non-zero exit code if violations found

set -e

echo "🔍 Auditing data layer conventions..."
VIOLATIONS=0

# Check for raw fetch() in components (should use fetchJson)
echo "Checking for raw fetch() calls in components..."
RAW_FETCH=$(grep -r "fetch(" components --include="*.tsx" --include="*.ts" | grep -v "fetchJson\|lib/analytics" || true)
if [ -n "$RAW_FETCH" ]; then
  echo "❌ Found raw fetch() calls (should use fetchJson):"
  echo "$RAW_FETCH"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✅ No raw fetch() calls found"
fi

# Check for direct Supabase .from() calls in components
echo "Checking for direct Supabase .from() calls in components..."
SUPABASE_FROM=$(grep -r "\.from(" components --include="*.tsx" --include="*.ts" | grep -v "Array.from\|node_modules" || true)
if [ -n "$SUPABASE_FROM" ]; then
  echo "❌ Found direct Supabase .from() calls (should use API routes):"
  echo "$SUPABASE_FROM"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "✅ No direct Supabase .from() calls found"
fi

# Check that all useQuery calls pass signal
echo "Checking useQuery queryFn signatures..."
# This is a basic check - can be enhanced
QUERY_WITHOUT_SIGNAL=$(grep -r "useQuery" components --include="*.tsx" -A 5 | grep "queryFn:" | grep -v "signal" | head -1 || true)
if [ -n "$QUERY_WITHOUT_SIGNAL" ]; then
  echo "⚠️  Warning: Some useQuery calls may not pass signal (manual review recommended)"
  echo "$QUERY_WITHOUT_SIGNAL"
else
  echo "✅ useQuery calls appear to use signal (manual verification recommended)"
fi

echo ""
if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ All checks passed!"
  exit 0
else
  echo "❌ Found $VIOLATIONS violation(s)"
  exit 1
fi

