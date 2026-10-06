// Cartridge Save Sync (0.9.51): units found in fake homes, RomM's hash, the decision table, and two devices syncing
// through a fake RomM that behaves like backend/endpoints/saves.py (slots with versions, content hash, 409 when
// another device saved since this device's last sync).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const SS = require('../electron/saveSync');

const tmp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cart-ss-')));
const put = (root, rel, text) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const SWITCH_ID = '0100F2C0115B6000';

// a device with Eden (its own user ID), RPCS3, a PCSX2 card and RetroArch saves and states
function device(user, o = {}) {
  const h = tmp();
  if (!o.empty) {
    put(h, `.local/share/eden/nand/user/save/0000000000000000/${user}/${SWITCH_ID}/save.bin`, o.sw || 'zelda 1');
    put(h, '.config/rpcs3/dev_hdd0/home/00000001/savedata/BLUS30443-SAVE/PARAM.SFO', 'x');
    put(h, '.config/rpcs3/dev_hdd0/home/00000001/savedata/BLUS30443-SAVE/DATA.BIN', o.ps3 || 'demons 1');
    put(h, '.config/PCSX2/memcards/Mcd001.ps2', o.card || 'card 1');
    put(h, '.config/retroarch/retroarch.cfg', '');
    put(h, '.config/retroarch/saves/Super Metroid (USA).srm', 'srm 1');
    put(h, '.config/retroarch/states/Snes9x/Super Metroid (USA).state', 'state 1');
    put(h, '.config/retroarch/states/Snes9x/Super Metroid (USA).state1', 'state 2');
  } else {
    fs.mkdirSync(path.join(h, `.local/share/eden/nand/user/save/0000000000000000/${user}`), { recursive: true });
    fs.mkdirSync(path.join(h, '.config/rpcs3/dev_hdd0/home/00000001'), { recursive: true });
    fs.mkdirSync(path.join(h, '.config/PCSX2/memcards'), { recursive: true });
    put(h, '.config/retroarch/retroarch.cfg', '');
    fs.mkdirSync(path.join(h, '.config/retroarch/saves'), { recursive: true });
    fs.mkdirSync(path.join(h, '.config/retroarch/states'), { recursive: true });
  }
  return h;
}
const GAMES = [
  { id: 1, name: 'The Legend of Zelda', ids: [SWITCH_ID] },
  { id: 2, name: "Demon's Souls", ids: ['BLUS30443'] },
  { id: 3, name: 'Super Metroid (USA)', ids: [] },
  { id: 9, name: 'Ico', ids: ['SCUS97113'] },
];
const CARRIERS = { ps2: 9 };

// RomM: saves by (rom, slot), newest wins; per-device sync records like device_save_sync
function fakeRomm() {
  const saves = [], syncs = new Map(); let id = 0, clock = 1000;
  const hashOf = (buf) => SS.hashArchive(SS.unzip(buf));
  const rpcFor = (dev) => ({
    list: async (romId, slot) => saves.filter((s) => s.rom_id === romId && s.slot === slot),
    upload: async (u, buf, name, { overwrite } = {}) => {
      const slotSaves = saves.filter((s) => s.rom_id === u.romId && s.slot === u.slot).sort((a, b) => b.updated_at - a.updated_at);
      const latest = slotSaves[0], sync = latest && syncs.get(dev + ':' + latest.id);
      if (latest && !overwrite && (!sync || sync < latest.updated_at)) return { conflict: true }; // 409
      const s = { id: ++id, rom_id: u.romId, slot: u.slot, buf, content_hash: hashOf(buf), updated_at: ++clock, file_name: name };
      saves.push(s); syncs.set(dev + ':' + s.id, s.updated_at);
      return s;
    },
    download: async (sid) => { const s = saves.find((x) => x.id === sid); syncs.set(dev + ':' + sid, s.updated_at); return s.buf; },
    confirm: async () => {},
  });
  return { saves, rpcFor };
}
const ledger = () => { const m = new Map(); return { get: (k) => m.get(k), set: (k, v) => m.set(k, v), m }; };

