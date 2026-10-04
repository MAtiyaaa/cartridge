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

test('games are found in the main server’s folders too, and texture folders by their game folders (0.9.28)', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'st-'));
  fs.mkdirSync(path.join(home, '.local/state/syncthing'), { recursive: true });
  fs.writeFileSync(path.join(home, '.local/state/syncthing/config.xml'), '<configuration><gui><address>127.0.0.1:8384</address><apikey>k1</apikey></gui></configuration>');
  const local = { '/rest/config/folders': [{ id: 'saves', label: 'Saves', path: '/s/pcsx2/memcards' }], '/rest/db/browse?folder=saves': [{ name: 'SCUS97328', type: 'FILE_INFO_TYPE_DIRECTORY', children: [{ name: 'x.bin', size: 4 }] }] };
  const server = { '/rest/config/folders': [{ id: 'saves', label: 'Saves', path: '/srv/saves' }, { id: 'tex', label: 'Dolphin textures', path: '/srv/dolphin/Load/Textures' }], '/rest/db/browse?folder=tex': [{ name: 'GALE01', type: 'FILE_INFO_TYPE_DIRECTORY', children: [] }] };
  const fetchImpl = async (url) => {
    const u = new URL(url), key = u.pathname + (u.searchParams.get('folder') ? '?folder=' + u.searchParams.get('folder') : '');
    const src = u.port === '8384' ? local : server;
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => src[key] || [], text: async () => '' };
  };
  const games = [{ id: 1, name: 'Gran Turismo 4', ids: ['SCUS-97328'] }, { id: 2, name: 'Super Smash Bros. Melee', ids: [], discIds: ['GALE01'] }];
  const r = await S.gamesSynced(games, { fetchImpl, home, server: { address: 'http://10.0.0.5:8385', apikey: 'k2' } });
  assert.strictEqual(r.folders, 2); // 'saves' read once
  assert.ok(r.games[1].saves.length);
  assert.ok(r.games[2].textures.length);
  fs.rmSync(home, { recursive: true, force: true });
});

// The Syncthing Update (0.9.29): main device only on a blank Syncthing, joining takes folders at its own paths
function fakeSyncthing(home, state) {
  const fs = require('fs'), path = require('path');
  fs.mkdirSync(path.join(home, '.local/state/syncthing'), { recursive: true });
  fs.writeFileSync(path.join(home, '.local/state/syncthing/config.xml'), '<configuration><gui><address>127.0.0.1:8384</address><apikey>k</apikey></gui></configuration>');
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    const u = new URL(url), m = opts.method || 'GET', body = opts.body ? JSON.parse(opts.body) : null;
    if (m !== 'GET') calls.push([m, u.pathname, body]);
    let out = {};
    if (u.pathname === '/rest/system/ping') out = { ping: 'pong' };
    else if (u.pathname === '/rest/system/status') out = { myID: state.me };
    else if (u.pathname === '/rest/config') out = state.conf;
    else if (u.pathname === '/rest/cluster/pending/folders') out = state.pendingFolders || {};
    else if (u.pathname === '/rest/cluster/pending/devices') out = {};
    else if (m === 'POST' && u.pathname === '/rest/config/folders') state.conf.folders.push(body);
    else if (m === 'POST' && u.pathname === '/rest/config/devices') state.conf.devices.push(body);
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => out, text: async () => '' };
  };
  return { fetchImpl, calls };
}
const ME = 'AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG-HHHHHHH', OTHER = 'ZZZZZZZ-YYYYYYY-XXXXXXX-WWWWWWW-VVVVVVV-UUUUUUU-TTTTTTT-SSSSSSS';

test('main device: only on a blank Syncthing, one folder per console at the real save folder, versioned', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'st-'));
  const state = { me: ME, conf: { devices: [{ deviceID: ME }], folders: [{ id: 'default', path: '~/Sync', devices: [{ deviceID: ME }] }] } };
  const { fetchImpl, calls } = fakeSyncthing(home, state);
  const roots = [{ id: 'cartridge-saves-switch', label: 'Switch Saves', path: path.join(home, 'eden/nand/user/save') }];
  const r = await S.makeMain(roots, { fetchImpl, home });
  assert.deepStrictEqual(r.made, ['cartridge-saves-switch']);
  const f = calls.find((c) => c[1] === '/rest/config/folders')[2];
  assert.strictEqual(f.path, roots[0].path);
  assert.strictEqual(f.type, 'sendreceive');
  assert.strictEqual(f.versioning.type, 'staggered');
  // a second run adds nothing; a Syncthing already used with another device is never changed
  assert.deepStrictEqual((await S.makeMain(roots, { fetchImpl, home, mine: true })).made, []);
  const used = fakeSyncthing(home, { me: ME, conf: { devices: [{ deviceID: ME }, { deviceID: OTHER }], folders: [] } });
  await assert.rejects(S.makeMain(roots, { fetchImpl: used.fetchImpl, home }), /leaves it as it is/);
  assert.strictEqual(used.calls.length, 0);
  fs.rmSync(home, { recursive: true, force: true });
});

test('pairing: a device ID is checked, gets every Cartridge folder; joining takes folders receive only at its own paths', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'st-'));
  const state = { me: ME, conf: { devices: [{ deviceID: ME }], folders: [{ id: 'cartridge-saves-ps2', devices: [{ deviceID: ME }] }, { id: 'mine', devices: [] }] } };
  const { fetchImpl, calls } = fakeSyncthing(home, state);
  await assert.rejects(S.addDevice({ id: 'nope' }, { fetchImpl, home }), /device ID/);
  await S.addDevice({ id: OTHER.toLowerCase(), name: 'Deck' }, { fetchImpl, home });
  assert.ok(calls.some((c) => c[0] === 'POST' && c[1] === '/rest/config/devices' && c[2].deviceID === OTHER && c[2].autoAcceptFolders === false));
  const put = calls.find((c) => c[0] === 'PUT');
  assert.strictEqual(put[1], '/rest/config/folders/cartridge-saves-ps2'); // only Cartridge's folders are shared
  assert.ok(put[2].devices.some((d) => d.deviceID === OTHER));
  state.pendingFolders = { 'cartridge-saves-ps2': { offeredBy: { [OTHER]: { label: 'PS2 Memory Cards' } } }, 'cartridge-saves-x360': { offeredBy: { [OTHER]: {} } }, 'someone-else': { offeredBy: { [OTHER]: {} } } };
  const r = await S.acceptFolders([{ id: 'cartridge-saves-ps2', label: 'PS2 Memory Cards', path: path.join(home, 'PCSX2/memcards') }], { fetchImpl, home });
  assert.deepStrictEqual(r, { added: ['cartridge-saves-ps2'], missing: ['cartridge-saves-x360'] });
  const added = calls.filter((c) => c[1] === '/rest/config/folders').pop()[2];
  assert.strictEqual(added.type, 'receiveonly');
  assert.strictEqual(added.path, path.join(home, 'PCSX2/memcards'));
  await assert.rejects(S.setType('mine', 'sendreceive', { fetchImpl, home }), /its own/);
  fs.rmSync(home, { recursive: true, force: true });
});
