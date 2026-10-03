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
const A = require('../electron/addons.js');

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

// 0.9.18: each emulator's layout found by what it reads, whatever the pack's wrapper folders
test('texture layouts per emulator: the game folder found by what the emulator reads', () => {
  const L = (rels) => rels.map((rel) => ({ rel, size: 1 }));
  const to = (rels, kind, o) => I.plan(L(rels), kind, o).map((x) => x.to).sort();
  // PCSX2 and DuckStation: the folder above replacements; images with none go into one
  assert.deepStrictEqual(to(['HD Pack v2/SLUS-21287/replacements/a.png', 'HD Pack v2/readme.txt'], 'pcsx2', { id: 'SLUS-21287' }), ['replacements/a.png']);
  assert.deepStrictEqual(to(['Pack/SCUS-94900/replacements/x/b.png', 'Pack/SCUS-94900/config.yaml'], 'duckstation', { id: 'SCUS-94900' }), ['config.yaml', 'replacements/x/b.png']);
  assert.deepStrictEqual(to(['Pack/a.png', 'Pack/sub/b.dds', 'Pack/info.txt'], 'pcsx2', { id: 'SLUS-21287' }), ['replacements/a.png', 'replacements/sub/b.dds']);
  // PPSSPP: the folder holding textures.ini
  assert.deepStrictEqual(to(['Wrap/ULUS10041/textures.ini', 'Wrap/ULUS10041/t/1.png', 'Wrap/notes.txt'], 'ppsspp', { id: 'ULUS10041' }), ['t/1.png', 'textures.ini']);
  assert.deepStrictEqual(to(['textures.ini', 'a.png'], 'ppsspp', { id: 'ULUS10041' }), ['a.png', 'textures.ini']);
  // Dolphin: a folder named the 6 or 3 character game ID, else as it is minus wrappers
  assert.deepStrictEqual(to(['Zelda HD/GALE01/tex1_a.png', 'Zelda HD/GALE01/ui/b.png'], 'dolphin', { id: 'GALE01' }), ['tex1_a.png', 'ui/b.png']);
  assert.deepStrictEqual(to(['Pack/GAL/tex1_a.png'], 'dolphin', { id: 'GALE01' }), ['tex1_a.png']);
  assert.deepStrictEqual(to(['Pack/one/tex1_a.png', 'Pack/two/tex1_b.png'], 'dolphin', { id: 'GALE01' }), ['one/tex1_a.png', 'two/tex1_b.png']);
  // Azahar: the title ID folder
  assert.deepStrictEqual(to(['P/0004000000055D00/tex1.png'], 'azahar', { id: '0004000000055D00' }), ['tex1.png']);
  // Cemu: each rules.txt folder is a pack; one at the top gets the mod's name
  assert.deepStrictEqual(to(['Wrap/BotW_60FPS/rules.txt', 'Wrap/BotW_60FPS/patch.asm', 'Wrap/readme.md'], 'cemu', { name: 'x' }), ['BotW_60FPS/patch.asm', 'BotW_60FPS/rules.txt']);
  assert.deepStrictEqual(to(['rules.txt', 'a.asm'], 'cemu', { name: 'My Pack' }), ['My Pack/a.asm', 'My Pack/rules.txt']);
  assert.deepStrictEqual(to(['readme.md'], 'cemu', { name: 'x' }), []);
  // Switch: Atmosphere's contents/<id>/romfs gets the mod's name, a named mod folder keeps its own
  assert.deepStrictEqual(to(['atmosphere/contents/01007EF00011E000/romfs/a.bin'], 'switch', { name: 'HD' }), ['HD/romfs/a.bin']);
  assert.deepStrictEqual(to(['Wrap/60 FPS/exefs/main.ips'], 'switch', { name: 'HD' }), ['60 FPS/exefs/main.ips']);
});

// 0.9.19: an .xci's title ID from its Program NCA header (AES-128-XTS with the header key, big-endian sector tweak)
test('Switch .xci title ID from the NCA header, with the header key from prod.keys', () => {
  const crypto = require('crypto');
  const key = crypto.randomBytes(32), dir = path.join(TMP, 'keys'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'prod.keys'), `header_key = ${key.toString('hex')}\n`);
  const head = Buffer.alloc(0x400); head.write('NCA3', 0x200, 'latin1'); head[0x205] = 0; head.writeBigUInt64LE(0x0100abcd12340000n, 0x210);
  const enc = Buffer.concat([0, 1].map((s) => { const iv = Buffer.alloc(16); iv.writeBigUInt64BE(BigInt(s), 8); const c = crypto.createCipheriv('aes-128-xts', key, iv); c.setAutoPadding(false); return Buffer.concat([c.update(head.subarray(s * 0x200, s * 0x200 + 0x200)), c.final()]); }));
  const hfs = (files) => { // HFS0 with files [{ name, data }]
    const names = Buffer.concat(files.map((f) => Buffer.from(f.name + '\0'))); const ents = Buffer.alloc(files.length * 0x40);
    let off = 0, no = 0; files.forEach((f, i) => { ents.writeBigUInt64LE(BigInt(off), i * 0x40); ents.writeBigUInt64LE(BigInt(f.data.length), i * 0x40 + 8); ents.writeUInt32LE(no, i * 0x40 + 16); off += f.data.length; no += f.name.length + 1; });
    const h = Buffer.alloc(16); h.write('HFS0', 0, 'latin1'); h.writeUInt32LE(files.length, 4); h.writeUInt32LE(names.length, 8);
    return Buffer.concat([h, ents, names, ...files.map((f) => f.data)]);
  };
  const secure = hfs([{ name: 'abc.nca', data: enc }]);
  const root = hfs([{ name: 'update', data: Buffer.alloc(0) }, { name: 'secure', data: secure }]);
  const xh = Buffer.alloc(0x200); xh.write('HEAD', 0x100, 'latin1'); xh.writeBigUInt64LE(0x200n, 0x130);
  const f = path.join(TMP, 'Game.xci'); fs.writeFileSync(f, Buffer.concat([xh, root]));
  assert.strictEqual(A.switchTitleId(f, [dir]), '0100ABCD12340000');
});
