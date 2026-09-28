// Node entry point of the Android app. Runs the desktop backend (electron/main.js) unchanged
// behind the Electron shim, and serves it to the WebView(s) over a local HTTP server:
//   POST /ipc/<channel>   same { ok, data | error } envelope as Electron's ipcRenderer.invoke
//   GET  /events          Server-Sent Events carrying every webContents.send(channel, data)
//   GET  /romimg/?...     the romimg:// image protocol
//   GET  /ui/...          the built UI, for the second-screen WebView
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// ---------------------------------------------------------------- Android-only channels
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

// ---------------------------------------------------------------- server (shared with desktop)
// Loopback API for the two screens, and the phone remote on the network when it's turned on.
const remote = require('./electron/remote-server.js')({
  invoke: (ch, arg) => (handlers.get(ch) ? handlers.get(ch)(null, arg) : Promise.resolve({ ok: false, error: 'Unknown channel ' + ch })),
  handleImage: (req) => schemes.get('romimg')(req),
  uiDir: path.join(__dirname, 'ui'),
  remoteDir: path.join(__dirname, 'ui', 'remote'),
  dataDir: state.dataDir,
  version: state.version,
  kind: 'android',
  localToken: process.env.CARTRIDGE_TOKEN,
  log: (...a) => console.log('[remote]', ...a),
});
electron.__android.remote = remote; // main.js saveConfig -> remote.configChanged
for (const [ch, fn] of Object.entries(remote.handlers)) handle(ch, fn);
bus.on('send', (ch, data) => remote.send(ch, data));

remote.startLocal(Number(process.env.CARTRIDGE_PORT || 0)).then((info) => {
  console.log('CARTRIDGE SERVER ' + JSON.stringify(info));
  if (bridge) {
    bridge.channel.send('server', info);
    bridge.channel.on('hello', () => bridge.channel.send('server', info));
    bridge.channel.on('resume', () => electron.__android.window()?.emit('focus'));
  }
});
