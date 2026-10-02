// Recommendations and similar games (0.9.3 K, plan H1, owner's pick: IGDB when the server has it,
// but it must work without). Everything comes from what RomM already synced: series, genres,
// developer and game modes from any metadata source (IGDB, ScreenScraper, MobyGames, LaunchBox...),
// plus IGDB's similar games list only when present. Your play time and finished games weigh in.
// Each result carries a short reason so a row never feels random. Pure functions, tested in
// test/recs.test.js.

const norm = (s) => String(s || '').toLowerCase().trim();
const DONE = new Set(['finished', 'completed_100']);
const SKIP = new Set(['retired', 'never_playing']);

// how alike two games are, and the strongest reason why: { score, kind, detail }
function likeness(a, b) {
  let score = 0, kind = null, detail = '', wt = 0;
  const note = (w, k, d = '') => { score += w; if (w > wt) { wt = w; kind = k; detail = d; } };
  const sa = new Set((a.series || []).map(norm));
  if ((b.series || []).some((s) => sa.has(norm(s)))) note(6, 'series');
  if ((a.igdb_id && (b.similar || []).includes(a.igdb_id)) || (b.igdb_id && (a.similar || []).includes(b.igdb_id))) note(4, 'similar');
  if (a.developer && norm(a.developer) === norm(b.developer)) note(2.5, 'studio', b.developer);
  const ga = new Set((a.genres || []).map(norm));
  const shared = (b.genres || []).filter((g) => ga.has(norm(g)));
  if (shared.length) note(shared.length * 1.2, 'genre', shared[0]);
  if (a.platform_slug && a.platform_slug === b.platform_slug) score += 0.3; // a nudge, never a reason
  return { score, kind, detail };
}

// The game page: games most like this one, each with its reason. The series row is shown on its
// own, so series matches can be left out with skipSeries.
export function similarTo(me, roms, { skipSeries = false, limit = 30 } = {}) {
  if (!me) return [];
  const out = [];
  const min = (me.genres || []).length > 1 ? 2.4 : 1.2; // one shared genre alone isn't "similar" when there are several
  for (const r of roms) {
    if (r.id === me.id || norm(r.name) === norm(me.name)) continue;
    const { score, kind, detail } = likeness(me, r);
    if (!kind || score < min || (skipSeries && kind === 'series')) continue;
    const why = { series: 'Same series', similar: 'Similar', studio: `From ${detail}`, genre: detail }[kind];
    out.push({ rom: r, why, score: score + (r.rating || 0) / 200 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

// Home: "Because you played …". Seeds are the games you played most, finished, or marked as
// playing; candidates are games you haven't started. Weighted by how much you played each seed.
export function recommend(roms, { minsOf = () => 0, lastPlay = () => 0, limit = 30 } = {}) {
  const played = (r) => minsOf(r) > 0 || lastPlay(r) > 0 || !!r.user?.status || r.user?.playing;
  const seeds = roms
    .filter((r) => (minsOf(r) >= 20 || DONE.has(r.user?.status) || r.user?.playing) && !SKIP.has(r.user?.status))
    .map((r) => ({ r, w: 1 + Math.min(3, Math.log10(1 + minsOf(r) / 30)) + (DONE.has(r.user?.status) ? 1 : 0) }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 12);
  if (!seeds.length) return [];
  const best = new Map();
  for (const r of roms) {
    if (played(r) || r.user?.hidden) continue;
    for (const s of seeds) {
      if (norm(s.r.name) === norm(r.name)) continue;
      const { score, kind } = likeness(s.r, r);
      if (!kind || score < 2) continue;
      const total = score * s.w + (r.rating || 0) / 100;
      const cur = best.get(r.id);
      if (!cur || total > cur.score) best.set(r.id, { rom: r, why: becauseOf(kind, s.r), score: total });
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
// the reason as Home shows it, always naming the game you played
function becauseOf(kind, seed) {
  if (kind === 'series') return `Same series as ${seed.name}`;
  if (kind === 'studio') return `Same studio as ${seed.name}`;
  return `Because you played ${seed.name}`;
}
