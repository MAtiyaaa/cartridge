import { reactive, markRaw } from 'vue';
import { romimg, IS_ANDROID, IS_REMOTE } from './platform.js';

const rd = window.cart;
export const call = (ch, arg) => rd.call(ch, arg ? JSON.parse(JSON.stringify(arg)) : arg);

export const store = reactive({
  config: null,
  info: {},
  connection: { base: '', route: '' },
  lib: null, // markRaw({ platforms, roms: {pid: []}, firstSeen, syncedAt, lastNew })
  libVersion: 0,
  installed: {},
  sync: { state: 'idle' },
  downloads: [],
  fuseUploads: [], // games Fuse handed over to upload to RomM (electron/fuseUpload.js), newest first
  fuseUpload: null, // the request of the last cartridge://upload link, until its page reads it
  bg: '',
  route: { name: 'home', params: {} },
  history: [],
  hints: [],
  viewHandlers: {},
  toasts: [],
  modal: null,
  quickMenu: false,
  battery: null, // { level, charging, toFull, toEmpty } from the WebView (App.vue), null on desktops
  lastSearch: '',
  logos: {},
  art: {},
  logoJob: null,
  manualSync: false,
  update: { state: 'idle' },
  achTab: 'all', // Achievements tab: 'all' | 'ra' | 'others'
  trophyVer: 0, // bumps whenever emulator trophies change
  iconVer: 0, // bumps when a game icon is changed or reset
  trophySync: { state: 'idle' },
  trophyScan: null,
  pops: [], // "Trophy unlocked" pop-ups
  play: {}, // romId -> { min, last, src }: play time from Steam and RetroArch (0.8)
  issues: 0, // things waiting in Settings → Emulators → Issues (0.9.3)
  homeLists: {}, // a Home row opened with Show all (0.9.3)
  settingsSpot: null, // the Settings row a sub-screen was opened from (0.9.3 L)
  sharp: {}, // rom id -> sharp SteamGridDB background url (0.9.3 K)
  deleting: {}, // romId -> percent deleted, while a game is being deleted (0.9.3)
});

// ---------------- play time (Steam's own numbers for games in Steam, plus RetroArch's logs)
export async function loadPlay() { try { store.play = (await call('play:stats')) || {}; } catch {} }
export const playOf = (id) => store.play[id] || null;
export function playtimeText(min) {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return `${h < 10 ? Math.round(h * 10) / 10 : Math.round(h)} h`;
}

// ---------------- routing
export function go(name, params = {}) {
  // leaving Settings for one of its screens: remember the row (Settings puts focus back on it, 0.9.3 L)
  const el = document.activeElement;
  if (store.route.name === 'settings' && el?.closest?.('.pane')) store.settingsSpot = { sec: store.settingsSection, text: (el.textContent || '').trim().slice(0, 60) };
  store.history.push({ ...store.route, focusKey: document.activeElement?.dataset?.key || null });
  store.route = { name, params };
}
export function back() {
  if (!store.history.length) return false;
  store.route = store.history.pop();
  return true;
}
export function tab(name) {
  store.history = [];
  store.route = { name, params: {} };
}
// Back with nowhere left to go. Android sets it when Fuse opened Cartridge (src/android/fuse.js).
let onRootBack = null;
export function setRootBack(fn) { onRootBack = fn; }
export function rootBack() { return onRootBack ? onRootBack() : false; }

// ---------------- toasts
let tid = 1;
export function toast(msg, kind = 'info', ms = 3400, icon) {
  const t = { id: tid++, msg, kind, icon: icon || { ok: 'mdiCheck', error: 'mdiAlertCircleOutline', info: 'mdiInformationVariant' }[kind] };
  store.toasts.push(t);
  if (store.toasts.length > 4) store.toasts.shift();
  setTimeout(() => { const i = store.toasts.indexOf(t); if (i >= 0) store.toasts.splice(i, 1); }, ms);
}

