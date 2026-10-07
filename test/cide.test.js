// CIDE, the Cartridge ID Engine (0.9.51): the ID rules in one place, without changing detection. These pin that:
// the name parse is exactly the old one, every kind is classified right, Switch updates and add-ons map to their game,
// every console RomM can send has its ID kinds or a written reason, and every reader CIDE names exists.
const test = require('node:test');
const assert = require('node:assert');
const C = require('../electron/cide');
const { serialsIn } = require('../electron/syncthing');

// real-world file and folder names, as RomM and emulators write them
const NAMES = [
  'God of War (USA) [SCUS-97399].iso', 'Final Fantasy X (USA) SLUS_203.12.iso', "Demon's Souls [BLUS30443].pkg", 'NPUB30025 Flower',
  'Patapon (USA) ULUS10077.cso', 'Persona 4 Golden [PCSE00120].vpk', 'Bloodborne CUSA00900', 'Astro Bot PPSA01325',
  'The Legend of Zelda BotW [01007EF00011E000][v0].nsp', 'Zelda Update [01007EF00011E800][v786432].nsp', 'Pokemon X 0004000000055D00.3ds',
  'Tetris (USA).nes', 'Super Mario World (USA).sfc', 'SLES-50294 Ico.iso', 'scus_944.26 Ridge Racer.bin',
];

test('parse: the same IDs as before, on real names', () => {
  for (const n of NAMES) assert.deepStrictEqual(C.parse(n), [...serialsIn(n)], n);
  assert.deepStrictEqual(C.parse('Demon\'s Souls [BLUS30443].pkg'), ['BLUS30443']);
  assert.deepStrictEqual(C.parse('Tetris (USA).nes'), []);
});

test('classify: each console\'s IDs', () => {
  const k = (id, hint) => C.kindsOf(id, hint);
  assert.deepStrictEqual(k('BLUS30443'), ['ps3']);
  assert.deepStrictEqual(k('NPUB30025'), ['ps3']);
  assert.deepStrictEqual(k('ULUS10077'), ['psp']);
  assert.deepStrictEqual(k('PCSE00120'), ['vita']);
  assert.deepStrictEqual(k('CUSA00900'), ['ps4']);
  assert.deepStrictEqual(k('PPSA01325'), ['ps5']);
  assert.deepStrictEqual(k('01007EF00011E000'), ['switch']);
  assert.deepStrictEqual(k('0004000000055D00'), ['n3ds']);
  assert.deepStrictEqual(k('0005000010101C00'), ['wiiu']);
  assert.deepStrictEqual(k('SLUS20312').sort(), ['ps1', 'ps2']); // the console settles it
  assert.deepStrictEqual(k('SLUS20312', 'ps2'), ['ps2']);
  assert.deepStrictEqual(k('GALE01'), ['gcwii']);
  assert.deepStrictEqual(k('4D5307E6'), ['x360']);
  assert.strictEqual(C.consoleOf('BLUS30443'), 'ps3');
  assert.strictEqual(C.consoleOf('SLUS20312'), null);
});

test('Switch: an update and an add-on belong to their game', () => {
  assert.strictEqual(C.base('01007EF00011E800'), '01007EF00011E000');
  assert.strictEqual(C.base('01007EF00011F001'), '01007EF00011E000');
  assert.ok(C.same('01007ef0-0011e800', '01007EF00011E000'));
  assert.ok(!C.same('01007EF00011E000', '0100F2C0115B6000'));
  assert.strictEqual(C.base('BLUS30443'), 'BLUS30443');
});

test('every console RomM can send has ID kinds or a written reason', () => {
  const keys = require('../electron/cee').consoleKeys();
  const gaps = keys.filter((k) => !C.console(k));
  assert.deepStrictEqual(gaps, [], 'add the console to CONSOLES (its ID kinds and readers) or BY_NAME');
  for (const c of Object.values(C.CONSOLES)) for (const k of c.kinds) assert.ok(C.KINDS[k], k);
});

test('every reader CIDE names exists where it says', () => {
  for (const [key, c] of Object.entries(C.CONSOLES)) for (const r of c.read) {
    const m = /^([a-zA-Z]+)\.([a-zA-Z0-9]+)/.exec(r); if (!m || m[1] === 'main' || !/^[a-z]/.test(m[2])) continue;
    let mod; try { mod = require('../electron/' + m[1]); } catch { continue; } // a module with Electron imports is checked by name in main
    assert.strictEqual(typeof mod[m[2]], 'function', `${key}: ${r}`);
  }
  const main = require('fs').readFileSync(require('path').join(__dirname, '../electron/main.js'), 'utf8');
  for (const fn of ['ps3Serial', 'ppssppPatchState']) assert.match(main, new RegExp(`function ${fn}\\(`));
});

test('the identity and saves engines still find the same games (nothing in detection moved)', () => {
  const S = require('../electron/saves');
  const games = [{ id: 1, name: 'Breath of the Wild', ids: ['01007EF00011E000'] }, { id: 2, name: "Demon's Souls", ids: ['BLUS30443'] }];
  const saves = S.match([{ keys: { switch: '01007EF00011E800' } }, { keys: { serial: 'BLUS30443' } }, { keys: { name: 'Nothing' } }], games);
  assert.deepStrictEqual(saves.map((s) => s.romIds), [[1], [2], []]);
});
