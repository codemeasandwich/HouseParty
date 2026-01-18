#!/usr/bin/env bash
#
# Test check - runs bun test suite
#

set -e

# Path resolution
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

echo "    Running bun test..."
echo ""

bun test 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "    All tests passed"
    exit 0
else
    echo ""
    echo "    Tests failed"
    exit 1
fi
