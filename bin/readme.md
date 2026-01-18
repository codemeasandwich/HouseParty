# Wrapper Script

[Back to main README](../README.md)

The claude-wrapper script intercepts Claude CLI calls and injects persona-specific system prompts.

## How It Works

```
VSCode Extension (UI)
    ↓ writes to
~/.claude/persona-state.json
    ↓ read by
~/.claude/bin/claude-wrapper
    ↓ injects via --append-system-prompt
Claude CLI
```

The wrapper script is configured as the `claudeCode.claudeProcessWrapper` in VSCode settings. When Claude Code launches, it calls this wrapper instead of the Claude CLI directly.

## Auto-Detection Logic

1. Reads persona from `~/.claude/persona-state.json` for current folder
2. If no folder-specific persona set, auto-detects based on project files:
   - `package.json` present → **TARS**
   - `ProjectSettings/`, `.unity`, or `.csproj` present → **Red Queen**
   - Otherwise → **STEM** (default)
3. Loads persona markdown from `~/.claude/skills/persona-{name}.md`
4. Appends to Claude's system prompt via `--append-system-prompt`

## Behavior Details

- If the user already specified `--append-system-prompt` or `--system-prompt`, the wrapper passes through without modification
- If the persona file doesn't exist, the wrapper passes through without modification
- The working directory is determined by `CLAUDE_WORKING_DIR` env var or falls back to `pwd`

## File

| File | Purpose |
|------|---------|
| `claude-wrapper` | Bash script installed to `~/.claude/bin/` |

## Troubleshooting

### Persona not changing

- Start a **new conversation** after switching personas
- The persona is injected when Claude starts, not mid-conversation

### Check current persona state

```bash
cat ~/.claude/persona-state.json
```

### Verify wrapper is being used

Check VSCode settings for:
```json
{
  "claudeCode.claudeProcessWrapper": "/Users/YOUR_USERNAME/.claude/bin/claude-wrapper"
}
```

### Test wrapper manually

```bash
~/.claude/bin/claude-wrapper claude --version
```
