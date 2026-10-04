'use strict';
// Names for trophy codes Cartridge can't read from the game itself (0.9.29, owner: built-in list of trophy
// codes to names). Xbox 360: Xenia names a game by its title ID, so the name comes from x360db (xenia-manager's
// open archive of the Xbox 360 Marketplace, about 5,900 titles). It has no licence file, so it's fetched when
// needed and cached in the user's folder for 30 days, never shipped in Cartridge.
// PS4 and Vita (NPWR codes) have no open list: their names come from the game files on any of your devices
// (trophies.js titles.json) and your other devices' RomM notes (trophyService).
const fs = require('fs');
const path = require('path');
const X360_URL = 'https://raw.githubusercontent.com/xenia-manager/x360db/main/games.json';
let dir = null, fetchImpl = (...a) => fetch(...a), x360 = null, loading = null;
function setup(o) { dir = o.dir; if (o.fetchImpl) fetchImpl = o.fetchImpl; }
// x360db's games.json -> { TITLEID: name }, alternative IDs included
function x360Map(list) {
  const out = {};
  for (const g of Array.isArray(list) ? list : []) {
    const name = String(g.title || '').trim();
    if (!name) continue;
    for (const id of [g.id, ...(g.alternative_id || [])]) if (/^[0-9A-F]{8}$/i.test(id || '') && !out[id.toUpperCase()]) out[id.toUpperCase()] = name;
  }
  return out;
}
async function loadX360() {
  if (x360) return x360;
  if (loading) return loading;
  loading = (async () => {
    const file = dir && path.join(dir, 'x360db.json');
    let cached = null; try { cached = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
    if (cached && Date.now() - (cached.at || 0) < 30 * 864e5) return (x360 = cached.names || {});
    try {
      const r = await fetchImpl(X360_URL, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error('x360db answered ' + r.status);
      const names = x360Map(await r.json());
      if (file) try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, JSON.stringify({ at: Date.now(), names })); } catch {}
      return (x360 = names);
    } catch { return (x360 = cached?.names || {}); }
  })();
  return loading;
}
// a name for a code, when known now (loads in the background the first time it's asked)
function nameFor(src, code) {
  const c = String(code || '').trim().toUpperCase();
  if (src === 'xenia' && /^[0-9A-F]{8}$/.test(c)) { if (!x360) { loadX360().catch(() => {}); return ''; } return x360[c] || ''; }
  return '';
}
module.exports = { setup, nameFor, loadX360, x360Map };
