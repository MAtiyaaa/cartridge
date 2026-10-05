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

test('collection names are maker then console (0.9.27)', () => {
  assert.strictEqual(C.fullName('ps3', 'PlayStation 3'), 'Sony PlayStation 3');
  assert.strictEqual(C.fullName('wii', 'Wii'), 'Nintendo Wii');
  assert.strictEqual(C.fullName('dreamcast', 'Dreamcast'), 'Sega Dreamcast');
  assert.strictEqual(C.fullName('xbox', 'Xbox'), 'Microsoft Xbox');
  assert.strictEqual(C.fullName('ps2', 'Sony PlayStation 2'), 'Sony PlayStation 2'); // already has its maker
  assert.strictEqual(C.fullName('snes', 'Super Nintendo Entertainment System'), 'Super Nintendo Entertainment System');
  assert.strictEqual(C.fullName('arcade', 'Arcade'), 'Arcade'); // no single maker
  assert.strictEqual(C.nameFor('ps4', 'PlayStation 4', {}), 'Sony PlayStation 4');
  // the review proposes the full name, and a collection already named that way is left alone
  const by = Object.fromEntries(C.analyse([{ id: 'a', name: 'PS3', added: [] }, { id: 'b', name: 'Nintendo Wii', added: [] }], [{ key: 'ps3', name: C.fullName('ps3', 'PlayStation 3') }, { key: 'wii', name: C.fullName('wii', 'Wii') }]).map((x) => [x.id, x]));
  assert.strictEqual(by.a.want, 'Sony PlayStation 3');
  assert.strictEqual(by.b.action, 'ok');
});

// 0.9.36 (owner's photo): Steam ROM Manager's collection names are console collections too
test('Steam ROM Manager names ("<console> - <emulator>") are matched to their console', () => {
  const plats = [['nds', 'Nintendo DS'], ['n3ds', 'Nintendo 3DS'], ['wiiu', 'Wii U'], ['ps2', 'PlayStation 2']].map(([key, n]) => ({ key, name: C.fullName(key, n) }));
  assert.strictEqual(C.consoleOf('Nintendo DS - melonDS (Standalone)', plats), 'nds');
  assert.strictEqual(C.consoleOf('Nintendo 3DS - Azahar (Standalone)', plats), 'n3ds');
  assert.strictEqual(C.consoleOf('Nintendo Wii U - Cemu Native', plats), 'wiiu');
  assert.strictEqual(C.consoleOf('Sony PlayStation 2 - PCSX2', plats), 'ps2');
  assert.strictEqual(C.consoleOf('Favourites - Couch', plats), null);
});
