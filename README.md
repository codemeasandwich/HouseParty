# Claude Persona

Persona management system for Claude Code in VSCode. Switch between different AI personas (TARS, Red Queen, STEM) per-folder with automatic detection and status bar UI.

## Personas

| Persona | Best For | Auto-Detected By |
|---------|----------|------------------|
| **TARS** | JavaScript/TypeScript/SaaS development | `package.json`, `bun.lockb` |
| **Red Queen** | Unity/VR/AR/XR development | `ProjectSettings/`, `.unity`, `.csproj` |
| **STEM** | Research, planning, analysis | Default fallback |

## Installation

```bash
git clone https://github.com/codemeasandwich/claude-persona.git
cd claude-persona
npm install
```

The `npm install` will:
1. Install the wrapper script to `~/.claude/bin/claude-wrapper`
2. Initialize persona state at `~/.claude/persona-state.json`
3. Build and install the VSCode extension
4. Configure `claudeCode.claudeProcessWrapper` in VSCode settings
5. Check for persona definition files and warn if missing

**Re-running `npm install`** will upgrade existing installations without losing your persona state.

## Usage

1. **Restart VSCode** after installation (or Cmd+Shift+P → "Developer: Reload Window")
2. Look for the persona indicator in the **status bar** (bottom right)
3. **Click the status bar** or use Command Palette → "Claude: Switch Persona"
4. **Start a new conversation** — the selected persona will be active

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

The wrapper script intercepts Claude CLI calls and injects the selected persona's system prompt. Personas are auto-detected based on project files, or manually selected via the status bar.

## Persona Files

Personas are defined in `~/.claude/skills/`:
- `persona-tars.md`
- `persona-red-queen.md`
- `persona-stem.md`

Edit these files to customize persona behavior. The installer will warn you if any are missing.

### Creating a Persona File

Each persona file is a markdown document that defines the AI's identity and behavior:

```markdown
# I am TARS

I am TARS, an engineering partner for JavaScript and SaaS developers.

## My Identity
[Describe the persona's approach and philosophy]

## How I Work
[Define communication style, workflow, etc.]

## My Tech Stack
[List preferred technologies, if applicable]
```

## Customizing Personas

The `PUT_YOUR_MDs_HERE/` directory contains persona definitions that the installer will copy to `~/.claude/`:

```
PUT_YOUR_MDs_HERE/
├── .claude.md                   # Main persona detection & workflow config
└── skills/
    ├── persona-tars.md          # TARS: JS/SaaS development persona
    ├── persona-red-queen.md     # Red Queen: VR/Unity persona
    ├── persona-stem.md          # STEM: Research & planning persona
    ├── workflow-planning.md     # Phases 1-2: Capture & Requirements
    ├── workflow-design.md       # Phases 3-4: Architecture & Tasks
    ├── workflow-implementation.md # Phases 5-6: Implementation & Completion
    ├── task-tracking.md         # Todo file format
    ├── git-workflow.md          # Commit/branch conventions
    ├── codebase-analysis.md     # Understanding existing code
    ├── testing-philosophy.md    # E2E testing approach (100% coverage)
    ├── tech-stack-js.md         # Required JS/Node packages
    ├── tech-stack-vr-game.md    # Unity/VR tech stack
    ├── up_skill.md              # Skill file generator template
    ├── api-ape-client.md        # WebSocket client integration
    ├── api-ape-server.md        # WebSocket server setup
    ├── bri-client-integration.md # BRI database client
    ├── bri-server-integration.md # BRI server patterns
    ├── npm-release-workflow.md  # npm publish automation
    └── pre-commit-hooks.md      # Modular pre-commit system
```

**Edit these files before running `npm install`** to customize your personas. The installer reads from this directory and copies the files to `~/.claude/`.

## Uninstall

```bash
cd claude-persona
npm run uninstall
```

This removes:
- Wrapper script (`~/.claude/bin/claude-wrapper`)
- VSCode extension
- VSCode setting (`claudeCode.claudeProcessWrapper`)

Your persona state file (`~/.claude/persona-state.json`) is preserved so you don't lose folder-persona mappings.

## Platform Support

| Platform | Status |
|----------|--------|
| macOS | ✅ Fully supported |
| Linux | ✅ Supported |
| Windows | ✅ Supported |

VSCode settings paths are auto-detected for each platform.

## Requirements

- VSCode with Claude Code extension installed
- Node.js 18+
- Bun (for running tests)

## Testing

Run the full test suite:

```bash
bun test
```

Watch mode for development:

```bash
bun test:watch
```

### Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `stateManager.test.ts` | 25 | State read/write, persona detection, CRUD operations |
| `cliWrapper.test.ts` | 14 | State reading, auto-detection, prompt injection |
| `postinstall.test.ts` | 12 | Directory creation, wrapper install, state init |
| `uninstall.test.ts` | 10 | Wrapper/extension removal, settings cleanup |
| `e2e/fullFlow.test.ts` | 5 | Full install/uninstall cycle, multi-folder switching |

Tests use isolated temp directories and mock HOME environments to avoid affecting your actual `~/.claude/` configuration.

## Troubleshooting

### Persona not changing
- Make sure to **start a new conversation** after switching personas
- The persona is injected when Claude starts, not mid-conversation

### VSCode extension not showing
- Run "Developer: Reload Window" from Command Palette
- Check that `~/.vscode/extensions/claude-persona-switcher/` exists

### Missing persona files warning
- Create the persona files in `~/.claude/skills/`
- See "Persona Files" section above for format

### Manual VSCode configuration
If the installer couldn't update VSCode settings automatically, add this to your `settings.json`:
```json
{
  "claudeCode.claudeProcessWrapper": "/Users/YOUR_USERNAME/.claude/bin/claude-wrapper"
}
```

## License

MIT
