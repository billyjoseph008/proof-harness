#!/usr/bin/env node
// PreToolUse(Read|Edit|Write|MultiEdit|NotebookEdit|Grep): keep secret files (.env, private keys, credential stores)
// out of the agent's context and out of its edits. .env.example and public keys stay readable.
// Silent when allowed. Emergency switch: PROOF_HARNESS_GUARD=off in the session environment.
import { pathToFileURL } from 'node:url';
import { deny, disabled, emit, isSecretPath, readInput } from './lib.mjs';

const REASON = {
  read: 'this file usually holds secrets (.env, private key, credentials). Read the .env.example or ask the human for the one value you need.',
  write: 'writing a secret file from the agent risks leaking or committing it. Edit the .env.example and let the human copy the real value.',
  grep: 'this search targets secret files. Search the code that reads the setting instead, or the .env.example.',
};

/** Glob patterns that aim at secret files, such as .env*, *.pem or id_rsa*. */
function secretGlob(glob) {
  if (!glob) return false;
  const g = String(glob).replace(/^\*\*\//, '');
  const probe = g.replace(/\{([^,}]*)[^}]*\}/g, '$1').replace(/\*+/g, 'x').replace(/\?/g, 'x');
  if (/^\.env/i.test(g) && !/example|sample|template/i.test(g)) return true;
  return isSecretPath(probe);
}

/** The verdict for one tool call, or null to stay silent. */
export function check(input) {
  const tool = input?.tool_name;
  const ti = input?.tool_input || {};
  if (tool === 'Grep') {
    if (isSecretPath(ti.path) || secretGlob(ti.glob)) return deny(REASON.grep);
    return null;
  }
  const path = ti.file_path ?? ti.notebook_path ?? ti.path;
  if (!isSecretPath(path)) return null;
  return deny(tool === 'Read' ? REASON.read : REASON.write);
}

async function main() {
  if (disabled()) return;
  emit(check(await readInput()));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
