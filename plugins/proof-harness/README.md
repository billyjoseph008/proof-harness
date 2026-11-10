# Proof Harness (plugin)

Agents finish with proof, not promises. This plugin adds five skills (spec-driven development with EARS acceptance criteria, evidence-before-done, context economy, session handoff, fresh-context review), two agents (`reviewer`, `qa-evaluator`), three commands (`/proof-harness:new-spec`, `/proof-harness:ship-check`, `/proof-harness:handoff`) and two safety hooks that block destructive shell commands and keep secret files out of the agent's context.

Install:

```text
/plugin marketplace add billyjoseph008/proof-harness
/plugin install proof-harness@proof-harness
```

Setup: Node.js 18+ for the hooks; nothing else to install. Switch the hooks off for a session with `PROOF_HARNESS_GUARD=off`.

Full documentation, examples and the worked spec → build → evidence loop: see the [repository README](https://github.com/billyjoseph008/proof-harness#readme).
