// Add-on downloads (0.9.17): the PS2 texture catalog (EmuCoreX, as ARMSX2 reads it), GameBanana's
// answers, and installing into the emulator's folder without replacing anything, removable again.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const S = require('../electron/addonSources.js');
const I = require('../electron/addonInstall.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-addons-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// a stored (uncompressed) zip
function zip(file, entries) {
  const locals = [], centrals = []; let off = 0;
  for (const [name, text] of Object.entries(entries)) {
    const data = Buffer.from(text), n = Buffer.from(name), crc = zlib.crc32(data);
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

test('PS2 catalog: good entries kept, bad ones dropped, matched by serial', () => {
  const sha = 'A'.repeat(64);
  const list = S.parsePs2Catalog({ schemaVersion: 1, entries: [
    { id: 'a', name: 'A HD', gameTitle: 'A', serials: ['SLUS-21287'], downloadUrl: 'https://github.com/x/a.zip', sizeBytes: 10, sha256: sha, fileCount: 2, authors: ['me'] },
    { id: 'b', name: 'B', serials: ['SLES-50001'], sizeBytes: 10, sha256: sha, parts: [{ downloadUrl: 'https://x/1', sizeBytes: 5, sha256: sha }, { downloadUrl: 'https://x/2', sizeBytes: 5, sha256: sha }] },
    { id: 'bad', serials: ['SLUS-21287'], downloadUrl: 'http://insecure', sizeBytes: 1, sha256: sha },
    null,
  ] });
  assert.deepStrictEqual(list.map((e) => e.id), ['a', 'b']);
  assert.strictEqual(list[1].parts.length, 2);
  assert.deepStrictEqual(S.ps2For(list, 'slus-21287').map((e) => e.id), ['a']);
  assert.throws(() => S.parsePs2Catalog({ schemaVersion: 2, entries: [] }));
});

test('GameBanana answers read defensively', () => {
  const mods = S.parseGbMods({ _aRecords: [{ _idRow: 5, _sModelName: 'Mod', _sName: '60 FPS', _aSubmitter: { _sName: 'dev' }, _aPreviewMedia: { _aImages: [{ _sBaseUrl: 'https://images.gamebanana.com/img/ss/mods', _sFile220: 'x.jpg' }] } }, { _idRow: 6, _sModelName: 'Wip' }, {}] });
  assert.deepStrictEqual(mods.map((m) => [m.id, m.name, m.authors[0], m.preview]), [[5, '60 FPS', 'dev', 'https://images.gamebanana.com/img/ss/mods/x.jpg']]);
  const files = S.parseGbFiles({ _aFiles: [{ _idRow: 1, _sFile: 'mod.zip', _nFilesize: 10, _sDownloadUrl: 'https://gamebanana.com/dl/1', _sMd5Checksum: 'd41d8cd98f00b204e9800998ecf8427e' }, { _idRow: 2, _sFile: 'tool.exe', _sDownloadUrl: 'https://x' }] });
  assert.deepStrictEqual(files.map((f) => f.id), [1]);
});

test('PS2 pack: SERIAL/replacements or replacements, PNG and DDS only; never replaces; removable', async () => {
  const z = path.join(TMP, 'p.zip');
  zip(z, { 'SLUS-21287/replacements/a.png': 'a', 'SLUS-21287/replacements/sub/b.dds': 'b', 'SLUS-21287/readme.txt': 'r', 'SLUS-21287/replacements/c.exe': 'x' });
  const dest = path.join(TMP, 'textures/SLUS-21287');
  const r = await I.install(z, dest, 'ps2');
  assert.deepStrictEqual(r.files.sort(), ['replacements/a.png', 'replacements/sub/b.dds']);
  assert.strictEqual(fs.readFileSync(path.join(dest, 'replacements/a.png'), 'utf8'), 'a');
  await assert.rejects(I.install(z, dest, 'ps2'), /already/);
  fs.writeFileSync(path.join(dest, 'replacements/mine.png'), 'mine');
  await I.removeFiles(dest, r.files);
  assert.ok(fs.existsSync(path.join(dest, 'replacements/mine.png')));
  assert.ok(!fs.existsSync(path.join(dest, 'replacements/sub')));
});

test('Switch mod: a bare romfs gets the mod name as its folder', async () => {
  const z = path.join(TMP, 's.zip');
  zip(z, { 'romfs/Data/x.bin': '1', 'exefs/main.ips': '2' });
  const dest = path.join(TMP, 'load/0100F2C0115B6000');
  const r = await I.install(z, dest, 'switch', { name: '60 FPS: Mod' });
  assert.deepStrictEqual(r.files.sort(), ['60 FPS  Mod/exefs/main.ips', '60 FPS  Mod/romfs/Data/x.bin']);
});

test('unsafe paths are refused', async () => {
  const z = path.join(TMP, 'u.zip');
  zip(z, { '../evil.png': 'x' });
  await assert.rejects(I.install(z, path.join(TMP, 'safe'), 'plain'), /empty|Unsafe|invalid/);
  assert.ok(!fs.existsSync(path.join(TMP, 'evil.png')));
});
