// Shared helpers for Proof Harness hooks. Node 18+, no dependencies.
// Hook protocol: Claude Code sends the tool call as JSON on stdin; to block it, a PreToolUse hook prints
// {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny"|"ask","permissionDecisionReason":"..."}}.
// Printing nothing means "no opinion" and the normal permission flow continues.

export const PREFIX = 'proof-harness';

/** Read and parse the hook input from stdin. Invalid or empty input becomes {}. */
export async function readInput(stream = process.stdin) {
  let data = '';
  for await (const chunk of stream) data += chunk;
  try { return JSON.parse(data || '{}'); } catch { return {}; }
}

/** The PreToolUse decision object for a verdict, or null when there is nothing to say. */
export function decision(verdict) {
  if (!verdict) return null;
  const [permissionDecision, reason] = verdict;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision,
      permissionDecisionReason: `${PREFIX}: ${reason}`,
    },
  };
}

/** Write the decision for a verdict to stdout (nothing for null). */
export function emit(verdict) {
  const out = decision(verdict);
  if (out) process.stdout.write(JSON.stringify(out));
}

/** True when the user switched the guards off for this session. */
export const disabled = (env = process.env) => String(env.PROOF_HARNESS_GUARD || '').toLowerCase() === 'off';

export const deny = (reason) => ['deny', reason];
export const ask = (reason) => ['ask', reason];

const toPosix = (p) => String(p || '').replace(/\\/g, '/');
const SAFE_ENV_SUFFIX = /^\.env\.(example|sample|template|defaults|dist)$/i;
const KEY_NAMES = /^(id_(rsa|dsa|ecdsa|ed25519)|.*\.(pem|key|p12|pfx|jks|keystore|ppk|asc|gpg))$/i;
const CREDENTIAL_NAMES = /^(credentials(\.json)?|service[-_]?account.*\.json|\.netrc|_netrc|\.pgpass|\.npmrc|\.pypirc|\.git-credentials|secrets?\.(json|ya?ml|toml)|.*\.tfstate(\.backup)?|.*\.tfvars)$/i;
const CREDENTIAL_PATHS = /(^|\/)(\.aws\/credentials|\.ssh\/[^/]+|\.docker\/config\.json|\.kube\/config|\.config\/gcloud\/[^/]*credentials[^/]*)$/i;

/** True for files that usually hold secrets: .env*, private keys, credential stores. Public keys and .env.example are fine. */
export function isSecretPath(p) {
  const path = toPosix(p).replace(/^["']|["']$/g, '');
  if (!path) return false;
  const name = path.split('/').pop();
  if (/\.pub$/i.test(name)) return false;
  if (/^\.ssh\/known_hosts$|(^|\/)\.ssh\/(known_hosts|config|authorized_keys)$/i.test(path)) return false;
  if (name === '.env' || name === '.envrc') return true;
  if (/^\.env\./i.test(name)) return !SAFE_ENV_SUFFIX.test(name);
  if (/\.env$/i.test(name) && name !== '.env') return /^[\w.-]+\.env$/i.test(name) && !/^(example|sample|template)\.env$/i.test(name);
  return KEY_NAMES.test(name) || CREDENTIAL_NAMES.test(name) || CREDENTIAL_PATHS.test(path);
}

/**
 * Split a shell command into tokens, honoring single and double quotes and backslash escapes.
 * Operators (&&, ||, ;, |, &, newline) become their own tokens so callers can find segment boundaries.
 */
export function tokenize(cmd) {
  const tokens = [];
  let cur = '';
  let quoted = false;
  let quote = null;
  const push = () => { if (cur !== '' || quoted) tokens.push(cur); cur = ''; quoted = false; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < cmd.length) cur += cmd[++i];
      else cur += c;
      continue;
    }
    if (c === "'" || c === '"') { quote = c; quoted = true; continue; }
    if (c === '\\' && i + 1 < cmd.length) { cur += cmd[++i]; continue; }
    if (/\s/.test(c) && c !== '\n') { push(); continue; }
    const two = cmd.slice(i, i + 2);
    if (two === '&&' || two === '||') { push(); tokens.push(two); i++; continue; }
    if (c === ';' || c === '|' || c === '&' || c === '\n' || c === '(' || c === ')' || c === '`') { push(); tokens.push(c === '\n' ? ';' : c); continue; }
    if (c === '$' && cmd[i + 1] === '(') { push(); tokens.push('('); i++; continue; }
    cur += c;
  }
  push();
  return tokens;
}

const OPERATORS = new Set(['&&', '||', ';', '|', '&', '(', ')', '`']);

/** Segments of a command line: arrays of words between operators, plus the operator that follows each one. */
export function segments(cmd) {
  const out = [];
  let words = [];
  for (const t of tokenize(cmd)) {
    if (OPERATORS.has(t)) { out.push({ words, next: t }); words = []; } else words.push(t);
  }
  out.push({ words, next: null });
  return out.filter((s) => s.words.length);
}

const LAUNCHERS = new Set(['sudo', 'doas', 'env', 'command', 'builtin', 'exec', 'nohup', 'time', 'nice', 'xargs']);

/** Drop launchers (sudo, env, nohup…) and leading VAR=value assignments so words[0] is the real program. */
export function stripLaunchers(words) {
  const w = [...words];
  for (;;) {
    if (!w.length) return w;
    const name = w[0].split('/').pop();
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w[0])) { w.shift(); continue; }
    if (LAUNCHERS.has(name)) {
      w.shift();
      while (w.length && /^-/.test(w[0])) w.shift(); // launcher flags (sudo -u is rare enough to ignore its value)
      continue;
    }
    return w;
  }
}
