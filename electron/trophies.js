// Trophies and achievements from emulators that keep them as local files:
//   RPCS3 (PS3), shadPS4 (PS4), Xenia (Xbox 360), Vita3K (PS Vita).
// Everything here is read-only: emulator files are never modified.
// File formats follow each emulator's own source code:
//   RPCS3   rpcs3/Loader/TROPUSR.h      (TROPUSR.DAT, big-endian, magic 0x818F54AD)
//   Vita3K  vita3k/np/src/trophy/context.cpp (TROPUSR.DAT, little-endian, magic 0x12D5819A)
//   shadPS4 src/core/libraries/np/np_trophy.cpp (trophy XML with unlockstate + timestamp)
//   Xenia   src/xenia/kernel/xam/xdbf (GPD files in the XDBF format)
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const SOURCES = {
  rpcs3: { id: 'rpcs3', name: 'RPCS3', platform: 'PlayStation 3', short: 'PS3', slugs: ['ps3'], kind: 'trophy' },
  shadps4: { id: 'shadps4', name: 'shadPS4', platform: 'PlayStation 4', short: 'PS4', slugs: ['ps4'], kind: 'trophy' },
  xenia: { id: 'xenia', name: 'Xenia', platform: 'Xbox 360', short: 'X360', slugs: ['xbox360'], kind: 'gamerscore' },
  vita3k: { id: 'vita3k', name: 'Vita3K', platform: 'PlayStation Vita', short: 'Vita', slugs: ['psvita'], kind: 'trophy' },
};

const HOME = os.homedir();
const XDG_CONFIG = process.env.XDG_CONFIG_HOME || path.join(HOME, '.config');
const XDG_DATA = process.env.XDG_DATA_HOME || path.join(HOME, '.local', 'share');

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const ls = (p) => { try { return fs.readdirSync(p); } catch { return []; } };
const readText = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const mtime = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };

// Mounted drives and SD cards, plus common emulation roots on each of them
function mountRoots() {
  const out = [];
  for (const base of ['/run/media', '/media']) {
    for (const u of ls(base)) {
      const p = path.join(base, u);
      if (!isDir(p)) continue;
      // /run/media/<user>/<drive> or /media/<drive>
      for (const d of ls(p)) { const q = path.join(p, d); if (isDir(q)) out.push(q); }
      out.push(p);
    }
  }
  for (const d of ls('/mnt')) { const q = path.join('/mnt', d); if (isDir(q)) out.push(q); }
  return out;
}
function emulationRoots(extra = []) {
  const roots = new Set();
  for (const base of [HOME, ...mountRoots(), ...extra]) {
    for (const n of ['Emulation', 'emulation', 'retrodeck', 'RetroDECK', 'Emulators', 'emulators']) {
      const p = path.join(base, n);
      if (isDir(p)) roots.add(p);
    }
  }
  for (const e of extra) if (isDir(e)) roots.add(e);
  return [...roots];
}

// ---------------------------------------------------------------- tiny XML helpers
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unent = (s) => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()] ?? m)).trim();
const attrs = (s) => { const o = {}; String(s || '').replace(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g, (_, k, __, a, b) => { o[k] = unent(a ?? b); }); return o; };
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i')); return m ? unent(m[1]) : ''; };
function parseTrophyXml(xml) {
  if (!xml || !/<trophyconf/i.test(xml)) return null;
  const trophies = [];
  const re = /<trophy\b([^>]*?)(\/>|>([\s\S]*?)<\/trophy>)/gi;
  let m;
  while ((m = re.exec(xml))) {
    const a = attrs(m[1]);
    const body = m[3] || '';
    trophies.push({ id: parseInt(a.id, 10), grade: (a.ttype || '').toUpperCase()[0] || null, hidden: a.hidden === 'yes', name: tag(body, 'name'), desc: tag(body, 'detail'), unlockstate: a.unlockstate, timestamp: a.timestamp });
  }
  return { title: tag(xml, 'title-name'), npcommid: tag(xml, 'npcommid'), trophies: trophies.filter((t) => Number.isFinite(t.id)) };
}

