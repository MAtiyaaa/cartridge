// Node entry point of the Android app. Runs the desktop backend (electron/main.js) unchanged
// behind the Electron shim, and serves it to the WebView(s) over a local HTTP server:
//   POST /ipc/<channel>   same { ok, data | error } envelope as Electron's ipcRenderer.invoke
//   GET  /events          Server-Sent Events carrying every webContents.send(channel, data)
//   GET  /romimg/?...     the romimg:// image protocol
//   GET  /ui/...          the built UI, for the second-screen WebView
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

let bridge = null;
try { bridge = require('bridge'); } catch {} // provided by capacitor-nodejs on the device

// ---------------------------------------------------------------- environment
const STORAGE = process.env.CARTRIDGE_STORAGE || '/storage/emulated/0';
process.env.HOME = STORAGE; // lets main.js find ~/ES-DE/settings and ~/roms like on Linux
const origUserInfo = os.userInfo;
os.userInfo = (...a) => { try { return origUserInfo(...a); } catch { return { username: 'android', homedir: STORAGE, uid: -1, gid: -1, shell: null }; } };

const electron = require('electron');
const { bus, handlers, schemes, state } = electron.__android;
state.dataDir = process.env.CARTRIDGE_DATA || (bridge ? path.join(bridge.getDataPath(), 'Cartridge') : path.join(os.tmpdir(), 'cartridge-android'));
fs.mkdirSync(state.dataDir, { recursive: true });
try { state.version = require('./package.json').version; } catch {}

require('./electron/main.js');
const PLATFORM_MAP = require('./electron/platformMap.js');

// ---------------------------------------------------------------- helpers
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const listDirs = (p) => { try { return fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory() || d.isSymbolicLink()).map((d) => d.name); } catch { return []; } };
async function invoke(ch, arg) {
  const fn = handlers.get(ch);
  if (!fn) throw new Error('No handler for ' + ch);
  const r = await fn(null, arg);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}
function handle(ch, fn) {
  handlers.set(ch, async (_e, arg) => {
    try { return { ok: true, data: await fn(arg) }; } catch (e) { return { ok: false, error: e.message || String(e) }; }
  });
}
function wrap(ch, fn) {
  const orig = handlers.get(ch);
  handle(ch, (arg) => fn(arg, () => (orig ? orig(null, arg).then((r) => { if (!r.ok) throw new Error(r.error); return r.data; }) : null)));
}
const send = (ch, data) => bus.emit('send', ch, data);

// ---------------------------------------------------------------- storage + ROM folders
const SYSTEM_NAMES = new Set(Object.values(PLATFORM_MAP).flat().map((n) => n.toLowerCase()));
// Folder names that are also Android system folders or too generic to trust at the top level
const NOT_A_SYSTEM = new Set(['android', 'pc', 'dos', 'windows', 'music', 'movies', 'pictures', 'download', 'downloads', 'documents', 'dcim', 'notifications', 'podcasts', 'ringtones', 'alarms', 'audiobooks', 'recordings']);

function volumes() {
  const out = [{ path: STORAGE, label: 'Internal storage' }];
  for (const n of listDirs('/storage')) {
    if (/^[0-9A-F]{4}-[0-9A-F]{4}$/i.test(n)) out.push({ path: path.join('/storage', n), label: 'SD card (' + n + ')' });
  }
  return out.filter((v) => isDir(v.path));
}
const countSystems = (dir) => listDirs(dir).filter((n) => SYSTEM_NAMES.has(n.toLowerCase()) && !NOT_A_SYSTEM.has(n.toLowerCase())).length;

