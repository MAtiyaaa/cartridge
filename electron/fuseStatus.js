// Status for other apps, like the Fuse launcher (docs/FUSE_BRIDGE.md): what is downloading (in total and game by
// game), whether Cartridge is connected, when the library last changed, the games downloaded last, every
// downloaded game with its RomM metadata and pictures, and the games Fuse handed over to upload to RomM. The Linux desktop writes it all to
// $XDG_STATE_HOME/cartridge/status.json; on Android main.js sends the status and the games list to the WebView,
// which hands them to CartridgeStatusProvider. Never anything about the server (address, account, tokens) or settings.
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROTOCOL = 3; // 2 added the queue and the games, 3 the uploads; everything before is unchanged
const RECENT = 20;
const QUEUE = 100; // rows: downloading and waiting come first, so only old history is left out
const UPLOADS = 50;
const SUMMARY = 8000; // characters of RomM's text (the library keeps 400 for the UI)
const NAMES = 12; // genres and series per game
const EVERY = 500; // ms, at most one write per

// state: { version, queue (download items), connected (true/false/null), syncedAt, manifest, changedAt, uploads }
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
    queue: queueRows(queue),
    uploads: uploadRows(state.uploads),
  };
}

// The games Fuse handed over to upload (electron/fuseUpload.js), newest first
const UPLOAD_STATES = new Set(['waiting', 'uploading', 'scanning', 'done', 'failed', 'cancelled']);
function uploadRows(list) {
  return (Array.isArray(list) ? list : [])
    .filter((u) => u && typeof u.id === 'string' && UPLOAD_STATES.has(u.state))
    .slice(0, UPLOADS)
    .map((u) => {
      const total = Number(u.total) > 0 ? Math.round(u.total) : null;
      const sent = Math.max(0, Math.round(Number(u.sent) || 0));
      return { id: u.id, title: String(u.title || ''), platformSlug: String(u.platformSlug || ''), state: u.state, sent: total ? Math.min(sent, total) : sent, total,
        files: Math.max(0, Number(u.files) || 0), romId: Number(u.romId) > 0 ? Number(u.romId) : null, error: u.error ? String(u.error) : null, updatedAt: Number(u.updatedAt) || 0 };
    });
}

// Queue states under the names the Downloads page shows (a stopped download is 'cancelled' inside, "Paused" on screen)
const STATES = { downloading: 'downloading', queued: 'queued', cancelled: 'paused', error: 'failed', done: 'done' };
// The queue game by game, in the Downloads page's order: downloading, waiting in the order they start, then the
// history (paused, failed, done) newest first
function queueRows(queue) {
  const rank = (d) => (d.status === 'downloading' ? 0 : d.status === 'queued' ? 1 : 2);
  return (Array.isArray(queue) ? queue : [])
    .filter((d) => d && Number(d.romId) > 0)
    .map((d, i) => ({ d, i, r: rank(d) }))
    .sort((a, b) => a.r - b.r || (a.r === 2 ? (b.d.addedAt || 0) - (a.d.addedAt || 0) : 0) || a.i - b.i)
    .slice(0, QUEUE)
    .map(({ d }, position) => {
      const total = Number(d.total) > 0 ? Math.round(d.total) : null;
      const got = Math.max(0, Math.round(Number(d.received) || 0));
      return { romId: Number(d.romId), title: String(d.name || ''), platformSlug: String(d.platformSlug || ''), state: STATES[d.status] || String(d.status || ''), received: total ? Math.min(got, total) : got, total, position };
    });
}

// ---------------------------------------------------------------- games (downloaded games with their metadata)
const text = (v) => (typeof v === 'number' && Number.isFinite(v) ? String(v) : typeof v === 'string' && v.trim() ? v.trim() : null);
const names = (a) => [...new Set((Array.isArray(a) ? a : []).map(text).filter(Boolean))].slice(0, NAMES);
// RomM keeps release dates in seconds or ms (the UI's year() reads both); a year, or null
function yearOf(v) {
  const n = typeof v === 'string' && /\D/.test(v.trim()) ? Date.parse(v) / 1000 : Number(v);
  if (!Number.isFinite(n) || n === 0) return null;
  const y = new Date(Math.abs(n) > 1e11 ? n : n * 1000).getUTCFullYear();
  return y >= 1900 && y <= 2200 ? y : null;
}
// RomM's average rating is 0-10 or 0-100 (the UI's rating() reads both); 0-100, or null
function ratingOf(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(100, Math.round(n <= 10 ? n * 10 : n)) : null;
}