// ---------------- modals
export function openModal(type, props = {}) {
  return new Promise((resolve) => { store.modal = { type, props, resolve }; });
}
export function closeModal(value) {
  const m = store.modal;
  store.modal = null;
  m?.resolve(value);
}
export const askText = (props) => openModal('keyboard', props);
// Built-in on-screen keyboard: always, never (Steam keyboard), or Auto = in Game Mode only
export function builtinKb() {
  const k = store.config?.ui?.keyboard || 'auto';
  // Android: the system keyboard would grab the D-pad, so Auto uses the built-in one there too
  return k === 'builtin' || (k === 'auto' && (!!store.info?.gamescope || IS_ANDROID));
}
export const pickFolder = (props) => openModal('folder', props);
// Title Case for menu items (0.9.3 L, owner): words that are plain lower-case letters get a capital,
// except small joining words in the middle. Names, file names, paths and anything with digits or
// punctuation inside a word are left as they are.
const SMALL = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with', 'as', 'via', 'per', 'vs']);
export function titleCase(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/(^|[\s(“"])([a-z]+)(?=$|[\s,.:;!?)”"…])/g, (m, pre, w, off) => (off > 0 && SMALL.has(w) ? m : pre + w[0].toUpperCase() + w.slice(1)));
}
export const choose = (props) => openModal('menu', props);
export const confirm = (title, message, okLabel = 'Confirm', danger = false) =>
  openModal('menu', { title, message, options: [{ label: okLabel, value: true, danger, icon: danger ? 'mdiAlertOutline' : 'mdiCheck' }, { label: 'Cancel', value: false, icon: 'mdiClose' }] });

// ---------------- config
export async function loadConfig() {
  store.config = await call('config:get');
  store.info = await call('app:info');
  // 0.6.4 to 0.6.5 kept the button icon choice in ui.prompts; ui.buttons (abdu2304's) replaced it
  const old = store.config?.ui?.prompts;
  if (old && !store.config.ui.buttons && !IS_REMOTE) {
    const buttons = { xbox: 'xbox', ps: 'playstation', nintendo: 'nintendo', steamdeck: 'steam' }[old] || 'auto';
    saveConfig({ ui: { buttons, prompts: '' } }).catch(() => {});
  }
}
export async function saveConfig(patch) {
  store.config = await call('config:set', patch);
}

// ---------------- library
let romIndex = new Map();
function setLib(lib) {
  if (!lib) { store.lib = null; romIndex = new Map(); store.libVersion++; return; }
  romIndex = new Map();
  for (const list of Object.values(lib.roms)) for (const r of list) romIndex.set(r.id, r);
  lib.platforms.sort((a, b) => a.display_name.localeCompare(b.display_name));
  store.lib = markRaw(lib);
  store.libVersion++;
}
export async function loadLibrary() {
  setLib(await call('library:get'));
  store.installed = await call('installed:get');
}
export const romById = (id) => (store.libVersion, romIndex.get(Number(id)));
export const platformById = (id) => (store.libVersion, store.lib?.platforms.find((p) => p.id === Number(id)));
// A console's name as your RomM server has it now (renamed consoles show their new name everywhere,
// 0.9.3 L): from the game's console when the game is in the library, else by slug, else the fallback
const SRC_SLUG = { rpcs3: ['ps3'], shadps4: ['ps4'], xenia: ['xbox360'], vita3k: ['psvita', 'vita'] };
export function consoleName({ romId, slug, src, fallback = '' } = {}) {
  const r = romId ? romById(romId) : null;
  const p = r ? platformById(r.platform_id) : null;
  if (p) return p.display_name || p.name || fallback;
  const slugs = slug ? [slug] : SRC_SLUG[src] || [];
  const q = slugs.length && store.lib?.platforms.find((x) => slugs.includes(x.slug) || slugs.includes(x.fs_slug));
  return (q && (q.display_name || q.name)) || r?.platform_display_name || fallback;
}
export function visiblePlatforms() {
  if (!store.lib) return [];
  return store.lib.platforms.filter((p) => !store.config.ui.hideEmpty || p.rom_count > 0);
}
export function romsOf(pid) { return (store.libVersion, store.lib?.roms[pid] || []); }
export function allRoms() { return (store.libVersion, [...romIndex.values()]); }
const NEW_WINDOW = 5 * 24 * 3600e3;
export function isNew(rom) {
  const t = store.lib?.firstSeen?.[rom.id];
  return !!t && t > 1 && Date.now() - t < NEW_WINDOW;
}