// ---------------------------------------------------------------- icons
// Icons are served through Cartridge's image protocol by an opaque token, so only files we
// registered here can ever be read.
const iconMap = new Map(); // token -> absolute path
function iconToken(p) {
  if (!p || !exists(p)) return '';
  const t = crypto.createHash('sha1').update(p).digest('hex').slice(0, 24);
  iconMap.set(t, p);
  return 'romimg://img/?tr=' + t;
}
function iconPath(token) { return iconMap.get(token) || null; }
let iconCacheDir = null; // for icons extracted from Xenia GPD files
function setIconCacheDir(d) { iconCacheDir = d; }

// ---------------------------------------------------------------- RPCS3 (PS3)
const PS3_EPOCH_US = 62135596800000000n; // microseconds from 0001-01-01 to 1970-01-01
function readTropusrPS3(buf) {
  if (!buf || buf.length < 0x30 || buf.readUInt32BE(0) !== 0x818f54ad) return null;
  const tables = buf.readUInt32BE(8);
  const out = new Map();
  for (let i = 0; i < tables; i++) {
    const h = 0x30 + i * 32;
    if (h + 32 > buf.length) break;
    const type = buf.readUInt32BE(h), count = buf.readUInt32BE(h + 12);
    const off = Number(buf.readBigUInt64BE(h + 16));
    if (type !== 6) continue;
    for (let k = 0; k < count; k++) {
      const e = off + k * 0x70;
      if (e + 0x70 > buf.length) break;
      const id = buf.readUInt32BE(e + 16), state = buf.readUInt32BE(e + 20);
      const ts = buf.readBigUInt64BE(e + 40); // timestamp2, what RPCS3 reports to games
      let time = null;
      if (state && ts > PS3_EPOCH_US) time = Number((ts - PS3_EPOCH_US) / 1000n);
      out.set(id, { unlocked: !!state, time });
    }
  }
  return out;
}
// Trophy folders (…/dev_hdd0/home/<user>/trophy) found through RPCS3's own vfs.yml
function rpcs3Roots() {
  const found = [];
  const cfgDirs = [path.join(XDG_CONFIG, 'rpcs3'), path.join(HOME, '.var/app/net.rpcs3.RPCS3/config/rpcs3')];
  for (const cd of cfgDirs) {
    if (!isDir(cd)) continue;
    let hdd = path.join(cd, 'dev_hdd0');
    for (const vf of [path.join(cd, 'config', 'vfs.yml'), path.join(cd, 'vfs.yml')]) {
      const t = readText(vf);
      const m = t && t.match(/^\s*\/dev_hdd0\/\s*:\s*(.+?)\s*$/m);
      if (m) { hdd = m[1].replace(/^["']|["']$/g, '').replace('$(EmulatorDir)', cd.endsWith('/') ? cd : cd + '/'); break; }
    }
    for (const u of ls(path.join(hdd, 'home'))) {
      const t = path.join(hdd, 'home', u, 'trophy');
      if (isDir(t)) found.push({ dir: t, how: 'config' });
    }
  }
  for (const r of emulationRoots()) {
    const hdd = path.join(r, 'storage', 'rpcs3', 'dev_hdd0');
    for (const u of ls(path.join(hdd, 'home'))) { const t = path.join(hdd, 'home', u, 'trophy'); if (isDir(t)) found.push({ dir: t, how: 'known' }); }
  }
  return found;
}
function parseRpcs3(root) {
  const games = [];
  for (const np of ls(root)) {
    const d = path.join(root, np);
    const usr = path.join(d, 'TROPUSR.DAT');
    if (!exists(usr)) continue;
    const conf = parseTrophyXml(readText(path.join(d, 'TROP.SFM'))) || parseTrophyXml(readText(path.join(d, 'TROPCONF.SFM')));
    let state = null;
    try { state = readTropusrPS3(fs.readFileSync(usr)); } catch {}
    if (!conf || !state) continue;
    games.push({
      src: 'rpcs3', set: conf.npcommid || np, title: conf.title || np, titleId: null,
      icon: iconToken(path.join(d, 'ICON0.PNG')),
      trophies: conf.trophies.map((t) => ({ id: t.id, name: t.name, desc: t.desc, grade: t.grade, hidden: t.hidden, icon: iconToken(path.join(d, `TROP${String(t.id).padStart(3, '0')}.PNG`)), unlocked: !!state.get(t.id)?.unlocked, time: state.get(t.id)?.time || null })),
      files: [usr],
    });
  }
  return games;
}

// ---------------------------------------------------------------- Vita3K (PS Vita)
function readTropusrVita(buf) {
  if (!buf || buf.length < 1136 || buf.readUInt32LE(0) !== 0x12d5819a) return null;
  const out = new Map();
  for (let id = 0; id < 128; id++) {
    const bit = (buf.readUInt32LE(4 + (id >> 5) * 4) >>> (id & 31)) & 1;
    const ts = Number(buf.readBigUInt64LE(112 + id * 8));
    out.set(id, { unlocked: !!bit, time: bit && ts ? ts * 1000 : null });
  }
  return out;
}
function vita3kRoots() {
  const found = [];
  const prefs = new Set([path.join(XDG_DATA, 'Vita3K', 'Vita3K')]);
  for (const cfg of [path.join(XDG_CONFIG, 'Vita3K', 'config.yml'), path.join(XDG_DATA, 'Vita3K', 'config.yml'), path.join(HOME, '.var/app/org.vita3k.Vita3K/config/Vita3K/config.yml')]) {
    const t = readText(cfg);
    const m = t && t.match(/^\s*pref-path\s*:\s*(.+?)\s*$/m);
    if (m && m[1] && m[1] !== "''" && m[1] !== '""') prefs.add(m[1].replace(/^["']|["']$/g, ''));
  }
  for (const r of emulationRoots()) prefs.add(path.join(r, 'storage', 'Vita3K'));
  for (const p of prefs) {
    for (const u of ls(path.join(p, 'ux0', 'user'))) {
      const t = path.join(p, 'ux0', 'user', u, 'trophy');
      if (isDir(path.join(t, 'data'))) found.push({ dir: t, how: 'config' });
    }
  }
  return found;
}
function parseVita3k(root) {
  const games = [];
  for (const np of ls(path.join(root, 'data'))) {
    const usr = path.join(root, 'data', np, 'TROPUSR.DAT');
    const cd = path.join(root, 'conf', np);
    let state = null;
    try { state = readTropusrVita(fs.readFileSync(usr)); } catch {}
    const conf = parseTrophyXml(readText(path.join(cd, 'TROP.SFM'))) || parseTrophyXml(readText(path.join(cd, 'TROPCONF.SFM')));
    if (!state || !conf) continue;
    games.push({
      src: 'vita3k', set: conf.npcommid || np, title: conf.title || np, titleId: null,
      icon: iconToken(path.join(cd, 'ICON0.PNG')),
      trophies: conf.trophies.map((t) => ({ id: t.id, name: t.name, desc: t.desc, grade: t.grade, hidden: t.hidden, icon: iconToken(path.join(cd, `TROP${String(t.id).padStart(3, '0')}.PNG`)), unlocked: !!state.get(t.id)?.unlocked, time: state.get(t.id)?.time || null })),
      files: [usr],
    });
  }
  return games;
}

// ---------------------------------------------------------------- shadPS4 (PS4)
// Current layout: <user>/trophy/<NP>/Xml/TROP.XML + <user>/home/<uid>/trophy/<NP>.xml (unlocks)
// Older layout:   <user>/game_data/<CUSA…>/TrophyFiles/trophy00/Xml/TROP.XML (unlocks inline)
function shadps4Roots() {
  const found = [];
  const users = [path.join(XDG_DATA, 'shadPS4'), path.join(HOME, '.var/app/net.shadps4.shadPS4/data/shadPS4')];
  for (const r of emulationRoots()) users.push(path.join(r, 'storage', 'shadps4'), path.join(r, 'storage', 'shadPS4'));
  for (const u of users) if (isDir(path.join(u, 'trophy')) || isDir(path.join(u, 'home')) || isDir(path.join(u, 'game_data'))) found.push({ dir: u, how: 'config' });
  return found;
}
const tsMs = (v) => { const n = Number(v); if (!n) return null; return n > 1e14 ? Math.round(n / 1000) : n > 1e11 ? n : n * 1000; };
function parseShadps4(userDir) {
  const games = new Map();
  const add = (g) => { const k = g.set; const prev = games.get(k); if (!prev || g.trophies.filter((t) => t.unlocked).length >= prev.trophies.filter((t) => t.unlocked).length) games.set(k, g); };
  const iconsOf = (dir, id) => iconToken(path.join(dir, `TROP${String(id).padStart(3, '0')}.PNG`));
  // current layout
  for (const uid of ls(path.join(userDir, 'home'))) {
    const tdir = path.join(userDir, 'home', uid, 'trophy');
    for (const f of ls(tdir)) {
      if (!/\.xml$/i.test(f)) continue;
      const np = f.replace(/\.xml$/i, '');
      const conf = parseTrophyXml(readText(path.join(tdir, f)));
      if (!conf) continue;
      const base = path.join(userDir, 'trophy', np);
      // names may be empty in the save copy: fill from the English/master definitions
      const defs = parseTrophyXml(readText(path.join(base, 'Xml', 'TROP_01.XML'))) || parseTrophyXml(readText(path.join(base, 'Xml', 'TROP.XML')));
      const byId = new Map((defs?.trophies || []).map((t) => [t.id, t]));
      add({
        src: 'shadps4', set: np, title: defs?.title || conf.title || np, titleId: null,
        icon: iconToken(path.join(base, 'Icons', 'ICON0.PNG')),
        trophies: conf.trophies.map((t) => { const d = byId.get(t.id) || t; return { id: t.id, name: d.name || t.name, desc: d.desc || t.desc, grade: t.grade || d.grade, hidden: t.hidden, icon: iconsOf(path.join(base, 'Icons'), t.id), unlocked: t.unlockstate === 'true', time: t.unlockstate === 'true' ? tsMs(t.timestamp) : null }; }),
        files: [path.join(tdir, f)],
      });
    }
  }
  // older layout
  for (const tid of ls(path.join(userDir, 'game_data'))) {
    const tf = path.join(userDir, 'game_data', tid, 'TrophyFiles');
    for (const t0 of ls(tf)) {
      const xml = path.join(tf, t0, 'Xml', 'TROP.XML');
      const conf = parseTrophyXml(readText(xml));
      if (!conf) continue;
      const set = conf.npcommid || `${tid}-${t0}`;
      add({
        src: 'shadps4', set, title: conf.title || tid, titleId: /^[A-Z]{4}\d{5}$/.test(tid) ? tid : null,
        icon: iconToken(path.join(tf, t0, 'Icons', 'ICON0.PNG')),
        trophies: conf.trophies.map((t) => ({ id: t.id, name: t.name, desc: t.desc, grade: t.grade, hidden: t.hidden, icon: iconsOf(path.join(tf, t0, 'Icons'), t.id), unlocked: t.unlockstate === 'true', time: t.unlockstate === 'true' ? tsMs(t.timestamp) : null })),
        files: [xml],
      });
    }
  }
  return [...games.values()];
}

// ---------------------------------------------------------------- Xenia (Xbox 360)
const FILETIME_EPOCH_MS = 11644473600000;
function u16be(buf, off) {
  let s = '';
  for (let i = off; i + 1 < buf.length; i += 2) { const c = buf.readUInt16BE(i); if (!c) return { s, end: i + 2 }; s += String.fromCharCode(c); }
  return { s, end: buf.length };
}
function readXdbf(buf) {
  if (!buf || buf.length < 24 || buf.toString('latin1', 0, 4) !== 'XDBF') return null;
  const entryCount = buf.readUInt32BE(8), entryUsed = buf.readUInt32BE(12), freeCount = buf.readUInt32BE(16);
  const dataStart = 24 + entryCount * 18 + freeCount * 8;
  const entries = [];
  for (let i = 0; i < entryUsed; i++) {
    const o = 24 + i * 18;
    if (o + 18 > buf.length) break;
    const section = buf.readUInt16BE(o), id = buf.readBigUInt64BE(o + 2), off = buf.readUInt32BE(o + 10), size = buf.readUInt32BE(o + 14);
    const s = dataStart + off;
    if (s + size > buf.length) continue;
    entries.push({ section, id, data: buf.subarray(s, s + size) });
  }
  return entries;
}
function parseGpd(file) {
  let buf;
  try { buf = fs.readFileSync(file); } catch { return null; }
  const entries = readXdbf(buf);
  if (!entries) return null;
  const titleIdHex = path.basename(file, '.gpd').toUpperCase();
  const strings = new Map(), images = new Map(), ach = [];
  for (const e of entries) {
    if (e.section === 5) strings.set(Number(e.id), u16be(e.data, 0).s);
    else if (e.section === 2) images.set(Number(e.id), e.data);
    else if (e.section === 1 && e.data.length >= 28) {
      const d = e.data;
      const id = d.readUInt32BE(4), imageId = d.readUInt32BE(8), gs = d.readUInt32BE(12), flags = d.readUInt32BE(16), ft = d.readBigUInt64BE(20);
      const t1 = u16be(d, 28), t2 = u16be(d, t1.end), t3 = u16be(d, t2.end);
      const unlocked = !!(flags & 0x20000);
      ach.push({ id, imageId, gamerscore: gs, name: t1.s, desc: unlocked ? (t2.s || t3.s) : (t3.s || t2.s), lockedDesc: t3.s, unlocked, hidden: !(flags & 0x8), time: unlocked && ft ? Math.max(0, Number(ft / 10000n) - FILETIME_EPOCH_MS) || null : null });
    }
  }
  if (!ach.length) return null;
  const img = (id) => {
    const data = images.get(id);
    if (!data || !iconCacheDir) return '';
    const f = path.join(iconCacheDir, `x360-${titleIdHex}-${id}.png`);
    try { if (!exists(f)) { fs.mkdirSync(iconCacheDir, { recursive: true }); fs.writeFileSync(f, data); } } catch { return ''; }
    return iconToken(f);
  };
  return {
    src: 'xenia', set: titleIdHex, title: strings.get(0x8000) || '', titleId: titleIdHex,
    icon: img(0x8000),
    trophies: ach.map((a) => ({ id: a.id, name: a.name, desc: a.desc, grade: null, points: a.gamerscore, hidden: a.hidden, icon: img(a.imageId), unlocked: a.unlocked, time: a.time })),
    files: [file],
  };
}
// Title names also live in each profile's dashboard GPD (FFFE07D1.gpd)
function dashboardTitles(profileDir) {
  const out = new Map();
  let buf; try { buf = fs.readFileSync(path.join(profileDir, 'FFFE07D1.gpd')); } catch { return out; }
  for (const e of readXdbf(buf) || []) {
    if (e.section !== 4 || e.data.length < 44) continue;
    const tid = e.data.readUInt32BE(0).toString(16).toUpperCase().padStart(8, '0');
    const name = u16be(e.data, 40).s;
    if (name && /^[\x20-￿]+$/.test(name)) out.set(tid, name);
  }
  return out;
}
// Content roots: portable installs keep "content" next to xenia(_canary).exe; others use
// Documents/Xenia/content inside a Wine/Proton prefix.
function xeniaRoots() {
  const found = [];
  const cand = new Set();
  const addPrefix = (drive) => { for (const u of ls(path.join(drive, 'users'))) cand.add(path.join(drive, 'users', u, 'Documents', 'Xenia', 'content')); };
  for (const r of emulationRoots()) {
    for (const sub of ['roms/xbox360', 'roms/xbox360/xenia', 'storage/xenia', 'storage/Xenia']) cand.add(path.join(r, sub, 'content'));
  }
  for (const a of [path.join(HOME, 'Applications'), path.join(HOME, 'Games'), path.join(HOME, 'Emulators')]) {
    for (const d of ls(a)) if (/xenia/i.test(d)) cand.add(path.join(a, d, 'content'));
  }
  for (const steam of [path.join(XDG_DATA, 'Steam'), path.join(HOME, '.steam', 'steam'), path.join(HOME, '.var/app/com.valvesoftware.Steam/data/Steam')]) {
    const cd = path.join(steam, 'steamapps', 'compatdata');
    for (const id of ls(cd)) addPrefix(path.join(cd, id, 'pfx', 'drive_c'));
  }
  addPrefix(path.join(HOME, '.wine', 'drive_c'));
  const bottles = path.join(HOME, '.var/app/com.usebottles.bottles/data/bottles/bottles');
  for (const b of ls(bottles)) addPrefix(path.join(bottles, b, 'drive_c'));
  for (const g of ls(path.join(HOME, 'Games'))) addPrefix(path.join(HOME, 'Games', g, 'drive_c'));
  for (const p of ls(path.join(HOME, 'Games', 'Heroic', 'Prefixes', 'default'))) addPrefix(path.join(HOME, 'Games', 'Heroic', 'Prefixes', 'default', p, 'pfx', 'drive_c'));
  // xenia-canary.config.toml may point somewhere else entirely
  for (const c of cand) if (isDir(c) && xeniaProfiles(c).length) found.push({ dir: c, how: 'known' });
  return found;
}
function xeniaProfiles(contentRoot) {
  const out = [];
  for (const x of ls(contentRoot)) {
    if (!/^[0-9A-F]{16}$/i.test(x)) continue;
    const p = path.join(contentRoot, x, 'FFFE07D1', '00010000', x);
    if (isDir(p)) out.push(p);
  }
  return out;
}
function parseXenia(contentRoot) {
  const byTitle = new Map();
  for (const prof of xeniaProfiles(contentRoot)) {
    const names = dashboardTitles(prof);
    for (const f of ls(prof)) {
      if (!/^[0-9A-F]{8}\.gpd$/i.test(f) || /^FFFE07D1/i.test(f)) continue;
      const g = parseGpd(path.join(prof, f));
      if (!g) continue;
      if (!g.title) g.title = names.get(g.set) || g.set;
      const prev = byTitle.get(g.set);
      if (!prev) { byTitle.set(g.set, g); continue; }
      // several profiles or Xenia builds: keep every unlock, earliest time wins
      const m = new Map(prev.trophies.map((t) => [t.id, t]));
      for (const t of g.trophies) { const p = m.get(t.id); if (!p) m.set(t.id, t); else if (t.unlocked && (!p.unlocked || (t.time && (!p.time || t.time < p.time)))) m.set(t.id, { ...p, unlocked: true, time: t.time }); }
      prev.trophies = [...m.values()];
      prev.files.push(...g.files);
    }
  }
  return [...byTitle.values()];
}

// ---------------------------------------------------------------- detection + scanning
const DETECT = { rpcs3: rpcs3Roots, shadps4: shadps4Roots, xenia: xeniaRoots, vita3k: vita3kRoots };
const PARSE = { rpcs3: parseRpcs3, shadps4: parseShadps4, xenia: parseXenia, vita3k: parseVita3k };

// Does this folder hold data for the given source? Returns the root to use (it may be a parent
// or child of what the user picked), or null.
function validate(src, dir, deep = true) {
  if (!dir || !isDir(dir)) return null;
  const r = validateAt(src, dir);
  if (r || !deep) return r;
  // the user may have picked the folder just above the emulator's own (".../data" for "shadPS4")
  for (const n of ls(dir).slice(0, 60)) { const c = path.join(dir, n); if (isDir(c)) { const x = validateAt(src, c); if (x) return x; } }
  return null;
}
function validateAt(src, dir) {
  const tryDirs = [dir, path.dirname(dir), path.dirname(path.dirname(dir))];
  if (src === 'rpcs3') {
    const check = (d) => ls(d).some((n) => { try { return readTropusrPS3(fs.readFileSync(path.join(d, n, 'TROPUSR.DAT'))) !== null; } catch { return false; } });
    for (const d of tryDirs) if (check(d)) return d;
    for (const u of ls(path.join(dir, 'home'))) if (check(path.join(dir, 'home', u, 'trophy'))) return path.join(dir, 'home', u, 'trophy');
    for (const u of ls(path.join(dir, 'dev_hdd0', 'home'))) if (check(path.join(dir, 'dev_hdd0', 'home', u, 'trophy'))) return path.join(dir, 'dev_hdd0', 'home', u, 'trophy');
    if (check(path.join(dir, 'trophy'))) return path.join(dir, 'trophy');
    return null;
  }
  if (src === 'vita3k') {
    const check = (d) => isDir(path.join(d, 'data')) && ls(path.join(d, 'data')).some((n) => { try { return readTropusrVita(fs.readFileSync(path.join(d, 'data', n, 'TROPUSR.DAT'))) !== null; } catch { return false; } });
    for (const d of tryDirs) if (check(d)) return d;
    for (const base of [dir, path.join(dir, 'ux0')]) for (const u of ls(path.join(base, 'user'))) if (check(path.join(base, 'user', u, 'trophy'))) return path.join(base, 'user', u, 'trophy');
    if (check(path.join(dir, 'trophy'))) return path.join(dir, 'trophy');
    return null;
  }
  if (src === 'shadps4') {
    const check = (d) => (isDir(path.join(d, 'home')) && ls(path.join(d, 'home')).some((u) => ls(path.join(d, 'home', u, 'trophy')).some((f) => /\.xml$/i.test(f))))
      || ls(path.join(d, 'game_data')).some((t) => isDir(path.join(d, 'game_data', t, 'TrophyFiles')));
    for (const d of [...tryDirs, path.join(dir, 'user')]) if (check(d)) return d;
    return null;
  }
  if (src === 'xenia') {
    for (const d of [dir, path.join(dir, 'content'), ...tryDirs]) if (xeniaProfiles(d).length) return d;
    return null;
  }
  return null;
}

// Limited background scan for trophy fingerprints: only home app/data folders, emulation
// folders and mounted drives, bounded depth, a time budget, and heavy folders skipped.
const SKIP = new Set(['node_modules', '.git', 'proc', 'sys', 'dev', 'cache', '.cache', 'Cache', 'shadercache', 'shader', 'shaders', 'shader_cache', 'ShaderCache', 'Videos', 'Music', 'Pictures', 'Trash', '.Trash-1000', 'lost+found', 'bios', 'downloaded_media', 'media', 'screenshots', 'logs', 'log', 'temp', 'tmp', 'dev_flash', 'dev_bdvd', 'dev_usb000', 'sys_modules']);
async function scan({ want, extraRoots = [], budgetMs = 12000, maxDepth = 10, onProgress } = {}) {
  const need = new Set(want || Object.keys(SOURCES));
  const found = {};
  for (const s of need) found[s] = [];
  const roots = [...new Set([
    path.join(HOME, '.var', 'app'), XDG_CONFIG, XDG_DATA, path.join(HOME, 'Applications'), path.join(HOME, 'Games'),
    ...emulationRoots(extraRoots), ...mountRoots(), ...extraRoots,
  ])].filter(isDir);
  const deadline = Date.now() + budgetMs;
  const seen = new Set();
  let visited = 0;
  const hit = (s, dir) => { if (need.has(s) && !found[s].some((f) => f.dir === dir)) found[s].push({ dir, how: 'scan' }); };
  const queue = roots.map((r) => [r, 0]);
  while (queue.length && Date.now() < deadline) {
    const [dir, depth] = queue.shift();
    let real; try { real = fs.realpathSync(dir); } catch { continue; }
    if (seen.has(real)) continue;
    seen.add(real);
    if (++visited % 400 === 0) { onProgress?.(visited); await new Promise((r) => setImmediate(r)); }
    let ents; try { ents = await fsp.readdir(dir, { withFileTypes: true }); } catch { continue; }
    const names = new Set(ents.map((e) => e.name));
    // fingerprints
    if (names.has('TROPUSR.DAT')) {
      try {
        const b = await fsp.readFile(path.join(dir, 'TROPUSR.DAT'));
        if (readTropusrPS3(b)) hit('rpcs3', path.dirname(dir));
        else if (readTropusrVita(b)) hit('vita3k', path.dirname(path.dirname(dir)));
      } catch {}
      continue;
    }
    if (path.basename(dir) === '00010000' && path.basename(path.dirname(dir)) === 'FFFE07D1') {
      const content = path.dirname(path.dirname(path.dirname(dir)));
      if (xeniaProfiles(content).length) hit('xenia', content);
      continue;
    }
    if (path.basename(dir) === 'trophy' && path.basename(path.dirname(path.dirname(dir))) === 'home' && [...names].some((n) => /^NPWR\d{5}_\d{2}\.xml$/i.test(n))) {
      hit('shadps4', path.dirname(path.dirname(path.dirname(dir))));
      continue;
    }
    if (names.has('TrophyFiles') && path.basename(path.dirname(dir)) === 'game_data') { hit('shadps4', path.dirname(path.dirname(dir))); continue; }
    if (depth >= maxDepth) continue;
    for (const e of ents) {
      if (!e.isDirectory() || SKIP.has(e.name)) continue;
      if (e.name.startsWith('.') && depth > 0 && e.name !== '.var' && e.name !== '.local' && e.name !== '.config') continue;
      queue.push([path.join(dir, e.name), depth + 1]);
    }
  }
  return { found, visited, timedOut: Date.now() >= deadline };
}

// ---------------------------------------------------------------- read everything
function readSource(src, dirs) {
  const games = [];
  for (const d of dirs) {
    try { games.push(...PARSE[src](d)); } catch (e) { /* one bad folder never breaks the rest */ }
  }
  // same trophy set from two installs: merge, keeping every unlock (earliest time)
  const bySet = new Map();
  for (const g of games) {
    const p = bySet.get(g.set);
    if (!p) { bySet.set(g.set, g); continue; }
    const m = new Map(p.trophies.map((t) => [t.id, t]));
    for (const t of g.trophies) { const q = m.get(t.id); if (!q) m.set(t.id, t); else if (t.unlocked && (!q.unlocked || (t.time && (!q.time || t.time < q.time)))) m.set(t.id, { ...q, unlocked: true, time: t.time }); }
    p.trophies = [...m.values()];
    p.files.push(...g.files);
    p.titleId ||= g.titleId;
  }
  return [...bySet.values()];
}
function signature(dirs) {
  // cheap change detector: newest modification time among the unlock files' folders
  let s = 0;
  const walk = (d, depth) => { if (depth > 5) return; for (const n of ls(d)) { const p = path.join(d, n); const m = mtime(p); if (m > s) s = m; if (depth < 5 && isDir(p)) walk(p, depth + 1); } };
  for (const d of dirs) walk(d, 0);
  return s;
}

module.exports = { SOURCES, DETECT, validate, scan, readSource, signature, iconPath, setIconCacheDir, readTropusrPS3, readTropusrVita, parseTrophyXml, parseGpd, readXdbf };
