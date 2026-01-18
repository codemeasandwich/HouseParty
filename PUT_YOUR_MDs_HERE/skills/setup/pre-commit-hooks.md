# Pre-commit Hooks Setup for Web/SaaS Projects

A modular, dependency-free pre-commit hook system for JavaScript, TypeScript, React, Node, and Bun projects.

## Why This Pattern?

**vs Husky/lint-staged:**
- Zero npm dependencies
- Full control over hook logic
- Version controlled with the repo
- Works identically in CI and local dev
- No magic - just bash scripts

## Directory Structure

```
project/
├── .hooks/
│   ├── pre-commit              # Main orchestrator
│   ├── commit-msg              # Commit message validator
│   └── pre-commit.d/           # Individual check scripts
│       ├── check-coverage.sh   # Test coverage (100%)
│       ├── check-docs.sh       # README.md & files.md
│       ├── check-jsdoc.sh      # JSDoc validation
│       ├── check-typescript.sh # TypeScript defs alignment
│       ├── check-yoda.sh       # Yoda conditions
│       ├── jsdoc-validator.js  # JSDoc engine
│       ├── check-typescript.js # TypeScript validator
│       └── yoda-validator.js   # Yoda engine
└── package.json                # hooks:install script
```

---

## Installation

### package.json Scripts

**npm/yarn:**
```json
{
  "scripts": {
    "hooks:install": "cp .hooks/pre-commit .git/hooks/ && cp .hooks/commit-msg .git/hooks/ && cp -r .hooks/pre-commit.d .git/hooks/ && chmod +x .git/hooks/pre-commit .git/hooks/commit-msg .git/hooks/pre-commit.d/*.sh",
    "prepare": "npm run hooks:install",
    "validate:coverage": "npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":100,\"functions\":100,\"lines\":100,\"statements\":100}}'",
    "validate:docs": "bash .hooks/pre-commit.d/check-docs.sh",
    "validate:jsdoc": "node .hooks/pre-commit.d/jsdoc-validator.js",
    "validate:types": "node .hooks/pre-commit.d/check-typescript.js",
    "validate:yoda": "node .hooks/pre-commit.d/yoda-validator.js",
    "validate:all": "npm run validate:docs && npm run validate:jsdoc && npm run validate:types && npm run validate:yoda && npm run validate:coverage"
  }
}
```

**Bun:**
```json
{
  "scripts": {
    "hooks:install": "cp .hooks/pre-commit .git/hooks/ && cp .hooks/commit-msg .git/hooks/ && cp -r .hooks/pre-commit.d .git/hooks/ && chmod +x .git/hooks/pre-commit .git/hooks/commit-msg .git/hooks/pre-commit.d/*.sh",
    "postinstall": "bun run hooks:install",
    "validate:coverage": "bun test --coverage",
    "validate:docs": "bash .hooks/pre-commit.d/check-docs.sh",
    "validate:jsdoc": "bun .hooks/pre-commit.d/jsdoc-validator.js",
    "validate:types": "bun .hooks/pre-commit.d/check-typescript.js",
    "validate:yoda": "bun .hooks/pre-commit.d/yoda-validator.js",
    "validate:all": "bun run validate:docs && bun run validate:jsdoc && bun run validate:types && bun run validate:yoda && bun run validate:coverage"
  }
}
```

---

## Core Scripts

### 1. Pre-commit Orchestrator

