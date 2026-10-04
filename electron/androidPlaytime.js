// Play time on Android, where there are no Steam or RetroArch logs to read. Two sources, both "launch to
// return", the most an app can honestly see without extra permissions:
// - Cartridge: when it hands a game to an emulator, and when it is back in front (src/android/playLog.js).
// - Fuse: its own play sessions, read from its play provider (docs/FUSE_BRIDGE.md, Play sessions from Fuse).
// Sessions are kept by key ('c<start>' Cartridge, 'f<id>' Fuse); an open one (no end yet, or never known)
// still counts as last played, never as time. Overlapping sessions of one game count once.
const DAY = 864e5;
const MAX_SESSION = 12 * 3600e3; // a longer one is a session whose end was missed: only its start counts
const KEEP = 400 * DAY;

// file: { sessions: { key: { romId, start, end, src } } }
function upsert(file, key, s) {
  if (!key || !Number.isFinite(s.romId) || !(s.start > 0)) return false;
  let end = s.end > s.start ? s.end : null;
  if (end && end - s.start > MAX_SESSION) end = null;
  const was = file.sessions[key];
  if (was && was.romId === s.romId && was.start === s.start && was.end === end) return false;
  file.sessions[key] = { romId: s.romId, start: s.start, end, src: s.src || 'cartridge' };
  return true;
}
function prune(file, now = Date.now()) {
  for (const [k, s] of Object.entries(file.sessions)) if (now - s.start > KEEP) delete file.sessions[k];
}
// each game's sessions as non-overlapping [start, end] spans (open sessions left out)
function spans(file) {
  const by = new Map();
  for (const s of Object.values(file.sessions)) if (s.end) (by.get(s.romId) || by.set(s.romId, []).get(s.romId)).push([s.start, s.end]);
  for (const [id, list] of by) {
    list.sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const [a, b] of list) { const l = out[out.length - 1]; if (l && a <= l[1]) l[1] = Math.max(l[1], b); else out.push([a, b]); }
    by.set(id, out);
  }
  return by;
}
// romId -> { min, last, src } like steamManager.playtime()
function totals(file) {
  const out = {};
  for (const [id, list] of spans(file)) out[id] = { min: Math.round(list.reduce((n, [a, b]) => n + (b - a), 0) / 6e4), last: 0, src: '' };
  for (const s of Object.values(file.sessions)) {
    const o = (out[s.romId] ||= { min: 0, last: 0, src: '' });
    const t = s.end || s.start;
    if (t > o.last) { o.last = t; o.src = s.src === 'fuse' ? 'Fuse' : 'Cartridge'; }
  }
  return out;
}
// minutes per local day (split at midnight), for Start's This week
function days(file, dayKey) {
  const out = {};
  for (const list of spans(file).values()) for (let [a, b] of list) {
    while (a < b) {
      const mid = new Date(a); mid.setHours(24, 0, 0, 0);
      const e = Math.min(b, mid.getTime());
      const k = dayKey(a); out[k] = (out[k] || 0) + (e - a) / 6e4;
      a = e;
    }
  }
  return out;
}

const nameKey = (s) => String(s || '').toLowerCase().replace(/\.[a-z0-9]{1,4}$/i, '').replace(/\s*[([][^)\]]*[)\]]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
const norm = (p) => String(p || '').replace(/\/+$/, '');
// Fuse's row -> a game in Cartridge's library: its RomM id, else the file Cartridge has on disk (the same
// file, or a file inside the game's folder), else one game whose title (Fuse's shown one or its file name)
// matches, on that console when there are several
function matchRow(row, { roms, installed }) {
  const id = Number(row.rom_id);
  if (id && roms.has(id)) return id;
  const paths = [row.path, row.launch_path].map(norm).filter(Boolean);
  for (const [rid, p] of Object.entries(installed)) {
    const q = norm(p);
    if (q && paths.some((x) => x === q || x.startsWith(q + '/') || q.startsWith(x + '/'))) return Number(rid);
  }
  const keys = [row.title, row.title_original].map(nameKey).filter((k) => k.length >= 3);
  if (!keys.length) return null;
  const plat = String(row.platform || '').toLowerCase();
  const hits = [...roms.values()].filter((r) => keys.includes(nameKey(r.name)) || keys.includes(nameKey(r.fs_name)));
  const same = plat ? hits.filter((r) => [r.platform_slug, r.platform_fs_slug].some((s) => String(s || '').toLowerCase() === plat)) : [];
  const pick = same.length === 1 ? same : hits.length === 1 ? hits : [];
  return pick.length ? pick[0].id : null;
}

module.exports = { upsert, prune, spans, totals, days, matchRow, nameKey, MAX_SESSION };
