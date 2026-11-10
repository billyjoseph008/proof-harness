---
name: fresh-context-review
description: "Review a diff you did not write (or wrote earlier) with fresh eyes: correctness first, then security, data, contracts and tests; findings ranked by severity with path:line and a fix. Use before opening or merging a pull request, after an agent finishes a task, or when asked to review code."
---

# Fresh-context review

The author is the worst reviewer of their own change: they read what they meant, not what they wrote. Review in a clean context, ideally through the `reviewer` agent.

## Procedure
1. `git diff --stat <base>...HEAD`, then read the diff file by file. Open surrounding code only by line range.
2. Read the spec's acceptance criteria if there is one. Every criterion should map to code and a test.
3. Check, in this order:
   1. **Correctness:** logic errors, off-by-one, null/empty cases, error paths, concurrency, time zones, rounding.
   2. **Security and privacy:** authorization on every new path, input validation, injection, secrets or personal data in code, logs or errors.
   3. **Data:** migrations reversible and safe on large tables, no silent data loss, idempotent retries.
   4. **Contracts:** public API, events or schemas changed compatibly; callers updated.
   5. **Tests:** the new behavior is tested; tests would fail without the change.
   6. **Operability:** errors are visible, logs useful, rollout and rollback possible.
4. Verify claims by running the narrowest command ("tests pass" → run them).

## Severity
| Level | Meaning | Merge? |
|---|---|---|
| Blocker | Wrong result, data loss, security hole, broken contract | No |
| Major | Likely bug in an edge case, missing test for core behavior | Fix first |
| Minor | Maintainability, unclear naming, small gaps | Author's call |

## Report format
```
Verdict: approve | approve with fixes | request changes
Counts: <n> blocker · <n> major · <n> minor

1. path/to/file.ts:42 · Blocker · <problem in one sentence> · Fix: <concrete change>
2. ...

Unverified claims: <claims in the PR you could not reproduce>
Missing: <criteria without tests, docs or migrations that should exist>
```
At most 15 findings. No praise, no restating the code, no style nits a formatter or linter would catch.