// What the bridge keeps of a downloaded game, from a RomM rom (a library page or the game's details)
function metaOf(r) {
  const md = r?.metadatum || {};
  return {
    title: text(r?.name) || text(r?.fs_name_no_ext) || text(r?.fs_name),
    platformSlug: text(r?.platform_slug),
    summary: text(r?.summary)?.slice(0, SUMMARY) || null,
    year: yearOf(md.first_release_date),
    genres: names(md.genres),
    developer: text(md.developers?.[0]) || text(md.companies?.[0]), // as the game page and slimRom pick it
    publisher: text(md.publishers?.[0]),
    rating: ratingOf(md.average_rating),
    players: text(md.player_count),
    series: names(md.franchises),
  };
}
// Keeps a game's metadata in store (romId -> metaOf + at); at moves only when something in it changed.
// True when the store changed.
function keepMeta(store, r, now = Date.now()) {
  const id = Number(r?.id);
  if (!(id > 0) || !store) return false;
  const next = metaOf(r), was = store[id];
  if (was && JSON.stringify({ ...was, at: 0 }) === JSON.stringify({ ...next, at: 0 })) return false;
  store[id] = { ...next, at: now };
  return true;
}

const IMAGES = ['cover', 'logo', 'screenshot'];
function mtimeOf(p) { try { const s = fs.statSync(p); return s.isFile() ? s.mtimeMs : null; } catch { return null; } }
// Every game Cartridge downloaded that is still on disk, newest download first.
// state: { manifest (installed.json), roms (Map romId -> library copy, slimRom), meta (keepMeta's store),
//   images: (romId, rom) => { cover, logo, screenshot } as absolute files or null; exists and mtime for tests }
function gameRows(state) {
  const exists = state.exists || fs.existsSync;
  const mtime = state.mtime || mtimeOf;
  return Object.entries(state.manifest || {})
    .map(([key, m]) => [Number(key), m])
    .filter(([id, m]) => id > 0 && m && typeof m.path === 'string' && m.path && exists(m.path))
    .sort(([a, ma], [b, mb]) => (Number(mb.at) || 0) - (Number(ma.at) || 0) || a - b)
    .map(([romId, m]) => {
      const r = state.roms?.get?.(romId) || null; // the library's copy: 400 characters of summary, 3 genres
      const x = state.meta?.[romId] || {}; // fuller, kept for downloaded games only
      const files = state.images?.(romId, r) || {};
      let at = Math.max(Number(m.at) || 0, Number(x.at) || 0);
      const img = {};
      for (const k of IMAGES) {
        const t = typeof files[k] === 'string' && path.isAbsolute(files[k]) ? mtime(files[k]) : null;
        img[k] = t == null ? null : files[k]; // only a file that is there
        if (t) at = Math.max(at, Math.round(t));
      }
      return {
        romId,
        path: m.path,
        title: x.title || text(r?.name) || String(m.name || ''),
        platformSlug: x.platformSlug || text(r?.platform_slug) || String(m.platformSlug || ''),
        summary: x.summary || text(r?.summary),
        year: x.year ?? yearOf(r?.year),
        genres: x.genres?.length ? x.genres : names(r?.genres),
        developer: x.developer || text(r?.developer),
        publisher: x.publisher || null,
        rating: x.rating ?? ratingOf(r?.rating),
        players: x.players || text(r?.players),
        series: x.series?.length ? x.series : names(r?.series),
        ...img,
        updatedAt: at,
      };
    });
}

