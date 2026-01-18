---
name: 5-implementation
description: "Phase 5: Implementation. Use when writing code, running tests, or building features. Triggers: implement, code, build, test."
---

# Phase 5: Implementation

**Goal:** Execute the approved plan with continuous testing.

After each sub-step: update task tracking file in `todo/`

---

## 1. Branch Safety Check

```bash
# Check current branch
git branch --show-current

# If on main/master, create feature branch
git checkout -b feature/short-description
# or
git checkout -b hotfix/short-description
```

## 2. Implement in Testable Increments

- Each high-level task = complete piece of functionality
- Work through tasks in order
- Update task status as you progress
- Surface blockers or scope changes immediately

## 3. Test Each Increment *(Continuous — not deferred)*

**For existing codebases:** First run through `skills/workflow_codebase-analysis.md` to understand user flows.

After completing each testable piece:

1. **Write tests** covering behavioral flows
2. **Run full scenario testing** with 100% coverage on all metrics
3. **Verify no dead code** exists
4. **Do NOT proceed** until current increment passes all tests

Test rules (see `skills/workflow_testing-philosophy.md`):
- Entry point: Public API / developer interface ONLY
- No testing internal implementation
- Tests derived from acceptance criteria (Phase 2)

## 4. Follow Technical Guidelines

- Use required packages for project type:
  - JS/TS/Node/Web/SaaS → see `skills/stack_tech-stack-js.md`
  - Unity/Unreal/Godot/VR/AR/Games → see `skills/stack_tech-stack-vr-game.md`
- Run via Docker where applicable
- Minimize dependencies beyond required packages

## 5. Update Documentation *(After tests pass)*

- Update `README.md` — user-facing, quick start, examples
- Update `files.md` — developer-facing, module architecture, constraints
- Ensure docs reflect all new/changed functionality

---

## Phase Exit Criteria

Before proceeding to Phase 6 (Completion):
- [ ] All tasks completed
- [ ] All tests pass with 100% coverage
- [ ] Documentation updated
