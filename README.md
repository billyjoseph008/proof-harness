# Proof Harness

**Agents finish with proof, not promises.**

A Claude Code plugin that makes coding agents work like careful engineers: agree on *what* before building, prove every "done" with a command and its output, keep context lean, hand off cleanly, get reviewed by a fresh pair of eyes, and never run the one command that wipes your week.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-8A63D2)
![Dependencies: 0](https://img.shields.io/badge/dependencies-0-blue)

## The problem

Coding agents are fast and confident. That is the problem.

- They say **"tests pass"** without running them, or after running the wrong ones.
- They start building before anyone agreed on what "done" means.
- They read whole codebases into context and get worse as the session gets longer.
- They lose the thread between sessions.
- They review their own work and approve it.
- Once in a while, they run `git push --force` to main or `cat .env` into the transcript.

Proof Harness fixes the workflow, not the model: a handful of short skills, two review agents, three commands and two safety hooks.

## Install in one minute

In Claude Code:

```text
/plugin marketplace add billyjoseph008/proof-harness
/plugin install proof-harness@proof-harness
```

Restart the session. The skills load on their own when they apply; the commands live under `/proof-harness:`.

Requirements: Claude Code with plugin support and Node.js 18+ (for the hooks). No other dependencies.

## What's inside

| Kind | Name | What it does |
|---|---|---|
| Skill | `spec-driven-development` | Turns a change into a short spec with EARS acceptance criteria, each with a proof, and stops for approval before code. |
| Skill | `evidence-before-done` | No "done", "fixed" or "passing" without the exact command and its result. Includes a copy-paste evidence format. |
| Skill | `context-economy` | Map before exploring, search before reading, read ranges, delegate wide searches, keep output short. |
| Skill | `session-handoff` | A ≤ 40-line `progress.md` (Status, Next, Log, Blockers) so the next session starts in one read. |
| Skill | `fresh-context-review` | Review by severity (correctness → security → data → contracts → tests) with `path:line` and a fix. |
| Agent | `reviewer` | Read-only reviewer with a fresh context. Verifies claims by running them. |
| Agent | `qa-evaluator` | Runs each acceptance criterion's proof and reports a verdict per criterion. Never accepts work itself. |
| Command | `/proof-harness:new-spec` | Drafts `spec.md`, `tasks.md` and `progress.md`, then waits for you. |
| Command | `/proof-harness:ship-check` | Pre-PR gate: the project's own lint, types and tests, evidence per criterion, then the reviewer. |
| Command | `/proof-harness:handoff` | Saves session state before `/clear` or handing work to another agent. |
| Hook | `guard-bash` | Blocks `rm -rf /` and `~`, force-push or delete on main, `reset --hard` on main, `git clean -fx`, `curl … \| sh`, `DROP DATABASE`/`TRUNCATE` through a DB client, disk formatting, and printing secret files. |
| Hook | `protect-files` | Blocks reading or writing `.env*`, private keys, `*.pem`, cloud and package-manager credentials. `.env.example` and public keys stay open. |

The hooks are silent when they allow, explain themselves when they block, and can be switched off for a session with `PROOF_HARNESS_GUARD=off`.

## The loop, in one example

A real-sized example lives in [`examples/password-reset-rate-limit`](examples/password-reset-rate-limit).

**1. Agree on what "done" means.**

```text
/proof-harness:new-spec AUTH-012 rate-limit password reset requests
```

The agent writes criteria you can check, then stops:

| ID | Criterion (EARS) | Proof |
|---|---|---|
| AC-01 | When a client requests a reset for an email that has had 5 requests in the last 60 minutes, the API shall respond 429 with a `Retry-After` header and send no email. | `npm test -- reset-rate-limit.test.ts -t "sixth request"` |
| AC-04 | If the rate-limit store is unavailable, then the API shall allow the request and log a warning. | `npm test -- reset-rate-limit.test.ts -t "store down"` |

**2. Build one task at a time, with evidence.**

```text
Claim: AC-01: the 6th reset request in an hour returns 429
Command: npm test -- reset-rate-limit.test.ts -t "sixth request"
Result: pass — 1 passed, 0 failed
Commit: 3f9c2a1
```

**3. Prove it to someone else.** `/proof-harness:ship-check` runs your checks and the `reviewer`; the `qa-evaluator` re-runs every proof and leaves the final "accepted" to you.

**4. Hand off.** `/proof-harness:handoff` writes the next step and its command into `progress.md`, so tomorrow's session (or another agent) starts working immediately.

## Design principles

1. **Claims need commands.** If it was not run, it is not verified, and the agent says so.
2. **Humans accept; agents propose.** Agents draft specs and verdicts. People approve specs and accept criteria.
3. **Fresh eyes review.** The author never approves their own diff.
4. **Context is a budget.** Read less, search more, delegate wide searches, write state down.
5. **Guardrails stay quiet.** A hook that cries wolf gets disabled. These block only what cannot be undone.
6. **Zero dependencies.** Markdown and Node's standard library. Read every line before you trust it.

## Where it comes from

Proof Harness is extracted from the harness I use to build and run a production SaaS with Claude Code and Codex: specs with acceptance criteria, evidence on every commit, review agents and hooks that have already stopped real mistakes. This repository keeps the generic, portable core.

## Development

```bash
npm test   # node:test, no install step
```

Try the plugin from a local checkout:

```text
/plugin marketplace add /path/to/proof-harness
/plugin install proof-harness@proof-harness
```

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md); the short version: keep skills short, keep hooks dependency-free, and paste your evidence in the PR.

If this saves you a bad afternoon, a star helps others find it.

## License

[MIT](LICENSE) © 2026 Billy Rojas Vindas
