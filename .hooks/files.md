# Hooks - File Reference

[Back to hooks readme](readme.md) | [Back to main README](../README.md)

## pre-commit

**Purpose:** Orchestrator that runs all pre-commit checks
**Lines:** 96

### Behavior

1. Checks current branch (skips if not main/master)
2. Resolves paths (works from `.git/hooks/` or `.hooks/`)
3. Changes to project root directory
4. Runs each check script in `pre-commit.d/`
5. Collects results and blocks commit if any failed

### Key functions

- `print_header()` - Colored section headers
- `run_check()` - Execute a check script and handle result

### Exit codes

- `0` - All checks passed
- `1` - One or more checks failed

---

## pre-commit.d/check-tests.sh

**Purpose:** Run Bun test suite
**Lines:** 33

### What it does

1. Resolves project root (works from either `.git/hooks/` or `.hooks/`)
2. Runs `bun test`
3. Returns exit code 0 if tests pass, 1 if they fail

---

## pre-commit.d/check-typescript.sh

**Purpose:** TypeScript type checking
**Lines:** 34

### What it does

1. Resolves project root
2. Changes to `vscode-extension/` directory
3. Runs `npx tsc --noEmit` (type-check only, no output)
4. Returns exit code 0 if compilation succeeds, 1 if there are type errors
