# Installation Scripts

[Back to main README](../README.md)

Scripts that handle installing and uninstalling Claude Persona.

## What `npm install` Does

1. Creates `~/.claude/bin/` directory
2. Installs wrapper script to `~/.claude/bin/claude-wrapper`
3. Initializes persona state at `~/.claude/persona-state.json` (if not exists)
4. Builds the VSCode extension (TypeScript compilation)
5. Installs extension to `~/.vscode/extensions/claude-persona-switcher/`
6. Copies persona files from `PUT_YOUR_MDs_HERE/` to `~/.claude/`
7. Copies skill files to `~/.claude/skills/`
8. Configures `claudeCode.claudeProcessWrapper` in VSCode settings

**Re-running `npm install`** upgrades existing installations without losing your persona state.

## Uninstall

```bash
npm run uninstall
```

This removes:
- Wrapper script (`~/.claude/bin/claude-wrapper`)
- VSCode extension (`~/.vscode/extensions/claude-persona-switcher/`)
- VSCode setting (`claudeCode.claudeProcessWrapper`)

**Preserved:** `~/.claude/persona-state.json` (your folder-persona mappings)

## Platform Support

| Platform | Status | Settings Path |
|----------|--------|---------------|
| macOS | Fully supported | `~/Library/Application Support/Code/User/settings.json` |
| Linux | Supported | `~/.config/Code/User/settings.json` |
| Windows | Supported | `%APPDATA%/Code/User/settings.json` |

## Requirements

- VSCode with Claude Code extension installed
- Node.js 18+
- Bun (for running tests)

## Manual VSCode Configuration

If the installer couldn't update VSCode settings automatically, add this to your `settings.json`:

```json
{
  "claudeCode.claudeProcessWrapper": "/Users/YOUR_USERNAME/.claude/bin/claude-wrapper"
}
```

## Files

See [files.md](files.md) for script details.
