---
name: spec-driven-development
description: "Turn a feature, bug fix or risky change into a short spec with EARS acceptance criteria and a task list before writing code, then build in small verified steps. Use when starting any non-trivial feature, a change that touches data, auth, money or a public contract, or when the request is ambiguous."
---

# Spec-driven development

Code is cheap; the wrong code is expensive. A spec is the smallest document that lets a human approve *what* will be built and lets anyone check *that* it was built.

## When to write one
- New feature, cross-module change, migration, auth/permissions, payments, public API change.
- A bug whose fix is not obvious in one file.
- Skip it for typos, one-line fixes and pure refactors with full test coverage.

## Loop
1. **Understand.** Read the request, then search the code for the 3–5 places it touches. Write down what exists today in two lines.
2. **Draft `spec.md`** from `templates/spec.md` (next to this file): problem, scope, out of scope, acceptance criteria, risks, open questions.
3. **Write acceptance criteria in EARS** (one behavior per line, each with an ID and a proof):
   - Ubiquitous: `The <system> shall <response>.`
   - Event: `When <trigger>, the <system> shall <response>.`
   - State: `While <state>, the <system> shall <response>.`
   - Unwanted: `If <condition>, then the <system> shall <response>.`
   - Optional: `Where <feature is enabled>, the <system> shall <response>.`
   Every criterion names how it will be proven: a test name, a command, or a manual check a human performs.
4. **Stop for approval.** List open questions. Do not start building until the human approves the spec or answers them.
5. **Plan `tasks.md`** from `templates/tasks.md`: tasks of ≤ ½ day, each mapped to the criteria it serves, in dependency order.
6. **Build one task at a time.** Write the test that proves the criterion first when practical, make it pass, then record evidence (skill `evidence-before-done`).
7. **Verify, then hand over.** Run the `qa-evaluator` agent on the spec. A human accepts each criterion; agents never mark their own work as accepted.

## Rules
- Criteria describe observable behavior, not implementation ("returns 429", not "uses a Redis counter").
- One spec per change. If scope grows, write a second spec instead of stretching the first.
- Keep `spec.md` under ~120 lines. Long specs hide decisions.
- Unknowns go in **Open questions**, never silently decided by the agent.
