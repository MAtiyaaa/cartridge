// Recommendations (0.9.3 K, plan H1): work from any RomM metadata, IGDB's similar list only a bonus.
const test = require('node:test');
const assert = require('node:assert');

let R;
test.before(async () => { R = await import('../src/recs.js'); });

const g = (id, name, o = {}) => ({ id, name, platform_slug: 'ps2', genres: [], series: [], ...o });
const LIB = [
  g(1, 'Gran Turismo 4', { genres: ['Racing', 'Simulator'], series: ['Gran Turismo'], developer: 'Polyphony Digital', igdb_id: 101, similar: [102] }),
  g(2, 'Gran Turismo 3', { genres: ['Racing', 'Simulator'], series: ['Gran Turismo'], developer: 'Polyphony Digital' }),
  g(3, 'Burnout 3', { genres: ['Racing', 'Arcade'], developer: 'Criterion', igdb_id: 102 }),
  g(4, 'Tourist Trophy', { genres: ['Racing', 'Simulator'], developer: 'Polyphony Digital' }),
  g(5, 'Kingdom Hearts', { genres: ['Role-playing (RPG)'], developer: 'Square' }),
  g(6, 'Need for Speed', { genres: ['Racing'] }),
];

test('similar games without IGDB: series, studio and shared genres, each with a reason', () => {
  const noIgdb = LIB.map(({ igdb_id, similar, ...r }) => r);
  const l = R.similarTo(noIgdb[0], noIgdb);
  assert.deepStrictEqual(l.map((x) => [x.rom.id, x.why]), [[2, 'Same series'], [4, 'From Polyphony Digital']]);
  assert.ok(!l.some((x) => x.rom.id === 5), 'an RPG is not like a racing game');
});

test('IGDB similar games add matches when the server has them', () => {
  const l = R.similarTo(LIB[0], LIB, { skipSeries: true });
  assert.ok(l.some((x) => x.rom.id === 3 && x.why === 'Similar'));
  assert.ok(!l.some((x) => x.rom.id === 2), 'series shown in its own row');
});

test('Home: unplayed games like the ones you play most, naming the game', () => {
  const mins = { 1: 600 };
  const l = R.recommend(LIB, { minsOf: (r) => mins[r.id] || 0 });
  assert.strictEqual(l[0].rom.id, 2);
  assert.strictEqual(l[0].why, ''); // 0.9.16: no reason line for a sequel
  assert.ok(l.every((x) => x.rom.id !== 1), 'never what you already played');
  assert.deepStrictEqual(R.recommend(LIB, {}), [], 'nothing played yet: no row');
});
