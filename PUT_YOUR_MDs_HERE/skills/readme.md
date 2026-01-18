# Skills System

[Back to customization readme](../readme.md) | [Back to main README](../../README.md)

Skills are modular markdown files that extend persona capabilities. Personas load skills based on the current workflow phase or task type.

## Skill Categories

### Core Personas

Define AI identity and base behavior:

| File | Persona | Purpose |
|------|---------|---------|
| `persona-tars.md` | TARS | JavaScript/SaaS development partner |
| `persona-red-queen.md` | Red Queen | Unity/VR/AR/XR specialist |
| `persona-stem.md` | STEM | Research and planning assistant |

### Workflow Skills

Loaded based on current development phase:

| File | Phases | Purpose |
|------|--------|---------|
| `workflow-planning.md` | 1-2 | Capture & Requirements |
| `workflow-design.md` | 3-4 | Architecture & Task Breakdown |
| `workflow-implementation.md` | 5-6 | Implementation & Completion |

### Development Skills

Task-specific guidance:

| File | Purpose |
|------|---------|
| `task-tracking.md` | Todo file format and structure |
| `git-workflow.md` | Commit messages, branching, merge process |
| `codebase-analysis.md` | Understanding existing code before changes |
| `testing-philosophy.md` | E2E testing approach (100% coverage goal) |

### Tech Stack Skills

Technology-specific patterns:

| File | Purpose |
|------|---------|
| `tech-stack-js.md` | Required JS/Node packages and patterns |
| `tech-stack-vr-game.md` | Unity/VR tech stack and conventions |

### Integration Skills

External system patterns:

| File | Purpose |
|------|---------|
| `api-ape-client.md` | WebSocket client integration patterns |
| `api-ape-server.md` | WebSocket server setup guide |
| `bri-client-integration.md` | BRI database client patterns |
| `bri-server-integration.md` | BRI server integration guide |

### Utility Skills

Support tasks:

| File | Purpose |
|------|---------|
| `up_skill.md` | Template for creating new skill files |
| `npm-release-workflow.md` | npm publish automation guide |
| `pre-commit-hooks.md` | Modular pre-commit hook system |

## How Skills Are Loaded

1. Main `.claude.md` detects project type and activates persona
2. Persona file defines base identity and available skills
3. Workflow skills are loaded based on current phase
4. Tech stack skills are loaded based on project type
5. Utility skills are available on-demand

## Creating New Skills

Use `up_skill.md` as a template. Key sections:

- **Purpose** - What this skill teaches
- **When to Use** - Trigger conditions
- **Instructions** - Detailed guidance
- **Examples** - Concrete usage patterns

## Files

See [files.md](files.md) for individual skill file descriptions.
