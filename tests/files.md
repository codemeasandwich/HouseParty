# Tests - File Reference

[Back to tests readme](readme.md) | [Back to main README](../README.md)

## Unit Tests

### stateManager.test.ts

Tests `StateManager` class:
- State file creation and initialization
- Reading/writing persona state
- Persona detection logic (TARS, Red Queen, STEM)
- CRUD operations on folder-persona mappings

### cliWrapper.test.ts

Tests `bin/claude-wrapper`:
- State file parsing
- Auto-detection based on project files
- Prompt injection via `--append-system-prompt`
- Passthrough when user specifies own prompt

### postinstall.test.ts

Tests `scripts/postinstall.js`:
- Directory creation (`~/.claude/bin/`, etc.)
- Wrapper script copying
- State file initialization
- VSCode settings update
- Persona file copying

### uninstall.test.ts

Tests `scripts/uninstall.js`:
- Wrapper file removal
- Extension folder removal
- VSCode settings cleanup
- State file preservation

### commands.test.ts

Tests VSCode commands:
- `claudePersona.switch` registration
- `claudePersona.detect` registration
- Quick pick behavior
- Warning when no folder open

### statusBar.test.ts

Tests status bar UI:
- Display of current persona
- Icon and tooltip content
- Refresh on state changes
- "No Folder" state

### extension.test.ts

Tests extension lifecycle:
- Activation
- Deactivation
- File watcher setup
- Workspace folder change handling

---

## End-to-End Tests

### e2e/fullFlow.test.ts

Full integration tests:
- Fresh install flow
- Upgrade flow (existing installation)
- Persona switching across folders
- Uninstall with state preservation
- Multi-folder persona management

---

## Test Utilities

### utils/bashRunner.ts

Execute bash scripts in tests:
- Runs scripts with custom environment
- Captures stdout/stderr
- Handles exit codes

### utils/tempDir.ts

Temp directory management:
- Creates isolated test directories
- Cleans up after tests
- Simulates HOME directory

---

## Fixtures

### fixtures/persona-state.json

Sample state file for testing:
```json
{
  "version": 1,
  "default": "stem",
  "folders": {}
}
```

### fixtures/persona-tars.md

Sample TARS persona for tests.

### fixtures/persona-red-queen.md

Sample Red Queen persona for tests.

### fixtures/persona-stem.md

Sample STEM persona for tests.

---

## Mocks

### mocks/vscode.ts

Mock VSCode API implementation:
- `window` - createStatusBarItem, showQuickPick, showInformationMessage
- `workspace` - workspaceFolders, createFileSystemWatcher
- `commands` - registerCommand

Enables testing extension code without actual VSCode runtime.
