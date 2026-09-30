// Status for other apps, like the Fuse launcher (docs/FUSE_BRIDGE.md): what is downloading, whether
// Cartridge is connected, when the library last changed and the games downloaded last. The Linux desktop
// writes it to $XDG_STATE_HOME/cartridge/status.json; on Android main.js sends it to the WebView, which
// hands it to CartridgeStatusProvider. Never anything about the server (address, account, tokens) or settings.
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROTOCOL = 1;
const RECENT = 20;
const EVERY = 500; // ms, at most one write per

// state: { version, queue (download items), connected (true/false/null), syncedAt, manifest, changedAt }
function snapshot(state, now = Date.now()) {
  const queue = Array.isArray(state.queue) ? state.queue : [];
  const down = queue.filter((d) => d.status === 'downloading');
  const waiting = queue.filter((d) => d.status === 'queued');
  const active = [...down, ...waiting];
  const total = active.reduce((s, d) => s + (d.total || 0), 0);
  const got = active.reduce((s, d) => s + Math.min(d.received || 0, d.total || 0), 0);
  const cur = down[0] || waiting[0] || null;
  // installed.json: every game Cartridge downloaded and still has, newest first
  const recent = Object.entries(state.manifest || {})
    .filter(([id, m]) => Number(id) > 0 && m && typeof m.path === 'string' && m.path)
    .map(([id, m]) => ({ romId: Number(id), title: String(m.name || ''), platformSlug: String(m.platformSlug || ''), path: m.path, finishedAt: Number(m.at) || 0 }))
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, RECENT);
  return {
    protocol: PROTOCOL,
    version: String(state.version || ''),
    connected: state.connected == null ? null : !!state.connected,
    activeDownloads: down.length,
    queuedDownloads: waiting.length,
    progress: total > 0 ? Math.round((got / total) * 1000) / 1000 : null,
    currentTitle: cur?.name || null,
    currentPlatform: cur?.platformSlug || null,
    libraryChangedAt: Math.max(Number(state.syncedAt) || 0, Number(state.changedAt) || 0, recent[0]?.finishedAt || 0),
    updatedAt: now,
    recent,
  };
}

// What is left once Cartridge has closed: nothing downloading (the queue carries on at the next start)
function closed(s, now = Date.now()) {
  return { ...s, connected: null, activeDownloads: 0, queuedDownloads: s.activeDownloads + s.queuedDownloads, progress: null, currentTitle: null, currentPlatform: null, updatedAt: now };
}

function statusFile(env = process.env, home = os.homedir()) {
  const state = env.XDG_STATE_HOME && path.isAbsolute(env.XDG_STATE_HOME) ? env.XDG_STATE_HOME : path.join(home, '.local', 'state');
  return path.join(state, 'cartridge', 'status.json');
}

// ---------------------------------------------------------------- publishing
let opts = null; // { build: () => state, file, send, log }
let timer = null;
let lastKey = '';
let last = null;
let floor = 0; // libraryChangedAt never goes back (a deleted game may have been the newest)
let touched = 0; // a game was deleted: the library on disk changed

function write(file, s) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(s, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file); // readers never see half a file
  } catch (e) { opts?.log?.('status write failed', e.message); }
}

// Builds the snapshot; writes or sends it only when something in it changed
function flush() {
  if (!opts) return last;
  let s;
  try { s = snapshot({ ...opts.build(), changedAt: touched }); } catch (e) { opts.log?.('status failed', e.message); return last; }
  s.libraryChangedAt = floor = Math.max(floor, s.libraryChangedAt);
  const key = JSON.stringify({ ...s, updatedAt: 0 });
  if (key === lastKey) return last;
  lastKey = key;
  last = s;
  if (opts.file) write(opts.file, s);
  try { opts.send?.(s); } catch {}
  return s;
}

const WATCH = new Set(['downloads', 'connection', 'library', 'installed-changed']);
// main.js calls this for every broadcast; the ones that matter here are written at most every 500 ms
function changed(ch, data) {
  if (ch && !WATCH.has(ch)) return;
  if (ch === 'installed-changed' && !data?.path) touched = Date.now();
  if (!opts || timer) return;
  timer = setTimeout(() => { timer = null; flush(); }, EVERY);
  timer.unref?.();
}

function setup(o) {
  opts = o;
  if (o.file) { try { floor = Number(JSON.parse(fs.readFileSync(o.file, 'utf8')).libraryChangedAt) || 0; } catch {} }
  changed();
}

// On quit (desktop): the file says nothing is downloading any more
function close() {
  if (!opts?.file) return;
  clearTimeout(timer);
  timer = null;
  const s = flush();
  if (s) write(opts.file, closed(s));
}

module.exports = { PROTOCOL, snapshot, closed, statusFile, setup, changed, current: flush, close };
