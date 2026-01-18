# Claude Persona

> Give your Claude Code AI a personality. Switch between specialized AI personas per-project with automatic detection.

## The Problem

Claude Code is powerful, but it treats every project the same. A React SaaS app gets the same responses as a Unity VR game or a research document.

## The Solution

**Claude Persona** lets you define distinct AI personalities that automatically activate based on your project type:

| Persona | Specialization | Auto-Detects |
|---------|---------------|--------------|
| **TARS** | JS/TS/SaaS development | `package.json`, `bun.lockb` |
| **Red Queen** | Unity/VR/AR/XR | `ProjectSettings/`, `.unity` |
| **STEM** | Research & analysis | Default fallback |

Each persona brings its own workflow, tech stack preferences, and communication style.

## Quick Install

```bash
git clone https://github.com/codemeasandwich/claude-persona.git
cd claude-persona && npm install
```

Restart VSCode. Done.

## How It Works

```
VSCode Status Bar  →  Persona State File  →  Wrapper  →  Claude CLI
     (select)            (persists)         (injects)    (responds)
```

Click the status bar to switch personas. The wrapper intercepts Claude CLI calls and injects your selected persona's system prompt.

## Documentation

| Topic | Description |
|-------|-------------|
| [Installation Details](scripts/readme.md) | What npm install does, platform support, requirements |
| [Wrapper Mechanism](bin/readme.md) | How the CLI wrapper intercepts and injects personas |
| [VSCode Extension](vscode-extension/readme.md) | Usage guide, commands, extension architecture |
| [Customizing Personas](PUT_YOUR_MDs_HERE/readme.md) | Create and edit persona definitions |
| [Skill Files](PUT_YOUR_MDs_HERE/skills/readme.md) | Modular skills system for workflows and tech stacks |
| [Testing](tests/readme.md) | Test suite, coverage, running tests |
| [Pre-commit Hooks](.hooks/readme.md) | Modular pre-commit validation system |

## Uninstall

```bash
npm run uninstall
```

## License

MIT
