// Vita archives installed the way Vita3K's interface.cpp does (0.9.19): unencrypted contents unpacked by
// Cartridge into ux0/app, ux0/addcont and ux0/patch (merged into the app); NoNpDrm and Vitamin told apart.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const P = require('../electron/pkgInstall.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-vita-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

function zip(file, entries) {
  const locals = [], centrals = []; let off = 0;
  for (const [name, val] of Object.entries(entries)) {
    const data = Buffer.isBuffer(val) ? val : Buffer.from(val), n = Buffer.from(name), crc = zlib.crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(n.length, 26);
    locals.push(h, n, data);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(off, 42);
    centrals.push(c, n);
    off += 30 + n.length + data.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(entries).length, 8); end.writeUInt16LE(Object.keys(entries).length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  fs.writeFileSync(file, Buffer.concat([...locals, cd, end]));
}
// a param.sfo with string keys
function sfo(kv) {
  const keys = Object.keys(kv), kb = [], db = []; let ko = 0, dof = 0;
  const idx = Buffer.alloc(16 * keys.length);
  keys.forEach((k, i) => {
    const kbuf = Buffer.from(k + '\0'), d = Buffer.from(kv[k] + '\0');
    idx.writeUInt16LE(ko, i * 16); idx.writeUInt16LE(0x0204, i * 16 + 2); idx.writeUInt32LE(d.length, i * 16 + 4); idx.writeUInt32LE(d.length, i * 16 + 8); idx.writeUInt32LE(dof, i * 16 + 12);
    kb.push(kbuf); db.push(d); ko += kbuf.length; dof += d.length;
  });
  const head = Buffer.alloc(20), K = Buffer.concat(kb);
  head.writeUInt32BE(0x00505346, 0); head.writeUInt32LE(0x101, 4); head.writeUInt32LE(20 + idx.length, 8); head.writeUInt32LE(20 + idx.length + K.length, 12); head.writeUInt32LE(keys.length, 16);
  return Buffer.concat([head, idx, K, Buffer.concat(db)]);
}

test('unencrypted game, DLC and update unpacked like Vita3K; encrypted and Vitamin told apart', async () => {
  const pref = path.join(TMP, 'fs');
  const game = path.join(TMP, 'game.vpk');
  zip(game, { 'sce_sys/param.sfo': sfo({ TITLE_ID: 'PCSE00001', CATEGORY: 'gd', CONTENT_ID: 'EP0001-PCSE00001_00-0000000000000000' }), 'eboot.bin': 'x', 'data/a.txt': 'a' });
  const c = await P.vitaArchiveContents(game);
  assert.strictEqual(c.length, 1); assert.strictEqual(c[0].encrypted, false);
  await P.vitaUnpack(game, pref, c);
  assert.strictEqual(fs.readFileSync(path.join(pref, 'ux0/app/PCSE00001/data/a.txt'), 'utf8'), 'a');
  // an update merges into the app (io.cpp copy_path) and leaves no patch folder
  const upd = path.join(TMP, 'upd.vpk');
  zip(upd, { 'sce_sys/param.sfo': sfo({ TITLE_ID: 'PCSE00001', CATEGORY: 'gp', CONTENT_ID: 'EP0001-PCSE00001_00-0000000000000000' }), 'data/a.txt': 'b' });
  await P.vitaUnpack(upd, pref, await P.vitaArchiveContents(upd));
  assert.strictEqual(fs.readFileSync(path.join(pref, 'ux0/app/PCSE00001/data/a.txt'), 'utf8'), 'b');
  assert.ok(!fs.existsSync(path.join(pref, 'ux0/patch/PCSE00001')));
  // DLC: addcont/<title>/<content ID from character 20>
  const dlc = path.join(TMP, 'dlc.zip');
  zip(dlc, { 'Wrap/sce_sys/param.sfo': sfo({ TITLE_ID: 'PCSE00001', CATEGORY: 'ac', CONTENT_ID: 'EP0001-PCSE00001_00-EXTRAPACK0000001' }), 'Wrap/x.dat': 'd' });
  await P.vitaUnpack(dlc, pref, await P.vitaArchiveContents(dlc));
  assert.ok(fs.existsSync(path.join(pref, 'ux0/addcont/PCSE00001/EXTRAPACK0000001/x.dat')));
  // NoNpDrm: retail with sce_sys/package goes to Vita3K
  const nonp = path.join(TMP, 'nonp.vpk');
  zip(nonp, { 'sce_sys/param.sfo': sfo({ TITLE_ID: 'PCSB00002', CATEGORY: 'gd' }), 'sce_sys/package/work.bin': 'w' });
  assert.strictEqual((await P.vitaArchiveContents(nonp))[0].encrypted, true);
  const vit = path.join(TMP, 'vit.vpk');
  zip(vit, { 'sce_sys/param.sfo': sfo({ TITLE_ID: 'PCSB00003', CATEGORY: 'gd' }), 'sce_module/steroid.suprx': 's' });
  await assert.rejects(P.vitaArchiveContents(vit), /Vitamin/);
});

// 0.9.21: Vita3K's own storage folder, worked out as Vita3K does (portable, config pref-path, default)
test('vita3kFsPaths follows Vita3K: portable folder, then config pref-path, then its default', () => {
  const P = require('../electron/pkgInstall.js');
  const os = require('os'), fs = require('fs'), path = require('path');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'v3kfs-'));
  const saved = { c: process.env.XDG_CONFIG_HOME, d: process.env.XDG_DATA_HOME };
  delete process.env.XDG_CONFIG_HOME; delete process.env.XDG_DATA_HOME;
  try {
    const exe = path.join(home, 'Applications/Vita3K/Vita3K');
    fs.mkdirSync(path.dirname(exe), { recursive: true }); fs.writeFileSync(exe, '');
    assert.deepStrictEqual(P.vita3kFsPaths(exe, home), [path.join(home, '.local/share/Vita3K/Vita3K')]);
    fs.mkdirSync(path.join(home, '.config/Vita3K'), { recursive: true });
    fs.writeFileSync(path.join(home, '.config/Vita3K/config.yml'), 'log-level: 2\npref-path: /run/media/me/Drive/Emulation/storage/Vita3K/\n');
    assert.strictEqual(P.vita3kFsPaths(exe, home)[0], '/run/media/me/Drive/Emulation/storage/Vita3K');
    fs.mkdirSync(path.join(home, 'Applications/Vita3K/portable'));
    assert.strictEqual(P.vita3kFsPaths(exe, home)[0], path.join(home, 'Applications/Vita3K/portable/fs'));
  } finally { if (saved.c) process.env.XDG_CONFIG_HOME = saved.c; if (saved.d) process.env.XDG_DATA_HOME = saved.d; fs.rmSync(home, { recursive: true, force: true }); }
});

test('vita3kWhy gives Vita3K\'s own reason without its log prefix', () => {
  const P = require('../electron/pkgInstall.js');
  assert.strictEqual(P.vita3kWhy('[10:00:00.000] |I| [main]: Installing archive from CLI: x.zip\n[10:00:03.120] |E| [is_nonpdrm]: NoNpDrm installation failed, deleting data!'), 'NoNpDrm installation failed, deleting data!');
  assert.strictEqual(P.vita3kWhy('[10:00:00.000] |I| [main]: all fine'), '');
});
