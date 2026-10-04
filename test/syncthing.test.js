// Syncthing smart search (0.9.23): synced files matched to games by serial, title ID or name
const test = require('node:test');
const assert = require('node:assert');
const S = require('../electron/syncthing');

test('serials and title IDs are read from paths', () => {
  assert.deepStrictEqual([...S.serialsIn('memcards/SLUS-20062.ps2 BLUS30001/ CUSA00419 0100F2C0115B6000 SCES_123.45')], ['SLUS20062', 'BLUS30001', 'CUSA00419', '0100F2C0115B6000', 'SCES12345']);
});

test('files go to games by serial first, then the longest name, saves and textures apart', () => {
  const games = [{ id: 1, name: 'Sonic', ids: [] }, { id: 2, name: 'Sonic Adventure 2 (USA)', ids: [] }, { id: 3, name: 'Gran Turismo 4', ids: ['SCUS-97328'] }];
  const folders = [
    { id: 'a', label: 'PCSX2 saves', path: '/s/pcsx2/memcards', files: [{ path: 'SCUS97328/x.bin', size: 4, at: 5 }, { path: 'unknown.bin', size: 1, at: 1 }] },
    { id: 'b', label: 'Dolphin', path: '/s/dolphin', files: [{ path: 'Load/Textures/Sonic Adventure 2/a.png', size: 10, at: 2 }, { path: 'GC/Sonic Heroes.gci', size: 3, at: 9 }] },
  ];
  const m = S.matchGames(games, folders);
  assert.strictEqual(m[3].saves[0].files, 1);
  assert.strictEqual(m[2].textures[0].size, 10);
  assert.strictEqual(m[1], undefined); // "Sonic" is too short to match by name
  assert.strictEqual(Object.keys(m).length, 2);
});
