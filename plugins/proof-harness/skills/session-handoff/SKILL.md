---
name: session-handoff
description: "Save the state of a task to progress.md (Status, Next, Log, Blockers) so a fresh session or another agent can resume in one read. Use before clearing or compacting the context, when ending a session, when handing work to another agent or person, and after finishing each task of a spec."
---

# Session handoff

A good handoff lets the next session start working in under a minute without rereading the codebase or the old chat.

## Where
- The active spec's `progress.md` (next to `spec.md`), or
- `.harness-handoff.md` at the repo root when there is no spec (keep it out of git).

## Format (≤ 40 lines)
```markdown
# <ID> progress

Status: <one line: what is true right now>
Branch: <branch> · Last commit: <short hash>

## Next
1. <The single next step, with the first command to run>
2. <Then this>

## Log
- <YYYY-MM-DD> <What changed>. Evidence: `<command>` → <result>.

## Blockers
- <What is stuck and who can unblock it>

## Questions for the human
- <Decisions the agent must not make alone>
```

## Rules
- **Next** is concrete: a file, a command, a decision. "Continue the feature" is not a next step.
- **Log** keeps evidence, not narrative (skill `evidence-before-done`). Trim entries older than the last ~10.
- List uncommitted files from `git status --short`. Do not commit unless the human asked.
- Never paste secrets, tokens or personal data into a handoff.
