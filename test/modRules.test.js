// The mod rule book (0.9.52): every emulator Cartridge lists for add-ons has a rule, nothing without one installs,
// RetroArch and RPCS3 take no mods (ROM hacks and patches have their own ways)
const test = require('node:test');
const assert = require('node:assert');
const R = require('../electron/modRules');
const P = require('../electron/emuProfiles');
const I = require('../electron/addonInstall');

test('every add-on emulator has a rule, with where it goes and what it needs', () => {
  for (const id of ['pcsx2', 'duckstation', 'ppsspp', 'dolphin', 'azahar', 'citra', 'cemu', 'shadps4', 'eden', 'citron', 'yuzu', 'ryujinx']) {
    const k = R.kindOf(id); assert.ok(k, id);
    for (const f of ['what', 'where', 'needs', 'on']) assert.ok(R.RULES[k][f], `${id} ${f}`);
    assert.strictEqual(P.modKind(id), k);
  }
  assert.strictEqual(R.kindOf('pcsx2', 'ps2'), 'ps2');
});

test('no rule, no install: RetroArch, RPCS3 and unknown emulators refuse', () => {
  for (const id of ['retroarch', 'rpcs3', 'mgba', 'xemu', 'nobody']) { assert.strictEqual(R.takesMods(id), false, id); assert.strictEqual(P.modKind(id), 'plain'); }
  assert.deepStrictEqual(I.plan([{ rel: 'Mod/data.bin' }], 'plain'), []);
  assert.match(R.refusal(null), /doesn’t know where/);
  assert.match(R.refusal('cemu'), /rules\.txt/);
});

test('archives that don\'t match the layout are refused, not dumped', () => {
  const to = (rels, kind, o) => I.plan(rels.map((rel) => ({ rel })), kind, o).map((x) => x.to);
  assert.deepStrictEqual(to(['Pack/readme.txt', 'Pack/screens/a.jpg.url'], 'ppsspp'), []); // no textures.ini
  assert.deepStrictEqual(to(['Pack/readme.txt', 'Pack/GALE01/tex1.png'], 'dolphin', { id: 'GALE01' }), ['tex1.png']);
  assert.deepStrictEqual(to(['Mod/readme.md', 'Mod/Data/stuff.pak'], 'switch', { name: 'Mod' }), []); // a PC build's files
  assert.deepStrictEqual(to(['Mod/romfs/a.bin', 'Mod/readme.md'], 'switch', { name: 'Mod' }), ['Mod/romfs/a.bin']);
});

test('mod sites are offered only with an emulator that takes mods', () => {
  const E = require('../electron/modEngine').createModEngine({ web: {}, key: () => null });
  const ids = (g) => E.sourcesFor(g).map((s) => s.id);
  assert.ok(ids({ name: 'Zelda', slug: 'switch', mods: true }).includes('gb'));
  assert.ok(!ids({ name: 'Zelda', slug: 'switch', mods: false }).includes('gb'));
  assert.ok(!ids({ name: 'Zelda', slug: 'switch', mods: false }).includes('nexus'));
});
