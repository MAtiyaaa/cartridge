// The game identity engine (0.9.48): IDs from names and from the game itself, cached by file version, and the
// matching order every feature now shares (ID, then the same title, then one title that starts the other).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path');
const { createIdentity, norm } = require('../electron/gameId');

function setup(extractCalls) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gid-'));
  const iso = path.join(dir, 'Some Game.iso'); fs.writeFileSync(iso, 'x');
  const roms = [
    { id: 30, name: "Demon's Souls", fs_name: "Demon's Souls (USA).pkg", platform_slug: 'ps3' },
    { id: 12, name: "Demon's Souls", fs_name: "Demon's Souls (Europe).iso", platform_slug: 'ps3' },
    { id: 40, name: 'Some Game', fs_name: 'Some Game.iso', platform_slug: 'ps3' },
    { id: 50, name: 'Ratchet & Clank', fs_name: 'Ratchet and Clank [BCUS98137].iso', platform_slug: 'ps3' },
    { id: 60, name: 'Ratchet & Clank', fs_name: 'Ratchet [SCUS97199].iso', platform_slug: 'ps2' },
  ];
  const where = { 40: iso };
  const id = createIdentity({ file: path.join(dir, 'ids.json'), roms: () => roms, whereOf: (x) => where[x] || '', extract: (r, w) => { extractCalls.push(w); return r.id === 40 ? ['bles-00001'] : []; } });
  return { id, iso, dir };
}

test('serials in names and IDs read from the game both count', () => {
  const calls = [], { id } = setup(calls);
  assert.deepStrictEqual(id.findRom({ ids: ['BCUS98137'], slugs: ['ps3'] }), { id: 50, by: 'id' });
  assert.deepStrictEqual(id.findRom({ ids: ['BLES00001'] }), { id: 40, by: 'id' }); // read from the file, normalised
});

test('a game is read once per file version', () => {
  const calls = [], { id, iso } = setup(calls);
  id.idsOf({ id: 40, name: 'Some Game', platform_slug: 'ps3' });
  id.bump(); id.idsOf({ id: 40, name: 'Some Game', platform_slug: 'ps3' });
  assert.strictEqual(calls.length, 1);
  fs.writeFileSync(iso, 'xx'); id.bump(); id.idsOf({ id: 40, name: 'Some Game', platform_slug: 'ps3' });
  assert.strictEqual(calls.length, 2);
});

test('same title gives the oldest copy, and consoles are kept apart', () => {
  const { id } = setup([]);
  assert.deepStrictEqual(id.findRom({ title: "Demon's Souls™ Trophies", slugs: ['ps3'] }), { id: 12, by: 'name' });
  assert.deepStrictEqual(id.findRom({ ids: ['SCUS97199'], slugs: ['ps3'] }), null);
  assert.deepStrictEqual(id.findRom({ title: 'Ratchet and Clank', slugs: ['ps2'] }), { id: 60, by: 'name' });
  assert.strictEqual(id.findRom({ title: 'Nothing Like It' }), null);
});

test('one normalisation for titles', () => {
  assert.strictEqual(norm('The Legend of Zelda™ (USA) [!]'), 'legend of zelda');
  assert.strictEqual(norm('Ratchet & Clank'), norm('Ratchet and Clank'));
});
