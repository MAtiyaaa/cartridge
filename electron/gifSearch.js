'use strict';
// GIFs for Start's picture widget (0.9.28; 0.9.39, owner: "the images don't load, and PS4 finds nothing").
// Openverse alone has few GIFs and short names miss ("ps4"), so: the words as typed and spelled out (PS4 ->
// PlayStation 4), from Openverse and Wikimedia Commons (both free, no key), small ones down to 200 px kept.
// Thumbnails come through romimg:// (fetched by main.js with webFetch, cached), not straight from those sites: the page
// asking them itself got nothing back on devices.
const SPELL = { ps1: 'playstation', psx: 'playstation', ps2: 'playstation 2', ps3: 'playstation 3', ps4: 'playstation 4', ps5: 'playstation 5', psp: 'playstation portable', vita: 'playstation vita', n64: 'nintendo 64', snes: 'super nintendo', nes: 'nintendo entertainment system', gba: 'game boy advance', gb: 'game boy', nds: 'nintendo ds', '3ds': 'nintendo 3ds', gc: 'gamecube', ngc: 'gamecube', xbox360: 'xbox 360', dc: 'dreamcast' };
function spelledOut(term) { const w = term.toLowerCase().split(/\s+/).map((x) => SPELL[x.replace(/[^a-z0-9]/g, '')] || x).join(' '); return w !== term.toLowerCase() ? w : ''; }
async function search(term, page = 1, { fetchImpl = require('./webFetch') } = {}) {
  const wf = fetchImpl, UA = { 'User-Agent': 'Cartridge (https://github.com/abdu2304/cartridge)' };
  const terms = [term, spelledOut(term)].filter(Boolean);
  const viaUs = (u) => 'romimg://img/?u=' + encodeURIComponent(u);
  const openverse = async (q) => {
    const r = await wf(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&extension=gif&page_size=20&page=${page}`, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`Openverse answered ${r.status}`);
    return ((await r.json()).results || []).filter((x) => x.url && (x.width || 0) >= 200).map((x) => ({ url: x.url, thumb: viaUs(x.thumbnail || x.url), w: x.width || 0, h: x.height || 0, by: x.creator || '', license: (x.license || '').toUpperCase() }));
  };
  const commons = async (q) => {
    const r = await wf(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=20&gsroffset=${(page - 1) * 20}&gsrsearch=${encodeURIComponent(q + ' filemime:image/gif')}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=480`, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`Wikimedia Commons answered ${r.status}`);
    return Object.values((await r.json()).query?.pages || {}).map((p) => p.imageinfo?.[0]).filter((i) => i?.url && i.mime === 'image/gif' && (i.width || 0) >= 200).map((i) => ({ url: i.url, thumb: viaUs(i.thumburl || i.url), w: i.width || 0, h: i.height || 0, by: '', license: '' }));
  };
  const runs = await Promise.allSettled(terms.flatMap((q) => [openverse(q), commons(q)]));
  const seen = new Set(), out = [];
  for (const x of runs.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))) if (!seen.has(x.url)) { seen.add(x.url); out.push(x); }
  if (!out.length && runs.every((r) => r.status === 'rejected')) throw new Error(runs[0].reason?.message || 'The GIF search didn’t answer');
  return out.sort((a, b) => b.w - a.w);
}
module.exports = { search, spelledOut };
