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

test('a folder is shared once, through the key Syncthing accepts (0.9.24 welcome)', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'st-'));
  fs.mkdirSync(path.join(home, '.local/state/syncthing'), { recursive: true });
  fs.writeFileSync(path.join(home, '.local/state/syncthing/config.xml'), '<configuration><gui><address>127.0.0.1:8384</address><apikey>k1</apikey></gui></configuration>');
  fs.mkdirSync(path.join(home, 'Emulation/saves'), { recursive: true });
  const posted = [];
  const fetchImpl = async (url, o = {}) => {
    const ok = o.headers?.['X-API-Key'] === 'k1';
    const body = url.endsWith('/rest/config/folders') && !o.method ? posted : {};
    if (o.method === 'POST') posted.push({ ...JSON.parse(o.body), path: JSON.parse(o.body).path });
    return { ok, status: ok ? 200 : 403, headers: { get: () => 'application/json' }, json: async () => body, text: async () => '' };
  };
  assert.strictEqual(S.suggest(home)[0].path, path.join(home, 'Emulation/saves'));
  const dir = path.join(home, 'Sync');
  const a = await S.addFolder({ dir, label: 'Sync' }, { fetchImpl, home });
  assert.strictEqual(a.existed, false);
  assert.ok(fs.existsSync(dir));
  const b = await S.addFolder({ dir }, { fetchImpl, home });
  assert.strictEqual(b.existed, true);
  assert.strictEqual(posted.length, 1);
  fs.rmSync(home, { recursive: true, force: true });
});
