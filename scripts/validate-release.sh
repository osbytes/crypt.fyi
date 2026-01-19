#!/bin/bash

# Pre-release validation script
# Runs all checks before allowing a release: format, typecheck, lint, build, test

set -e

echo "🔍 Running pre-release validation checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any check fails
FAILED=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if eval "$command"; then
        echo -e "${GREEN}✓ $name passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ $name failed${NC}"
        echo ""
        FAILED=1
        return 1
    fi
}

# Run all checks
echo "Starting validation pipeline..."
echo ""

run_check "Format Check" "yarn format:check" || true
run_check "Type Check" "yarn typecheck" || true
run_check "Lint" "yarn lint" || true
run_check "Build" "yarn build" || true
run_check "Test" "yarn test" || true

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 1 ]; then
    echo -e "${RED}❌ Pre-release validation FAILED${NC}"
    echo ""
    echo "Please fix the errors above before releasing."
    exit 1
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Ready to proceed with release."
    exit 0
fi
