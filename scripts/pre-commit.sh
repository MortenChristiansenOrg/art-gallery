#!/bin/zsh

# To install
# cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "Running pre-commit checks..."

echo "→ Type checking..."
bunx tsc -b || { echo "Type check failed"; exit 1; }

echo "→ Building..."
bunx vite build || { echo "Build failed"; exit 1; }

echo "→ Deploying Convex functions..."
bunx convex deploy || echo "Convex deploy skipped (no deployment configured)"

#echo "→ Unit tests..."
#bunx vitest run || { echo "Unit tests failed"; exit 1; }

#echo "→ E2E tests..."
#bunx playwright test || { echo "E2E tests failed"; exit 1; }

echo "All checks passed."
