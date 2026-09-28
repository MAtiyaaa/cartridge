// Trophies from local emulators (see trophies.js), linked to the RomM library and synced across
// devices through private RomM notes. Nothing here ever writes to an emulator's files.
const fs = require('fs');
const path = require('path');
const os = require('os');
const T = require('./trophies');

const NOTE_TITLE = 'Cartridge trophies';
const NOTE_TAG = 'cartridge-trophies';
const ORDER = ['rpcs3', 'shadps4', 'xenia', 'vita3k'];

module.exports = function createTrophyService(ctx) {
  const { USER_DATA, api, broadcast, log, loadJson } = ctx;
  const cfg = () => ctx.getConfig().trophies;
  const LINKS_FILE = path.join(USER_DATA, 'trophy-links.json');
  const REMOTE_FILE = path.join(USER_DATA, 'trophy-remote.json');
  T.setIconCacheDir(path.join(USER_DATA, 'trophyicons'));

  const links = loadJson(LINKS_FILE, {}); // "src:set" -> romId (0 = the user unlinked it)
  const remote = new Map(Object.entries(loadJson(REMOTE_FILE, {}))); // "src:set" -> { romId, noteId, data }
  let games = new Map(); // "src:set" -> local game
  let known = null; // unlock keys seen so far (null until the first read, so startup never pops)
  let scanning = null;
  let syncState = { state: 'idle' };
  let syncT = null, pollT = null, lastPoll = '';
  const saveLinks = () => { try { fs.writeFileSync(LINKS_FILE, JSON.stringify(links)); } catch {} };
  const saveRemote = () => { try { fs.writeFileSync(REMOTE_FILE, JSON.stringify(Object.fromEntries(remote))); } catch {} };
  const device = () => (cfg().device || os.hostname() || 'This device').slice(0, 40);
  const keyOf = (g) => `${g.src}:${g.set}`;

  // ------------------------------------------------------------ sources
  function srcCfg(id) {
    const c = cfg();
    c.sources ||= {};
    c.sources[id] ||= { enabled: true, dirs: [], custom: [] };
    return c.sources[id];
  }
  function dirsOf(id) {
    const s = srcCfg(id);
    const out = new Map();
    for (const d of s.custom || []) out.set(d, 'chosen');
    for (const f of s.dirs || []) if (!out.has(f.dir)) out.set(f.dir, f.how);
    // the same folder often shows up under several mount paths (/run/media/…, /media/…, symlinks):
    // keep one entry per real folder
    const seen = new Set();
    const res = [];
    for (const [dir, how] of out) {
      let real;
      try { if (!fs.statSync(dir).isDirectory()) continue; real = fs.realpathSync(dir); } catch { continue; }
      const st = fs.statSync(real);
      const key = st.dev + ':' + st.ino;
      if (seen.has(key)) continue;
      seen.add(key);
      res.push({ dir, how });
    }
    return res;
  }
  // Layer 1: each emulator's own config and the usual install locations (fast, every start)
  function detect() {
    for (const id of ORDER) {
      const s = srcCfg(id);
      const found = T.DETECT[id]();
      // keep earlier scan results only while they still hold trophy data; settings-based ones are re-read
      const merged = new Map((s.dirs || []).filter((f) => f.how === 'scan' && T.validate(id, f.dir, false)).map((f) => [f.dir, f.how]));
      for (const f of found) if (!merged.has(f.dir)) merged.set(f.dir, f.how);
      s.dirs = [...merged].map(([dir, how]) => ({ dir, how }));
    }
    ctx.saveConfig();
  }
  // Layer 2: a limited scan for trophy fingerprints
  async function scan(want) {
    if (scanning) return scanning;
    scanning = (async () => {
      const ids = want?.length ? want : ORDER.filter((id) => srcCfg(id).enabled);
      const extra = [ctx.getConfig().romsRoot].filter(Boolean).map((r) => path.dirname(r));
      broadcast('trophies-scan', { state: 'running' });
      const r = await T.scan({ want: ids, extraRoots: extra, budgetMs: 15000, onProgress: (n) => broadcast('trophies-scan', { state: 'running', visited: n }) });
      for (const id of ids) {
        const s = srcCfg(id);
        for (const f of r.found[id] || []) if (!s.dirs.some((x) => x.dir === f.dir)) s.dirs.push(f);
      }
      ctx.saveConfig();
      cfg().scanned = Date.now();
      log('trophy scan', r.visited, 'folders', r.timedOut ? '(time limit)' : '', JSON.stringify(Object.fromEntries(ids.map((i) => [i, (r.found[i] || []).length]))));
      broadcast('trophies-scan', { state: 'done' });
      await refresh();
      return status();
    })();
    try { return await scanning; } finally { scanning = null; }
  }
  // Layer 3: a folder the user picked, checked against the format before it is accepted
  async function choose({ src, dir }) {
    const root = T.validate(src, dir);
    if (!root) throw new Error(`No ${T.SOURCES[src].name} trophy data in that folder`);
    const s = srcCfg(src);
    s.custom = [...new Set([...(s.custom || []), root])];
    s.enabled = true;
    ctx.saveConfig();
    await refresh();
    return status();
  }
  function status() {
    return ORDER.map((id) => {
      const s = srcCfg(id);
      const dirs = dirsOf(id);
      const n = [...games.values()].filter((g) => g.src === id).length;
      return { ...T.SOURCES[id], enabled: s.enabled !== false, found: dirs, custom: s.custom || [], games: n, state: s.enabled === false ? 'off' : dirs.length ? 'found' : 'missing' };
    });
  }

  // ------------------------------------------------------------ reading + library links
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[™®©]/g, '')
    .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').replace(/\b(trophies|trophy set|achievements)\b/g, '').replace(/^the\s+|,\s*the\b/g, '')
    .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  function romsFor(src) {
    const lib = ctx.getLibrary();
    if (!lib) return [];
    const slugs = T.SOURCES[src].slugs;
    return lib.platforms.filter((p) => slugs.includes(p.slug) || slugs.includes(p.fs_slug)).flatMap((p) => lib.roms[p.id] || []);
  }
  function romById(id) {
    const lib = ctx.getLibrary();
    if (!lib || !id) return null;
    for (const list of Object.values(lib.roms)) { const r = list.find((x) => x.id === id); if (r) return r; }
    return null;
  }
  function autoLink(g) {
    const k = keyOf(g);
    if (k in links) return links[k] || null;
    const roms = romsFor(g.src);
    if (!roms.length) return null;
    if (g.titleId) {
      const id = g.titleId.toUpperCase();
      const hits = roms.filter((r) => String(r.fs_name || '').toUpperCase().includes(id));
      if (hits.length === 1) return hits[0].id;
    }
    const n = norm(g.title);
    if (!n) return null;
    const exact = roms.filter((r) => norm(r.name) === n || norm(r.fs_name_no_ext) === n);
    if (exact.length === 1) return exact[0].id;
    const loose = roms.filter((r) => { const a = norm(r.name); return a && (a.startsWith(n + ' ') || n.startsWith(a + ' ')); });
    return loose.length === 1 ? loose[0].id : null;
  }
  async function refresh({ quiet } = {}) {
    const next = new Map();
    for (const id of ORDER) {
      if (srcCfg(id).enabled === false) continue;
      const dirs = dirsOf(id).map((d) => d.dir);
      if (!dirs.length) continue;
      for (const g of T.readSource(id, dirs)) next.set(keyOf(g), g);
    }
    games = next;
    // live pop-ups: anything unlocked since the last read
    const now = new Set();
    for (const g of games.values()) for (const t of g.trophies) if (t.unlocked) now.add(`${keyOf(g)}:${t.id}`);
    if (known && !quiet && cfg().popups !== false) {
      for (const g of games.values()) for (const t of g.trophies) {
        if (t.unlocked && !known.has(`${keyOf(g)}:${t.id}`)) broadcast('trophy-unlocked', { src: g.src, set: g.set, game: g.title, name: t.name, grade: t.grade, points: t.points || 0, icon: t.icon || g.icon });
      }
    }
    const changed = known && [...now].some((k) => !known.has(k));
    known = now;
    lastPoll = pollSig();
    broadcast('trophies', { changed: true });
    if (changed || !syncState.at) queueSync(changed ? 3000 : 8000);
  }
  // Polling is a handful of stat calls: each unlock file plus each root folder
  function pollSig() {
    const parts = [];
    for (const id of ORDER) {
      if (srcCfg(id).enabled === false) continue;
      for (const { dir } of dirsOf(id)) {
        try { parts.push(fs.statSync(dir).mtimeMs); } catch {}
        for (const n of safeLs(dir)) { try { parts.push(fs.statSync(path.join(dir, n)).mtimeMs); } catch {} }
      }
    }
    for (const g of games.values()) for (const f of g.files) { try { const s = fs.statSync(f); parts.push(s.mtimeMs, s.size); } catch {} }
    return parts.join(',');
  }
  const safeLs = (d) => { try { return fs.readdirSync(d).slice(0, 400); } catch { return []; } };
  function startPolling() {
    clearInterval(pollT);
    pollT = setInterval(() => {
      try { const s = pollSig(); if (s !== lastPoll) refresh().catch(() => {}); } catch {}
    }, 8000);
  }

  // ------------------------------------------------------------ merged view (local + other devices)
  function merged(k) {
    const loc = games.get(k);
    const rem = remote.get(k)?.data;
    if (!loc && !rem) return null;
    const me = device();
    const base = loc
      ? { ...loc, trophies: loc.trophies.map((t) => ({ ...t, device: t.unlocked ? me : null })) }
      : { src: rem.src, set: rem.set, title: rem.title, titleId: rem.titleId || null, icon: '', remoteOnly: true,
        trophies: (rem.list || []).map((t) => ({ id: t.id, name: t.name, desc: t.desc || '', grade: t.grade || null, points: t.points || 0, hidden: false, icon: '', unlocked: false, time: null, device: null })) };
    if (rem?.unlocks) {
      const byId = new Map(base.trophies.map((t) => [String(t.id), t]));
      for (const [id, u] of Object.entries(rem.unlocks)) {
        const t = byId.get(String(id));
        if (!t) continue;
        if (!t.unlocked || (u.t && (!t.time || u.t < t.time))) Object.assign(t, { unlocked: true, time: u.t || t.time, device: u.d || 'Another device' });
      }
    }
    const romId = k in links ? links[k] || null : remote.get(k)?.romId || (loc ? autoLink(loc) : null);
    return { ...base, romId: romId || null, key: k };
  }
  function light(g) {
    const earned = g.trophies.filter((t) => t.unlocked);
    const grades = { P: 0, G: 0, S: 0, B: 0 };
    for (const t of earned) if (grades[t.grade] !== undefined) grades[t.grade]++;
    const last = earned.reduce((m, t) => Math.max(m, t.time || 0), 0);
    const rom = romById(g.romId);
    return {
      key: g.key, src: g.src, set: g.set, title: g.title, icon: g.icon, romId: g.romId, remoteOnly: !!g.remoteOnly,
      platform: T.SOURCES[g.src].platform, short: T.SOURCES[g.src].short, kind: T.SOURCES[g.src].kind,
      earned: earned.length, total: g.trophies.length, grades,
      score: g.trophies.reduce((s, t) => s + (t.unlocked ? t.points || 0 : 0), 0), possible: g.trophies.reduce((s, t) => s + (t.points || 0), 0),
      last, cover: rom ? rom.path_cover_small || rom.url_cover || null : null,
      devices: [...new Set(earned.map((t) => t.device).filter(Boolean))],
    };
  }
  function allKeys() { return [...new Set([...games.keys(), ...remote.keys()])]; }
  function overview() {
    const list = allKeys().map(merged).filter(Boolean);
    const summary = { P: 0, G: 0, S: 0, B: 0, trophies: 0, gamerscore: 0, gamerscoreMax: 0, games: list.length };
    const recent = [];
    for (const g of list) {
      for (const t of g.trophies) {
        if (!t.unlocked) continue;
        if (T.SOURCES[g.src].kind === 'gamerscore') summary.gamerscore += t.points || 0;
        else { summary.trophies++; if (summary[t.grade] !== undefined) summary[t.grade]++; }
        recent.push({ key: g.key, game: g.title, gameIcon: g.icon, src: g.src, short: T.SOURCES[g.src].short, id: t.id, name: t.name, desc: t.desc, grade: t.grade, points: t.points || 0, icon: t.icon, time: t.time, device: t.device });
      }
      if (T.SOURCES[g.src].kind === 'gamerscore') summary.gamerscoreMax += g.trophies.reduce((s, t) => s + (t.points || 0), 0);
    }
    recent.sort((a, b) => (b.time || 0) - (a.time || 0));
    const games2 = list.map(light).sort((a, b) => (b.last - a.last) || a.title.localeCompare(b.title));
    return { summary, recent: recent.slice(0, 40), games: games2, sources: status(), sync: syncState, device: device(), anySource: status().some((s) => s.state === 'found') || remote.size > 0 };
  }
  function forRom(romId) {
    for (const k of allKeys()) { const g = merged(k); if (g && g.romId === romId) return { ...g, light: light(g), kind: T.SOURCES[g.src].kind, platform: T.SOURCES[g.src].platform }; }
    return null;
  }

  // ------------------------------------------------------------ RomM notes sync
  const parse = (s) => { try { const j = JSON.parse(s); return j && j.cartridge === 'trophies' ? j : null; } catch { return null; } };
  const listOf = (r) => (Array.isArray(r) ? r : r?.items || []);
  let meId;
  async function notesFor(romId) {
    if (meId === undefined) { try { meId = (await api('/api/users/me')).id ?? null; } catch { meId = null; } }
    const notes = listOf(await api(`/api/roms/${romId}/notes`, { query: { tags: NOTE_TAG } }));
    return notes.filter((n) => n && n.title === NOTE_TITLE && (meId == null || n.user_id == null || n.user_id === meId)).map((n) => ({ id: n.id, data: parse(n.content) })).filter((n) => n.data);
  }
  function noteData(g, prev) {
    const unlocks = { ...(prev?.unlocks || {}) };
    const me = device();
    let changed = !prev;
    for (const t of g.trophies) {
      if (!t.unlocked) continue;
      const u = unlocks[t.id];
      const time = t.time || null;
      if (!u) { unlocks[t.id] = { t: time, d: me }; changed = true; }
      else if (time && (!u.t || time < u.t)) { unlocks[t.id] = { t: time, d: me }; changed = true; }
    }
    const list = g.trophies.map((t) => ({ id: t.id, name: t.name, desc: (t.desc || '').slice(0, 160), grade: t.grade || null, points: t.points || 0 }));
    if (prev && (prev.list || []).length !== list.length) changed = true;
    return { changed, data: { cartridge: 'trophies', v: 1, src: g.src, set: g.set, title: g.title, titleId: g.titleId || null, list, unlocks } };
  }
  async function syncOne(g, romId) {
    const k = keyOf(g);
    const notes = await notesFor(romId);
    const note = notes.find((n) => n.data.src === g.src && n.data.set === g.set);
    const { changed, data } = noteData(g, note?.data);
    const body = { title: NOTE_TITLE, content: JSON.stringify(data), is_public: false, tags: [NOTE_TAG] };
    let noteId = note?.id;
    if (changed && g.trophies.some((t) => t.unlocked)) {
      if (noteId) await api(`/api/roms/${romId}/notes/${noteId}`, { method: 'PUT', body });
      else { const r = await api(`/api/roms/${romId}/notes`, { method: 'POST', body }); noteId = r?.id; }
    }
    remote.set(k, { romId, noteId: noteId || null, data: changed ? data : note?.data || data });
  }
  async function sync() {
    if (cfg().sync === false) { syncState = { state: 'off' }; return syncState; }
    if (!ctx.getConfig().configured) return syncState;
    syncState = { state: 'running', at: syncState.at };
    broadcast('trophies-sync', syncState);
    let pushed = 0, pulled = 0;
    try {
      // this device's games that are linked to the library
      for (const g of games.values()) {
        const romId = autoLink(g);
        if (!romId || !g.trophies.some((t) => t.unlocked) && !remote.has(keyOf(g))) continue;
        await syncOne(g, romId); pushed++;
      }
      // games played only on other devices: ROMs with notes on trophy consoles
      const localRoms = new Set([...games.values()].map(autoLink).filter(Boolean));
      const withNotes = ORDER.flatMap((id) => romsFor(id)).filter((r) => r.has_notes && !localRoms.has(r.id)).slice(0, 80);
      for (const r of withNotes) {
        for (const n of await notesFor(r.id)) {
          const k = `${n.data.src}:${n.data.set}`;
          if (!T.SOURCES[n.data.src] || games.has(k)) continue;
          remote.set(k, { romId: r.id, noteId: n.id, data: n.data }); pulled++;
        }
      }
      saveRemote();
      syncState = { state: 'ok', at: Date.now(), pushed, pulled };
    } catch (e) {
      const msg = /Authentication/.test(e.message) ? 'Your RomM login cannot write notes (needs the roms.user.write permission)'
        : /Server error 404|Server error 405/.test(e.message) ? 'This RomM version has no notes, update RomM to sync trophies' : e.message;
      syncState = { state: 'error', at: Date.now(), error: msg };
      log('trophy sync failed', e.message);
    }
    broadcast('trophies-sync', syncState);
    broadcast('trophies', { changed: true });
    return syncState;
  }
  function queueSync(ms) { clearTimeout(syncT); syncT = setTimeout(() => sync().catch(() => {}), ms); }

  // ------------------------------------------------------------ start + ipc
  async function start() {
    try { detect(); } catch (e) { log('trophy detect failed', e.message); }
    await refresh({ quiet: true });
    // first run: one limited background scan for anything the configs did not reveal
    if (!cfg().scanned && ORDER.some((id) => srcCfg(id).enabled !== false && !dirsOf(id).length)) setTimeout(() => scan().catch(() => {}), 6000);
    startPolling();
  }

  const handlers = {
    'trophies:overview': () => overview(),
    'trophies:game': ({ key }) => { const g = merged(key); return g ? { ...g, light: light(g), platform: T.SOURCES[g.src].platform, kind: T.SOURCES[g.src].kind } : null; },
    'trophies:forRom': ({ romId }) => forRom(romId),
    'trophies:sources': () => status(),
    'trophies:scan': () => scan(),
    'trophies:choose': (o) => choose(o),
    'trophies:removeDir': ({ src, dir }) => {
      const s = srcCfg(src);
      s.custom = (s.custom || []).filter((d) => d !== dir);
      s.dirs = (s.dirs || []).filter((d) => d.dir !== dir);
      ctx.saveConfig();
      return refresh({ quiet: true }).then(status);
    },
    'trophies:toggle': ({ src, enabled }) => { srcCfg(src).enabled = !!enabled; ctx.saveConfig(); return refresh({ quiet: true }).then(status); },
    'trophies:linkable': ({ slug, fs_slug }) => {
      const srcs = ORDER.filter((id) => T.SOURCES[id].slugs.includes(slug) || T.SOURCES[id].slugs.includes(fs_slug));
      return allKeys().map(merged).filter((g) => g && srcs.includes(g.src)).map(light).sort((a, b) => a.title.localeCompare(b.title));
    },
    'trophies:link': ({ key, romId }) => {
      // one game per ROM: a new link replaces any other game on that ROM
      if (romId) for (const k of allKeys()) { const g = merged(k); if (g && g.romId === romId && k !== key) links[k] = 0; }
      links[key] = romId || 0;
      const r = remote.get(key);
      if (r && romId) r.romId = romId;
      saveLinks();
      queueSync(1500);
      broadcast('trophies', { changed: true });
      return true;
    },
    'trophies:sync': () => sync(),
  };
  return { start, handlers, iconPath: T.iconPath, refresh };
};
