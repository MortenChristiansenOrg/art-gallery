#!/bin/sh

# Use .cmd extension on Windows (Git Bash npx shim swallows output)
if [ -f "$(command -v npx).cmd" ] 2>/dev/null || [[ "$(uname -s)" == MINGW* ]] || [[ "$(uname -s)" == MSYS* ]]; then
  NPX="npx.cmd"
else
  NPX="npx"
fi

echo "Running pre-commit checks..."

echo "→ Type checking..."
$NPX tsc -b || { echo "Type check failed"; exit 1; }

echo "→ Building..."
$NPX vite build || { echo "Build failed"; exit 1; }

echo "→ Unit tests..."
$NPX vitest run || { echo "Unit tests failed"; exit 1; }

#echo "→ E2E tests..."
#$NPX playwright test || { echo "E2E tests failed"; exit 1; }

echo "All checks passed."
