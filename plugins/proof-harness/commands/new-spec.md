---
description: Draft a spec (spec.md + tasks.md + progress.md) with EARS acceptance criteria for a change, then stop for human approval
argument-hint: <ID> <short description of the change>
---
Draft a spec for: $ARGUMENTS

Follow the skill `spec-driven-development`.

1. Parse the ID (e.g. `AUTH-012`) and title from the arguments. If there is no ID, propose one and continue.
2. Search the code for the places the change touches (skill `context-economy`); summarize what exists today in two lines.
3. Create `docs/specs/<ID>-<kebab-title>/` with `spec.md` and `tasks.md` from the skill's templates, and a `progress.md` (skill `session-handoff`).
4. Write acceptance criteria in EARS, each with a concrete proof. Put every unknown under **Open questions**.
5. Do not write any implementation code. Reply with the spec path, the criteria table and the open questions, and ask the human to approve or answer.