// What is left once Cartridge has closed: nothing downloading (the queue carries on at the next start)
function closed(s, now = Date.now()) {
  return { ...s, connected: null, activeDownloads: 0, queuedDownloads: s.activeDownloads + s.queuedDownloads, progress: null, currentTitle: null, currentPlatform: null,
    queue: (s.queue || []).map((q) => (q.state === 'downloading' ? { ...q, state: 'queued' } : q)),
    // an upload can't carry on after Cartridge closes
    uploads: (s.uploads || []).map((u) => (['waiting', 'uploading', 'scanning'].includes(u.state) ? { ...u, state: 'failed', error: 'Cartridge was closed before the upload finished.' } : u)),
    updatedAt: now };
}

function statusFile(env = process.env, home = os.homedir()) {
  const state = env.XDG_STATE_HOME && path.isAbsolute(env.XDG_STATE_HOME) ? env.XDG_STATE_HOME : path.join(home, '.local', 'state');
  return path.join(state, 'cartridge', 'status.json');
}

// ---------------------------------------------------------------- publishing
let opts = null; // { build: () => state, games: () => gameRows state, file, send, sendGames, log }
let timer = null;
let lastKey = '';
let last = null;
let floor = 0; // libraryChangedAt never goes back (a deleted game may have been the newest)
let touched = 0; // a game was deleted: the library on disk changed
let gamesDirty = true; // the games list is rebuilt only after the library, the installed games or pictures changed
let gamesKey = '';
let gamesList = [];

function write(file, s) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(s, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file); // readers never see half a file
  } catch (e) { opts?.log?.('status write failed', e.message); }
}

// Rebuilds the games list when something it depends on changed; true when the list is different
function refreshGames() {
  if (!gamesDirty || !opts?.games) return false;
  gamesDirty = false;
  let g;
  try { g = gameRows(opts.games()); } catch (e) { opts.log?.('status games failed', e.message); return false; }
  const key = JSON.stringify(g);
  if (key === gamesKey) return false;
  gamesKey = key;
  gamesList = g;
  return true;
}

// Builds the snapshot; writes or sends it only when something in it changed. The games list is sent on its own:
// Android keeps it apart from the status, which changes every 500 ms while something downloads.
function flush() {
  if (!opts) return last;
  let s;
  try { s = snapshot({ ...opts.build(), changedAt: touched }); } catch (e) { opts.log?.('status failed', e.message); return last; }
  s.libraryChangedAt = floor = Math.max(floor, s.libraryChangedAt);
  const newGames = refreshGames();
  const key = JSON.stringify({ ...s, updatedAt: 0 });
  const newStatus = key !== lastKey;
  if (!newStatus && !newGames) return last;
  lastKey = key;
  last = s;
  if (opts.file) write(opts.file, { ...s, games: gamesList });
  if (newStatus) try { opts.send?.(s); } catch {}
  if (newGames) try { opts.sendGames?.(gamesList); } catch {}
  return s;
}

const WATCH = new Set(['downloads', 'connection', 'library', 'installed', 'installed-changed', 'images', 'fuse-uploads']);
const GAMES = new Set(['library', 'installed', 'installed-changed', 'images']); // 'images': main.js has new pictures
// main.js calls this for every broadcast; the ones that matter here are written at most every 500 ms
function changed(ch, data) {
  if (ch && !WATCH.has(ch)) return;
  if (ch === 'installed-changed' && !data?.path) touched = Date.now();
  if (!ch || GAMES.has(ch)) gamesDirty = true;
  if (!opts || timer) return;
  timer = setTimeout(() => { timer = null; flush(); }, EVERY);
  timer.unref?.();
}

function setup(o) {
  clearTimeout(timer);
  timer = null;
  opts = o;
  lastKey = ''; last = null; gamesKey = ''; gamesList = [];
  if (o.file) { try { floor = Number(JSON.parse(fs.readFileSync(o.file, 'utf8')).libraryChangedAt) || 0; } catch {} }
  changed();
}

// The games list (Android asks for it when the WebView starts or comes back)
function currentGames() {
  flush();
  return gamesList;
}

// On quit (desktop): the file says nothing is downloading any more
function close() {
  if (!opts?.file) return;
  clearTimeout(timer);
  timer = null;
  const s = flush();
  if (s) write(opts.file, { ...closed(s), games: gamesList });
}

module.exports = { PROTOCOL, snapshot, closed, queueRows, uploadRows, metaOf, keepMeta, gameRows, statusFile, setup, changed, current: flush, currentGames, close };
