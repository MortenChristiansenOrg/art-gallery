#!/usr/bin/env bash

# To install
# cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "Running pre-commit checks..."

echo "→ Type checking..."
bunx tsc -b || { echo "Type check failed"; exit 1; }

echo "→ Building..."
bunx vite build || { echo "Build failed"; exit 1; }

echo "→ Validating Convex functions..."
bunx convex codegen --typecheck enable || { echo "Convex codegen failed"; exit 1; }
if [ -n "${CONVEX_DEPLOYMENT:-}" ]; then
  echo "→ Deploying Convex functions..."
  bunx convex deploy || { echo "Convex deploy failed"; exit 1; }
fi

#echo "→ Unit tests..."
bunx vitest run || { echo "Unit tests failed"; exit 1; }

#echo "→ E2E tests..."
bunx playwright test || { echo "E2E tests failed"; exit 1; }

echo "All checks passed."
