# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-09

### Added
- Skills: `spec-driven-development`, `evidence-before-done`, `context-economy`,
  `session-handoff`, `fresh-context-review`.
- Agents: `reviewer` (read-only, fresh context) and `qa-evaluator`.
- Commands: `/proof-harness:new-spec`, `/proof-harness:ship-check`, `/proof-harness:handoff`.
- Hooks: `guard-bash` (blocks destructive shell commands) and `protect-files`
  (blocks reading or writing secret files).
- Tests for both hooks with `node:test` (zero dependencies).
- Example spec: password reset rate limit.