// Places a ROM collection usually lives on Android (ES-DE, Daijisho, Beacon, RetroArch setups)
function scanRomRoots() {
  const found = [];
  const add = (p, source) => {
    if (!isDir(p) || found.some((f) => f.path === p)) return;
    found.push({ path: p, source, exists: true, systems: countSystems(p) });
  };
  for (const v of volumes()) {
    for (const n of listDirs(v.path)) {
      const lower = n.toLowerCase();
      const full = path.join(v.path, n);
      if (['roms', 'rom', 'games', 'emulation', 'retroarch'].includes(lower)) {
        if (lower === 'roms' || lower === 'rom') add(full, v.label);
        for (const m of listDirs(full)) if (['roms', 'rom'].includes(m.toLowerCase())) add(path.join(full, m), v.label);
        if (lower === 'games' && countSystems(full) > 0) add(full, v.label);
      }
    }
    if (countSystems(v.path) >= 2) add(v.path, v.label + ' (system folders)');
  }
  return found.sort((a, b) => b.systems - a.systems);
}

wrap('fs:detect', async (_arg, orig) => {
  const base = (await orig().catch(() => null)) || { roots: [], bios: null };
  const esde = base.roots.filter((r) => r.exists && /ES-DE/.test(r.source));
  const scanned = scanRomRoots();
  const roots = [];
  for (const r of [...esde, ...scanned, ...base.roots.filter((r) => r.exists)]) if (!roots.some((o) => o.path === r.path)) roots.push(r);
  if (!roots.length) roots.push({ path: path.join(STORAGE, 'ROMs'), source: 'ES-DE default (will be created)', exists: false });
  let bios = base.bios;
  if (!bios) {
    const first = roots.find((r) => r.exists);
    if (first) for (const n of ['bios', 'BIOS', 'Bios']) { const b = path.join(path.dirname(first.path), n); if (isDir(b)) { bios = b; break; } }
  }
  return { roots, bios };
});

wrap('fs:places', async () => {
  const vols = volumes();
  const places = [...vols];
  for (const v of vols) for (const n of ['ROMs', 'Roms', 'roms', 'Emulation', 'Download']) {
    const p = path.join(v.path, n);
    if (isDir(p)) places.push({ label: (v.path === STORAGE ? '' : v.label + ' · ') + n, path: p });
  }
  return places;
});

// A system whose folder is not under the ROMs folder, but sits on its own at the top of a
// storage volume (like /storage/emulated/0/NDS): remember it so downloads go there too.
function strayFolder(p) {
  const names = [...(PLATFORM_MAP[p.slug] || []), p.fs_slug, p.slug].filter(Boolean).map((n) => n.toLowerCase()).filter((n) => !NOT_A_SYSTEM.has(n));
  for (const v of volumes()) {
    for (const base of [v.path, path.join(v.path, 'Games')]) {
      const hit = listDirs(base).find((d) => names.includes(d.toLowerCase()));
      if (hit) return path.join(base, hit);
    }
  }
  return null;
}
wrap('platforms:paths', async (list, orig) => {
  const res = (await orig()) || {};
  const cfg = await invoke('config:get');
  if (cfg?.android?.autoSystemFolders === false) return res;
  const patch = {};
  for (const p of list || []) {
    const cur = res[p.slug];
    if (!cur || cur.exists || cur.source === 'custom') continue;
    const hit = strayFolder(p);
    if (hit) { patch[p.slug] = hit; res[p.slug] = { path: hit, source: 'custom', exists: true }; }
  }
  if (Object.keys(patch).length) {
    await invoke('config:set', { paths: patch });
    invoke('installed:rescan').catch(() => {});
  }
  return res;
});

// Settings changed on one screen reach the other (theme, colours, background, wallpaper...)
for (const ch of ['config:set', 'config:setPath', 'wallpaper:set', 'wallpaper:clear']) {
  wrap(ch, async (_arg, orig) => {
    const out = await orig();
    invoke('config:get').then((c) => send('android:config', c)).catch(() => {});
    return out;
  });
}

