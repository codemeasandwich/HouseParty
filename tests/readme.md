# Test Suite

[Back to main README](../README.md)

Comprehensive test coverage for Claude Persona using Bun test runner.

## Running Tests

```bash
# Full test suite
bun test

# Watch mode for development
bun test --watch
```

## Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `stateManager.test.ts` | 25 | State read/write, persona detection, CRUD |
| `cliWrapper.test.ts` | 14 | State reading, auto-detection, prompt injection |
| `postinstall.test.ts` | 12 | Directory creation, wrapper install, state init |
| `uninstall.test.ts` | 10 | Wrapper/extension removal, settings cleanup |
| `commands.test.ts` | - | VSCode command registration and execution |
| `statusBar.test.ts` | - | Status bar UI behavior |
| `extension.test.ts` | - | Extension activation/deactivation |
| `e2e/fullFlow.test.ts` | 5 | Full install/uninstall cycle, multi-folder switching |

## Test Strategy

Tests use **isolated temp directories** and mock HOME environments to avoid affecting your actual `~/.claude/` configuration.

### Isolation Approach

1. Create temp directory for each test
2. Set `HOME` environment variable to temp directory
3. Run test operations
4. Clean up temp directory

### Mock Strategy

- **VSCode API:** Mocked via `vscodeApi.ts` abstraction layer
- **File System:** Real file operations in temp directories
- **Bash Scripts:** Executed via `bashRunner.ts` utility

## Directory Structure

```
tests/
├── e2e/                    # End-to-end integration tests
│   └── fullFlow.test.ts
├── fixtures/               # Test data files
│   ├── persona-*.md
│   └── persona-state.json
├── mocks/                  # Mock implementations
│   └── vscode.ts
├── utils/                  # Test helpers
│   ├── bashRunner.ts
│   └── tempDir.ts
├── stateManager.test.ts    # StateManager unit tests
├── cliWrapper.test.ts      # Wrapper script tests
├── postinstall.test.ts     # Installation tests
├── uninstall.test.ts       # Uninstallation tests
├── commands.test.ts        # Command tests
├── statusBar.test.ts       # Status bar tests
└── extension.test.ts       # Extension lifecycle tests
```

## Files

See [files.md](files.md) for test file details.