test('units: every kind found, keyed without the device\'s own user folder, cards on the carrier', () => {
  const h = device('AAAA1111');
  const us = SS.units({ home: h, games: GAMES, carriers: CARRIERS });
  const by = Object.fromEntries(us.map((u) => [u.key, u]));
  assert.strictEqual(by['switch:' + SWITCH_ID].romId, 1);
  assert.strictEqual(by['switch:' + SWITCH_ID].kind, 'dir');
  assert.strictEqual(by['ps3:BLUS30443-SAVE'].romId, 2);
  assert.strictEqual(by['ps2card:Mcd001.ps2'].romId, 9); // the whole card, on the console's carrier game
  assert.strictEqual(by['ra:Super Metroid (USA).srm'].romId, 3);
  const st = by['rastate:Snes9x/Super Metroid (USA)'];
  assert.deepStrictEqual(st.files, ['Super Metroid (USA).state', 'Super Metroid (USA).state1']);
  assert.strictEqual(st.romId, 3);
  assert.match(by['switch:' + SWITCH_ID].slot, /^cartridge:eden:dir:switch:/);
});

test('only Eden for Switch saves', () => {
  const h = device('AAAA1111');
  put(h, `.local/share/citron/nand/user/save/0000000000000000/X/${'0100000000010000'}/a.bin`, 'c');
  put(h, '.config/Ryujinx/bis/user/save/0000000000000001/0/a.bin', 'r');
  const keys = SS.units({ home: h, games: GAMES }).map((u) => u.emu);
  assert.ok(!keys.includes('citron') && !keys.includes('ryujinx'));
});

test('hash: the same as RomM\'s for the zip Cartridge uploads', () => {
  const h = device('AAAA1111');
  const u = SS.units({ home: h, games: GAMES }).find((x) => x.key.startsWith('ps3:'));
  const buf = SS.zip(SS.entriesOf(u));
  assert.strictEqual(SS.hashArchive(SS.unzip(buf)), SS.hashUnit(u));
  // RomM's own code (handler/filesystem/assets_handler.py hash_zip_contents), run in Python when it's there
  let py = null; try { execFileSync('python3', ['-c', 'pass']); py = 'python3'; } catch {}
  if (!py) return;
  const f = path.join(h, 'up.zip'); fs.writeFileSync(f, buf);
  const romm = execFileSync(py, ['-c', `
import hashlib, zipfile, sys
zf = zipfile.ZipFile(sys.argv[1])
lines = []
for name in sorted(zf.namelist()):
    if not name.endswith('/'):
        lines.append(name + ':' + hashlib.md5(zf.read(name)).hexdigest())
print(hashlib.md5('\\n'.join(lines).encode()).hexdigest())`, f]).toString().trim();
  assert.strictEqual(romm, SS.hashUnit(u));
});

test('decide: up, down, same, and a conflict is never guessed', () => {
  const r = (hash) => ({ id: 1, hash });
  assert.strictEqual(SS.decide(null, null, null), 'none');
  assert.strictEqual(SS.decide('a', null, null), 'up');
  assert.strictEqual(SS.decide(null, r('a'), null), 'down');
  assert.strictEqual(SS.decide('a', r('a'), null), 'same');
  assert.strictEqual(SS.decide('a', r('b'), null), 'conflict'); // first sync here, both differ
  assert.strictEqual(SS.decide('b', r('a'), { hash: 'a', remoteHash: 'a' }), 'up');
  assert.strictEqual(SS.decide('a', r('b'), { hash: 'a', remoteHash: 'a' }), 'down');
  assert.strictEqual(SS.decide('c', r('b'), { hash: 'a', remoteHash: 'a' }), 'conflict');
});

