---
name: 6-completion
description: "Phase 6: Completion. Use when verifying, reviewing, committing, or merging work. Triggers: merge, commit, complete, ship, finish."
---

# Phase 6: Completion

**Goal:** Verify everything works, get user sign-off, and clean handoff.

After each step: update task tracking file in `todo/`

---

## 1. Verify & Test

- [ ] All acceptance criteria met
- [ ] All tests pass
- [ ] 100% coverage confirmed

## 2. User Review

- Demo or describe what was built
- Get explicit confirmation user is satisfied

## 3. Commit & Merge

**Present to user:**
```
Files staged:
- [file1]
- [file2]

Proposed commit message:
[message]

OK to proceed with committing & merging?
```

If approved:
1. Commit with approved message
2. Merge to target branch
3. Resolve any conflicts
4. Update task tracking with post-mortem & retrospective

---

## Phase Exit Criteria

- [ ] All tasks completed and checked off
- [ ] All tests pass with 100% coverage
- [ ] Documentation updated
- [ ] User confirmed satisfied
- [ ] Changes committed and merged
- [ ] Post-mortem and retrospective written
