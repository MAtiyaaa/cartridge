// HowLongToBeat times for the game page, used when RomM has none (its HLTB source is off, or the
// game wasn't matched). Same wire contract as RomM's own handler (backend/utils/hltb_search.py):
// a short-lived session from <search url>/init, then a POST search. HLTB moves its search route now
// and then; RomM keeps the current one in its repo, so we read it from there and fall back to the
// last known one. Any failure just means no times on the page. Results are cached on disk.
const fs = require('fs');

const BASE = process.env.CARTRIDGE_HLTB_BASE || 'https://howlongtobeat.com';
const URL_FILE = 'https://raw.githubusercontent.com/rommapp/romm/refs/heads/master/backend/handler/metadata/fixtures/hltb_api_url';
// HLTB's firewall rejects tool-style agents, and the session is bound to the agent that asked for it
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const HIT_DAYS = 60, MISS_DAYS = 7;

module.exports = function hltb({ file, log = () => {} }) {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  const save = () => { try { fs.writeFileSync(file, JSON.stringify(cache)); } catch {} };
  let searchUrl = null, session = null, chain = Promise.resolve();

  async function getSearchUrl() {
    if (searchUrl) return searchUrl;
    searchUrl = BASE + '/api/search/site';
    if (!process.env.CARTRIDGE_HLTB_BASE) {
      try {
        const t = (await (await fetch(URL_FILE, { signal: AbortSignal.timeout(6000) })).text()).trim();
        if (/^https:\/\/howlongtobeat\.com\/api\//.test(t)) searchUrl = t;
      } catch {}
    }
    return searchUrl;
  }
  async function getSession(renew) {
    if (session && !renew && Date.now() - session.at < 10 * 60e3) return session;
    const r = await fetch(`${await getSearchUrl()}/init?t=${Date.now()}`, { headers: { Referer: BASE, 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('HLTB init ' + r.status);
    const d = await r.json();
    if (!d?.token) throw new Error('HLTB gave no session');
    session = { token: d.token, hpKey: d.hpKey || null, hpVal: d.hpVal || null, at: Date.now() };
    return session;
  }
  async function search(term) {
    const payload = {
      searchType: 'games', searchTerms: term.split(' '), searchPage: 1, size: 20,
      searchOptions: {
        games: { userId: 0, platform: '', sortCategory: 'popular', rangeCategory: 'main', rangeTime: { min: null, max: null }, gameplay: { perspective: '', flow: '', genre: '', difficulty: '' }, rangeYear: { min: '', max: '' }, modifier: '' },
        users: { sortCategory: 'postcount' }, lists: { sortCategory: 'follows' }, filter: '', sort: 0, randomizer: 0,
      },
      useCache: true,
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      const s = await getSession(attempt > 0);
      const headers = { 'Content-Type': 'application/json', Referer: BASE, 'User-Agent': UA, Origin: BASE, 'x-auth-token': s.token };
      const body = { ...payload };
      if (s.hpKey && s.hpVal) { headers['x-hp-key'] = s.hpKey; headers['x-hp-val'] = s.hpVal; body[s.hpKey] = s.hpVal; }
      const r = await fetch(await getSearchUrl(), { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      if (r.status === 401 || r.status === 403) continue; // session expired or refused: mint a new one once
      if (!r.ok) throw new Error('HLTB search ' + r.status);
      const d = await r.json();
      return Array.isArray(d?.data) ? d.data : [];
    }
    return [];
  }

  // "The Legend of Zelda: Ocarina of Time (USA) (Rev 1)" -> "the legend of zelda ocarina of time"
  const norm = (s) => String(s || '').toLowerCase().replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
  function best(list, name, year) {
    const n = norm(name);
    let top = null, topScore = 0;
    for (const g of list) {
      const names = [g.game_name, ...(String(g.game_alias || '').split(','))].map(norm).filter(Boolean);
      let s = 0;
      for (const x of names) {
        if (x === n) s = Math.max(s, 100);
        else if (x.startsWith(n) || n.startsWith(x)) s = Math.max(s, 70);
        else {
          const a = new Set(n.split(' ')), b = new Set(x.split(' '));
          const common = [...a].filter((w) => b.has(w)).length;
          s = Math.max(s, (common / Math.max(a.size, b.size)) * 60);
        }
      }
      if (year && g.release_world && Math.abs(g.release_world - year) <= 1) s += 15;
      if (s > topScore) { topScore = s; top = g; }
    }
    return topScore >= 55 ? top : null; // better nothing than another game's times
  }
  const hours = (sec) => (sec > 0 ? Math.round((sec / 3600) * 2) / 2 : null); // nearest half hour

  async function lookup({ name, year }) {
    const key = `${norm(name)}|${year || ''}`;
    const c = cache[key];
    if (c && Date.now() - c.t < (c.none ? MISS_DAYS : HIT_DAYS) * 86400e3) return c.none ? null : c;
    let list = await search(norm(name));
    // "Metal Gear Solid 3: Snake Eater" style names: retry with the part before the subtitle
    if (!list.length && /[:\-]/.test(name)) list = await search(norm(String(name).split(/:| - /)[0]));
    const g = best(list, name, year);
    const out = g ? { id: g.game_id, name: g.game_name, main: hours(g.comp_main), extra: hours(g.comp_plus), full: hours(g.comp_100), t: Date.now() } : { none: true, t: Date.now() };
    if (g && !out.main && !out.extra && !out.full) { cache[key] = { none: true, t: Date.now() }; save(); return null; }
    cache[key] = out; save();
    return g ? out : null;
  }
  // one lookup at a time, so browsing quickly never bursts requests at HLTB
  return {
    forGame(q) {
      const run = chain.then(() => lookup(q)).catch((e) => { log('hltb', e.message); return null; });
      chain = run.then(() => {}, () => {});
      return run;
    },
  };
};
