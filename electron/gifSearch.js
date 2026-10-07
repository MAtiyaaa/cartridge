'use strict';
// GIFs for Start's picture widget (0.9.28; 0.9.39, owner: "the images don't load, and PS4 finds nothing").
// Openverse alone has few GIFs and short names miss ("ps4"), so: the words as typed and spelled out (PS4 ->
// PlayStation 4), from Openverse and Wikimedia Commons (both free, no key), small ones down to 200 px kept.
// 0.9.52 (owner: "you only get two, three options, the selection is bad"): Tenor first. Its search pages carry the
// results as JSON (the store-cache script), 50 a search, safe-search on, no key; page 2 on asks Tenor again with a
// second word added (Tenor's pages have no "next"), and Openverse and Commons follow as before.
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
  const tenor = async (q) => {
    const r = await wf(`https://tenor.com/search/${tenorSlug(q)}-gifs`, { headers: { 'User-Agent': BROWSER, 'Accept-Language': 'en' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`Tenor answered ${r.status}`);
    return tenorResults(await r.text()).map((x) => ({ ...x, thumb: viaUs(x.thumb) }));
  };
  const tq = (page === 1 ? terms.slice().reverse() : terms.slice().reverse().map((q) => q + ' ' + MORE[(page - 2) % MORE.length])); // spelled out first: Tenor's "ps4" is mostly not games
  const [tRuns, fRuns] = await Promise.all([Promise.allSettled(tq.map(tenor)), Promise.allSettled(terms.flatMap((q) => [openverse(q), commons(q)]))]);
  const seen = new Set(), out = [], take = (runs) => { for (const x of runs.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))) if (!seen.has(x.url)) { seen.add(x.url); out.push(x); } };
  take(tRuns); // Tenor in its own order (most relevant first)
  const n = out.length;
  take(fRuns);
  const runs = tRuns.concat(fRuns);
  if (!out.length && runs.every((r) => r.status === 'rejected')) throw new Error(runs.find((r) => r.status === 'rejected').reason?.message || 'The GIF search didn’t answer');
  return out.slice(0, n).concat(out.slice(n).sort((a, b) => b.w - a.w));
}
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const MORE = ['game', 'gaming', 'aesthetic', 'pixel', 'loop', 'retro'];
const tenorSlug = (q) => q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'games';
// the results inside a Tenor search page: the biggest GIF that's still light (mediumgif, else gif), tinygif to show
function tenorResults(html) {
  const m = /<script[^>]*id="store-cache"[^>]*>([\s\S]*?)<\/script>/.exec(html || '');
  if (!m) return [];
  let d; try { d = JSON.parse(m[1]); } catch { return []; }
  const lists = Object.values(d?.universal?.search || {}).map((v) => v?.results || []);
  const out = [];
  for (const x of lists.flat()) {
    const f = x?.media_formats || {}, g = f.mediumgif || f.gif, t = f.tinygif || g;
    if (!g?.url || !/^https:\/\/media\d*\.tenor\.com\//.test(g.url)) continue;
    const [w, h] = g.dims || [0, 0];
    if (w && w < 200) continue;
    out.push({ url: g.url, thumb: t.url, w, h, by: 'Tenor', license: '', title: x.content_description || x.title || '' });
  }
  return out;
}
module.exports = { search, spelledOut, tenorResults, tenorSlug };
