# Pre-commit Hooks

[Back to main README](../README.md)

Modular pre-commit validation system for Claude Persona.

## How It Works

The `pre-commit` orchestrator runs all check scripts in `pre-commit.d/` sequentially.

```
.hooks/
├── pre-commit           # Orchestrator script
└── pre-commit.d/        # Individual check scripts
    ├── check-tests.sh
    └── check-typescript.sh
```

## Behavior

- **Only runs on main/master branch** (skips on feature branches)
- Runs all checks in sequence
- Blocks commit if any check fails
- Provides colored output for pass/fail status

## Installation

Hooks are installed automatically during `npm install`. The postinstall script copies `.hooks/` contents to `.git/hooks/`.

To reinstall manually:
```bash
cp -r .hooks/* .git/hooks/
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit.d/*.sh
```

## Current Checks

| Check | Script | What It Does |
|-------|--------|--------------|
| Bun Tests | `check-tests.sh` | Runs `bun test` |
| TypeScript | `check-typescript.sh` | Runs `npx tsc --noEmit` in vscode-extension/ |

## Adding New Checks

1. Create a new script in `pre-commit.d/`:
   ```bash
   #!/usr/bin/env bash
   set -e
   # Your check here
   exit 0  # or exit 1 on failure
   ```

2. Make it executable:
   ```bash
   chmod +x .hooks/pre-commit.d/your-check.sh
   ```

3. Add it to the orchestrator (`pre-commit`) in the "Run checks" section:
   ```bash
   run_check "$CHECKS_DIR/your-check.sh" "Your Check Name"
   ```

4. Copy to git hooks:
   ```bash
   cp -r .hooks/* .git/hooks/
   ```

## Bypassing Hooks

For emergency commits (use sparingly):
```bash
git commit --no-verify -m "message"
```

## Files

See [files.md](files.md) for script details.
