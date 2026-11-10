import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { check } from '../plugins/proof-harness/hooks/scripts/protect-files.mjs';

const SCRIPT = fileURLToPath(new URL('../plugins/proof-harness/hooks/scripts/protect-files.mjs', import.meta.url));
const verdict = (tool_name, tool_input) => check({ tool_name, tool_input })?.[0] ?? 'allow';

describe('protect-files denies', () => {
  const paths = ['.env', '/repo/.env.local', 'app/.env.production', '.envrc', 'deploy/prod.env', 'certs/server.pem', 'tls/server.key',
    '/home/me/.ssh/id_rsa', '/home/me/.ssh/id_ed25519', 'credentials.json', 'gcp/service-account-prod.json', '/home/me/.aws/credentials',
    '/home/me/.netrc', '.npmrc', 'infra/terraform.tfstate', 'infra/prod.tfvars', 'C:\\Users\\me\\.ssh\\id_rsa'];
  for (const p of paths) {
    test(`Read ${p}`, () => assert.equal(verdict('Read', { file_path: p }), 'deny'));
  }
  test('Write .env', () => assert.equal(verdict('Write', { file_path: '.env', content: 'X=1' }), 'deny'));
  test('Edit .env.local', () => assert.equal(verdict('Edit', { file_path: '.env.local', old_string: 'a', new_string: 'b' }), 'deny'));
  test('MultiEdit a key', () => assert.equal(verdict('MultiEdit', { file_path: 'keys/app.pem', edits: [] }), 'deny'));
  test('Grep inside .env', () => assert.equal(verdict('Grep', { pattern: 'KEY', path: '.env' }), 'deny'));
  test('Grep with a .env* glob', () => assert.equal(verdict('Grep', { pattern: 'KEY', glob: '.env*' }), 'deny'));
  test('Grep with a **/*.pem glob', () => assert.equal(verdict('Grep', { pattern: 'BEGIN', glob: '**/*.pem' }), 'deny'));
});

describe('protect-files allows', () => {
  const paths = ['.env.example', '.env.sample', 'config/.env.template', 'example.env', 'src/env.ts', 'docs/environment.md',
    '/home/me/.ssh/id_ed25519.pub', '/home/me/.ssh/known_hosts', 'README.md', 'src/keyboard.ts', 'package.json'];
  for (const p of paths) {
    test(`Read ${p}`, () => assert.equal(verdict('Read', { file_path: p }), 'allow'));
  }
  test('Write .env.example', () => assert.equal(verdict('Write', { file_path: '.env.example', content: 'X=' }), 'allow'));
  test('Grep across src with a ts glob', () => assert.equal(verdict('Grep', { pattern: 'process.env', glob: '**/*.ts' }), 'allow'));
  test('Grep with no path', () => assert.equal(verdict('Grep', { pattern: 'TODO' }), 'allow'));
  test('unknown tool with no path', () => assert.equal(verdict('Glob', { pattern: '**/*' }), 'allow'));
});

describe('protect-files process protocol', () => {
  const run = (input, env = {}) => spawnSync(process.execPath, [SCRIPT], { input: JSON.stringify(input), env: { ...process.env, ...env } }).stdout.toString();
  test('prints a PreToolUse deny decision', () => {
    const out = JSON.parse(run({ tool_name: 'Read', tool_input: { file_path: '.env' } }));
    assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(out.hookSpecificOutput.permissionDecisionReason, /^proof-harness: /);
  });
  test('is silent when it allows', () => assert.equal(run({ tool_name: 'Read', tool_input: { file_path: 'README.md' } }), ''));
  test('PROOF_HARNESS_GUARD=off switches it off', () => {
    assert.equal(run({ tool_name: 'Read', tool_input: { file_path: '.env' } }, { PROOF_HARNESS_GUARD: 'off' }), '');
  });
});
