#!/bin/sh

# Use .cmd extension on Windows (Git Bash shim swallows output)
if [ -f "$(command -v bun).cmd" ] 2>/dev/null || [[ "$(uname -s)" == MINGW* ]] || [[ "$(uname -s)" == MSYS* ]]; then
  BUN="bun.cmd"
else
  BUN="bun"
fi

echo "Running pre-commit checks..."

echo "→ Type checking..."
$BUN tsc -b || { echo "Type check failed"; exit 1; }

echo "→ Building..."
$BUN vite build || { echo "Build failed"; exit 1; }

echo "→ Unit tests..."
$BUN vitest run || { echo "Unit tests failed"; exit 1; }

#echo "→ E2E tests..."
#$BUN playwright test || { echo "E2E tests failed"; exit 1; }

echo "All checks passed."
