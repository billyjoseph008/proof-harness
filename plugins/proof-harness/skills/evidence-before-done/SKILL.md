---
name: evidence-before-done
description: "Never claim work is done, fixed, passing or deployed without proof: the exact command that was run and the relevant lines of its output. Use before saying 'done', 'fixed', 'tests pass', 'works', 'deployed', before opening a PR, and when reporting status to a human."
---

# Evidence before done

"Done" is a claim. A claim without evidence is a guess. Every status you report must be reproducible by someone who was not in the session.

## The rule
Before you write *done, fixed, passing, works, verified, deployed or safe*, you must have:
1. **Run** the narrowest command that proves it (a specific test, a build, a curl against the endpoint, a query).
2. **Read** its result yourself, not assumed it.
3. **Recorded** it in the evidence format below.

If you could not run the proof, say so plainly: "Not verified: <why>. To verify, run `<command>`." Never soften a failure into "should work".

## Evidence format
```
Claim: <one sentence, e.g. "AC-02: the 6th reset request in an hour returns 429">
Command: <exact command, copy-pasteable>
Result: <pass/fail + the 1–5 output lines that matter, e.g. "12 passed, 0 failed">
Commit: <short hash the command ran against>
```
Append entries to the spec's `progress.md` under `## Log`, or to the PR description.

## What counts
| Claim | Good proof | Not proof |
|---|---|---|
| Tests pass | `npm test -- reset.test.ts` → `12 passed` | "I added tests" |
| Bug fixed | A test that failed before the fix and passes after | "The code looks right now" |
| Endpoint works | `curl -i` showing status and body | Reading the handler |
| Deployed | Version or revision ID from the live system | "The deploy command finished" |
| No regressions | The full suite, with counts | The one test you wrote |

## Smells
- Reporting a pass count you did not see.
- Re-running a failing command with no new hypothesis.
- Changing a test's expectation to make it pass without saying so.
- "Verified" next to something only a human can check (visuals, real payments, emails received): mark it **Human check** instead.