test('two devices through RomM: up, brought over, changed, back, and a conflict', async () => {
  const romm = fakeRomm();
  const A = device('AAAA1111'), B = device('BBBB2222', { empty: true });
  const la = ledger(), lb = ledger(), bk = tmp(), opts = (home) => ({ home, backupsRoot: bk, procs: [] });
  // A uploads everything it has
  for (const u of SS.units({ home: A, games: GAMES, carriers: CARRIERS })) assert.strictEqual((await SS.syncUnit(u, romm.rpcFor('A'), la, opts(A))).result, 'up');
  // B has none of them: they come from RomM into B's own folders (B's Eden user, not A's)
  const keysB = new Set(SS.units({ home: B, games: GAMES }).map((u) => u.key));
  const remote = SS.remoteOnly(romm.saves, keysB);
  assert.strictEqual(remote.length, 5);
  for (const u of remote) assert.strictEqual((await SS.syncUnit(u, romm.rpcFor('B'), lb, opts(B))).result, 'down', u.key);
  assert.strictEqual(fs.readFileSync(path.join(B, `.local/share/eden/nand/user/save/0000000000000000/BBBB2222/${SWITCH_ID}/save.bin`), 'utf8'), 'zelda 1');
  assert.strictEqual(fs.readFileSync(path.join(B, '.config/retroarch/states/Snes9x/Super Metroid (USA).state1'), 'utf8'), 'state 2');
  // B plays and saves: up; A, unchanged, takes it down (and keeps a backup of its old save)
  put(B, '.config/rpcs3/dev_hdd0/home/00000001/savedata/BLUS30443-SAVE/DATA.BIN', 'demons 2');
  const ub = SS.units({ home: B, games: GAMES }).find((u) => u.key === 'ps3:BLUS30443-SAVE');
  assert.strictEqual((await SS.syncUnit(ub, romm.rpcFor('B'), lb, opts(B))).result, 'up');
  const ua = SS.units({ home: A, games: GAMES }).find((u) => u.key === 'ps3:BLUS30443-SAVE');
  assert.strictEqual((await SS.syncUnit(ua, romm.rpcFor('A'), la, opts(A))).result, 'down');
  assert.strictEqual(fs.readFileSync(path.join(A, '.config/rpcs3/dev_hdd0/home/00000001/savedata/BLUS30443-SAVE/DATA.BIN'), 'utf8'), 'demons 2');
  assert.ok(fs.readdirSync(bk).some((d) => d.startsWith('ps3_BLUS30443-SAVE')));
  // both change before syncing: a conflict, nothing written; then the person picks theirs
  put(A, '.config/PCSX2/memcards/Mcd001.ps2', 'card A');
  put(B, '.config/PCSX2/memcards/Mcd001.ps2', 'card B');
  const cb = SS.units({ home: B, games: GAMES, carriers: CARRIERS }).find((u) => u.key === 'ps2card:Mcd001.ps2');
  assert.strictEqual((await SS.syncUnit(cb, romm.rpcFor('B'), lb, opts(B))).result, 'up');
  const ca = SS.units({ home: A, games: GAMES, carriers: CARRIERS }).find((u) => u.key === 'ps2card:Mcd001.ps2');
  assert.strictEqual((await SS.syncUnit(ca, romm.rpcFor('A'), la, opts(A))).result, 'conflict');
  assert.strictEqual(fs.readFileSync(path.join(A, '.config/PCSX2/memcards/Mcd001.ps2'), 'utf8'), 'card A');
  assert.strictEqual((await SS.syncUnit(ca, romm.rpcFor('A'), la, { ...opts(A), choice: 'theirs' })).result, 'down');
  assert.strictEqual(fs.readFileSync(path.join(A, '.config/PCSX2/memcards/Mcd001.ps2'), 'utf8'), 'card B');
});

test('guard rails: never under a running emulator, never a damaged download, unmatched saves stay put', async () => {
  const romm = fakeRomm();
  const A = device('AAAA1111'), bk = tmp(), l = ledger();
  const u = SS.units({ home: A, games: GAMES }).find((x) => x.key.startsWith('ps3:'));
  assert.strictEqual((await SS.syncUnit(u, romm.rpcFor('A'), l, { home: A, backupsRoot: bk, procs: ['/usr/bin/rpcs3 --no-gui game'] })).result, 'busy');
  assert.strictEqual((await SS.syncUnit({ ...u, romId: null }, romm.rpcFor('A'), l, { home: A, backupsRoot: bk, procs: [] })).result, 'unmatched');
  // RomM answers with bytes that don't match its own hash: nothing is written
  await SS.syncUnit(u, romm.rpcFor('A'), l, { home: A, backupsRoot: bk, procs: [] });
  const B = device('BBBB2222', { empty: true });
  const bad = { ...romm.rpcFor('B'), download: async () => SS.zip([['DATA.BIN', null]].slice(0, 0).concat([['x.bin', path.join(A, '.config/retroarch/retroarch.cfg')]])) };
  const rem = SS.remoteOnly(romm.saves, new Set())[0];
  assert.strictEqual((await SS.syncUnit(rem, bad, ledger(), { home: B, backupsRoot: bk, procs: [] })).result, 'damaged');
  assert.ok(!fs.existsSync(path.join(B, '.config/rpcs3/dev_hdd0/home/00000001/savedata/BLUS30443-SAVE')));
});

test('zip: refuses names that leave the save\'s folder', () => {
  const buf = SS.zip([['ok.bin', __filename]]);
  const evil = Buffer.from(buf.toString('latin1').replace(/ok\.bin/g, '../x.b'), 'latin1');
  assert.throws(() => SS.unzip(evil), /unsafe/);
});
