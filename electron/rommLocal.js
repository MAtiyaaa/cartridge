// RomM on this device (0.9.15, plan section 1): RomM's own docker-compose.example.yml (RomM with its
// built-in Valkey, plus MariaDB) run with rootless Podman as one pod. Podman itself is set up from
// here when missing (prepare, 0.9.17). The user picks their own RomM username and password (RomM's first admin, made
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
// Podman (0.9.17, owner: set it up inside Cartridge). SteamOS 3.5+, Bazzite and Fedora Atomic ship
// it; elsewhere Cartridge fetches podman-launcher (89luca89/podman-launcher: podman-static in one file,
// works from $HOME, the copy distrobox's Steam Deck guide uses) into its own folder. Rootless Podman
// also needs the user's ID ranges in /etc/subuid and /etc/subgid (SteamOS has none): added once with
// the device password, the way that guide does (usermod --add-subuid 100000-165535 ...).
const OWN_PODMAN = path.join(os.homedir(), '.local/share/cartridge-romm/bin/podman');
const LAUNCHER_URL = 'https://github.com/89luca89/podman-launcher/releases/latest/download/podman-launcher-amd64';
function systemPodman() { try { return execFileSync('sh', ['-c', 'command -v podman'], { encoding: 'utf8', env: plainEnv() }).trim() || null; } catch { return null; } }
function podmanBin() { const sys = systemPodman(); if (sys) return sys; try { fs.accessSync(OWN_PODMAN, fs.constants.X_OK); return OWN_PODMAN; } catch { return null; } }
const podman = (...a) => run(podmanBin() || 'podman', a);
function hasPodman() { return !!podmanBin(); }
const userName = () => os.userInfo().username;
function hasIds(etc = '/etc') {
  const u = userName(), id = String(os.userInfo().uid);
  const has = (f) => { try { return fs.readFileSync(path.join(etc, f), 'utf8').split('\n').some((l) => l.startsWith(u + ':') || l.startsWith(id + ':')); } catch { return false; } };
  return has('subuid') && has('subgid');
}
// what's missing before RomM can run: { podman: 'system' | 'cartridge' | null, ids }
function readiness() { const b = podmanBin(); return { podman: b ? (b === OWN_PODMAN ? 'cartridge' : 'system') : null, ids: hasIds() }; }
async function getLauncher(fetchImpl = require('./webFetch')) {
  const r = await fetchImpl(LAUNCHER_URL, { headers: { 'User-Agent': 'Cartridge' }, signal: AbortSignal.timeout(10 * 60e3) });
  if (!r.ok) throw new Error(`Podman couldn't be downloaded (GitHub answered ${r.status}).`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 10 << 20 || buf.readUInt32BE(0) !== 0x7f454c46) throw new Error("The Podman download isn't a program. Try again.");
  fs.mkdirSync(path.dirname(OWN_PODMAN), { recursive: true });
  fs.writeFileSync(OWN_PODMAN + '.tmp', buf, { mode: 0o755 }); fs.renameSync(OWN_PODMAN + '.tmp', OWN_PODMAN);
}
// sudo with the password on stdin (-S), asked fresh (-k); the password is never stored
function sudo(password, script) {
  return new Promise((resolve, reject) => {
    const c = require('child_process').execFile('sudo', ['-S', '-k', '-p', '', 'sh', '-c', script], { env: plainEnv(), timeout: 60000 }, (e, out, err) => {
      if (!e) return resolve();
      const m = String(err || '');
      reject(new Error(/incorrect|try again|Sorry/i.test(m) ? 'That password didn’t work.' : /not in the sudoers|not allowed/i.test(m) ? 'This account isn’t allowed to make system changes (sudo).' : 'The change didn’t work: ' + (m.trim().split('\n').pop() || e.message)));
    });
    c.stdin.end(String(password || '') + '\n');
  });
}
async function prepare({ password, fetchImpl } = {}, onProgress = () => {}) {
  if (!podmanBin()) { onProgress({ label: 'Downloading Podman' }); await getLauncher(fetchImpl); }
  if (!hasIds()) {
    const u = userName();
    if (!/^[a-z_][a-z0-9_.-]*$/i.test(u)) throw new Error('This account name can’t be set up automatically.');
    if (!password) throw Object.assign(new Error('Your device password is needed once.'), { code: 'password' });
    onProgress({ label: 'Letting Podman run as you' });
    await sudo(password, `touch /etc/subuid /etc/subgid && usermod --add-subuid 100000-165535 --add-subgid 100000-165535 ${u}`);
  }
  await podman('system', 'migrate').catch(() => {});
  await podman('info', '--format', '{{.Host.Security.Rootless}}');
  return readiness();
}

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
  if (!hasPodman() || !hasIds()) throw Object.assign(new Error('Podman isn’t ready yet.'), { code: 'prepare' });
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
  // 0.9.19: the server name the user picked is the server's own host name too (RomM has no name setting
  // of its own), so it shows in RomM's logs and to anything that asks the pod who it is
  const host = String(opts.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  await podman('pod', 'create', '--name', POD, '-p', `${port}:8080`, ...(host ? ['--hostname', host] : []));
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
  const boot = podmanBin() === OWN_PODMAN ? await ownBootUnit() : await run('systemctl', ['--user', 'enable', 'podman-restart.service']).then(() => true, () => false);
  return { port, base, user, boot };
}

// Cartridge's own Podman has no podman-restart service: the same command as a user unit
async function ownBootUnit() {
  const unit = path.join(os.homedir(), '.config/systemd/user/cartridge-romm.service');
  fs.mkdirSync(path.dirname(unit), { recursive: true });
  fs.writeFileSync(unit, `[Unit]\nDescription=RomM on this device (Cartridge)\nWants=network-online.target\nAfter=network-online.target\n\n[Service]\nType=oneshot\nRemainAfterExit=true\nExecStart="${OWN_PODMAN}" start --all --filter restart-policy=always\n\n[Install]\nWantedBy=default.target\n`);
  await run('systemctl', ['--user', 'daemon-reload']).catch(() => {});
  return run('systemctl', ['--user', 'enable', 'cartridge-romm.service']).then(() => true, () => false);
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

module.exports = { sudo, keysOf, setup, status, update, lanUrls, hasPodman, hasIds, readiness, prepare, podmanBin, OWN_PODMAN, dbArgs, rommArgs, envText, readEnv, freePort, POD };
