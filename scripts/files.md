# Scripts - File Reference

[Back to scripts readme](readme.md) | [Back to main README](../README.md)

## postinstall.js

**Purpose:** Main installation orchestrator
**Run by:** `npm install` (automatically via package.json postinstall hook)
**Lines:** 196

### What it does:

1. Detects if this is a fresh install or upgrade
2. Creates `~/.claude/bin/` and `~/.vscode/extensions/claude-persona-switcher/`
3. Copies `bin/claude-wrapper` to `~/.claude/bin/`
4. Initializes `~/.claude/persona-state.json` (if not exists)
5. Builds VSCode extension (`npm install` + `npm run compile`)
6. Copies compiled extension to VSCode extensions folder
7. Copies persona files from `PUT_YOUR_MDs_HERE/` to `~/.claude/`
8. Updates VSCode `settings.json` with wrapper path

### Key functions:

- `copyDir(src, dest)` - Recursive directory copy
- `getVSCodeSettingsPath()` - Platform-specific settings path detection

---

## uninstall.js

**Purpose:** Clean removal of Claude Persona
**Run by:** `npm run uninstall`
**Lines:** 75

### What it does:

1. Removes `~/.claude/bin/claude-wrapper`
2. Removes `~/.vscode/extensions/claude-persona-switcher/`
3. Removes `claudeCode.claudeProcessWrapper` from VSCode settings
4. **Preserves** `~/.claude/persona-state.json`

### Why state is preserved:

User may want to reinstall later without losing their folder-persona mappings.
