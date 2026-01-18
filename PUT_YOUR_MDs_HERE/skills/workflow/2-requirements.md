---
name: 2-requirements
description: "Phase 2: Requirements & Scope. Use when writing user stories, defining acceptance criteria, or setting scope boundaries. Triggers: requirements, user stories, scope, acceptance criteria."
---

# Phase 2: Requirements & Scope

**Goal:** Define exactly what will be built before designing how.

After each step: update task tracking file in `todo/`

---

## 1. User Stories *(Critical — drives everything downstream)*

Format: **"As a [role], I want [feature] so that [benefit]"**

Rules:
- Each story must be testable
- Each story must be independently deliverable
- Stories define behavioral flows requiring 100% test coverage
- Stories directly inform acceptance criteria

## 2. Acceptance Criteria

- Derive directly from user stories
- Each criterion must be verifiable through integration/E2E tests
- These become test scenarios in Phase 5

## 3. Functional Requirements

- List specific behaviors/features the solution must have
- Map each requirement back to its user story

## 4. Scope Boundaries

Document explicitly:
```
**In Scope:**
- [Item]

**Out of Scope:**
- [Item]
```

Get user confirmation on boundaries.

## 5. Questions Checkpoint

- Surface ALL remaining questions
- **STOP and wait for user confirmation that requirements are complete**

---

## Phase Exit Criteria

Before proceeding to Phase 3 (Architecture):
- [ ] User stories written and approved
- [ ] Acceptance criteria derived from stories
- [ ] Functional requirements mapped to stories
- [ ] Scope boundaries confirmed
- [ ] All questions answered
