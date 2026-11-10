---
description: Save session state to progress.md (Status, Next, Log, Blockers) so the next session or agent can resume in one read
argument-hint: [spec ID]
---
Prepare this session for `/clear` or for another agent. Follow the skill `session-handoff`.

1. Find the active spec: `$ARGUMENTS` if given, else the most recently modified `docs/specs/*/progress.md`. If none exists, write `.harness-handoff.md` at the repo root.
2. Update it (≤ 40 lines): Status, Branch and last commit, `## Next` (1–3 concrete steps, the first with its command), a dated Log entry with evidence, Blockers, Questions for the human.
3. Run `git status --short` and list uncommitted files. Do not commit unless the human asked.
4. Reply in ≤ 5 lines: where the state was saved and the single next step.
