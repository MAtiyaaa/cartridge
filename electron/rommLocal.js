// RomM on this device (0.9.15, plan section 1): RomM's own docker-compose.example.yml (RomM with its
// built-in Valkey, plus MariaDB) run with rootless Podman as one pod, so nothing touches the
// read-only system. The user picks their own RomM username and password (RomM's first admin, made
// through POST /api/users, which RomM allows with no sign-in while it has no admin). Only the
// secrets nobody types (database passwords, RomM's auth key) are generated; they stay in
// romm-local.env (mode 600) so updates can recreate the containers with the same database.
// - Port: the first free one from 8095 (Steam's remote debugging already holds 8080).
// - Folders are mounted with SELinux labelling off for these containers (no relabelling of the user's files).
// - --restart=always plus Podman's own podman-restart user service: it starts with the device.
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const crypto = require('crypto');
const { execFile, execFileSync } = require('child_process');

const POD = 'cartridge-romm';
const IMAGES = { db: 'docker.io/library/mariadb:11', romm: 'docker.io/rommapp/romm:latest' };

function plainEnv() {
  const env = { ...process.env };
  for (const k of ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'APPDIR', 'APPIMAGE', 'ARGV0', 'OWD']) delete env[k];
  return env;
}
function run(cmd, args, { timeout = 0 } = {}) {
  return new Promise((resolve, reject) => execFile(cmd, args, { env: plainEnv(), timeout, maxBuffer: 16 << 20 }, (e, out, err) => {
    if (e) { const m = String(err || e.message).trim().split('\n').filter(Boolean).pop() || e.message; reject(new Error(m.slice(0, 300))); } else resolve(String(out).trim());
  }));
}
const podman = (...a) => run('podman', a);
function hasPodman() { try { execFileSync('sh', ['-c', 'command -v podman'], { stdio: 'ignore', env: plainEnv() }); return true; } catch { return false; } }

function freePort(start = 8095) {
  return new Promise((resolve) => {
    const tryPort = (p) => {
      if (p > start + 50) return resolve(start);
      const s = net.createServer();
      s.once('error', () => tryPort(p + 1));
      s.once('listening', () => s.close(() => resolve(p)));
      s.listen(p, '0.0.0.0');
    };
    tryPort(start);
  });
}
const secret = (n = 32) => crypto.randomBytes(n).toString('hex');

// The env file and the containers' arguments (kept apart so tests can check them)
function envText(o) {
  return Object.entries(o).map(([k, v]) => `${k}=${String(v).replace(/\n/g, '')}`).join('\n') + '\n';
}
function readEnv(file) {
  const out = {};
  try { for (const l of fs.readFileSync(file, 'utf8').split('\n')) { const i = l.indexOf('='); if (i > 0) out[l.slice(0, i)] = l.slice(i + 1); } } catch {}
  return out;
}
function dbArgs(s) {
  return ['run', '-d', '--pod', POD, '--name', `${POD}-db`, '--restart', 'always', '--security-opt', 'label=disable',
    '-e', `MARIADB_ROOT_PASSWORD=${s.DB_ROOT}`, '-e', 'MARIADB_DATABASE=romm', '-e', 'MARIADB_USER=romm-user', '-e', `MARIADB_PASSWORD=${s.DB_PASSWD}`,
    '-v', `${POD}-db:/var/lib/mysql`, '--health-cmd', 'healthcheck.sh --connect --innodb_initialized', '--health-interval', '10s', IMAGES.db];
}
// metadata keys live with the other secrets (romm-local.env), so updates keep them (0.9.16)
const KEY_ENV = { igdbId: 'K_IGDB_ID', igdbSecret: 'K_IGDB_SECRET', ssUser: 'K_SS_USER', ssPass: 'K_SS_PASS', sgdb: 'K_SGDB' };
const keysOf = (s) => Object.fromEntries(Object.entries(KEY_ENV).map(([k, e]) => [k, s[e] || '']));
const withKeys = (s, keys) => ({ ...s, ...Object.fromEntries(Object.entries(KEY_ENV).filter(([k]) => keys && keys[k] != null).map(([k, e]) => [e, String(keys[k]).trim()])) });
function rommArgs(s, dirs, keys = keysOf(s)) {
  const e = { DB_HOST: '127.0.0.1', DB_PORT: '3306', DB_NAME: 'romm', DB_USER: 'romm-user', DB_PASSWD: s.DB_PASSWD, ROMM_AUTH_SECRET_KEY: s.AUTH_KEY, HASHEOUS_API_ENABLED: 'true',
    ...(keys.igdbId && keys.igdbSecret ? { IGDB_CLIENT_ID: keys.igdbId, IGDB_CLIENT_SECRET: keys.igdbSecret } : {}),
    ...(keys.ssUser && keys.ssPass ? { SCREENSCRAPER_USER: keys.ssUser, SCREENSCRAPER_PASSWORD: keys.ssPass } : {}),
    ...(keys.sgdb ? { STEAMGRIDDB_API_KEY: keys.sgdb } : {}) };
  return ['run', '-d', '--pod', POD, '--name', `${POD}-app`, '--restart', 'always', '--security-opt', 'label=disable',
    ...Object.entries(e).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
    '-v', `${POD}-resources:/romm/resources`, '-v', `${POD}-redis:/redis-data`,
    '-v', `${dirs.library}:/romm/library`, '-v', `${dirs.assets}:/romm/assets`, '-v', `${dirs.config}:/romm/config`, IMAGES.romm];
}

