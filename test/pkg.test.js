// PS3 packages through RPCS3 (0.9.3 D): reading PKG headers, install order, installing with a
// stand-in RPCS3, and the checks that guard deleting a game from RPCS3's storage.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const P = require('../electron/pkgInstall.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-pkg-'));
// a PKG header as RPCS3 reads it: magic, platform, metadata (content type, flags), content ID
function fakePkg(file, { contentId, platform = 1, type = 5, patch = false }) {
  const b = Buffer.alloc(0x100);
  b.writeUInt32BE(0x7f504b47, 0); b.writeUInt16BE(0x8000, 4); b.writeUInt16BE(platform, 6);
  b.writeUInt32BE(0xc0, 8); b.writeUInt32BE(2, 12);
  b.write(contentId, 0x30, 'latin1');
  b.writeUInt32BE(2, 0xc0); b.writeUInt32BE(4, 0xc4); b.writeUInt32BE(type, 0xc8);
  b.writeUInt32BE(3, 0xcc); b.writeUInt32BE(4, 0xd0); b.writeUInt32BE(patch ? 0x10 : 0x2, 0xd4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, b);
}
const sfo = (dir, serial) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'PARAM.SFO'), Buffer.from(`\0PSF\x01\x01\0\0TITLE_ID\0${serial}\0`, 'latin1')); };

test('reads the title ID, content type and patch flag from a PKG header', () => {
  const f = path.join(TMP, 'h/game.pkg');
  fakePkg(f, { contentId: 'UP9000-BCUS98137_00-0000000000000001' });
  const i = P.pkgInfo(f);
  assert.strictEqual(i.titleId, 'BCUS98137');
  assert.strictEqual(i.contentType, 5);
  assert.strictEqual(i.patch, false);
  fs.writeFileSync(path.join(TMP, 'h/not.pkg'), 'hello');
  assert.strictEqual(P.pkgInfo(path.join(TMP, 'h/not.pkg')), null);
});

test('install order: licences, the game, DLC, then updates oldest first; Vita packages left out', () => {
  const d = path.join(TMP, 'order');
  fakePkg(path.join(d, 'Game-A0102-V0105.pkg'), { contentId: 'UP0001-BLUS30001_00-GAMEUPDATE000000', type: 4, patch: true });
  fakePkg(path.join(d, 'Game-A0101-V0102.pkg'), { contentId: 'UP0001-BLUS30001_00-GAMEUPDATE000000', type: 4, patch: true });
  fakePkg(path.join(d, 'Game.pkg'), { contentId: 'UP0001-BLUS30001_00-GAME000000000000' });
  fakePkg(path.join(d, 'dlc/Extra.pkg'), { contentId: 'UP0001-BLUS30001_00-DLC0000000000000', type: 4 });
  fakePkg(path.join(d, 'vita.pkg'), { contentId: 'UP0001-PCSE00001_00-0000000000000000', platform: 2 });
  fs.writeFileSync(path.join(d, 'UP0001-BLUS30001_00-GAME.rap'), 'x');
  const r = P.packagesIn(d);
  assert.deepStrictEqual(r.order.map((f) => path.relative(d, f)), ['UP0001-BLUS30001_00-GAME.rap', 'Game.pkg', 'dlc/Extra.pkg', 'Game-A0101-V0102.pkg', 'Game-A0102-V0105.pkg']);
  assert.deepStrictEqual(r.titleIds, ['BLUS30001']);
});

