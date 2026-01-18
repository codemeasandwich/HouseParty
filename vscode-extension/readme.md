# VSCode Extension

[Back to main README](../README.md)

The Claude Persona Switcher extension provides UI for selecting personas in VSCode.

## Usage

1. **Restart VSCode** after installation (or Cmd+Shift+P → "Developer: Reload Window")
2. Look for the persona indicator in the **status bar** (bottom right)
3. **Click the status bar** or use Command Palette → "Claude: Switch Persona"
4. **Start a new conversation** — the selected persona will be active

## Commands

| Command | Description |
|---------|-------------|
| `claudePersona.switch` | Opens quick pick to select a persona for the current folder |
| `claudePersona.detect` | Auto-detect persona based on project files |

## Architecture

```
extension.ts (entry point)
    │
    ├── stateManager.ts (reads/writes ~/.claude/persona-state.json)
    │
    ├── statusBar.ts (manages status bar UI)
    │
    ├── commands.ts (registers VSCode commands)
    │
    └── vscodeApi.ts (VSCode API abstraction for testing)
```

## How It Works

1. **Activation:** Extension activates on VSCode startup
2. **State Manager:** Reads persona state from `~/.claude/persona-state.json`
3. **Status Bar:** Displays current persona with icon (TARS, Red Queen, or STEM)
4. **File Watcher:** Watches for state file changes and refreshes UI
5. **Commands:** User clicks status bar → quick pick → state updates → wrapper reads new persona

## Building Manually

```bash
cd vscode-extension
npm install
npm run compile
```

Output goes to `out/` directory.

## Troubleshooting

### Extension not showing

- Run "Developer: Reload Window" from Command Palette
- Check that `~/.vscode/extensions/claude-persona-switcher/` exists

### Status bar missing

- Ensure a folder is open (not just a file)
- Check VSCode output panel for errors

## Files

See [files.md](files.md) for source file details.