async function waitFor(test, ms, every = 2000) {
  const until = Date.now() + ms;
  for (;;) {
    try { if (await test()) return true; } catch {}
    if (Date.now() > until) return false;
    await new Promise((r) => setTimeout(r, every));
  }
}

// opts: { username, password, library (a folder holding roms/<console>), dataDir, keys, envFile }
async function setup(opts, onProgress = () => {}, { fetchImpl = fetch } = {}) {
  const step = (n, label) => onProgress({ step: n, of: 7, label });
  if (!hasPodman()) throw new Error("Podman isn't installed on this system. Bazzite and Fedora Atomic include it; on other systems install the podman package, then try again.");
  const user = String(opts.username || '').trim().toLowerCase();
  if (user.length < 3) throw new Error('The RomM username needs at least 3 characters.');
  if (!String(opts.password || '').trim()) throw new Error('Choose a RomM password.');
  const dirs = { library: opts.library, assets: path.join(opts.dataDir, 'assets'), config: path.join(opts.dataDir, 'config') };
  for (const d of [dirs.library, path.join(dirs.library, 'roms'), dirs.assets, dirs.config]) fs.mkdirSync(d, { recursive: true });
  const s = withKeys({ DB_ROOT: secret(24), DB_PASSWD: secret(24), AUTH_KEY: secret(32), ...readEnv(opts.envFile) }, opts.keys);
  fs.mkdirSync(path.dirname(opts.envFile), { recursive: true });
  fs.writeFileSync(opts.envFile, envText(s), { mode: 0o600 });

  step(1, 'Downloading the database');
  await podman('pull', IMAGES.db);
  step(2, 'Downloading RomM');
  await podman('pull', IMAGES.romm);
  step(3, 'Creating the server');
  const port = opts.port || await freePort();
  await podman('pod', 'rm', '-f', POD).catch(() => {});
  await podman('pod', 'create', '--name', POD, '-p', `${port}:8080`);
  step(4, 'Starting the database');
  await podman(...dbArgs(s));
  const dbUp = await waitFor(async () => (await podman('healthcheck', 'run', `${POD}-db`).then(() => true, () => false)), 180000, 3000);
  if (!dbUp) throw new Error("The database didn't start. Try again, or check `podman logs cartridge-romm-db`.");
  step(5, 'Starting RomM');
  await podman(...rommArgs(s, dirs));
  const base = `http://127.0.0.1:${port}`;
  const up = await waitFor(async () => (await fetchImpl(`${base}/api/heartbeat`)).ok, 300000, 3000);
  if (!up) throw new Error("RomM didn't start. Try again, or check `podman logs cartridge-romm-app`.");
  step(6, 'Creating your account');
  const r = await fetchImpl(`${base}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, email: '', password: opts.password, role: 'admin' }) });
  if (!r.ok) {
    let d = ''; try { d = (await r.json()).detail; } catch {}
    if (!/already exists/i.test(String(d))) throw new Error(`RomM didn't create the account: ${d || r.status}`); // a replay: the account is there
  }
  step(7, 'Starting with this device');
  const boot = await run('systemctl', ['--user', 'enable', 'podman-restart.service']).then(() => true, () => false);
  return { port, base, user, boot };
}

async function status() {
  if (!hasPodman()) return { podman: false };
  const out = await podman('pod', 'ps', '--filter', `name=^${POD}$`, '--format', '{{.Status}}').catch(() => '');
  return { podman: true, exists: !!out, running: /running/i.test(out), status: out };
}
// Newer RomM: pull, then recreate the app container (database and files stay)
async function update(opts) {
  let s = readEnv(opts.envFile);
  if (!s.AUTH_KEY) throw new Error('This RomM was not set up by Cartridge.');
  if (opts.keys) { s = withKeys(s, opts.keys); fs.writeFileSync(opts.envFile, envText(s), { mode: 0o600 }); }
  if (!opts.keysOnly) await podman('pull', IMAGES.romm);
  await podman('rm', '-f', `${POD}-app`).catch(() => {});
  const dirs = { library: opts.library, assets: path.join(opts.dataDir, 'assets'), config: path.join(opts.dataDir, 'config') };
  await podman(...rommArgs(s, dirs));
  return true;
}
// LAN addresses other devices can use
function lanUrls(port) {
  return Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => `http://${i.address}:${port}`);
}

module.exports = { keysOf, setup, status, update, lanUrls, hasPodman, dbArgs, rommArgs, envText, readEnv, freePort, POD };
