// Game bundles: the base game, its updates and its DLC as one game. RomM already keeps them together
// (a game with several files, each with a category); this groups them, checks which are on the device
// and picks the file an emulator should be given. Pure functions, no app state.

export const CAT_ORDER = ['game', 'update', 'dlc', 'patch', 'mod', 'demo', 'translation', 'prototype', 'hack'];
export const CAT_LABEL = { game: 'Base game', update: 'Update', dlc: 'DLC', patch: 'Patch', mod: 'Mod', demo: 'Demo', translation: 'Translation', prototype: 'Prototype', hack: 'Hack' };
const DIR = /(^|\/)(updates?|dlcs?|patch(?:es)?|mods?|demos?|translations?|prototypes?|hacks?)\//i;
const JUNK = /\.(txt|nfo|jpe?g|png|gif|pdf|sfv|md5|sha1|xml|db|ini|url|html?|json|srm|sav|state\d*)$/i;

// When RomM sent no category (older servers): the folder or the name usually says
export function guessCat(rel) {
  const d = rel.match(DIR);
  if (d) { const c = d[2].toLowerCase().replace(/e?s$/, ''); return c === 'patch' || c === 'patche' ? 'patch' : CAT_ORDER.find((x) => x.startsWith(c.slice(0, 3))) || 'game'; }
  const n = rel.split('/').pop();
  if (/\[(upd|update)\]|\(update\)|[ _.-]update[ _.-]|\bupd\b/i.test(n)) return 'update';
  if (/\[dlc\]|\(dlc\)|[ _.-]dlc[ _.-]/i.test(n)) return 'dlc';
  return 'game';
}
export const catOf = (f, rel) => {
  const c = String(f.category || '').toLowerCase();
  return CAT_ORDER.includes(c) ? c : c === 'manual' ? 'manual' : guessCat(rel);
};

export function versionOf(name) {
  const dotted = name.match(/[\s_(\[-]v(?:er(?:sion)?\.?\s*)?(\d+(?:\.\d+){1,3})(?![\d.])/i) || name.match(/\((\d+(?:\.\d+){1,3})\)/);
  if (dotted) return dotted[1];
  const code = name.match(/\[v(\d+)\]/i);
  return code ? 'v' + code[1] : '';
}
// Compare two versions written as 3.0.4 or v131072
export function compareVersions(a, b) {
  const p = (v) => String(v || '').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const x = p(a), y = p(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}
// "Mario Kart 8 Deluxe - Booster Course Pass [0100152000023001][v0].nsp" -> "Mario Kart 8 Deluxe - Booster Course Pass"
export function cleanName(file) {
  return file.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/\s*\[[^\]]*\]/g, '').replace(/\s+/g, ' ').replace(/[\s._-]+$/, '').trim() || file;
}

// files: RomM's list for the game ({ file_name, full_path, file_size_bytes, category }); prefix: the game's own
// folder on the server + '/'; scan: what is on the device (android:scan) or null
export function makeBundle({ files = [], prefix = '', scan = null }) {
  const onDisk = new Map((scan?.files || []).map((f) => [f.rel.toLowerCase(), f.size]));
  const rows = files.length
    ? files.map((f) => ({ f, rel: f.full_path && prefix && f.full_path.startsWith(prefix) ? f.full_path.slice(prefix.length) : f.file_name }))
    : (scan?.files || []).map((s) => ({ f: { file_name: s.rel.split('/').pop(), file_size_bytes: s.size }, rel: s.rel }));
  const groups = new Map();
  for (const { f, rel } of rows) {
    const cat = catOf(f, rel);
    if (cat === 'manual' || JUNK.test(f.file_name)) continue;
    const size = f.file_size_bytes ?? onDisk.get(rel.toLowerCase()) ?? 0;
    const have = onDisk.get(rel.toLowerCase());
    const item = { file: f.file_name, rel, cat, name: cleanName(f.file_name), version: versionOf(f.file_name), size, on: have !== undefined, id: f.id };
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(item);
  }
  const list = CAT_ORDER.filter((c) => groups.has(c)).map((c) => ({ cat: c, label: CAT_LABEL[c], items: groups.get(c).sort((a, b) => a.name.localeCompare(b.name)) }));
  const flat = list.flatMap((g) => g.items);
  const updates = groups.get('update') || [];
  const latest = updates.slice().sort((a, b) => compareVersions(a.version, b.version)).pop() || null;
  return {
    groups: list, count: flat.length, size: flat.reduce((s, x) => s + x.size, 0),
    extras: list.some((g) => g.cat !== 'game'), // worth showing as a bundle
    base: (groups.get('game') || [])[0] || null, latest, updates: updates.length, dlc: (groups.get('dlc') || []).length,
    onDevice: flat.filter((x) => x.on).length,
  };
}

const PRIORITY = ['m3u', 'cue', 'gdi', 'ccd', 'chd', 'cso', 'iso', 'img', 'rvz', 'wbfs', 'gcz', 'gcm', 'nsp', 'xci', 'nsz', 'xcz', '3ds', 'cci', 'cxi', 'cia', 'nds', 'wua', 'wux', 'wud', 'rpx', 'pbp', 'bin', 'elf', 'zip', '7z'];
const ext = (n) => (n.split('.').pop() || '').toLowerCase();
const rank = (n) => { const i = PRIORITY.indexOf(ext(n)); return i < 0 ? 99 : i; };

// The file to hand an emulator: the base game (never an update or DLC), preferring a disc list or cue sheet.
// A single file is itself. Returns a path, or '' when nothing on the device looks playable.
export function playablePath(installed, bundle, scan) {
  if (!scan?.folder) return installed;
  const base = bundle?.groups.find((g) => g.cat === 'game')?.items.filter((x) => x.on) || [];
  const pool = base.length ? base : (scan.files || []).filter((s) => !DIR.test(s.rel) && !JUNK.test(s.rel)).map((s) => ({ rel: s.rel, file: s.rel.split('/').pop(), size: s.size }));
  pool.sort((a, b) => rank(a.file) - rank(b.file) || b.size - a.size);
  return pool[0] ? installed.replace(/\/$/, '') + '/' + pool[0].rel : '';
}
