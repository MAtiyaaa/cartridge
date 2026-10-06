// The game identity engine (0.9.48). One place that answers "which library game is this?" for a save folder, a
// trophy set, a Syncthing folder or anything else that names a game by an ID or a title.
// Before, each feature worked it out on its own (serials in file names for trophies, IDs read from the game for saves,
// disc IDs for Syncthing), so a game could match in one place and not in another. Now they all ask here:
// - idsOf(rom): every ID the game is known by. From its names (BLUS30443, CUSA00001, SLUS-20062, ULUS10041, a 16-digit
//   Switch title ID...) and, for a downloaded game, from the game itself through the extractors main passes in
//   (PARAM.SFO, SYSTEM.CNF, disc headers, NCA headers). What is read from a file is cached by its path, size and
//   modification time, here and in game-ids.json, so a file is read once, not on every look.
// - findRom({ ids, title, slugs }): the library game for something found on disk. An ID match wins; then the same
//   title on the same console; then a title that is the start of exactly one game's title. Several copies of one game
//   (regions, versions) give the oldest ROM, so every device picks the same one.
// - norm(title): the one title normalisation, shared by all of the above.
// No network, no writes outside its own cache file. Pure enough to test with a fake library (test/gameId.test.js).
const fs = require('fs');

// the serial patterns Syncthing matching already used (PS1 to PS3, PSP, Vita, PS4/PS5, Switch and 3DS title IDs)
const { serialsIn } = require('./syncthing');
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[™®©]/g, '')
  .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').replace(/\b(trophies|trophy set|achievements)\b/g, '').replace(/^the\s+|,\s*the\b/g, '')
  .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const up = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// ctx: { file (cache path), roms() -> [rom], whereOf(id) -> path or '', extract(rom, where) -> [id], log }
function createIdentity(ctx) {
  let cache = null, dirty = false, saveT = null;
  const load = () => { if (cache) return cache; try { cache = JSON.parse(fs.readFileSync(ctx.file, 'utf8')) || {}; } catch { cache = {}; } return cache; };
  const save = () => { dirty = true; clearTimeout(saveT); saveT = setTimeout(() => { if (!dirty || !ctx.file) return; dirty = false; try { fs.writeFileSync(ctx.file, JSON.stringify(cache)); } catch {} }, 2000); saveT.unref?.(); };
  // IDs read from the game itself, once per file version
  function fileIds(rom, where) {
    if (!where || !ctx.extract) return [];
    let st; try { st = fs.statSync(where); } catch { return []; }
    const k = `${where}:${st.size}:${Math.round(st.mtimeMs)}`, c = load();
    if (c[k]) return c[k];
    let ids = [];
    try { ids = [...new Set((ctx.extract(rom, where) || []).filter(Boolean).map(up))]; } catch (e) { ctx.log?.('game id read failed', where, e.message); }
    for (const old of Object.keys(c)) if (old.startsWith(where + ':') && old !== k) delete c[old]; // the file changed: forget its old IDs
    c[k] = ids; save();
    return ids;
  }
  const nameIds = (rom, where) => [...serialsIn([rom.fs_name, rom.name, ...(rom.files || []).map((f) => f.file_name), where ? where.split('/').pop() : ''].join(' '))];
  function idsOf(rom) {
    const where = ctx.whereOf?.(rom.id) || '';
    return [...new Set([...nameIds(rom, where), ...fileIds(rom, where)])];
  }
  // each game's IDs, worked out once (until bump()) and only for the consoles a question is about, so asking about a
  // PS3 trophy never reads Switch games
  let memo = new Map();
  const idsMemo = (r) => { if (!memo.has(r.id)) memo.set(r.id, new Set(idsOf(r))); return memo.get(r.id); };
  function index() {
    const idx = new Map();
    for (const r of ctx.roms()) for (const id of idsMemo(r)) { const a = idx.get(id) || []; a.push(r.id); idx.set(id, a); }
    return idx;
  }
  const slugOk = (r, slugs) => !slugs?.length || slugs.includes(r.platform_slug) || slugs.includes(r.platform_fs_slug);
  const oldest = (list) => list.reduce((a, b) => (b.id < a.id ? b : a));
  function findRom({ ids = [], title = '', slugs = null } = {}) {
    const roms = ctx.roms().filter((r) => slugOk(r, slugs));
    if (!roms.length) return null;
    for (const id of ids.map(up).filter(Boolean)) {
      const hits = roms.filter((r) => idsMemo(r).has(id));
      if (hits.length) return { id: oldest(hits).id, by: 'id' };
    }
    const n = norm(title);
    if (!n) return null;
    const exact = roms.filter((r) => norm(r.name) === n || norm(r.fs_name_no_ext) === n);
    if (exact.length) return { id: oldest(exact).id, by: 'name' };
    const loose = roms.filter((r) => { const a = norm(r.name); return a && (a.startsWith(n + ' ') || n.startsWith(a + ' ')); });
    return loose.length && new Set(loose.map((r) => norm(r.name))).size === 1 ? { id: oldest(loose).id, by: 'loose' } : null;
  }
  return { idsOf, fileIds, nameIds, findRom, index, bump: () => { memo = new Map(); } };
}

module.exports = { createIdentity, serialsIn, norm };
