---
description: Pre-PR gate for the current branch — scoped lint, types and tests, evidence for each acceptance criterion, then a fresh-context review
argument-hint: [base branch, default origin/main]
---
Run the pre-PR gate for the current branch. Base branch: `$ARGUMENTS` (use `origin/main` if empty).

1. `git status --short` and `git diff --stat <base>...HEAD`. If there are uncommitted changes, list them and ask whether to include them.
2. Detect the project's own commands (package.json scripts, Makefile, go.mod, pyproject, etc.). Run, scoped to what changed when possible: format check, lint, type check, tests. Never install new tools or change config to make a check pass.
3. Record each result in the evidence format (skill `evidence-before-done`). A failing check stops the gate: report it with the 1–5 lines that matter.
4. If a spec exists for this branch, map each acceptance criterion to its evidence; list the ones without proof.
5. Launch the `reviewer` agent on the diff and include its verdict and findings.
6. Reply with a table: check · command · result, then the reviewer verdict, then **Ready for PR: yes/no** and why.
