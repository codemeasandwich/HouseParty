# Persona Customization

[Back to main README](../README.md)

This directory contains persona definitions that get copied to `~/.claude/` during installation.

## Directory Structure

```
PUT_YOUR_MDs_HERE/
├── .claude.md          # Main persona detection & workflow config
└── skills/             # Persona and skill definitions
    ├── persona-*.md    # Core persona files
    └── *.md            # Skill files loaded by personas
```

## How It Works

1. **Edit files here** before running `npm install`
2. Installer copies `.claude.md` → `~/.claude/CLAUDE.md`
3. Installer copies `skills/` → `~/.claude/skills/`
4. Personas reference skill files via the workflow system

## Creating a Persona File

Each persona file is a markdown document defining AI identity and behavior:

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

## Core Persona Files

| File | Persona | Specialization |
|------|---------|----------------|
| `skills/persona-tars.md` | TARS | JavaScript/TypeScript/SaaS |
| `skills/persona-red-queen.md` | Red Queen | Unity/VR/AR/XR |
| `skills/persona-stem.md` | STEM | Research & planning |

## Detection Rules

From `.claude.md`:

| Persona | Auto-Detected By |
|---------|------------------|
| **TARS** | `package.json`, `.js`, `.ts`, `node_modules/`, `bun.lockb` |
| **Red Queen** | `.unity`, `.csproj`, `ProjectSettings/`, `.uproject` |
| **STEM** | No code project detected, or user requests research/planning |

## Workflow System

The `.claude.md` file defines a 6-phase workflow that all personas follow:

| Phase | Goal | Skill |
|-------|------|-------|
| 1. Capture | Document request, clarify intent | `workflow-planning.md` |
| 2. Requirements | User stories, acceptance criteria | `workflow-planning.md` |
| 3. Architecture | High-level design | `workflow-design.md` |
| 4. Task Breakdown | Implementation roadmap | `workflow-design.md` |
| 5. Implementation | Code + test | `workflow-implementation.md` |
| 6. Completion | Verify, review, commit | `workflow-implementation.md` |

Each phase requires explicit user approval before proceeding.

## Shared Principles

All personas follow these core principles:

- **Output only after clear requirements** - Never produce deliverables until the request is fully understood
- **Numbered options, not open questions** - Present 3-5 concrete options with reasoning
- **Task tracking** - Update `todo/` markdown after every step

## Skill Files

See [skills/readme.md](skills/readme.md) for the skill system documentation.