**`.hooks/pre-commit`**
```bash
#!/usr/bin/env bash
#
# Pre-commit validation orchestrator
#
# Runs all pre-commit checks in sequence.
# Exit codes: 0 = pass, 1 = fail

set -e

# Path resolution (works from .git/hooks/ or .hooks/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    CHECKS_DIR="$SCRIPT_DIR/pre-commit.d"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
else
    CHECKS_DIR="$SCRIPT_DIR/pre-commit.d"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

cd "$PROJECT_ROOT"

ERROR=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

run_check() {
    local script="$1"
    local name="$2"

    if [ ! -f "$script" ]; then
        echo -e "${RED}  ✗ Check script not found: $script${NC}"
        ERROR=1
        return
    fi

    echo ""
    echo -e "  Running: $name"

    if [ -x "$script" ]; then
        if "$script"; then
            echo -e "${GREEN}  ✓ $name passed${NC}"
        else
            echo -e "${RED}  ✗ $name failed${NC}"
            ERROR=1
        fi
    else
        if bash "$script"; then
            echo -e "${GREEN}  ✓ $name passed${NC}"
        else
            echo -e "${RED}  ✗ $name failed${NC}"
            ERROR=1
        fi
    fi
}

print_header "Pre-commit Checks"

# Run checks (customize this list)
run_check "$CHECKS_DIR/check-docs.sh" "Documentation (README.md & files.md)"
run_check "$CHECKS_DIR/check-jsdoc.sh" "JSDoc Validation"
run_check "$CHECKS_DIR/check-typescript.sh" "TypeScript Definitions"
run_check "$CHECKS_DIR/check-coverage.sh" "Test Coverage (100%)"
run_check "$CHECKS_DIR/check-yoda.sh" "Yoda Conditions"

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $ERROR -eq 1 ]; then
    echo -e "${RED}  ✗ Commit blocked: One or more checks failed${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}  ✓ All pre-commit checks passed${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
exit 0
```

### 2. Commit Message Validator

**`.hooks/commit-msg`**
```bash
#!/usr/bin/env bash
#
# Commit message validator
#
# Enforces:
#   1. Conventional Commits format: <type>: <message>
#   2. First line max 80 characters
#   3. Multi-line required with list of changes
#
# Allowed types:
#   bug, fix, feat, docs, style, refactor, perf, test, build, ci, chore

MSG_FILE="$1"
MSG_CONTENT=$(cat "$MSG_FILE")
FIRST_LINE=$(echo "$MSG_CONTENT" | sed -n '1p' | tr -d '\r')

# Skip merge commits
if printf '%s\n' "$FIRST_LINE" | grep -Eq "^Merge "; then
    exit 0
fi

TYPES="bug|fix|feat|docs|style|refactor|perf|test|build|ci|chore"

# Check format: type: message (with optional ! for breaking changes)
if ! printf '%s\n' "$FIRST_LINE" | grep -Eq "^(${TYPES})(!)?:[[:space:]]+[^[:space:]]"; then
    cat >&2 <<'ERR'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ Invalid Commit Message Format
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit messages must follow Conventional Commits format:

    <type>: <summary>

Allowed types:
    bug      - Bug report or fix for a bug
    fix      - A bug fix
    feat     - A new feature
    docs     - Documentation only changes
    style    - Code style changes (formatting, etc)
    refactor - Code refactoring
    perf     - Performance improvements
    test     - Adding or updating tests
    build    - Build system changes
    ci       - CI/CD changes
    chore    - Other changes (deps, configs, etc)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ERR
    exit 1
fi

# Enforce max line length (80 characters)
LENGTH=${#FIRST_LINE}
if [ "$LENGTH" -gt 80 ]; then
    cat >&2 <<ERR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ First Line Too Long
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

First line is ${LENGTH} characters (maximum is 80).

Keep the summary line concise. Details go in the body.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ERR
    exit 1
fi

exit 0
```

---

## Adding/Removing Checks

### Adding a New Check

1. Create `.hooks/pre-commit.d/check-{name}.sh`
2. Follow the template pattern (path resolution, exit codes)
3. Add to orchestrator's `run_check` calls

### Removing a Check

Comment out or remove the `run_check` line in `.hooks/pre-commit`.

### Adjusting Coverage Threshold

Edit `check-coverage.sh`:
```bash
--coverageThreshold='{"global":{"branches":80,"functions":90,"lines":90,"statements":90}}'
```

---

## Troubleshooting

**Hooks not running:**
```bash
# Reinstall hooks
npm run hooks:install

# Check permissions
ls -la .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Bypass hooks (emergency only):**
```bash
git commit --no-verify -m "emergency fix"
```

**Debug a specific check:**
```bash
bash .hooks/pre-commit.d/check-coverage.sh
```