test('installs through a stand-in RPCS3 and reads back what it made', async () => {
  const hdd = path.join(TMP, 'rpcs3/dev_hdd0');
  fs.mkdirSync(path.join(hdd, 'game/BLES00001'), { recursive: true }); // another game already there
  const pkg = path.join(TMP, 'roms/ps3/Game/Game.pkg');
  fakePkg(pkg, { contentId: 'UP0001-BLUS30001_00-GAME000000000000' });
  // stands in for RPCS3: makes the game folder named in the package and writes the arguments it got
  const exe = path.join(TMP, 'fake-rpcs3');
  fs.writeFileSync(exe, `#!/bin/sh\necho "$@" >> "${TMP}/args"\nmkdir -p "${hdd}/game/BLUS30001"\nprintf '\\0PSF TITLE_ID BLUS30001' > "${hdd}/game/BLUS30001/PARAM.SFO"\n`);
  fs.chmodSync(exe, 0o755);
  const p = P.packagesIn(path.dirname(pkg));
  const steps = [];
  const out = await P.install({ cmd: { exe, args: ['run', 'x'] }, hdds: [hdd], files: p.order, titleIds: p.titleIds, onStep: (s) => steps.push(s.step) });
  assert.deepStrictEqual(out.map((g) => [g.serial, g.created]), [['BLUS30001', true]]);
  assert.strictEqual(fs.readFileSync(path.join(TMP, 'args'), 'utf8').trim(), `run x --headless --installpkg ${pkg}`);
  assert.deepStrictEqual(steps, [1]);
});

test('finds RPCS3 storage through its vfs.yml, wherever it was moved', () => {
  const H = path.join(TMP, 'home');
  const moved = path.join(TMP, 'elsewhere/dev_hdd0');
  fs.mkdirSync(path.join(moved, 'game'), { recursive: true });
  fs.mkdirSync(path.join(H, '.config/rpcs3/config'), { recursive: true });
  fs.writeFileSync(path.join(H, '.config/rpcs3/config/vfs.yml'), `$(EmulatorDir): ""\n/dev_hdd0/: ${moved}/\n`);
  const old = process.env.XDG_CONFIG_HOME; delete process.env.XDG_CONFIG_HOME;
  try { assert.deepStrictEqual(P.rpcs3Hdds(H, []).map((h) => path.resolve(h)), [path.resolve(moved)]); }
  finally { if (old !== undefined) process.env.XDG_CONFIG_HOME = old; }
});

test('delete from RPCS3 refuses anything that is not exactly the game Cartridge installed', () => {
  const hdd = path.join(TMP, 'del/dev_hdd0');
  const game = path.join(hdd, 'game');
  sfo(path.join(game, 'BLUS30001'), 'BLUS30001');
  const ok = { emu: 'rpcs3', serial: 'BLUS30001', dir: path.join(game, 'BLUS30001'), created: true };
  assert.strictEqual(P.safeToRemove(ok, [hdd]).ok, true);
  // installed by the user in RPCS3, or only an update Cartridge installed: never
  assert.strictEqual(P.safeToRemove({ ...ok, created: false }, [hdd]).ok, false);
  // another game with a similar serial
  sfo(path.join(game, 'BLUS30001X'), 'BLUS30001');
  assert.strictEqual(P.safeToRemove({ ...ok, dir: path.join(game, 'BLUS30001X') }, [hdd]).ok, false);
  // a link in the game folder pointing elsewhere
  const outside = path.join(TMP, 'del/outside/BLUS30002'); sfo(outside, 'BLUS30002');
  fs.symlinkSync(outside, path.join(game, 'BLUS30002'));
  assert.strictEqual(P.safeToRemove({ ...ok, serial: 'BLUS30002', dir: path.join(game, 'BLUS30002') }, [hdd]).ok, false);
  // missing or wrong PARAM.SFO
  fs.mkdirSync(path.join(game, 'BLUS30003'));
  assert.strictEqual(P.safeToRemove({ ...ok, serial: 'BLUS30003', dir: path.join(game, 'BLUS30003') }, [hdd]).ok, false);
  sfo(path.join(game, 'BLUS30004'), 'BLUS39999');
  assert.strictEqual(P.safeToRemove({ ...ok, serial: 'BLUS30004', dir: path.join(game, 'BLUS30004') }, [hdd]).ok, false);
  // the game folder itself, or a folder outside RPCS3's storage
  assert.strictEqual(P.safeToRemove({ ...ok, dir: game }, [hdd]).ok, false);
  const stray = path.join(TMP, 'del/other/BLUS30001'); sfo(stray, 'BLUS30001');
  assert.strictEqual(P.safeToRemove({ ...ok, dir: stray }, [hdd]).ok, false);
});
