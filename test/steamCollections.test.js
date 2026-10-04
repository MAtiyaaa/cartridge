// Steam collections matched to consoles (0.9.24): renamed to the library's names, maker-only names left alone
const test = require('node:test');
const assert = require('node:assert');
const C = require('../electron/steamCollections');

const plats = [{ key: 'ps2', name: 'Sony PlayStation 2' }, { key: 'gc', name: 'Nintendo GameCube' }, { key: 'genesis', name: 'Sega Genesis' }, { key: 'xbox360', name: 'Microsoft Xbox 360' }, { key: 'nds', name: 'Nintendo DS' }, { key: 'n3ds', name: 'Nintendo 3DS' }];

test('collection names map to consoles by words, with or without the maker', () => {
  assert.strictEqual(C.consoleOf('PlayStation 2', plats), 'ps2');
  assert.strictEqual(C.consoleOf('PS2 Games', plats), 'ps2');
  assert.strictEqual(C.consoleOf('GameCube', plats), 'gc');
  assert.strictEqual(C.consoleOf('Mega Drive', plats), 'genesis');
  assert.strictEqual(C.consoleOf('XBOX 360', plats), 'xbox360');
  assert.strictEqual(C.consoleOf('3DS', plats), 'n3ds');
  assert.strictEqual(C.consoleOf('DS', plats), 'nds');
  assert.strictEqual(C.consoleOf('Nintendo', plats), null); // a maker holds many consoles
  assert.strictEqual(C.consoleOf('Sega', plats), null);
  assert.strictEqual(C.consoleOf('Favourites', plats), null);
  assert.strictEqual(C.consoleOf('PS3', plats), null); // not in the library
});

test('analyse proposes renames, skips taken names and duplicates', () => {
  const cols = [
    { id: 'a', name: 'PlayStation 2', added: [1, 2, 3] }, { id: 'b', name: 'PS2', added: [4] },
    { id: 'c', name: 'Nintendo GameCube', added: [] }, { id: 'd', name: 'GC', added: [5] },
    { id: 'e', name: 'RPGs', added: [6] },
  ];
  const by = Object.fromEntries(C.analyse(cols, plats).map((x) => [x.id, x]));
  assert.strictEqual(by.a.action, 'rename');
  assert.strictEqual(by.a.want, 'Sony PlayStation 2');
  assert.strictEqual(by.b.action, 'shared');
  assert.strictEqual(by.c.action, 'ok');
  assert.strictEqual(by.d.action, 'taken');
  assert.strictEqual(by.e.action, 'other');
  assert.strictEqual(C.nameFor('ps2', 'Sony PlayStation 2', { ps2: 'PS2' }), 'PS2');
});
