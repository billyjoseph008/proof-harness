---
name: context-economy
description: "Spend context like money: map before exploring, search before reading, read line ranges, delegate wide searches, keep command output short and hand off before context runs out. Use at the start of any non-trivial task, when the context is getting large, or when work feels slow."
---

# Context economy

Every token you read is paid again on every later turn, and a crowded context makes attention worse. Finish with the smallest context that still yields correct, verified work.

## Rules
1. **Map before you explore.** Read the repo's README, AGENTS.md/CLAUDE.md and any code map first. Do not list directories recursively.
2. **Search, then read ranges.** Grep or Glob for precise patterns, then read only the relevant lines of the files found. Never open a large file "to understand it".
3. **Never load** lockfiles, generated code, build output, `node_modules/`, coverage reports, minified files, large fixtures or binaries.
4. **Delegate wide searches.** If finding something spans more than ~3 directories or unknown names, send a subagent and ask for ≤ 1,500 tokens of conclusions with `path:line`, not file dumps.
5. **Quiet commands.** Use scoped commands (one package, one test file) and filter output to ≤ 40 lines; write long logs to a file and grep them.
6. **Don't repeat work.** Don't re-read a file you just edited. Don't re-run a failed command without a new hypothesis. Don't paste code back into replies.
7. **Externalize memory.** Decisions go in an ADR or the spec; task state in `progress.md`. Chat history is not memory.

## Budget checkpoints
- Around half the context window: summarize what you know into `progress.md` and drop exploration you no longer need.
- Before switching tasks or when the window is mostly used: run `/proof-harness:handoff`, then start a fresh session from it.

## Reading a new codebase in 5 steps
1. README and agent instructions. 2. The entry point (main, router, app). 3. Grep for the feature's nouns. 4. Read the 2–3 hits that matter, by range. 5. Write down the map in three lines before changing anything.
