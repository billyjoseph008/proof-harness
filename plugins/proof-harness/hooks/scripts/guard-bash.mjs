#!/usr/bin/env node
// PreToolUse(Bash): deny commands that destroy work or data and cannot be undone, or that pull secrets into the
// transcript. Silent for everything else. Emergency switch: PROOF_HARNESS_GUARD=off in the session environment.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { deny, disabled, emit, isSecretPath, readInput, segments, stripLaunchers } from './lib.mjs';

const PROTECTED_BRANCHES = /^(main|master|trunk|production|prod|release)$/i;
// rm targets that wipe a machine, a home folder or the whole working tree.
const DANGER_TARGET = /^(\/|\/\*|~|~\/|~\/\*|\$HOME\/?\*?|\$\{HOME\}\/?\*?|\*|\.|\.\/|\.\/\*|\.\.|\.\.\/|\/[a-z]\/?\*?|[a-z]:[\\/]?\*?)$/i;
const SYSTEM_DIRS = new Set(['/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/lib64', '/opt', '/proc', '/root', '/sbin', '/sys', '/usr', '/var', '/Users', '/System', '/Applications']);
const DESTRUCTIVE_SQL = /\b(drop\s+(database|schema|table)|truncate\s+(table\s+)?\w)|\.dropDatabase\(\)/i;
const DB_CLIENTS = new Set(['psql', 'mysql', 'mariadb', 'sqlite3', 'sqlcmd', 'mongosh', 'mongo', 'cockroach', 'clickhouse-client', 'duckdb']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish', 'python', 'python3', 'node', 'perl', 'ruby', 'php']);
const FETCHERS = new Set(['curl', 'wget']);
const READERS = new Set(['cat', 'tac', 'head', 'tail', 'less', 'more', 'bat', 'batcat', 'nl', 'od', 'xxd', 'hexdump', 'strings',
  'grep', 'egrep', 'fgrep', 'rg', 'ag', 'awk', 'sed', 'cut', 'sort', 'uniq', 'base64', 'source', '.', 'diff', 'jq', 'yq']);

const prog = (words) => (words[0] || '').split('/').pop();

function currentBranch(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).toString().trim();
  } catch { return ''; }
}

function checkRm(args) {
  const flags = args.filter((a) => a.startsWith('-')).join(' ');
  const recursive = /(^|\s)-[a-zA-Z]*[rR]|--recursive/.test(flags);
  if (!recursive) return null;
  const targets = args.filter((a) => !a.startsWith('-'));
  const hit = targets.find((t) => DANGER_TARGET.test(t) || SYSTEM_DIRS.has(t.replace(/\/+\*?$/, '') || '/'));
  if (args.includes('--no-preserve-root') || hit !== undefined) {
    return deny(`recursive delete of "${hit ?? '/'}" would wipe the system, a home folder or the whole working tree. Delete the specific paths you mean.`);
  }
  return null;
}

function checkGit(args, cwd) {
  // Skip global options such as -C <dir> or -c key=value to find the subcommand.
  const a = [...args];
  while (a.length && a[0].startsWith('-')) { const opt = a.shift(); if ((opt === '-C' || opt === '-c') && a.length) a.shift(); }
  const [sub, ...rest] = a;
  if (sub === 'push') {
    const force = rest.some((x) => /^(-f|--force|--force-with-lease(=.*)?|--mirror|--delete|-d)$/.test(x) || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(x));
    const refs = rest.filter((x) => !x.startsWith('-')).slice(1); // after the remote name
    const plusRef = refs.find((r) => r.startsWith('+') || r.startsWith(':'));
    const targets = refs.map((r) => r.replace(/^[+:]/, '').split(':').pop());
    const branch = targets.length ? targets : [currentBranch(cwd)];
    const protectedHit = branch.find((b) => PROTECTED_BRANCHES.test(b));
    if ((force || plusRef) && protectedHit) {
      return deny(`force-pushing or deleting "${protectedHit}" rewrites shared history for everyone. Push a new branch and open a pull request instead.`);
    }
    return null;
  }
  if (sub === 'reset' && rest.includes('--hard')) {
    const branch = currentBranch(cwd);
    if (PROTECTED_BRANCHES.test(branch)) {
      return deny(`git reset --hard on "${branch}" throws away uncommitted work on a shared branch. Use git stash, or work on a feature branch.`);
    }
    return null;
  }
  if (sub === 'clean' && rest.some((x) => /^-[a-zA-Z]*f/.test(x)) && rest.some((x) => /^-[a-zA-Z]*x/.test(x))) {
    return deny('git clean -fx deletes ignored files too (.env, local databases, build caches). Run git clean -n first and delete what you mean.');
  }
  if (sub === 'branch' && rest.includes('-D') && rest.some((x) => PROTECTED_BRANCHES.test(x))) {
    return deny('deleting a protected branch (main/master/release) is not something an agent should do.');
  }
  return null;
}

/** The verdict for a command line, or null to stay silent. */
export function check(command, cwd = process.cwd()) {
  const cmd = String(command || '');
  if (!cmd.trim()) return null;
  if (/:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/.test(cmd)) return deny('fork bomb.');
  const segs = segments(cmd);
  if (DESTRUCTIVE_SQL.test(cmd) && segs.some((s) => DB_CLIENTS.has(prog(stripLaunchers(s.words))))) {
    return deny('DROP DATABASE/SCHEMA/TABLE or TRUNCATE destroys data with no undo. Write a reviewed migration, or ask the human to run it.');
  }
  for (let i = 0; i < segs.length; i++) {
    const words = stripLaunchers(segs[i].words);
    const name = prog(words);
    const args = words.slice(1);
    // Download piped straight into an interpreter: curl … | sh
    if (FETCHERS.has(name) && segs[i].next === '|') {
      const nextName = prog(stripLaunchers(segs[i + 1]?.words || []));
      if (SHELLS.has(nextName)) return deny(`piping a download into ${nextName} runs unreviewed code. Download the script, read it, then run it.`);
    }
    if (name === 'rm') { const v = checkRm(args); if (v) return v; }
    if (name === 'git') { const v = checkGit(args, cwd); if (v) return v; }
    if (/^mkfs(\.|$)/.test(name) || name === 'wipefs') return deny('formatting a filesystem destroys every file on it.');
    if (name === 'dd' && args.some((x) => /^of=\/dev\/(sd|nvme|hd|disk|mmcblk|xvd|vd)/.test(x))) return deny('dd onto a raw disk overwrites it.');
    if ((name === 'chmod' || name === 'chown') && args.some((x) => /^-[a-zA-Z]*R/.test(x)) && args.some((x) => x === '/' || SYSTEM_DIRS.has(x))) {
      return deny(`recursive ${name} on a system directory can make the machine unbootable.`);
    }
    if (READERS.has(name) && args.some((x) => !x.startsWith('-') && isSecretPath(x))) {
      return deny('this prints a secret file (.env, private key, credentials) into the transcript. Read the .env.example or ask the human for the value you need.');
    }
  }
  // Redirecting a secret file into a command: cmd < .env
  const redirect = cmd.match(/<\s*([^\s;&|]+)/);
  if (redirect && isSecretPath(redirect[1])) return deny('this feeds a secret file into a command whose output lands in the transcript.');
  return null;
}

async function main() {
  if (disabled()) return;
  const input = await readInput();
  emit(check(input?.tool_input?.command, input?.cwd || process.cwd()));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
