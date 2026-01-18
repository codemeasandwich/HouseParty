## Research Findings: Persona Config Service for Claude Code

### Available Mechanisms

| Mechanism | What It Does | Control Level |
|-----------|--------------|---------------|
| `--system-prompt` | **Replaces** entire system prompt | Full replacement |
| `--append-system-prompt` | **Appends** to system prompt | Additive |
| `CLAUDE.md` | Loaded as **first user message** (not system prompt) | Context injection |
| `SessionStart` hook | Fires when session starts/resumes | Can inject context |
| `settings.json` hierarchy | User → Project → Local | Per-folder config |
| VSCode `claudeCode.environmentVariables` | Env vars for extension | Limited |

### Key Discovery: How VSCode Extension Spawns Claude

The extension spawns Claude from a bundled CLI:
```
node .../cli.js --output-format stream-json --verbose --input-format stream-json --append-system-prompt [...]
```

This means the extension **already uses `--append-system-prompt`** internally. We can potentially intercept or wrap this.

---

### Architecture Options

#### Option A: CLI Wrapper + SessionStart Hook (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│ Your System                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ~/.local/bin/claude  ← wrapper script (on PATH first)  │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────┐                                    │
│  │ persona-service │  (tiny local daemon or script)     │
│  │                 │                                    │
│  │ - reads ~/.claude/persona-state.json                 │
│  │ - determines current folder's persona                │
│  │ - builds --append-system-prompt dynamically          │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  /usr/local/bin/claude (real Claude CLI)                │
│           │                                             │
│           ▼                                             │
│  Claude Code (with persona locked in system prompt)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**How it works:**

1. **Wrapper script** (`~/.local/bin/claude`) intercepts all `claude` calls
2. Reads persona state for current folder from `~/.claude/persona-state.json`
3. Builds persona-specific system prompt from modular files
4. Calls real CLI with `--system-prompt-file /tmp/current-persona.md`
5. Agent sees **only** its persona—no awareness of others

**Persona state file:**
```json
{
  "folders": {
    "/home/user/projects/my-saas": {
      "persona": "tars",
      "lastUsed": "2026-01-18T10:30:00Z"
    },
    "/home/user/projects/vr-game": {
      "persona": "red-queen",
      "lastUsed": "2026-01-17T14:00:00Z"
    }
  },
  "default": "stem"
}
```

**Wrapper script (`~/.local/bin/claude`):**
```bash
#!/bin/bash

PERSONA_SERVICE="$HOME/.claude/persona-service.sh"
REAL_CLAUDE="/usr/local/bin/claude-real"  # renamed original

# Get persona for current directory
PERSONA=$("$PERSONA_SERVICE" get-persona "$(pwd)")
PROMPT_FILE=$("$PERSONA_SERVICE" build-prompt "$PERSONA")

# Forward all args, inject system prompt
exec "$REAL_CLAUDE" --system-prompt-file "$PROMPT_FILE" "$@"
```

---

#### Option B: SessionStart Hook Only (Simpler, Less Isolated)

Use `SessionStart` hook to inject persona context:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/inject-persona.sh"
      }]
    }]
  }
}
```

**Limitation:** SessionStart hooks can load context but have no blocking capability—shows stderr to user only. This means we can add context but can't truly lock/isolate the persona.

---

### UI Component: VSCode Extension

For the selection UI, we have two options:

#### Option B1: Separate Companion Extension

Build a small VSCode extension that:
- Shows current persona in status bar
- Provides dropdown to switch personas
- Updates `~/.claude/persona-state.json`
- Optionally shows persona icon per message (harder—requires reading Claude extension output)

#### Option B2: Fork/Wrap Official Extension

There's an existing fork called "Claudix" that provides a custom interface. We could fork or build similarly.

**Recommendation:** Start with B1 (companion extension)—less maintenance, doesn't break on Claude updates.

---

### Implementation Plan

#### Phase 1: CLI Wrapper (Core)

```
~/.claude/
  personas/
    tars.md           # Full TARS system prompt
    red-queen.md      # Full Red Queen system prompt
    stem.md           # Full STEM system prompt
    _shared/
      workflow.md     # Shared workflow (included by all)
      communication.md
  persona-state.json  # Per-folder persona tracking
  persona-service.sh  # Script to manage state + build prompts
```

**`persona-service.sh` commands:**
```bash
./persona-service.sh get-persona /path/to/folder  # Returns: tars
./persona-service.sh set-persona /path/to/folder red-queen
./persona-service.sh build-prompt tars  # Outputs: /tmp/tars-prompt-xxxxx.md
./persona-service.sh list  # Lists all personas
./persona-service.sh detect /path/to/folder  # Auto-detect based on files
```

#### Phase 2: VSCode Companion Extension

- Status bar item showing current persona + icon
- Click to open quick pick for switching
- Calls `persona-service.sh set-persona` on selection
- File watcher on `persona-state.json` to update UI

#### Phase 3: Message Icons (Nice-to-have)

- Would require parsing Claude extension output or injecting into webview
- May not be feasible without forking the extension
- Alternative: Persona name in status bar is always visible

---

### Answers to Your Requirements

| Requirement | How We Achieve It |
|-------------|-------------------|
| Conversation-level persona | Wrapper injects at CLI spawn time (each conversation = new CLI process) |
| Auto-pick on new conversation | `persona-service.sh detect` checks for `package.json` vs `.unity` etc. |
| Per-folder persistence | `persona-state.json` tracks last used per folder |
| Pre-conversation selection | VSCode extension shows current + allows change before first message |
| Hard lock during conversation | `--system-prompt-file` replaces base prompt—agent has zero awareness of other personas |
| User can force-switch | VSCode extension updates state, next message uses new persona |
| Visual indicator | Status bar shows current persona |
| Works with Claude Max | Yes—wrapper just intercepts CLI, no API needed |
