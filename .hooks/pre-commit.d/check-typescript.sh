#!/usr/bin/env bash
#
# TypeScript compilation check - ensures VSCode extension compiles without errors
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

echo "    Checking TypeScript compilation..."
echo ""

# Compile VSCode extension (type-check only, no emit)
cd vscode-extension && npx tsc --noEmit 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "    TypeScript compilation successful"
    exit 0
else
    echo ""
    echo "    TypeScript compilation failed"
    exit 1
fi