// ---------------------------------------------------------------- Android-only channels
let companion = null;
let loaded = false;
handle('android:hello', (o = {}) => {
  if (o.w && o.h) state.size = [Math.round(o.w), Math.round(o.h)];
  const w = electron.__android.window();
  if (w && !loaded && !o.companion) { loaded = true; w.webContents.emit('did-finish-load'); }
  return { version: state.version, storage: STORAGE, volumes: volumes(), zoom: state.zoom };
});
handle('android:size', ({ w, h }) => {
  state.size = [Math.round(w), Math.round(h)];
  electron.__android.window()?.emit('resize');
  return true;
});
handle('android:resume', () => { electron.__android.window()?.emit('focus'); return true; });
handle('android:roots', () => ({ volumes: volumes(), roots: scanRomRoots() }));
handle('android:companion:state', (s) => { companion = s; send('android:companion:state', s); return true; });
handle('android:companion:get', () => companion);
handle('android:companion:cmd', (c) => { send('android:companion:cmd', c); return true; });

// ---------------------------------------------------------------- HTTP server
const TOKEN = process.env.CARTRIDGE_TOKEN || crypto.randomBytes(18).toString('hex');
const UI_DIR = path.join(__dirname, 'ui');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const clients = new Set();
bus.on('send', (ch, data) => {
  let msg;
  try { msg = `data: ${JSON.stringify({ ch, data: data === undefined ? null : data })}\n\n`; } catch { return; }
  for (const res of clients) res.write(msg);
});
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 20000).unref();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-cart-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://127.0.0.1');
  const authed = req.headers['x-cart-token'] === TOKEN || url.searchParams.get('_k') === TOKEN;
  try {
    if (url.pathname.startsWith('/ipc/')) {
      if (!authed) { res.writeHead(403); return res.end(); }
      const ch = decodeURIComponent(url.pathname.slice(5));
      const fn = handlers.get(ch);
      const body = await readBody(req);
      const arg = body ? JSON.parse(body).arg : undefined;
      const out = fn ? await fn(null, arg) : { ok: false, error: 'Unknown channel ' + ch };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(out === undefined ? { ok: true, data: null } : out));
    }
    if (url.pathname === '/events') {
      if (!authed) { res.writeHead(403); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': hi\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (url.pathname === '/romimg/') {
      if (!authed) { res.writeHead(403); return res.end(); }
      const fn = schemes.get('romimg');
      url.searchParams.delete('_k');
      const r = await fn(new Request('http://img/?' + url.searchParams.toString(), { headers: req.headers['range'] ? { range: req.headers['range'] } : {} }));
      const headers = {};
      r.headers.forEach((v, k) => { headers[k] = v; });
      headers['Access-Control-Allow-Origin'] = '*';
      if (!headers['cache-control']) headers['Cache-Control'] = 'max-age=86400';
      res.writeHead(r.status, headers);
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    if (url.pathname.startsWith('/ui/')) {
      const rel = path.normalize(decodeURIComponent(url.pathname.slice(4)) || 'index.html').replace(/^(\.\.[/\\])+/, '');
      let file = path.join(UI_DIR, rel);
      if (!file.startsWith(UI_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(UI_DIR, 'index.html');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(404); res.end();
  } catch (e) {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: e.message || String(e) }));
  }
});

const PORT = Number(process.env.CARTRIDGE_PORT || 0);
// The WebView opens at most 6 connections per host:port, shared by both screens. Images are
// spread over 8 ports on the same address so dozens load at once instead of queueing.
const listenOn = (srv, port) => new Promise((resolve) => srv.once('error', () => resolve(null)).listen(port, '127.0.0.1', () => resolve(srv.address().port)));
server.listen(PORT, '127.0.0.1', async () => {
  const handler = server.listeners('request')[0];
  const extra = await Promise.all(Array.from({ length: 7 }, () => listenOn(http.createServer(handler), 0)));
  const info = { port: server.address().port, ports: [server.address().port, ...extra.filter(Boolean)], token: TOKEN, version: state.version };
  console.log('CARTRIDGE SERVER ' + JSON.stringify(info));
  if (bridge) {
    bridge.channel.send('server', info);
    bridge.channel.on('hello', () => bridge.channel.send('server', info));
    bridge.channel.on('resume', () => electron.__android.window()?.emit('focus'));
  }
});