export async function resync() {
  store.manualSync = true;
  try { return await call('library:sync'); }
  catch (e) { toast(e.message, 'error'); return null; }
}
// one Refresh Library: RomM scans for new files when allowed, then a resync
export async function refreshLibrary() {
  store.manualSync = true;
  try { return await call('library:refresh'); }
  catch (e) { toast(e.message, 'error', 6000); return null; }
}
export async function scanServer() {
  toast('Asking RomM to scan for new files…', 'info', 3000, 'mdiRadar');
  try {
    store.manualSync = true;
    await call('library:scan');
  } catch (e) { toast(e.message, 'error', 6000); }
}

// ---------------- images / backgrounds
export function img(p) {
  if (!p) return '';
  return romimg('u=' + encodeURIComponent(p));
}
export function cover(rom, large = false) {
  const o = store.art?.[rom.id]?.grid;
  if (o) return img(o);
  let p = (large ? rom.path_cover_large || rom.path_cover_small : rom.path_cover_small || rom.path_cover_large) || rom.url_cover;
  if (/^[a-z-]*file:\/\//i.test(p || '')) p = ''; // a gamelist.xml cover RomM never copied: only RomM can read it
  // with a SteamGridDB key, main.js fills in a cover when RomM has none (or answers without one)
  const sg = store.config?.sgdbKey && rom.id ? `g=${encodeURIComponent(rom.id)}&n=${encodeURIComponent(rom.name || '')}` : '';
  if (!p) return sg ? romimg(sg) : '';
  return romimg('u=' + encodeURIComponent(p) + (sg ? '&' + sg : ''));
}
// Sharp backgrounds (0.9.3 K, F2/F3): SteamGridDB's biggest hero for a game, asked for once it has
// been highlighted for a moment (main.js sharpHero caches it). undefined: not asked yet, null: none.
const sharpWait = new Set();
let sharpT = 0;
export function wantSharp(rom) {
  if (!rom || !store.config?.sgdbKey || rom.id in store.sharp || sharpWait.has(rom.id)) return;
  clearTimeout(sharpT);
  sharpT = setTimeout(async () => {
    sharpWait.add(rom.id);
    try { store.sharp[rom.id] = await call('art:sharpHero', { id: rom.id, name: rom.name }); } catch { /* offline: ask again later */ }
    sharpWait.delete(rom.id);
  }, 350);
}
export function backdropOf(rom) {
  if (!rom) return '';
  const h = store.art?.[rom.id]?.hero;
  if (h) return { src: img(h), blur: false };
  if (store.sharp[rom.id]) return { src: store.sharp[rom.id], blur: false };
  if (rom.shot) return { src: img(rom.shot), blur: false };
  const c = cover(rom, true);
  return c ? { src: c, blur: true } : '';
}
let bgTimer;
export function setBg(b) {
  clearTimeout(bgTimer);
  bgTimer = setTimeout(() => { store.bg = b || ''; }, 40);
}

// ---------------- downloads
export function downloadFor(romId) {
  for (let i = store.downloads.length - 1; i >= 0; i--) if (store.downloads[i].romId === romId) return store.downloads[i];
  return null;
}
export async function download(rom, { checkSpace = true } = {}) {
  const p = platformById(rom.platform_id);
  if (p && !p.target?.path) { toast(`Set a folder for ${p.display_name} first`, 'error'); return false; }
  if (checkSpace && p?.target?.path && rom.fs_size_bytes && !(await roomFor(rom, p))) return false;
  await call('dl:add', { romId: rom.id, name: rom.name, platformSlug: rom.platform_slug, platformName: rom.platform_display_name, size: rom.fs_size_bytes, cover: rom.path_cover_small || rom.url_cover });
  toast(`Downloading ${rom.name}`, 'info', 2000, 'mdiDownload');
  return true;
}

// Before a download: will it fit? Counts what is still downloading to the same folder too.
async function roomFor(rom, p) {
  const sp = await call('fs:space', p.target.path).catch(() => null);
  if (!sp) return true;
  const same = (d) => ['queued', 'downloading'].includes(d.status) && store.lib?.platforms.find((x) => x.slug === d.platformSlug)?.target?.path === p.target.path;
  const pending = store.downloads.filter(same).reduce((s, d) => s + Math.max(0, (d.total || 0) - (d.received || 0)), 0);
  // PS4/PS5 zips are unpacked next to the zip before it is deleted: room for both
  const unpack = ['ps4', 'ps5'].some((x) => [rom.platform_slug, rom.platform_fs_slug].includes(x)) && /\.zip$/i.test(rom.fs_name || '');
  const need = rom.fs_size_bytes * (unpack ? 2 : 1);
  if (need + pending <= sp.free) return true;
  const v = await choose({
    title: `Not enough space for ${rom.name}`,
    message: `It needs ${bytes(need)}${unpack ? ' (the zip, and room to unpack it)' : ''}${pending ? `, plus ${bytes(pending)} still downloading there` : ''}. That drive has ${bytes(sp.free)} free.`,
    options: [
      { label: 'Free up space', sub: 'Open the storage manager', value: 'storage', icon: 'mdiHarddisk' },
      { label: 'Download anyway', value: 'go', icon: 'mdiDownload' },
      { label: 'Cancel', value: null, icon: 'mdiClose' },
    ],
  });
  if (v === 'storage') { store.settingsSection = 'storage'; tab('settings'); }
  return v === 'go';
}

// ---------------- formatting
// Time left: one download (its own speed) or the whole queue (everything still to fetch at the combined speed)
export function duration(sec) {
  if (!isFinite(sec) || sec <= 0) return '';
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
}
export function queueLeft(list = store.downloads) {
  const active = (list || []).filter((d) => d.status === 'downloading' || d.status === 'queued');
  const left = active.reduce((n, d) => n + Math.max(0, (d.total || 0) - (d.received || 0)), 0);
  const speed = active.reduce((n, d) => n + (d.status === 'downloading' ? d.speed || 0 : 0), 0);
  return { count: active.length, left, speed, time: speed ? duration(left / speed) : '' };
}
export function itemLeft(d) { return d?.speed && d.total ? duration((d.total - (d.received || 0)) / d.speed) : ''; }

export function bytes(n) {
  if (!n && n !== 0) return '';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
}
export function year(ts) {
  if (!ts) return '';
  const d = new Date(ts > 1e11 ? ts : ts * 1000);
  return isNaN(d) ? '' : String(d.getFullYear());
}
export function ago(ts) {
  if (!ts) return 'never';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
export function rating(r) { return r ? (r <= 10 ? `${r.toFixed(1)}` : `${Math.round(r)}%`) : ''; }

// ---------------- live events
rd.on('downloads', (list) => { store.downloads = list; });
rd.on('logos-progress', (p) => {
  store.logoJob = p.state === 'running' ? p : null;
  if (p.state === 'done') { resetLogos(); toast(`Logos ready: ${p.found} of ${p.total} games have one`, 'ok', 4000, 'mdiCheck'); }
  if (p.state === 'stopped') { resetLogos(); toast(`Stopped · ${p.found} logos fetched`, 'info', 3000); }
  if (p.state === 'error') toast('SteamGridDB rejected the API key', 'error', 4000);
});
rd.on('connection', (c) => { store.connection = c; });
rd.on('trophies', () => { store.trophyVer++; });
rd.on('trophies-sync', (s) => { store.trophySync = s; });
rd.on('trophies-scan', (s) => { store.trophyScan = s.state === 'running' ? s : null; });
let popId = 1;
rd.on('trophy-unlocked', (t) => {
  const p = { ...t, id: popId++ };
  store.pops.push(p);
  if (store.pops.length > 3) store.pops.shift();
  setTimeout(() => { const i = store.pops.indexOf(p); if (i >= 0) store.pops.splice(i, 1); }, 6500);
});
export const iconKey = (romId, title) => (romId ? 'rom-' + romId : 'tro-' + title);
export function iconChanged(key) { globalThis.__gameIcons?.delete(key); store.iconVer++; }
export const GRADE = { P: 'Platinum', G: 'Gold', S: 'Silver', B: 'Bronze' };
export function when(ms) {
  if (!ms) return '';
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} d ago`;
  return new Date(ms).toLocaleDateString();
}
rd.on('library', (lib) => setLib(lib));
let playT = 0;
rd.on('installed', (m) => { store.installed = m; clearTimeout(playT); playT = setTimeout(loadPlay, 800); }); // RetroArch times match installed files
rd.on('sync', (s) => { store.sync = s; });
// the ring stays a moment at 100% so the end is seen, then the card updates
rd.on('delete-progress', ({ romId, pct }) => {
  store.deleting = { ...store.deleting, [romId]: pct };
  if (pct >= 100) setTimeout(() => { const d = { ...store.deleting }; delete d[romId]; store.deleting = d; }, 600);
});
rd.on('update', (u) => {
  if (u.state === 'ready' && store.update.state !== 'ready') toast(`Cartridge ${u.version} is ready. Restart from the Quick Menu to update.`, 'ok', 6000, 'mdiUpdate');
  store.update = u;
});
call('update:get').then((u) => { store.update = u; }).catch(() => {});
rd.on('installed-changed', ({ romId, path }) => {
  if (path) store.installed[romId] = path;
  else delete store.installed[romId];
});
call('dl:list').then((l) => { store.downloads = l; }).catch(() => {});
rd.on('fuse-uploads', (list) => { store.fuseUploads = list; });
call('fuse:upload:list').then((l) => { store.fuseUploads = l; }).catch(() => {});

// ---------------- collections
// RomM's collections (yours and smart ones), plus ones Cartridge makes from the library: series,
// top rated, hidden gems, couch multiplayer and short games. All share one shape:
// { id, name, rom_ids, auto?, mine?, rid? } so tiles, grids and LB/RB treat them the same.
export const visible = (r) => !r.user?.hidden; // games you hid in RomM stay out of lists
export const score = (r) => (r.rating ? (r.rating <= 10 ? r.rating * 10 : r.rating) : 0);
const AUTO = [
  { id: 'auto-top', name: 'Top rated', icon: 'mdiStarOutline', description: 'Your best-rated games', pick: (rs) => rs.filter((r) => score(r) >= 80).sort((a, b) => score(b) - score(a)).slice(0, 80) },
  { id: 'auto-gems', name: 'Hidden gems', icon: 'mdiDiamondStone', description: 'Rated highly by few people', pick: (rs) => rs.filter((r) => score(r) >= 75 && r.votes > 0 && r.votes < 60).sort((a, b) => score(b) - score(a)).slice(0, 80) },
  { id: 'auto-couch', name: 'Couch multiplayer', icon: 'mdiAccountGroupOutline', description: 'Local multiplayer and co-op', pick: (rs) => rs.filter((r) => (r.modes || []).some((m) => /split screen|co-operative|^multiplayer$/i.test(m))) },
  { id: 'auto-short', name: 'Short games', icon: 'mdiTimerSandComplete', description: 'Beatable in under 5 hours', pick: (rs) => rs.filter((r) => r.hours && r.hours <= 5).sort((a, b) => a.hours - b.hours) },
];
let autoCache = { v: -1, list: [] };
function autoCollections() {
  if (autoCache.v === store.libVersion) return autoCache.list;
  const rs = allRoms().filter(visible);
  const list = AUTO.map((a) => ({ id: a.id, name: a.name, icon: a.icon, description: a.description, auto: true, rom_ids: a.pick(rs).map((r) => r.id) })).filter((c) => c.rom_ids.length);
  // Series: RomM's franchise data, any series with at least two games. Near-identical names are one
  // series ("Mario" and "Mario Bros.", "Ratchet & Clank" and "Ratchet & Clank Future"): a name whose
  // words include a shorter series' words joins it. A game is in each series once.
  const STOP = new Set(['the', 'series', 'bros', 'brothers', 'super', 'of', 'and', 'a']);
  const words = (n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter((w) => w && !STOP.has(w));
  const names = [...new Set(rs.flatMap((r) => r.series || []))].sort((a, b) => words(a).length - words(b).length || a.length - b.length);
  const groups = []; // { name, words, ids: Set }
  const groupOf = new Map();
  for (const n of names) {
    const w = words(n);
    const g = w.length && groups.find((x) => x.words.every((y) => w.includes(y)));
    if (g) groupOf.set(n, g);
    else { const ng = { name: n, words: w, roms: new Map() }; groups.push(ng); groupOf.set(n, ng); }
  }
  for (const r of rs) for (const f of r.series || []) groupOf.get(f)?.roms.set(r.id, r);
  const series = groups.filter((g) => g.roms.size >= 2).sort((a, b) => b.roms.size - a.roms.size || a.name.localeCompare(b.name))
    .map((g) => ({ id: 'series-' + g.name, name: g.name, icon: 'mdiBookshelf', auto: true, series: true, description: 'Series', rom_ids: [...g.roms.values()].sort((a, b) => (a.year || 9e15) - (b.year || 9e15)).map((r) => r.id) }));
  autoCache = { v: store.libVersion, list: [...list, ...series] };
  return autoCache.list;
}
export function collections() { return (store.libVersion, store.lib?.collections || []); }
export function allCollections() { return [...collections(), ...autoCollections()]; }
export const autoLists = () => autoCollections().filter((c) => !c.series);
export const seriesLists = () => autoCollections().filter((c) => c.series);
export function collectionById(id) { return store.homeLists?.[id] || allCollections().find((c) => c.id === id) || genres().find((g) => g.id === id); } // a genre is a list of games too (the second screen shows it like one)
export function romsOfCollection(id) {
  const c = collectionById(id);
  // each game once, even if the collection lists it twice
  return c ? [...new Set(c.rom_ids)].map((rid) => romIndex.get(rid)).filter((r) => r && visible(r)) : [];
}
export const myCollections = () => collections().filter((c) => c.mine && !c.smart);
export const favourites = () => collections().find((c) => c.favorite && c.mine && !c.smart) || null;
export const isFavourite = (id) => !!favourites()?.rom_ids.includes(id);

// Add games to one of your collections (or a new one), from a game page or a multi-selection
export async function addToCollection(romIds) {
  const mine = myCollections().filter((c) => !c.favorite);
  const v = await choose({
    title: romIds.length > 1 ? `Add ${romIds.length} games to a collection` : 'Add to a collection',
    options: [...mine.map((c) => ({ label: c.name, sub: `${c.rom_ids.length}`, value: c.rid, icon: 'mdiBookmarkOutline', selected: romIds.length === 1 && c.rom_ids.includes(romIds[0]) })),
      { label: 'New collection…', value: '__new', icon: 'mdiPlus' }],
  });
  if (v == null) return false;
  try {
    if (v === '__new') {
      const name = await askText({ title: 'Name the new collection', placeholder: 'Weekend games' });
      if (!name || !name.trim()) return false;
      await call('col:create', { name: name.trim(), romIds });
      toast(`Added to ${name.trim()}`, 'ok', 2400, 'mdiBookmarkOutline');
    } else {
      const c = mine.find((x) => x.rid === v);
      // one game already in that collection: picking it again takes it out
      if (romIds.length === 1 && c?.rom_ids.includes(romIds[0])) {
        await call('col:remove', { rid: v, romIds });
        toast(`Removed from ${c.name}`, 'ok', 2400, 'mdiBookmarkRemoveOutline');
      } else {
        await call('col:add', { rid: v, romIds });
        toast(`Added to ${c?.name || 'the collection'}`, 'ok', 2400, 'mdiBookmarkOutline');
      }
    }
    return true;
  } catch (e) { toast(e.message, 'error', 6000); return false; }
}

// ---------------- top bar tabs (Look & Feel → Top bar)
export const TAB_DEFS = {
  home: { label: 'Home', icon: 'mdiHomeVariantOutline' },
  library: { label: 'Library', icon: 'mdiViewGridOutline' },
  consoles: { label: 'Consoles', icon: 'mdiGamepadSquareOutline' },
  genres: { label: 'Genres', icon: 'mdiTagMultipleOutline' },
  collections: { label: 'Collections', icon: 'mdiBookmarkMultipleOutline' },
  achievements: { label: 'Achievements', icon: 'mdiTrophyOutline' },
  downloads: { label: 'Downloads', icon: 'mdiTrayArrowDown' },
  settings: { label: 'Settings', icon: 'mdiCogOutline' },
};
export const DEFAULT_TABS = ['home', 'library', 'consoles', 'achievements', 'downloads', 'settings'];
// Settings can't be removed, so the top bar can always be changed back
export function activeTabs() {
  const t = store.config?.ui?.tabs;
  const list = (Array.isArray(t) && t.length ? t : DEFAULT_TABS).filter((n) => TAB_DEFS[n]);
  return list.includes('settings') ? list : [...list, 'settings'];
}

// ---------------- genres
let genreCache = { v: -1, list: [] };
export function genres() {
  if (genreCache.v === store.libVersion) return genreCache.list;
  const by = new Map();
  for (const r of allRoms()) if (visible(r)) for (const g of r.genres || []) (by.get(g) || by.set(g, []).get(g)).push(r.id);
  genreCache = { v: store.libVersion, list: [...by].sort((a, b) => b[1].length - a[1].length).map(([name, ids]) => ({ id: 'genre-' + name, name, genre: true, icon: 'mdiTagOutline', rom_ids: ids })) };
  return genreCache.list;
}
export const romsOfGenre = (g) => (genres().find((x) => x.name === g)?.rom_ids || []).map((id) => romIndex.get(id)).filter(Boolean);

// Game logo, prepared by the main process: { url, w, h, dark } or null.
// Order: a logo picked in "Change artwork", RomM's own logo, then SteamGridDB (when a key is set).
const logoAsked = new Set();
function rommLogo(rom) {
  if (rom.logo) return rom.logo;
  const p = rom.ss_metadata?.logo_path || rom.gamelist_metadata?.marquee_path;
  return p ? (p.startsWith('/') ? p : '/assets/romm/resources/' + p) : '';
}
export function logoOf(rom) {
  if (!rom || !rom.id) return null;
  const got = store.logos[rom.id];
  if (got !== undefined) return got;
  if (!logoAsked.has(rom.id)) {
    logoAsked.add(rom.id);
    queueMicrotask(() => call('logo:get', { id: rom.id, name: rom.name, romm: rommLogo(rom) }).then((u) => { store.logos[rom.id] = u || null; }).catch(() => { store.logos[rom.id] = null; }));
  }
  return null;
}
export function resetLogos(id) {
  if (id != null) { logoAsked.delete(id); delete store.logos[id]; return; }
  logoAsked.clear(); for (const k of Object.keys(store.logos)) delete store.logos[k];
}

// ---------------- custom artwork (Change artwork on a game page)
export async function loadArt() { store.art = await call('art:all').catch(() => ({})) || {}; }
export function artFor(id) { return store.art?.[id] || {}; }
