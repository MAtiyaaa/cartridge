const { app, BrowserWindow, ipcMain, protocol, powerSaveBlocker, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const crypto = require('crypto');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const PLATFORM_MAP = require('./platformMap');

// Note: never add 'no-sandbox' here. Appending it at runtime (after Chromium has
// started its zygote) makes renderers crash with "/dev/shm ... No such process".
// The AppImage launcher already passes --no-sandbox when user namespaces are missing.
app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar');
app.setName('Cartridge');

protocol.registerSchemesAsPrivileged([
  { scheme: 'romimg', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

const USER_DATA = app.getPath('userData');
const CONFIG_FILE = path.join(USER_DATA, 'config.json');
const MANIFEST_FILE = path.join(USER_DATA, 'installed.json');
const IMG_CACHE = path.join(USER_DATA, 'imgcache');

// ---------------------------------------------------------------- config
const DEFAULT_CONFIG = {
  server: {
    localUrl: '',
    remoteUrl: '',
    mode: 'auto', // auto | local | remote
    auth: 'password', // password | token
    username: '',
    password: '',
    token: '',
    cfClientId: '',
    cfClientSecret: '',
  },
  romsRoot: '',
  biosPath: '',
  paths: {},
  downloads: { concurrency: 2, esdeM3uFolders: true, flattenSingleFile: true },
  ui: { gridSize: 'md', hideEmpty: true, sounds: true, bgStyle: 'waves', theme: 'purple', mediaBar: true, logos: true, pointer: 'auto', scale: 'auto', keyboard: 'auto',
    customColor: '', surface: 'glass', text: 'normal', font: 'outfit', cardShape: 'rounded', density: 'normal', cardTitles: true,
    motion: 'normal', effects: 'auto', soundPack: 'soft', volume: 'medium', wallpaper: '', wallDim: 'medium',
    colors: { highlight: '', buttons: '', bars: '', background: '' } },
  sync: { onLaunch: true, everyMinutes: 60 },
  sgdbKey: '', // optional SteamGridDB API key for game logos
  ra: { user: '', key: '' }, // RetroAchievements username + web API key
  trophies: { sources: {}, sync: true, popups: true, device: '' }, // PS3/PS4/Xbox 360/Vita trophies from emulators
  graphics: 'auto', // auto (GPU, falls back on failure) | software
  configVersion: 2,
  configured: false,
};

function deepMerge(base, extra) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(extra || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') out[k] = deepMerge(base[k], v);
    else out[k] = v;
  }
  return out;
}

const LIBRARY_FILE = path.join(USER_DATA, 'library.json');
// Carry settings over from the RomDeck preview build
if (!fs.existsSync(CONFIG_FILE)) {
  const old = path.join(app.getPath('appData'), 'RomDeck');
  for (const f of ['config.json', 'installed.json']) {
    try { fs.mkdirSync(USER_DATA, { recursive: true }); fs.copyFileSync(path.join(old, f), path.join(USER_DATA, f)); } catch {}
  }
}
let config = loadJson(CONFIG_FILE, {});
const rawVersion = config.configVersion || 1;
config = deepMerge(DEFAULT_CONFIG, config);
if (rawVersion < 2) {
  // 0.1.1/0.1.2 saved 'software' as a default, not a user choice: move everyone to Auto (GPU)
  if (config.graphics !== 'hardware') config.graphics = 'auto';
  if (config.graphics === 'hardware') config.graphics = 'auto';
  config.configVersion = 2;
  try { fs.mkdirSync(USER_DATA, { recursive: true }); fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 }); } catch {}
}

// ---------------------------------------------------------------- graphics
// Chromium's GPU path shows a blank grey window on some Linux handhelds (AMD + KDE
// Wayland on Bazzite in particular). Software rendering is plenty for this UI and
// works everywhere, so it's the default; hardware acceleration is opt-in in Settings.
const LOG_FILE = path.join(USER_DATA, 'cartridge.log');
function log(...a) {
  try { fs.mkdirSync(USER_DATA, { recursive: true }); fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${a.join(' ')}\n`); } catch {}
}
try { if (fs.statSync(LOG_FILE).size > 512 * 1024) fs.renameSync(LOG_FILE, LOG_FILE + '.old'); } catch {}
function isGamescope() {
  const e = process.env;
  const de = ((e.XDG_CURRENT_DESKTOP || '') + ' ' + (e.XDG_SESSION_DESKTOP || '') + ' ' + (e.DESKTOP_SESSION || '')).toLowerCase();
  return !!(e.GAMESCOPE_WAYLAND_DISPLAY || e.SteamGamepadUI || e.SteamOS === '1' && !e.KDE_FULL_SESSION || de.includes('gamescope'));
}
// Game Mode (gamescope) always renders in software: the GPU path gives a blank or missing
// window there, and 0.1.2 proved software is reliable in Game Mode. Desktop Mode uses the GPU.
const inGamescope = isGamescope();
// Launched from Steam (Desktop or Game Mode): Steam injects its overlay into every process,
// and the overlay hooking Chromium's GPU process leaves a hung, windowless app stuck on
// "Running". 0.1.2 used software rendering everywhere and launched fine from Steam, so do that.
function launchedBySteam() {
  const e = process.env;
  return !!(e.CARTRIDGE_FROM_STEAM || e.SteamGameId || e.SteamAppId || e.SteamClientLaunch || e.SteamOverlayGameId || /gameoverlayrenderer/.test(e.LD_PRELOAD || ''));
}
const fromSteam = launchedBySteam();
// Biggest connected display, read from the kernel before Chromium starts (the screen API only
// works after startup, too late to pick a renderer). A 4K TV is far too many pixels to draw in
// software, so big screens get the GPU even under Steam; handheld-size screens keep the
// software path that is proven to launch there.
function biggestDisplay() {
  let best = { w: 0, h: 0 };
  try {
    for (const d of fs.readdirSync('/sys/class/drm')) {
      if (!/^card\d+-/.test(d)) continue;
      try {
        if (fs.readFileSync(`/sys/class/drm/${d}/status`, 'utf8').trim() !== 'connected') continue;
        const m = fs.readFileSync(`/sys/class/drm/${d}/modes`, 'utf8').split('\n')[0].match(/(\d+)x(\d+)/);
        if (m && +m[1] * +m[2] > best.w * best.h) best = { w: +m[1], h: +m[2] };
      } catch {}
    }
  } catch {}
  return best;
}
const display = biggestDisplay();
const bigScreen = display.w >= 2560 || display.h >= 1440 || process.env.CARTRIDGE_BIG === '1';
const forceSoftware = ((inGamescope || fromSteam) && !bigScreen) || process.argv.includes('--disable-gpu') || process.env.CARTRIDGE_SAFE_GPU === '1';
const useGpu = !forceSoftware && config.graphics !== 'software';
const startedAt = Date.now();
if (!useGpu) app.disableHardwareAcceleration();
log('start', app.getVersion(), 'gpu=' + (useGpu ? 'hardware' : 'software'), 'session=' + (process.env.XDG_SESSION_TYPE || '?'), 'desktop=' + (process.env.XDG_CURRENT_DESKTOP || '?'), 'appimage=' + (process.env.APPIMAGE || 'no'), 'display=' + (display.w ? display.w + 'x' + display.h : '?'), 'gamescope=' + inGamescope, 'steam=' + fromSteam, 'overlay=' + /gameoverlayrenderer/.test(process.env.LD_PRELOAD || ''), 'wl=' + (process.env.WAYLAND_DISPLAY || '-'), 'x=' + (process.env.DISPLAY || '-'), 'gs=' + (process.env.GAMESCOPE_WAYLAND_DISPLAY || '-'));
// Steam launches Cartridge through this script instead of the AppImage directly.
// Steam adds its overlay (LD_PRELOAD) and its runtime libraries (LD_LIBRARY_PATH) to every
// game, and Chromium can die during its sandbox setup under Steam before any app code runs.
// The script drops both, starts without the Chromium sandbox, and writes everything to
// steam-launch.log so a failed launch always leaves a trace.
const STEAM_LAUNCHER = path.join(USER_DATA, 'steam-launch.sh');
function writeSteamLauncher() {
  const ai = process.env.APPIMAGE;
  if (!ai) return null;
  const q = (v) => "'" + String(v).replace(/'/g, "'\\''") + "'";
  const body = `#!/bin/bash
# Written by Cartridge. Steam's shortcut runs this; it is rewritten on every start.
LOG=${q(path.join(USER_DATA, 'steam-launch.log'))}
{
  echo "=== $(date -Is) launched by Steam"
  env | grep -E '^(LD_PRELOAD|LD_LIBRARY_PATH|SteamGameId|SteamAppId|SteamGamepadUI|XDG_SESSION_TYPE|XDG_CURRENT_DESKTOP|DISPLAY|WAYLAND_DISPLAY|GAMESCOPE_WAYLAND_DISPLAY)=' | cut -c1-300
} > "$LOG" 2>&1
unset LD_PRELOAD LD_LIBRARY_PATH
export CARTRIDGE_FROM_STEAM=1
exec ${q(ai)} --no-sandbox "$@" >> "$LOG" 2>&1
`;
  fs.mkdirSync(USER_DATA, { recursive: true });
  fs.writeFileSync(STEAM_LAUNCHER, body, { mode: 0o755 });
  fs.chmodSync(STEAM_LAUNCHER, 0o755);
  return STEAM_LAUNCHER;
}
// keep the script pointing at wherever this AppImage lives now
if (process.env.APPIMAGE && fs.existsSync(STEAM_LAUNCHER)) { try { writeSteamLauncher(); } catch {} }

function relaunch() {
  const args = process.argv.slice(1).filter((a) => !a.startsWith('--disable-gpu'));
  if (process.env.APPIMAGE) app.relaunch({ execPath: process.env.APPIMAGE, args });
  else app.relaunch({ args });
  app.exit(0);
}
let manifest = loadJson(MANIFEST_FILE, {}); // romId -> { path, platformSlug, name, at }

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function saveJson(file, data, pretty = true) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, pretty ? 2 : 0), { mode: 0o600 });
  fs.renameSync(tmp, file);
}
const saveConfig = () => saveJson(CONFIG_FILE, config);
const saveManifest = () => saveJson(MANIFEST_FILE, manifest);

// ---------------------------------------------------------------- server / api
const trimUrl = (u) => (u || '').trim().replace(/\/+$/, '');
let activeBase = null;

function authHeaders(srv = config.server) {
  const h = { Accept: 'application/json', 'User-Agent': 'Cartridge/1.0' };
  if (srv.auth === 'token' && srv.token) h.Authorization = `Bearer ${srv.token.trim()}`;
  else if (srv.username) h.Authorization = 'Basic ' + Buffer.from(`${srv.username}:${srv.password}`).toString('base64');
  if (srv.cfClientId && srv.cfClientSecret) {
    h['CF-Access-Client-Id'] = srv.cfClientId.trim();
    h['CF-Access-Client-Secret'] = srv.cfClientSecret.trim();
  }
  return h;
}

async function probe(base, srv = config.server, timeout = 2500) {
  if (!base) return null;
  try {
    const r = await fetch(`${base}/api/heartbeat`, { headers: authHeaders(srv), signal: AbortSignal.timeout(timeout), redirect: 'manual' });
    if (r.status >= 300 && r.status < 400) return { ok: false, error: 'Redirected (Cloudflare Access login?). Add a service token in Advanced.' };
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const j = await r.json().catch(() => null);
    if (!j) return { ok: false, error: 'Not a RomM server (bad response)' };
    return { ok: true, version: j?.SYSTEM?.VERSION || j?.VERSION || 'unknown' };
  } catch (e) {
    return { ok: false, error: e.name === 'TimeoutError' ? 'Timed out' : (e.cause?.code || e.message) };
  }
}

async function resolveBase(force = false) {
  if (activeBase && !force) return activeBase;
  const s = config.server;
  const local = trimUrl(s.localUrl), remote = trimUrl(s.remoteUrl);
  if (s.mode === 'local') activeBase = local;
  else if (s.mode === 'remote') activeBase = remote;
  else {
    const l = local ? await probe(local, s, 1500) : null;
    activeBase = l?.ok ? local : (remote || local);
  }
  broadcast('connection', { base: activeBase, route: activeBase === trimUrl(s.localUrl) ? 'local' : 'remote' });
  return activeBase;
}

async function api(pathname, { query, method = 'GET', body, retry = true, srv, base } = {}) {
  const b = base || (await resolveBase());
  if (!b) throw new Error('No server configured');
  const url = new URL(b + pathname);
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
    else url.searchParams.set(k, v);
  }
  const headers = authHeaders(srv);
  if (body) headers['Content-Type'] = 'application/json';
  let r;
  try {
    r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    if (retry && !base && config.server.mode === 'auto') {
      await resolveBase(true);
      return api(pathname, { query, method, body, retry: false, srv });
    }
    throw new Error(`Cannot reach server (${e.cause?.code || e.message})`);
  }
  if (r.status === 401 || r.status === 403) throw new Error('Authentication failed. Check your credentials.');
  if (!r.ok) throw new Error(`Server error ${r.status} on ${pathname}`);
  return r.json();
}

// ---------------------------------------------------------------- path detection
function expandHome(p) {
  if (!p) return p;
  return p.replace(/^~(?=$|\/)/, os.homedir()).replace(/\$HOME|\$\{HOME\}/g, os.homedir());
}
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function readEmuDeckSettings() {
  const file = path.join(os.homedir(), '.config/EmuDeck/settings.sh');
  const out = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?(romsPath|emulationPath|biosPath|toolsPath)=["']?([^"'\n]*)["']?/);
      if (m) out[m[1]] = expandHome(m[2].trim());
    }
  } catch {}
  return out;
}

function readEsdeRomDir() {
  const files = [
    path.join(os.homedir(), 'ES-DE/settings/es_settings.xml'),
    path.join(os.homedir(), '.emulationstation/es_settings.xml'),
    path.join(os.homedir(), '.var/app/org.es_de.frontend/ES-DE/settings/es_settings.xml'),
  ];
  for (const f of files) {
    try {
      const m = fs.readFileSync(f, 'utf8').match(/name="ROMDirectory"\s+value="([^"]*)"/);
      if (m && m[1]) return { file: f, dir: expandHome(m[1].replace('%ROMPATH%', '')) };
    } catch {}
  }
  return null;
}

function scanMounts() {
  const found = [];
  const roots = [`/run/media/${os.userInfo().username}`, '/run/media', '/media', '/mnt', os.homedir()];
  const tryDir = (p) => {
    for (const cand of [path.join(p, 'Emulation/roms'), path.join(p, 'roms')]) {
      if (isDir(cand) && !found.includes(cand)) found.push(cand);
    }
  };
  for (const r of roots) {
    tryDir(r);
    let lvl1 = [];
    try { lvl1 = fs.readdirSync(r, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')); } catch {}
    for (const d of lvl1) {
      const p1 = path.join(r, d.name);
      tryDir(p1);
      let lvl2 = [];
      try { lvl2 = fs.readdirSync(p1, { withFileTypes: true }).filter((x) => x.isDirectory() && !x.name.startsWith('.')); } catch {}
      for (const d2 of lvl2.slice(0, 40)) tryDir(path.join(p1, d2.name));
    }
  }
  return found.filter((p) => !p.includes('/.'));
}

function detectRoots() {
  const out = [];
  const add = (p, source) => {
    if (!p) return;
    const norm = path.resolve(p);
    if (!out.find((o) => o.path === norm)) out.push({ path: norm, source, exists: isDir(norm) });
  };
  const emu = readEmuDeckSettings();
  if (emu.romsPath) add(emu.romsPath, 'EmuDeck settings');
  else if (emu.emulationPath) add(path.join(emu.emulationPath, 'roms'), 'EmuDeck settings');
  const esde = readEsdeRomDir();
  if (esde) add(esde.dir, 'ES-DE settings');
  for (const p of scanMounts()) add(p, 'Found on disk');
  let bios = null;
  if (emu.biosPath) bios = emu.biosPath;
  else if (emu.emulationPath) bios = path.join(emu.emulationPath, 'bios');
  else {
    const r = out.find((o) => o.exists);
    if (r) { const b = path.join(path.dirname(r.path), 'bios'); if (isDir(b)) bios = b; }
  }
  return { roots: out, bios };
}

function listDirNames(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() || d.isSymbolicLink()).map((d) => d.name); } catch { return []; }
}

function platformPath(p) {
  // p: { slug, fs_slug }
  const override = config.paths[p.slug];
  if (override) return { path: override, source: 'custom', exists: isDir(override) };
  const root = config.romsRoot;
  if (!root) return { path: '', source: 'none', exists: false };
  const cands = [...(PLATFORM_MAP[p.slug] || []), ...(p.fs_slug ? [p.fs_slug] : []), p.slug].filter(Boolean);
  const existing = listDirNames(root);
  const lower = new Map(existing.map((n) => [n.toLowerCase(), n]));
  for (const c of cands) {
    const hit = lower.get(c.toLowerCase());
    if (hit) return { path: path.join(root, hit), source: 'auto', exists: true };
  }
  return { path: path.join(root, cands[0]), source: 'auto', exists: false };
}

// ---------------------------------------------------------------- installed detection
function candidatesFor(rom) {
  const names = [rom.fs_name, `${rom.fs_name}.m3u`];
  const files = rom.files || [];
  if (files.length === 1) names.push(files[0].file_name);
  return names.filter(Boolean);
}

// PS4 / PS5 games live on RomM as zips but are played from an extracted folder, so the zip
// never shows up on disk. They are matched by folder name (zip name without .zip) or by the
// PlayStation title ID (CUSA12345 / PPSA12345), and can also be marked by hand.
const FOLDER_SYSTEMS = new Set(['ps4', 'ps5']);
const isFolderSystem = (r) => FOLDER_SYSTEMS.has(r.platform_slug) || FOLDER_SYSTEMS.has(r.platform_fs_slug);
const MARKS_FILE = path.join(USER_DATA, 'marked.json');
const marks = loadJson(MARKS_FILE, {}); // romId -> { at }
function saveMarks() { try { fs.writeFileSync(MARKS_FILE, JSON.stringify(marks, null, 1)); } catch {} }
const titleId = (s) => (String(s || '').match(/\b(CUSA|PPSA)\d{5}\b/i) || [])[0]?.toUpperCase() || '';
function installedState(roms, platform) {
  const dir = platformPath(platform).path;
  let entries = new Set();
  if (dir) { try { entries = new Set(fs.readdirSync(dir)); } catch {} }
  const out = {};
  let ids = null;
  for (const rom of roms) {
    const m = manifest[rom.id];
    if (m && fs.existsSync(m.path)) { out[rom.id] = m.path; continue; }
    const hit = candidatesFor(rom).find((n) => entries.has(n));
    if (hit) { out[rom.id] = path.join(dir, hit); continue; }
    if (isFolderSystem(rom) && dir) {
      const stem = String(rom.fs_name || '').replace(/\.(zip|7z|rar)$/i, '');
      if (stem && entries.has(stem)) { out[rom.id] = path.join(dir, stem); continue; }
      const tid = titleId(rom.fs_name) || titleId(rom.name);
      if (tid) {
        ids ||= new Map([...entries].map((e) => [titleId(e), e]).filter(([k]) => k));
        if (ids.has(tid)) { out[rom.id] = path.join(dir, ids.get(tid)); continue; }
      }
    }
    if (marks[rom.id]) out[rom.id] = MARKED;
  }
  return out;
}
const MARKED = '(marked as installed)';

// ---------------------------------------------------------------- library cache + sync
// The whole library is mirrored locally (Argosy-style): instant startup, offline browsing,
// and a "Resync" that pulls whatever changed on the server.
let library = loadJson(LIBRARY_FILE, null); // { platforms, roms: {pid: [...]}, firstSeen: {id: ts}, syncedAt, base }
let syncing = null;
let installedMap = {};

// Transparent game logo from RomM (ScreenScraper "logo" media, or an ES-DE gamelist marquee)
function logoPath(r) {
  const p = r.ss_metadata?.logo_path || r.gamelist_metadata?.marquee_path || null;
  if (!p) return null;
  return /^(https?:)?\/\//.test(p) || p.startsWith('/assets/') ? p : '/assets/romm/resources/' + p.replace(/^\//, '');
}
function slimRom(r) {
  const md = r.metadatum || {};
  return {
    id: r.id, name: r.name || r.fs_name_no_ext, fs_name: r.fs_name, fs_name_no_ext: r.fs_name_no_ext,
    platform_id: r.platform_id, platform_slug: r.platform_slug, platform_fs_slug: r.platform_fs_slug,
    platform_display_name: r.platform_display_name, fs_size_bytes: r.fs_size_bytes,
    path_cover_small: r.path_cover_small, path_cover_large: r.path_cover_large, url_cover: r.url_cover,
    shot: (r.merged_screenshots || [])[0] || null,
    logo: logoPath(r),
    ra_id: r.ra_id || null,
    has_notes: !!(r.has_notes || r.all_user_notes?.length || r.rom_user?.note_raw_markdown),
    summary: (r.summary || '').slice(0, 400),
    regions: r.regions || [], files: (r.files || []).map((f) => ({ file_name: f.file_name })),
    year: md.first_release_date || null, genres: (md.genres || []).slice(0, 3),
    developer: (md.developers?.[0] || md.companies?.[0] || ''), rating: md.average_rating || null,
    created_at: r.created_at, has_file_on_disk: r.has_file_on_disk !== false,
  };
}

function publicLibrary() {
  if (!library) return null;
  return {
    platforms: library.platforms.map((p) => ({ ...p, target: platformPath(p) })),
    roms: library.roms,
    firstSeen: library.firstSeen,
    syncedAt: library.syncedAt,
    lastNew: library.lastNew || [],
    collections: library.collections || [],
  };
}

function computeInstalled() {
  const out = {};
  if (!library) return out;
  for (const p of library.platforms) Object.assign(out, installedState(library.roms[p.id] || [], p));
  installedMap = out;
  broadcast('installed', out);
  return out;
}

async function syncLibrary() {
  if (syncing) return syncing;
  syncing = (async () => {
    const started = Date.now();
    try {
      broadcast('sync', { state: 'running', label: 'Connecting…', done: 0, total: 0 });
      const platforms = (await api('/api/platforms')).map((p) => ({
        id: p.id, slug: p.slug, fs_slug: p.fs_slug, name: p.name, display_name: p.display_name || p.custom_name || p.name,
        rom_count: p.rom_count || 0, category: p.category || null, family_name: p.family_name || null, generation: p.generation || null,
        size: p.fs_size_bytes || 0, url_logo: p.url_logo || null,
      }));
      const withGames = platforms.filter((p) => p.rom_count > 0);
      const roms = {};
      let i = 0;
      for (const p of withGames) {
        broadcast('sync', { state: 'running', label: p.display_name, done: i, total: withGames.length });
        const list = [];
        for (let offset = 0; ; ) {
          const page = await api('/api/roms', {
            query: {
              platform_ids: p.id, platform_id: p.id, limit: 500, offset, order_by: 'name', order_dir: 'asc',
              with_char_index: false, with_filter_values: false, with_rom_id_index: false, with_files: true,
            },
          });
          const items = Array.isArray(page) ? page : page.items || [];
          list.push(...items.map(slimRom));
          offset += items.length;
          if (Array.isArray(page) || items.length < 500 || offset >= (page.total ?? 0)) break;
        }
        roms[p.id] = list;
        i++;
      }
      const prevSeen = library?.firstSeen || {};
      const firstSync = !library;
      const firstSeen = {};
      const lastNew = [];
      for (const list of Object.values(roms)) {
        for (const r of list) {
          if (prevSeen[r.id]) firstSeen[r.id] = prevSeen[r.id];
          else { firstSeen[r.id] = firstSync ? 1 : started; if (!firstSync) lastNew.push(r.id); }
        }
      }
      const prevCount = library ? Object.values(library.roms).reduce((s, l) => s + l.length, 0) : 0;
      const count = Object.values(roms).reduce((s, l) => s + l.length, 0);
      broadcast('sync', { state: 'running', label: 'Collections', done: withGames.length, total: withGames.length + 1 });
      const collections = [];
      for (const [kind, ep] of [['user', '/api/collections'], ['smart', '/api/collections/smart']]) {
        try {
          for (const c of await api(ep)) {
            const ids = [...(c.rom_ids || [])];
            if (!ids.length) continue;
            collections.push({ id: `${kind}-${c.id}`, name: c.name, description: c.description || '', rom_ids: ids, favorite: !!c.is_favorite, smart: kind === 'smart',
              covers: (c.path_covers_small || []).slice(0, 4), cover: c.path_cover_large || c.url_cover || null });
          }
        } catch {}
      }
      collections.sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name));
      library = { platforms, roms, firstSeen, syncedAt: Date.now(), base: activeBase, lastNew, collections };
      saveJson(LIBRARY_FILE, library, false);
      computeInstalled();
      const result = { state: 'done', added: lastNew.length, removed: Math.max(0, prevCount + lastNew.length - count), total: count, firstSync };
      broadcast('library', publicLibrary());
      broadcast('sync', result);
      return result;
    } catch (e) {
      broadcast('sync', { state: 'error', error: e.message });
      throw e;
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

// Ask RomM to scan its folders for new files (needs a password login: scans use a web session)
const SCAN_SOURCES = {
  igdb: 'IGDB_API_ENABLED', ss: 'SS_API_ENABLED', moby: 'MOBY_API_ENABLED', ra: 'RA_API_ENABLED',
  launchbox: 'LAUNCHBOX_API_ENABLED', hasheous: 'HASHEOUS_API_ENABLED', playmatch: 'PLAYMATCH_API_ENABLED',
  flashpoint: 'FLASHPOINT_API_ENABLED', hltb: 'HLTB_API_ENABLED', sgdb: 'STEAMGRIDDB_API_ENABLED',
  libretro: 'LIBRETRO_API_ENABLED', steam: 'STEAM_API_ENABLED',
};
async function scanServer() {
  const s = config.server;
  if (s.auth !== 'password' || !s.username) throw new Error('Server scans need username & password sign-in');
  const base = await resolveBase();
  const hb = await fetch(`${base}/api/heartbeat`, { headers: authHeaders() }).then((r) => r.json());
  const flags = hb.METADATA_SOURCES || {};
  const apis = Object.entries(SCAN_SOURCES).filter(([, f]) => flags[f]).map(([k]) => k).concat('gamelist');
  const login = await fetch(`${base}/api/login`, { method: 'POST', headers: authHeaders(), redirect: 'manual' });
  if (!login.ok) throw new Error(`Login for scan failed (HTTP ${login.status})`);
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  const { io } = require('socket.io-client');
  const extraHeaders = { Cookie: cookie };
  if (s.cfClientId && s.cfClientSecret) { extraHeaders['CF-Access-Client-Id'] = s.cfClientId; extraHeaders['CF-Access-Client-Secret'] = s.cfClientSecret; }
  return new Promise((resolve, reject) => {
    const sock = io(base, { path: '/ws/socket.io', transports: ['websocket'], extraHeaders, reconnection: false, timeout: 15000 });
    let lastPlatform = '';
    const finish = (fn, v) => { clearTimeout(t); sock.close(); fn(v); };
    const t = setTimeout(() => finish(reject, new Error('Scan timed out')), 4 * 3600e3);
    sock.on('connect', () => {
      broadcast('sync', { state: 'scanning', label: 'Scanning server…' });
      sock.emit('scan', { platforms: [], type: 'quick', apis });
    });
    sock.on('connect_error', (e) => finish(reject, new Error('Could not open scan connection: ' + e.message)));
    sock.on('scan:scanning_platform', (p) => { lastPlatform = p?.display_name || p?.name || ''; broadcast('sync', { state: 'scanning', label: `Scanning ${lastPlatform}` }); });
    sock.on('scan:scanning_rom', (r) => broadcast('sync', { state: 'scanning', label: `Scanning ${lastPlatform}: ${r?.name || r?.fs_name || ''}` }));
    sock.on('scan:done', (stats) => finish(resolve, stats || {}));
    sock.on('scan:done_ko', (msg) => finish(reject, new Error(typeof msg === 'string' ? msg : 'Scan failed')));
  });
}

// ---------------------------------------------------------------- image protocol (auth + disk cache)
async function handleImage(request) {
  const u = new URL(request.url);
  const sl = u.searchParams.get('sys');
  if (sl && u.searchParams.get('png')) {
    try { return new Response(await fsp.readFile(path.join(__dirname, '../build/syslogos', path.basename(sl) + '.png')), { headers: { 'Content-Type': 'image/png' } }); } catch { return new Response('nf', { status: 404 }); }
  }
  if (sl) {
    try { return new Response(await fsp.readFile(path.join(SYSLOGO_DIR, path.basename(sl) + '.svg')), { headers: { 'Content-Type': 'image/svg+xml' } }); } catch { return new Response('nf', { status: 404 }); }
  }
  if (u.searchParams.get('wp')) {
    const f = fs.readdirSync(USER_DATA).find((n) => /^wallpaper\.(png|jpe?g|webp)$/i.test(n));
    if (!f) return new Response('nf', { status: 404 });
    const type = { '.png': 'image/png', '.webp': 'image/webp' }[path.extname(f).toLowerCase()] || 'image/jpeg';
    return new Response(await fsp.readFile(path.join(USER_DATA, f)), { headers: { 'Content-Type': type } });
  }
  const tr = u.searchParams.get('tr');
  if (tr) {
    const p = trophySvc.iconPath(tr);
    try { return new Response(await fsp.readFile(p), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=86400' } }); } catch { return new Response('nf', { status: 404 }); }
  }
  const lf = u.searchParams.get('f');
  if (lf) {
    try { return new Response(await fsp.readFile(path.join(LOGO_DIR, path.basename(lf))), { headers: { 'Content-Type': 'image/png' } }); } catch { return new Response('nf', { status: 404 }); }
  }
  const target = u.searchParams.get('u');
  if (!target) return new Response('bad', { status: 400 });
  const key = crypto.createHash('sha1').update(target).digest('hex');
  const file = path.join(IMG_CACHE, key);
  try {
    const buf = await fsp.readFile(file);
    const type = (await fsp.readFile(file + '.type', 'utf8').catch(() => '')) || 'image/jpeg';
    return new Response(buf, { headers: { 'Content-Type': type, 'Cache-Control': 'max-age=31536000' } });
  } catch {}
  try {
    let url, headers = {};
    if (/^https?:\/\//.test(target)) url = target.replace(/^\/\//, 'https://');
    else { url = (await resolveBase()) + (target.startsWith('/') ? '' : '/') + target; headers = authHeaders(); delete headers.Accept; }
    if (url.startsWith('//')) url = 'https:' + url;
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return new Response('nf', { status: 404 });
    const buf = Buffer.from(await r.arrayBuffer());
    const type = r.headers.get('content-type') || 'image/jpeg';
    fsp.mkdir(IMG_CACHE, { recursive: true }).then(() => Promise.all([fsp.writeFile(file, buf), fsp.writeFile(file + '.type', type)])).catch(() => {});
    return new Response(buf, { headers: { 'Content-Type': type } });
  } catch {
    return new Response('err', { status: 502 });
  }
}

// ---------------------------------------------------------------- logos + custom artwork
// Logos come from (in order) a logo the user picked, RomM's own logo, or SteamGridDB (free key).
// Every logo is prepared here: transparent padding trimmed so sizes can be evened out on screen,
// and near-black logos detected so a white version is picked (or the black one drawn white).
const LOGO_FILE = path.join(USER_DATA, 'logos.json');
const LOGO_DIR = path.join(USER_DATA, 'logos');
const ART_FILE = path.join(USER_DATA, 'artwork.json');
const LOGO_VERSION = 2;
const logoCache = loadJson(LOGO_FILE, {}); // romId -> { v, file, w, h, dark, src, t }
const artOverrides = loadJson(ART_FILE, {}); // romId -> { grid, logo, hero }
let logoSaveT = null;
function saveLogoCache() { clearTimeout(logoSaveT); logoSaveT = setTimeout(() => { try { fs.writeFileSync(LOGO_FILE, JSON.stringify(logoCache)); } catch {} }, 500); }
function saveArt() { try { fs.writeFileSync(ART_FILE, JSON.stringify(artOverrides, null, 1)); } catch {} }
const logoInflight = new Map();
let logoChain = Promise.resolve();
const SGDB_BASE = () => process.env.CARTRIDGE_SGDB_BASE || 'https://www.steamgriddb.com/api/v2';
async function sgdb(pathname) {
  const r = await fetch(SGDB_BASE() + pathname, { headers: { Authorization: 'Bearer ' + config.sgdbKey }, signal: AbortSignal.timeout(12000) });
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('SteamGridDB rejected the API key'), { auth: true });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j && j.success ? j.data : null;
}
function cleanName(n) { return String(n || '').replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').replace(/\s+/g, ' ').trim(); }
async function sgdbGames(name) {
  const tries = [...new Set([cleanName(name), cleanName(name).split(/:| - /)[0].trim()])].filter((x) => x.length > 1);
  for (const term of tries) {
    const games = await sgdb('/search/autocomplete/' + encodeURIComponent(term));
    if (games && games.length) return games.slice(0, 6).map((g) => ({ id: g.id, name: g.name, year: g.release_date ? new Date(g.release_date * 1000).getFullYear() : null }));
  }
  return [];
}
const logoRank = (l) => (l.style === 'official' ? 0 : l.style === 'white' ? 1 : l.style === 'custom' ? 2 : 3) + (l.mime === 'image/png' ? 0 : 0.5);

async function fetchImage(src) {
  let url = src, headers = {};
  if (!/^https?:\/\//.test(src)) { url = (await resolveBase()) + (src.startsWith('/') ? '' : '/') + src; headers = authHeaders(); delete headers.Accept; }
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}
// Trim transparent edges, measure brightness, save a PNG. Returns null if it isn't a usable image.
function prepareLogo(buf, key) {
  const { nativeImage } = require('electron');
  let im = nativeImage.createFromBuffer(buf);
  if (im.isEmpty()) return null;
  let { width: W, height: H } = im.getSize();
  if (W > 900) { im = im.resize({ width: 900, quality: 'best' }); ({ width: W, height: H } = im.getSize()); }
  const px = im.toBitmap(); // BGRA
  let x0 = W, y0 = H, x1 = -1, y1 = -1, lum = 0, sat = 0, wsum = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, a = px[i + 3];
      if (a < 24) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const b = px[i], g = px[i + 1], r = px[i + 2], w = a / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      lum += w * (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      sat += w * (mx ? (mx - mn) / mx : 0);
      wsum += w;
    }
  }
  if (x1 < 0 || x1 - x0 < 8 || y1 - y0 < 4) return null;
  const crop = im.crop({ x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  fs.mkdirSync(LOGO_DIR, { recursive: true });
  const file = `${key}.png`;
  fs.writeFileSync(path.join(LOGO_DIR, file), crop.toPNG());
  const L = wsum ? lum / wsum : 1, S = wsum ? sat / wsum : 1;
  return { file, w: x1 - x0 + 1, h: y1 - y0 + 1, dark: L < 0.22 && S < 0.35, lum: +L.toFixed(3) };
}
async function logoFromSgdb(id, name) {
  const games = await sgdbGames(name);
  for (const g of games.slice(0, 2)) {
    const logos = await sgdb(`/logos/game/${g.id}?types=static&nsfw=false&humor=false`);
    if (!logos || !logos.length) continue;
    const list = [...logos].sort((a, b) => logoRank(a) - logoRank(b) || (b.score || 0) - (a.score || 0)).slice(0, 5);
    let firstDark = null;
    for (const [i, l] of list.entries()) {
      try {
        const got = prepareLogo(await fetchImage(l.url), `${id}-s${i}`);
        if (!got) continue;
        if (!got.dark) return { ...got, src: l.url };
        firstDark ||= { ...got, src: l.url };
      } catch {}
    }
    if (firstDark) return firstDark; // only black versions exist: the app draws it white
  }
  return null;
}
function logoPublic(c) { return c && c.file ? { url: 'romimg://img/?f=' + encodeURIComponent(c.file) + '&t=' + c.t, w: c.w, h: c.h, dark: c.dark } : null; }
async function logoFor({ id, name, romm }) {
  if (!id) return null;
  const pick = artOverrides[id]?.logo || '';
  const c = logoCache[id];
  const want = pick ? 'pick:' + pick : romm ? 'romm:' + romm : 'sgdb';
  if (c && c.v === LOGO_VERSION && c.want === want && (c.file || Date.now() - c.t < 3 * 864e5)) return logoPublic(c);
  if (want === 'sgdb' && !config.sgdbKey) return null;
  if (logoInflight.has(id)) return logoInflight.get(id);
  const job = (logoChain = logoChain.then(async () => {
    let got = null;
    try {
      if (pick) got = prepareLogo(await fetchImage(pick), `${id}-p`);
      else if (romm) { try { got = prepareLogo(await fetchImage(romm), `${id}-r`); } catch {} }
      if (!got && !pick && config.sgdbKey) got = await logoFromSgdb(id, name);
    } catch (e) { log('logo', name, e.message); if (e.auth) throw e; }
    logoCache[id] = { v: LOGO_VERSION, want, t: Date.now(), ...(got || {}) }; saveLogoCache();
    return logoPublic(logoCache[id]);
  }));
  logoChain = job.catch(() => {});
  logoInflight.set(id, job);
  try { return await job; } finally { logoInflight.delete(id); }
}
// ---------------------------------------------------------------- RetroAchievements
// Web API (retroachievements.org/API) with the user's username + web API key.
// Docs: github.com/RetroAchievements/api-docs. Results are cached briefly (and on disk, so the
// tab still shows something offline).
const RA_BASE = () => process.env.CARTRIDGE_RA_BASE || 'https://retroachievements.org';
const RA_MEDIA = () => process.env.CARTRIDGE_RA_MEDIA || 'https://media.retroachievements.org';
const RA_CACHE_FILE = path.join(USER_DATA, 'retroachievements.json');
const raCache = loadJson(RA_CACHE_FILE, {});
const raMem = new Map();
async function raApi(name, params = {}, auth = config.ra) {
  if (!auth?.user || !auth?.key) throw new Error('Sign in to RetroAchievements first');
  const q = new URLSearchParams({ y: auth.key, u: auth.user, ...params });
  const r = await fetch(`${RA_BASE()}/API/API_${name}.php?${q}`, { headers: { 'User-Agent': `Cartridge/${app.getVersion()}` }, signal: AbortSignal.timeout(15000) });
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('RetroAchievements rejected the username or web API key'), { auth: true });
  if (r.status === 429) throw new Error('RetroAchievements is rate limiting, try again in a minute');
  if (!r.ok) throw new Error('RetroAchievements error ' + r.status);
  const j = await r.json();
  if (j && typeof j === 'object' && !Array.isArray(j) && (j.error || j.Error)) throw Object.assign(new Error(String(j.error || j.Error)), { auth: /key|user|auth/i.test(String(j.error || j.Error)) });
  return j;
}
const raMedia = (p) => (!p ? '' : /^https?:/.test(p) ? p : RA_MEDIA() + (p.startsWith('/') ? '' : '/') + p);
const raBadge = (b, locked) => (b ? `${RA_MEDIA()}/Badge/${b}${locked ? '_lock' : ''}.png` : '');
async function raCached(key, ttl, fn) {
  const m = raMem.get(key);
  if (m && Date.now() - m.t < ttl) return m.v;
  try {
    const v = await fn();
    raMem.set(key, { t: Date.now(), v });
    raCache[key] = { t: Date.now(), v };
    try { fs.writeFileSync(RA_CACHE_FILE, JSON.stringify(raCache)); } catch {}
    return v;
  } catch (e) {
    if (!e.auth && raCache[key]) return { ...raCache[key].v, offline: true };
    throw e;
  }
}
// Links a RetroAchievements game to a library ROM: RomM's ra_id first, then an exact title
// match among ROMs on consoles RetroAchievements supports (only when the title is unique).
function raRomIndex() {
  const byId = new Map(), byTitle = new Map();
  for (const r of library ? Object.values(library.roms).flat() : []) {
    if (r.ra_id) byId.set(Number(r.ra_id), r.id);
    if (RA_CONSOLES[r.platform_slug] ?? RA_CONSOLES[r.platform_fs_slug]) {
      const k = raNorm(r.name);
      byTitle.set(k, byTitle.has(k) ? null : r.id);
    }
  }
  return { get: (gameId, title) => byId.get(Number(gameId)) || (title ? byTitle.get(raNorm(title)) : null) || null };
}
// RetroAchievements system IDs for the consoles it supports (RomM slug -> RA console ID).
// Consoles missing here (PS3, PS4, PS5, Vita, Switch, 3DS, Xbox...) have no RetroAchievements.
const RA_CONSOLES = {
  'genesis-slash-megadrive': 1, genesis: 1, megadrive: 1, n64: 2, snes: 3, sfam: 3, gb: 4, gba: 5, gbc: 6, nes: 7, famicom: 7,
  tg16: 8, 'pc-engine': 8, pcengine: 8, segacd: 9, sega32: 10, 'sega-32x': 10, sms: 11, psx: 12, lynx: 13, ngp: 14, ngpc: 14,
  gamegear: 15, ngc: 16, jaguar: 17, nds: 18, ps2: 21, 'pokemon-mini': 24, atari2600: 25, arcade: 27, virtualboy: 28, msx: 29,
  sg1000: 33, saturn: 39, dc: 40, psp: 41, '3do': 43, colecovision: 44, intellivision: 45, vectrex: 46, atari7800: 51,
  wonderswan: 53, 'wonderswan-color': 53, 'neo-geo-cd': 56, 'turbografx-cd': 76, 'pc-engine-cd': 76, 'nintendo-dsi': 78,
};
const raNorm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').replace(/^the\s+|,\s*the\b/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
async function raGameList(consoleId) {
  const key = 'list:' + consoleId;
  const c = raCache[key];
  if (c && Date.now() - c.t < 7 * 864e5) return c.v;
  const list = await raApi('GetGameList', { i: consoleId, f: 1 });
  const v = (Array.isArray(list) ? list : []).map((g) => [raNorm(g.Title), g.ID]);
  raCache[key] = { t: Date.now(), v };
  try { fs.writeFileSync(RA_CACHE_FILE, JSON.stringify(raCache)); } catch {}
  return v;
}
async function raForRom({ ra_id, name, slug, fs_slug }) {
  if (!config.ra?.user || !config.ra?.key) return null;
  const consoleId = RA_CONSOLES[slug] ?? RA_CONSOLES[fs_slug];
  if (!consoleId) return null; // no RetroAchievements for this console
  if (ra_id) return Number(ra_id);
  const n = raNorm(name);
  if (!n) return null;
  const list = await raGameList(consoleId);
  const exact = list.find(([t]) => t === n);
  if (exact) return exact[1];
  const base = raNorm(String(name).split(/:| - /)[0]);
  const partial = list.filter(([t]) => t === base || t.startsWith(n + ' ') || n.startsWith(t + ' '));
  return partial.length === 1 ? partial[0][1] : null;
}
async function raOverview({ force } = {}) {
  if (force) raMem.clear();
  return raCached('overview:' + config.ra.user, 120000, async () => {
    const [profile, recent, played] = await Promise.all([
      raApi('GetUserProfile'),
      raApi('GetUserRecentAchievements', { m: 60 * 24 * 30 }).catch(() => []),
      raApi('GetUserRecentlyPlayedGames', { c: 30 }).catch(() => []),
    ]);
    const idx = raRomIndex();
    return {
      user: profile.User || config.ra.user,
      avatar: raMedia(profile.UserPic),
      points: profile.TotalPoints || 0,
      softPoints: profile.TotalSoftcorePoints || 0,
      truePoints: profile.TotalTruePoints || 0,
      presence: profile.RichPresenceMsg || '',
      memberSince: profile.MemberSince || '',
      recent: (Array.isArray(recent) ? recent : []).map((a) => ({
        id: a.AchievementID, title: a.Title, desc: a.Description, points: a.Points, date: a.Date, hardcore: !!a.HardcoreMode,
        badge: raMedia(a.BadgeURL) || raBadge(a.BadgeName), game: a.GameTitle, gameId: a.GameID, console: a.ConsoleName, gameIcon: raMedia(a.GameIcon), romId: idx.get(a.GameID, a.GameTitle),
      })),
      played: (Array.isArray(played) ? played : []).map((g) => ({
        gameId: g.GameID, title: g.Title, console: g.ConsoleName, icon: raMedia(g.ImageIcon), boxart: raMedia(g.ImageBoxArt), lastPlayed: g.LastPlayed,
        total: g.NumPossibleAchievements ?? g.AchievementsTotal ?? 0, earned: g.NumAchieved || 0, earnedHc: g.NumAchievedHardcore || 0,
        score: g.ScoreAchieved || 0, possible: g.PossibleScore || 0, romId: idx.get(g.GameID, g.Title),
      })),
    };
  });
}
async function raGame({ gameId, force }) {
  if (force) raMem.delete(`game:${config.ra.user}:${gameId}`);
  return raCached(`game:${config.ra.user}:${gameId}`, 120000, async () => {
    const g = await raApi('GetGameInfoAndUserProgress', { g: gameId, a: 1 });
    const list = Object.values(g.Achievements || {}).map((a) => ({
      id: a.ID, title: a.Title, desc: a.Description, points: a.Points, type: a.type || null, order: a.DisplayOrder || 0,
      earned: a.DateEarned || null, earnedHc: a.DateEarnedHardcore || null, rarity: g.NumDistinctPlayers ? Math.round((a.NumAwarded / g.NumDistinctPlayers) * 1000) / 10 : null,
      badge: raBadge(a.BadgeName, !(a.DateEarned || a.DateEarnedHardcore)),
    })).sort((a, b) => a.order - b.order || a.id - b.id);
    return {
      gameId: g.ID, title: g.Title, console: g.ConsoleName, icon: raMedia(g.ImageIcon), boxart: raMedia(g.ImageBoxArt), ingame: raMedia(g.ImageIngame),
      total: g.NumAchievements || list.length, earned: g.NumAwardedToUser || 0, earnedHc: g.NumAwardedToUserHardcore || 0,
      completion: g.UserCompletion || '', award: g.HighestAwardKind || null, achievements: list, romId: raRomIndex().get(g.ID, g.Title),
    };
  });
}

// Console logos: white SVG wordmarks from the open-source Art Book Next theme for ES-DE
// (github.com/anthonycaccese/art-book-next-es-de), fetched on first use and cached. Logos are
// trademarks of their owners. Anything missing falls back to the console's name.
const SYSLOGO_DIR = path.join(USER_DATA, 'syslogos');
const SYSLOGO_BASE = 'https://raw.githubusercontent.com/anthonycaccese/art-book-next-es-de/main/_inc/systems/logos/';
const sysLogoInflight = new Map();
async function sysLogo({ slug, fs_slug }) {
  const names = [...new Set([...(PLATFORM_MAP[slug] || []), ...(PLATFORM_MAP[fs_slug] || []), fs_slug, slug].filter(Boolean))].filter((n) => /^[a-z0-9_-]+$/i.test(n));
  const key = names[0];
  if (!key) return null;
  // bundled logos (PS5: the wordmark without the PlayStation symbol)
  for (const n of [slug, fs_slug]) if (n && fs.existsSync(path.join(__dirname, '../build/syslogos', n + '.png'))) return 'romimg://img/?sys=' + encodeURIComponent(n) + '&png=1';
  const file = path.join(SYSLOGO_DIR, key + '.svg'), miss = file + '.none';
  if (fs.existsSync(file)) return 'romimg://img/?sys=' + encodeURIComponent(key);
  try { if (Date.now() - fs.statSync(miss).mtimeMs < 7 * 864e5) return null; } catch {}
  if (sysLogoInflight.has(key)) return sysLogoInflight.get(key);
  const job = (async () => {
    for (const n of names) {
      try {
        const r = await fetch(SYSLOGO_BASE + n + '.svg', { signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const svg = await r.text();
        if (!/<svg[\s>]/i.test(svg)) continue;
        fs.mkdirSync(SYSLOGO_DIR, { recursive: true });
        fs.writeFileSync(file, svg);
        return 'romimg://img/?sys=' + encodeURIComponent(key);
      } catch {}
    }
    try { fs.mkdirSync(SYSLOGO_DIR, { recursive: true }); fs.writeFileSync(miss, ''); } catch {}
    return null;
  })();
  sysLogoInflight.set(key, job);
  try { return await job; } finally { sysLogoInflight.delete(key); }
}

// Fetch all: prepare logos for the whole library in the background, reporting progress.
let fetchAll = null; // { done, total, found, stop }
async function fetchAllLogos() {
  if (fetchAll) return { running: true };
  const roms = library ? Object.values(library.roms).flat() : [];
  fetchAll = { done: 0, total: roms.length, found: 0, stop: false };
  const report = (state) => broadcast('logos-progress', { state, done: fetchAll.done, total: fetchAll.total, found: fetchAll.found });
  report('running');
  let last = 0;
  try {
    for (const r of roms) {
      if (fetchAll.stop) break;
      const romm = r.logo || '';
      try { if (await logoFor({ id: r.id, name: r.name, romm })) fetchAll.found++; } catch (e) { if (e.auth) { report('error'); throw e; } }
      fetchAll.done++;
      if (Date.now() - last > 250) { last = Date.now(); report('running'); }
    }
    report(fetchAll.stop ? 'stopped' : 'done');
    return { done: fetchAll.done, found: fetchAll.found };
  } finally { fetchAll = null; }
}

// Artwork picker: SteamGridDB images of one kind for a game (by name, or a chosen SGDB game id)
// Square game icons from SteamGridDB (used for trophy games). Cached; null when there is none.
const ICON_FILE = path.join(USER_DATA, 'gameicons.json');
const iconCache = loadJson(ICON_FILE, {});
const iconInflight = new Map();
async function gameIcon({ key, name }) {
  if (!config.sgdbKey || !name) return null;
  const k = String(key || name);
  const c = iconCache[k];
  if (c && (c.url || Date.now() - c.t < 7 * 864e5)) return c.url || null;
  if (iconInflight.has(k)) return iconInflight.get(k);
  const job = (async () => {
    let url = null;
    try {
      const games = await sgdbGames(String(name).replace(/[™®©]/g, '').replace(/\s+trophies$/i, ''));
      if (games[0]) {
        const icons = (await sgdb(`/icons/game/${games[0].id}?types=static&nsfw=false&humor=false`)) || [];
        const good = icons.filter((i) => i.mime === 'image/png' || /\.png($|\?)/i.test(i.url || ''))
          .sort((a, b) => (Math.abs(a.width - a.height) - Math.abs(b.width - b.height)) || (b.width - a.width) || ((b.score || 0) - (a.score || 0)));
        url = good[0]?.url || null;
      }
    } catch (e) { return null; } // offline or rejected key: try again next time
    iconCache[k] = { url, t: Date.now() };
    try { fs.writeFileSync(ICON_FILE, JSON.stringify(iconCache)); } catch {}
    return url;
  })();
  iconInflight.set(k, job);
  try { return await job; } finally { iconInflight.delete(k); }
}
async function sgdbArt({ name, kind, gameId }) {
  if (!config.sgdbKey) throw new Error('Add a SteamGridDB API key in Settings → Look & feel first.');
  const games = await sgdbGames(name);
  const gid = gameId || games[0]?.id;
  if (!gid) return { games, gameId: null, images: [] };
  const ep = kind === 'grid' ? `/grids/game/${gid}?dimensions=600x900,342x482,660x930&types=static&nsfw=false&humor=false`
    : kind === 'hero' ? `/heroes/game/${gid}?types=static&nsfw=false&humor=false`
    : `/logos/game/${gid}?types=static&nsfw=false&humor=false`;
  const imgs = (await sgdb(ep)) || [];
  const sorted = kind === 'logo' ? [...imgs].sort((a, b) => logoRank(a) - logoRank(b) || (b.score || 0) - (a.score || 0)) : [...imgs].sort((a, b) => (b.score || 0) - (a.score || 0));
  return { games, gameId: gid, images: sorted.slice(0, 40).map((i) => ({ url: i.url, thumb: i.thumb || i.url, w: i.width, h: i.height, style: i.style })) };
}
async function setArt({ id, kind, url }) {
  const o = artOverrides[id] || (artOverrides[id] = {});
  if (url) o[kind] = url; else delete o[kind];
  if (!Object.keys(o).length) delete artOverrides[id];
  saveArt();
  if (kind === 'logo') delete logoCache[id];
  return artOverrides[id] || {};
}

// ---------------------------------------------------------------- downloads
const queue = []; // items
let nextId = 1;
let psbId = null;

function publicItem(it) {
  const { abort, ...rest } = it;
  return rest;
}
function emitQueue() { broadcast('downloads', queue.map(publicItem)); }
let emitTimer = null;
function emitQueueThrottled() {
  if (emitTimer) return;
  emitTimer = setTimeout(() => { emitTimer = null; emitQueue(); }, 250);
}

function updatePowerBlock() {
  const active = queue.some((q) => q.status === 'downloading' || q.status === 'queued');
  if (active && psbId === null) psbId = powerSaveBlocker.start('prevent-app-suspension');
  if (!active && psbId !== null) { powerSaveBlocker.stop(psbId); psbId = null; }
}

const DISC_EXT = new Set(['chd', 'cue', 'gdi', 'cdi', 'ccd', 'mds', 'iso', 'pbp', 'cso', 'rvz', 'wbfs']);
const DESCRIPTOR = new Set(['cue', 'gdi', 'ccd', 'mds']);

function enqueue(job) {
  const existing = queue.find((q) => q.romId === job.romId && ['queued', 'downloading'].includes(q.status));
  if (existing) return existing.id;
  for (let i = queue.length - 1; i >= 0; i--) if (queue[i].romId === job.romId) queue.splice(i, 1);
  const it = { id: nextId++, status: 'queued', received: 0, total: job.size || 0, speed: 0, error: null, addedAt: Date.now(), ...job };
  queue.push(it);
  emitQueue();
  pump();
  return it.id;
}

function pump() {
  const running = queue.filter((q) => q.status === 'downloading').length;
  const free = Math.max(1, config.downloads.concurrency || 1) - running;
  queue.filter((q) => q.status === 'queued').slice(0, Math.max(0, free)).forEach((it) => runJob(it));
  updatePowerBlock();
}

async function downloadTo(url, dest, it, onBytes) {
  const part = dest + '.part';
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  let start = 0;
  try { start = (await fsp.stat(part)).size; } catch {}
  const headers = authHeaders();
  delete headers.Accept;
  if (start > 0) headers.Range = `bytes=${start}-`;
  const r = await fetch(url, { headers, signal: it.abort.signal });
  if (r.status === 416) { start = 0; await fsp.rm(part, { force: true }); return downloadTo(url, dest, it, onBytes); }
  if (!r.ok) throw new Error(r.status === 404 ? 'File not found on server' : `HTTP ${r.status}`);
  const resumed = r.status === 206 && start > 0;
  if (resumed) onBytes(start);
  const ws = fs.createWriteStream(part, { flags: resumed ? 'a' : 'w' });
  const body = Readable.fromWeb(r.body);
  body.on('data', (chunk) => onBytes(chunk.length));
  await pipeline(body, ws);
  await fsp.rename(part, dest);
}

async function runJob(it) {
  it.status = 'downloading';
  it.abort = new AbortController();
  it.error = null;
  emitQueue();
  const base = await resolveBase();
  let lastT = Date.now(), lastB = 0;
  try {
    const rom = await api(`/api/roms/${it.romId}`);
    const target = platformPath({ slug: rom.platform_slug, fs_slug: rom.platform_fs_slug }).path;
    if (!target) throw new Error('No folder set for this platform. Set it in Settings.');
    await fsp.mkdir(target, { recursive: true });
    const files = (rom.files || []).slice().sort((a, b) => a.full_path.localeCompare(b.full_path));
    const romPrefix = rom.full_path + '/';
    it.total = files.reduce((s, f) => s + (f.file_size_bytes || 0), 0) || rom.fs_size_bytes || 0;
    it.received = 0;

    // Resume: count bytes of files already completed
    const onBytes = (n) => {
      it.received += n;
      const now = Date.now();
      if (now - lastT >= 1000) { it.speed = (it.received - lastB) / ((now - lastT) / 1000); lastT = now; lastB = it.received; }
      emitQueueThrottled();
    };

    let finalPath;
    const single = files.length <= 1 && (rom.has_simple_single_file || (config.downloads.flattenSingleFile && rom.has_nested_single_file) || files.length === 0);
    if (single) {
      const fname = files[0]?.file_name || rom.fs_name;
      finalPath = path.join(target, fname);
      const url = files[0]
        ? `${base}/api/roms/${files[0].id}/files/content/${encodeURIComponent(fname)}`
        : `${base}/api/roms/${rom.id}/content/${encodeURIComponent(fname)}`;
      try { await downloadTo(url, finalPath, it, onBytes); }
      catch (e) {
        if (!files[0] || !/not found|404/.test(e.message)) throw e;
        await downloadTo(`${base}/api/roms/${rom.id}/content/${encodeURIComponent(fname)}`, finalPath, it, onBytes);
      }
    } else {
      // Multi-file: mirror the server folder, one file at a time (resumable)
      const folder = path.join(target, rom.fs_name);
      for (const f of files) {
        if (it.abort.signal.aborted) throw new Error('aborted');
        const rel = f.full_path.startsWith(romPrefix) ? f.full_path.slice(romPrefix.length) : f.file_name;
        const dest = path.join(folder, rel);
        if (!dest.startsWith(folder)) throw new Error('Unsafe file path from server');
        const st = await fsp.stat(dest).catch(() => null);
        if (st && st.size === f.file_size_bytes) { onBytes(st.size); continue; }
        it.currentFile = rel;
        await downloadTo(`${base}/api/roms/${f.id}/files/content/${encodeURIComponent(f.file_name)}`, dest, it, onBytes);
      }
      it.currentFile = null;
      finalPath = folder;
      // Multi-disc: generate an .m3u if the server has none
      const exts = files.map((f) => (f.file_name.split('.').pop() || '').toLowerCase());
      const hasM3u = exts.includes('m3u');
      const hasDescriptor = exts.some((e) => DESCRIPTOR.has(e));
      const discs = files.filter((f) => {
        const e = (f.file_name.split('.').pop() || '').toLowerCase();
        if (e === 'm3u') return false;
        return hasDescriptor ? DESCRIPTOR.has(e) || e === 'chd' : DISC_EXT.has(e);
      });
      let m3uName = null;
      if (hasM3u) m3uName = files.find((f) => f.file_name.toLowerCase().endsWith('.m3u')).file_name;
      else if (discs.length >= 2) {
        m3uName = `${rom.fs_name}.m3u`;
        const lines = discs.map((f) => (f.full_path.startsWith(romPrefix) ? f.full_path.slice(romPrefix.length) : f.file_name));
        await fsp.writeFile(path.join(folder, m3uName), lines.join('\n') + '\n');
      }
      // ES-DE "directory as file": Game.m3u/ containing Game.m3u
      if (m3uName && config.downloads.esdeM3uFolders && !rom.fs_name.toLowerCase().endsWith('.m3u')) {
        const dirName = `${rom.fs_name}.m3u`;
        if (m3uName !== dirName) await fsp.rename(path.join(folder, m3uName), path.join(folder, dirName));
        const newFolder = path.join(target, dirName);
        await fsp.rm(newFolder, { recursive: true, force: true });
        await fsp.rename(folder, newFolder);
        finalPath = newFolder;
      }
    }
    it.status = 'done';
    it.received = it.total;
    it.path = finalPath;
    manifest[rom.id] = { path: finalPath, platformSlug: rom.platform_slug, name: rom.name || rom.fs_name, at: Date.now() };
    saveManifest();
    installedMap[rom.id] = finalPath;
    broadcast('installed-changed', { romId: rom.id, path: finalPath });
  } catch (e) {
    if (it.abort.signal.aborted) { it.status = it.status === 'paused' ? 'paused' : 'cancelled'; }
    else { it.status = 'error'; it.error = e.message; }
  }
  it.speed = 0;
  emitQueue();
  pump();
}

async function downloadBios(platformId, slug) {
  const list = await api('/api/firmware', { query: { platform_id: platformId } });
  const base = await resolveBase();
  let dir = config.biosPath;
  if (!dir) throw new Error('Set a BIOS folder in Settings first.');
  await fsp.mkdir(dir, { recursive: true });
  const done = [];
  for (const f of list) {
    const dest = path.join(dir, f.file_name);
    if (fs.existsSync(dest)) { done.push({ name: f.file_name, skipped: true }); continue; }
    const fake = { abort: new AbortController() };
    await downloadTo(`${base}/api/firmware/${f.id}/content/${encodeURIComponent(f.file_name)}`, dest, fake, () => {});
    done.push({ name: f.file_name });
  }
  return { count: list.length, files: done, dir };
}

// ---------------------------------------------------------------- self-update (GitHub Releases)
let updateState = { state: 'idle' };
let autoUpdater = null;
function setupUpdater() {
  if (!app.isPackaged || !process.env.APPIMAGE) return; // only the real AppImage can replace itself
  try { ({ autoUpdater } = require('electron-updater')); } catch { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  const set = (s) => { updateState = s; broadcast('update', { ...s, supported: true }); };
  autoUpdater.on('checking-for-update', () => set({ state: 'checking' }));
  autoUpdater.on('update-available', (i) => set({ state: 'downloading', version: i.version, percent: 0 }));
  autoUpdater.on('download-progress', (p) => set({ ...updateState, state: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-not-available', () => set({ state: 'current', version: app.getVersion() }));
  autoUpdater.on('update-downloaded', (i) => set({ state: 'ready', version: i.version }));
  autoUpdater.on('error', (e) => set({ state: 'error', error: String(e?.message || e).slice(0, 200) }));
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 8000);
  setInterval(check, 6 * 3600e3);
}

// ---------------------------------------------------------------- window + ipc
let win;

function broadcast(ch, data) { if (win && !win.isDestroyed()) win.webContents.send(ch, data); }

// Interface size. The UI is laid out for 1920x1080 (what the Ally shows in Game Mode). Bigger
// windows, like a 4K TV, zoom in by the same ratio so text and art keep their size on screen.
// Smaller windows (Steam Deck 1280x800) stay at 100%, which is what they were designed around.
function autoZoom() {
  if (!win || win.isDestroyed()) return 1;
  const [w, h] = win.getContentSize();
  const z = Math.min(w / 1920, h / 1080);
  return Math.max(1, Math.min(3, Math.round(z * 20) / 20));
}
function currentZoom() {
  const s = config.ui.scale;
  return !s || s === 'auto' ? autoZoom() : Math.max(0.75, Math.min(3, Number(s) || 1));
}
let zoomT = null;
function applyZoom() {
  if (!win || win.isDestroyed()) return;
  const z = currentZoom();
  if (Math.abs(win.webContents.getZoomFactor() - z) > 0.001) win.webContents.setZoomFactor(z);
}
function createWindow() {
  const fullscreen = isGamescope() || process.argv.includes('--fullscreen');
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    fullscreen,
    backgroundColor: '#0D1117',
    autoHideMenuBar: true,
    title: 'Cartridge',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  win.setMenuBarVisibility(false);
  if (process.env.VITE_DEV) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
  win.webContents.on('render-process-gone', (_e, d) => log('renderer gone', d.reason, d.exitCode));
  // CI launch check: exit 0 only if the UI actually rendered
  if (process.env.CARTRIDGE_SMOKE) {
    const fail = (why) => { console.error('SMOKE FAIL: ' + why); app.exit(1); };
    const t = setTimeout(() => fail('timeout'), 30000);
    win.webContents.on('render-process-gone', (_e, d) => fail('renderer ' + d.reason));
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      try {
        const text = await win.webContents.executeJavaScript('document.body.innerText');
        clearTimeout(t);
        if (/Cartridge/.test(text)) { console.log('SMOKE OK: ' + text.replace(/\s+/g, ' ').slice(0, 80)); app.exit(0); }
        else fail('empty UI');
      } catch (e) { fail(e.message); }
    }, 3000));
  }
  win.webContents.once('did-finish-load', () => log('ui loaded', Date.now() - startedAt + 'ms', 'window=' + win.getContentSize().join('x'), 'zoom=' + currentZoom()));
  win.webContents.on('did-finish-load', applyZoom);
  win.on('resize', () => { clearTimeout(zoomT); zoomT = setTimeout(applyZoom, 150); });
  win.on('enter-full-screen', () => setTimeout(applyZoom, 200));
  win.on('leave-full-screen', () => setTimeout(applyZoom, 200));
  win.webContents.on('did-fail-load', (_e, code, desc, url) => log('load failed', code, desc, url));
  win.webContents.on('console-message', (e) => { const m = e.message ?? e; if ((e.level === 'error' || e.level === 3) && typeof m === 'string') log('console', m.slice(0, 300)); });
  win.on('unresponsive', () => log('window unresponsive'));
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.type === 'keyDown' && input.key === 'F12') win.webContents.toggleDevTools();
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

const trophySvc = require('./trophyService')({
  USER_DATA, api, broadcast: (c, d) => broadcast(c, d), log, loadJson,
  getConfig: () => config, saveConfig: () => saveConfig(), getLibrary: () => library,
});
const handlers = {
  ...trophySvc.handlers,
  'config:get': () => config,
  'wallpaper:set': async ({ file }) => {
    const ext = path.extname(file || '').toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) throw new Error('Pick a PNG, JPG or WebP image');
    const st = await fsp.stat(file);
    if (st.size > 40 * 1024 * 1024) throw new Error('That image is too big (over 40 MB)');
    for (const f of fs.readdirSync(USER_DATA)) if (/^wallpaper\./.test(f)) try { fs.rmSync(path.join(USER_DATA, f)); } catch {}
    await fsp.copyFile(file, path.join(USER_DATA, 'wallpaper' + ext));
    config.ui.wallpaper = String(Date.now()); config.ui.bgStyle = 'wallpaper'; saveConfig();
    return config;
  },
  'wallpaper:clear': () => { for (const f of fs.readdirSync(USER_DATA)) if (/^wallpaper\./.test(f)) try { fs.rmSync(path.join(USER_DATA, f)); } catch {} config.ui.wallpaper = ''; saveConfig(); return config; },
  'clip:read': async () => String((await require('electron').clipboard.readText()) || '').trim().slice(0, 4000),
  'logo:get': (r) => logoFor(r),
  'ra:signin': async ({ user, key }) => {
    const p = await raApi('GetUserProfile', {}, { user: user.trim(), key: key.trim() });
    if (!p || !p.User) throw new Error('RetroAchievements did not recognise that account');
    config.ra = { user: p.User, key: key.trim() }; saveConfig(); raMem.clear();
    return { user: p.User };
  },
  'ra:signout': () => { config.ra = { user: '', key: '' }; saveConfig(); raMem.clear(); return true; },
  'ra:overview': (o) => raOverview(o),
  'ra:game': (o) => raGame(o),
  'ra:forRom': (o) => raForRom(o),
  'ra:supported': ({ slug, fs_slug }) => !!(RA_CONSOLES[slug] ?? RA_CONSOLES[fs_slug]),
  'syslogo:get': (p) => sysLogo(p),
  'icon:get': (p) => gameIcon(p),
  'logo:fetchAll': () => fetchAllLogos(),
  'logo:stopAll': () => { if (fetchAll) fetchAll.stop = true; return true; },
  'art:all': () => artOverrides,
  'art:search': (q) => sgdbArt(q),
  'art:set': (q) => setArt(q),
  'art:reset': ({ id }) => { delete artOverrides[id]; delete logoCache[id]; saveArt(); saveLogoCache(); return {}; },
  'logo:test': async ({ key }) => {
    const r = await fetch(SGDB_BASE() + '/search/autocomplete/zelda', { headers: { Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(12000) });
    return { ok: r.ok, status: r.status };
  },
  'config:set': (patch) => {
    config = deepMerge(config, patch); saveConfig();
    if (patch.server) activeBase = null;
    if (patch.ui && 'scale' in patch.ui) applyZoom();
    if ('sgdbKey' in patch) { for (const k of Object.keys(logoCache)) if (!logoCache[k].file) delete logoCache[k]; saveLogoCache(); }
    if ('romsRoot' in patch && library) { broadcast('library', publicLibrary()); computeInstalled(); }
    return config;
  },
  'config:setPath': ({ slug, path: p }) => {
    if (p) config.paths[slug] = p; else delete config.paths[slug];
    saveConfig();
    if (library) { broadcast('library', publicLibrary()); computeInstalled(); }
    return config;
  },
  'library:get': () => publicLibrary(),
  'library:reset': () => { library = null; installedMap = {}; try { fs.rmSync(LIBRARY_FILE); } catch {} broadcast('library', null); return true; },
  'library:sync': () => syncLibrary(),
  'library:scan': async () => { const stats = await scanServer(); const res = await syncLibrary(); return { stats, ...res }; },
  'installed:get': () => installedMap,
  'installed:rescan': () => computeInstalled(),
  'server:test': async (srv) => {
    const s = deepMerge(config.server, srv || {});
    const res = {};
    for (const key of ['localUrl', 'remoteUrl']) {
      const b = trimUrl(s[key]);
      if (!b) continue;
      const hb = await probe(b, s);
      if (hb.ok) {
        try { const me = await api('/api/users/me', { base: b, srv: s, retry: false }); hb.user = me.username; }
        catch (e) { hb.ok = false; hb.error = e.message; }
      }
      res[key] = hb;
    }
    return res;
  },
  'server:pair': async ({ base, code }) => {
    const b = trimUrl(base);
    const r = await fetch(`${b}/api/client-tokens/exchange`, {
      method: 'POST', headers: { ...authHeaders({ ...config.server, auth: 'none', username: '' }), 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }), signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(r.status === 404 ? 'Invalid or expired pairing code' : `Pairing failed (HTTP ${r.status})`);
    const j = await r.json();
    return j.raw_token;
  },
  'server:reconnect': async () => ({ base: await resolveBase(true) }),
  'server:status': async () => ({ base: await resolveBase(), route: activeBase === trimUrl(config.server.localUrl) ? 'local' : 'remote' }),
  'api:get': ({ path: p, query }) => api(p, { query }),
  'platforms:list': async () => {
    const list = await api('/api/platforms');
    return list.map((p) => ({ ...p, target: platformPath(p) }));
  },
  'platforms:supported': async () => {
    let list = [];
    try { list = await api('/api/platforms/supported'); } catch {}
    return list.map((p) => ({ ...p, target: platformPath(p) }));
  },
  'platforms:paths': (list) => Object.fromEntries(list.map((p) => [p.slug, platformPath(p)])),
  'roms:installed': ({ roms, platform }) => installedState(roms, platform),
  'roms:mark': ({ romId, on }) => {
    if (on) marks[romId] = { at: Date.now() }; else delete marks[romId];
    saveMarks();
    computeInstalled();
    return Object.keys(marks);
  },
  'roms:marks': () => Object.keys(marks),
  'roms:delete': async ({ romId, path: p }) => {
    let target = p || manifest[romId]?.path;
    // a hand-made mark has no files of its own: only remove the mark, never touch folders
    if (target === MARKED || (marks[romId] && !manifest[romId] && (!target || target === MARKED))) {
      delete marks[romId]; saveMarks(); computeInstalled(); return true;
    }
    if (!target) throw new Error('Nothing to delete');
    // never delete a whole console folder or the ROMs root
    const roots = new Set([config.romsRoot, ...(library?.platforms || []).map((pl) => platformPath(pl).path)].filter(Boolean).map((x) => path.resolve(x)));
    if (roots.has(path.resolve(target))) throw new Error('Refusing to delete a whole console folder');
    await fsp.rm(target, { recursive: true, force: true });
    delete manifest[romId];
    saveManifest();
    delete installedMap[romId];
    broadcast('installed-changed', { romId, path: null });
    return true;
  },
  'dl:add': (job) => enqueue(job),
  'dl:list': () => queue.map(publicItem),
  'dl:cancel': (id) => {
    const it = queue.find((q) => q.id === id);
    if (!it) return;
    if (it.status === 'downloading') { it.status = 'cancelled'; it.abort?.abort(); }
    else if (it.status === 'queued') it.status = 'cancelled';
    emitQueue(); pump();
  },
  'dl:retry': (id) => { const it = queue.find((q) => q.id === id); if (it) { it.status = 'queued'; it.error = null; emitQueue(); pump(); } },
  'dl:clear': () => { for (let i = queue.length - 1; i >= 0; i--) if (!['queued', 'downloading'].includes(queue[i].status)) queue.splice(i, 1); emitQueue(); },
  'bios:download': ({ platformId, slug }) => downloadBios(platformId, slug),
  'bios:list': ({ platformId }) => api('/api/firmware', { query: { platform_id: platformId } }),
  'fs:detect': () => detectRoots(),
  'fs:list': async (arg) => {
    const o = typeof arg === 'object' && arg ? arg : { dir: arg };
    const d = expandHome(o.dir || os.homedir());
    const entries = await fsp.readdir(d, { withFileTypes: true }).catch(() => []);
    const isD = (e) => e.isDirectory() || (e.isSymbolicLink() && isDir(path.join(d, e.name)));
    const dirs = entries.filter((e) => isD(e) && (o.hidden ? !['.', '..', '.cache', '.Trash-1000'].includes(e.name) : !e.name.startsWith('.'))).map((e) => e.name).sort((a, b) => a.localeCompare(b));
    const exts = Array.isArray(o.files) ? o.files.map((x) => '.' + String(x).toLowerCase()) : null;
    const files = exts ? entries.filter((e) => !isD(e) && !e.name.startsWith('.') && exts.includes(path.extname(e.name).toLowerCase())).map((e) => e.name).sort((a, b) => a.localeCompare(b)) : undefined;
    return { path: path.resolve(d), parent: path.dirname(path.resolve(d)), dirs, files };
  },
  'fs:mkdir': async (dir) => { await fsp.mkdir(dir, { recursive: true }); return true; },
  'fs:space': async (dir) => {
    let d = dir;
    while (d && !isDir(d)) { const up = path.dirname(d); if (up === d) break; d = up; }
    try { const s = await fsp.statfs(d || '/'); return { free: s.bavail * s.bsize, total: s.blocks * s.bsize }; } catch { return null; }
  },
  'fs:places': (o) => {
    const u = os.userInfo().username;
    const extra = o?.hidden ? [{ label: 'Flatpak apps', path: path.join(os.homedir(), '.var', 'app') }, { label: '.config', path: path.join(os.homedir(), '.config') }, { label: '.local/share', path: path.join(os.homedir(), '.local', 'share') }] : [];
    return [
      { label: 'Home', path: os.homedir() },
      ...extra,
      { label: 'External drives', path: isDir(`/run/media/${u}`) ? `/run/media/${u}` : '/run/media' },
      { label: 'Emulation (home)', path: path.join(os.homedir(), 'Emulation') },
      { label: 'Root', path: '/' },
    ].filter((p) => isDir(p.path));
  },
  'steam:add': async ({ restartSteam } = {}) => {
    if (isGamescope()) throw new Error('Switch to Desktop Mode to add Cartridge to Steam (Steam has to restart).');
    if (!process.env.APPIMAGE) throw new Error('This only works from the AppImage build.');
    const launcher = writeSteamLauncher();
    const r = await require('./steamArt').addToSteam({ exe: launcher, artDir: path.join(__dirname, '../steam-art'), restartSteam });
    log('steam add', JSON.stringify(r));
    return r;
  },
  'steam:status': () => ({ running: require('./steamArt').steamRunning(), gamescope: isGamescope(), appimage: !!process.env.APPIMAGE }),
  'steam:applyArt': () => {
    const res = require('./steamArt').applySteamArt(path.join(__dirname, '../steam-art'));
    if (!res.length) throw new Error('Add Cartridge to Steam first (Add a Non-Steam Game), then try again.');
    return res;
  },
  'update:get': () => ({ ...updateState, current: app.getVersion(), supported: !!autoUpdater }),
  'update:check': async () => { if (!autoUpdater) throw new Error('Updates work in the AppImage build only'); await autoUpdater.checkForUpdates(); return updateState; },
  'update:install': () => { if (updateState.state === 'ready') autoUpdater.quitAndInstall(true, true); },
  'app:info': () => ({ version: app.getVersion(), gamescope: isGamescope(), userData: USER_DATA, gpu: useGpu, home: os.homedir(), hostname: os.hostname() }),
  'app:scale': () => { const [w, h] = win.getContentSize(); return { auto: autoZoom(), current: currentZoom(), w, h, display }; },
  'app:quit': () => app.quit(),
  'app:screenshot': async () => {
    const dir = path.join(app.getPath('pictures'), 'Cartridge');
    await fsp.mkdir(dir, { recursive: true });
    const imgShot = await win.webContents.capturePage();
    const file = path.join(dir, `cartridge-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.png`);
    await fsp.writeFile(file, imgShot.toPNG());
    return file;
  },
  'app:relaunch': () => relaunch(),
  'app:graphics': () => ({ mode: useGpu ? 'hardware' : 'software', setting: config.graphics, status: app.getGPUFeatureStatus?.() }),
  'app:fullscreen': () => win.setFullScreen(!win.isFullScreen()),
  'app:clearCache': async () => { await fsp.rm(IMG_CACHE, { recursive: true, force: true }); return true; },
};

for (const [ch, fn] of Object.entries(handlers)) {
  ipcMain.handle(ch, async (_e, arg) => {
    try { return { ok: true, data: await fn(arg) }; }
    catch (e) { return { ok: false, error: e.message || String(e) }; }
  });
}

app.whenReady().then(() => {
  protocol.handle('romimg', handleImage);
  createWindow();
  if (library) computeInstalled();
  win.webContents.once('did-finish-load', () => {
    if (config.configured && (config.sync.onLaunch || !library)) syncLibrary().catch(() => {});
    setTimeout(() => trophySvc.start().catch((e) => log('trophies failed', e.message)), 1500);
  });
  setInterval(() => {
    const every = (config.sync.everyMinutes || 0) * 60e3;
    if (config.configured && every && library && Date.now() - library.syncedAt > every) syncLibrary().catch(() => {});
  }, 60e3);
  win.on('focus', () => { if (library) computeInstalled(); });
  setupUpdater();
  // Safety net if the display could not be read up front: a big window drawn in software is
  // unusably slow, so restart once with the GPU. A user or crash-chosen "software" is respected.
  setTimeout(() => {
    if (useGpu || config.graphics === 'software' || process.env.CARTRIDGE_BIG === '1' || process.argv.includes('--disable-gpu')) return;
    const [w, h] = win.getContentSize();
    if (w >= 2500 || h >= 1400) { log('big window in software mode', w + 'x' + h, 'restarting with the GPU'); process.env.CARTRIDGE_BIG = '1'; relaunch(); }
  }, 2500);
});
app.on('child-process-gone', (_e, d) => {
  log('child gone', d.type, d.reason, d.exitCode);
  // If the GPU dies early, remember it and restart without the GPU so the window is never blank
  if (d.type === 'GPU' && useGpu && d.reason !== 'clean-exit' && Date.now() - startedAt < 20000) {
    config.graphics = 'software';
    try { saveConfig(); } catch {}
    log('gpu failed at startup, relaunching in software mode');
    relaunch();
  }
});
app.on('window-all-closed', () => app.quit());
