// Switch title ID and version read like Eden (0.9.30): an NSP built here the way Nintendo's are laid out,
// encrypted with OpenSSL's own AES-XTS (plain Node has it, Electron doesn't), then read back with Cartridge's
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const S = require('../electron/switchNca');

const rnd = (n) => crypto.randomBytes(n);
const headerKey = rnd(32), kak = rnd(16), tkek = rnd(16);
const keys = S.parseKeys(`header_key = ${headerKey.toString('hex')}\nkey_area_key_application_00 = ${kak.toString('hex')}\ntitlekek_00 = ${tkek.toString('hex')}\n`);
const ecbEnc = (k, d) => { const c = crypto.createCipheriv('aes-128-ecb', k, null); c.setAutoPadding(false); return Buffer.concat([c.update(d), c.final()]); };
function xtsEnc(key, data, sector) { // OpenSSL's XTS, Nintendo's big-endian sector tweak
  const out = [];
  for (let s = 0; s * 0x200 < data.length; s++) { const iv = Buffer.alloc(16); iv.writeBigUInt64BE(BigInt(sector + s), 8); const c = crypto.createCipheriv('aes-128-xts', key, iv); out.push(c.update(data.subarray(s * 0x200, (s + 1) * 0x200)), c.final()); }
  return Buffer.concat(out);
}
const ctr = (key, upper, off, d) => { const iv = Buffer.alloc(16); upper.copy(iv); iv.writeBigUInt64BE(BigInt(off / 16), 8); const c = crypto.createCipheriv('aes-128-ctr', key, iv); return Buffer.concat([c.update(d), c.final()]); };
const pad = (b, n = 0x200) => Buffer.concat([b, Buffer.alloc((n - (b.length % n)) % n)]);
function pfs0(files, magic = 'PFS0') {
  const es = magic === 'PFS0' ? 0x18 : 0x40;
  let strs = Buffer.alloc(0), off = 0; const tab = Buffer.alloc(files.length * es);
  files.forEach(([name, data], i) => { tab.writeBigUInt64LE(BigInt(off), i * es); tab.writeBigUInt64LE(BigInt(data.length), i * es + 8); tab.writeUInt32LE(strs.length, i * es + 16); strs = Buffer.concat([strs, Buffer.from(name + '\0')]); off += data.length; });
  strs = pad(strs, 0x20);
  const h = Buffer.alloc(16); h.write(magic); h.writeUInt32LE(files.length, 4); h.writeUInt32LE(strs.length, 8);
  return Buffer.concat([h, tab, strs, ...files.map((f) => f[1])]);
}
function romfs(name, data) { // one file at the root
  const nm = Buffer.from(name), meta = Buffer.alloc(0x20 + Math.ceil(nm.length / 4) * 4);
  meta.writeUInt32LE(0, 0); meta.writeUInt32LE(0xffffffff, 4); meta.writeBigUInt64LE(0n, 8); meta.writeBigUInt64LE(BigInt(data.length), 0x10); meta.writeUInt32LE(0xffffffff, 0x18); meta.writeUInt32LE(nm.length, 0x1c); nm.copy(meta, 0x20);
  const h = Buffer.alloc(0x50); h.writeBigUInt64LE(0x50n, 0); h.writeBigUInt64LE(0x50n, 0x38); h.writeBigUInt64LE(BigInt(meta.length), 0x40); h.writeBigUInt64LE(BigInt(0x50 + meta.length), 0x48);
  return Buffer.concat([h, meta, data]);
}
// an NCA3 with one section: PFS0 (hash layers 2, data region 1) or RomFS (IVFC, data at level index 5)
function nca({ type, titleId, section, kind, rights, titleKey }) {
  const h = Buffer.alloc(0xc00), secStart = 0xc00, upper = rnd(8), ctrKey = titleKey || rnd(16);
  h.write('NCA3', 0x200); h[0x204] = 0; h[0x205] = type; h[0x206] = 0; h[0x207] = 0; h[0x220] = 0;
  h.writeBigUInt64LE(BigInt('0x' + titleId), 0x210);
  if (rights) rights.copy(h, 0x230);
  else { const area = Buffer.alloc(0x40); ctrKey.copy(area, 0x20); ecbEnc(kak, area).copy(h, 0x300); }
  const body = pad(section);
  h.writeUInt32LE(secStart / 0x200, 0x240); h.writeUInt32LE((secStart + body.length) / 0x200, 0x244);
  const fh = h.subarray(0x400, 0x600);
  fh[2] = kind === 'pfs' ? 1 : 0; fh[3] = kind === 'pfs' ? 2 : 3; fh[4] = 3;
  if (kind === 'pfs') { fh.writeInt32LE(2, 0x2c); fh.writeBigUInt64LE(0n, 0x40); fh.writeBigUInt64LE(BigInt(section.length), 0x48); }
  else { fh.write('IVFC', 0x8); fh.writeUInt32LE(7, 0x14); fh.writeBigUInt64LE(0n, 0x18 + 5 * 0x18); fh.writeBigUInt64LE(BigInt(section.length), 0x20 + 5 * 0x18); }
  Buffer.from(upper).reverse().copy(fh, 0x140); // stored little-endian, used big-endian
  return Buffer.concat([xtsEnc(headerKey, h, 0), ctr(ctrKey, upper, secStart, body)]);
}
function cnmtFile(titleId, version, type) { const b = Buffer.alloc(0x20); b.writeBigUInt64LE(BigInt('0x' + titleId), 0); b.writeUInt32LE(version, 8); b[0xc] = type; return b; }
function nacpFile(name, display) { const b = Buffer.alloc(0x4000); b.write(name, 0); b.write(display, 0x3060); return b; }
function ticket(rights, encKey) { const b = Buffer.alloc(0x2c0); b.writeUInt32LE(0x10004, 0); encKey.copy(b, 0x180); rights.copy(b, 0x2a0); return b; }

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-nsp-'));
function nsp(name, titleId, version, type, gameName, display) {
  const rights = Buffer.concat([Buffer.from(titleId, 'hex'), Buffer.alloc(7), Buffer.from([0])]), tk = rnd(16);
  const files = [
    ['aa.cnmt.nca', nca({ type: 1, titleId, kind: 'pfs', section: pfs0([[`Application_${titleId}.cnmt`, cnmtFile(titleId, version, type)]]) })],
    ['bb.nca', nca({ type: 2, titleId, kind: 'romfs', section: romfs('control.nacp', nacpFile(gameName, display)), rights, titleKey: tk })],
    [`${rights.toString('hex')}.tik`, ticket(rights, ecbEnc(tkek, tk))],
  ];
  const f = path.join(dir, name); fs.writeFileSync(f, pfs0(files)); return f;
}
const base = nsp('Game.nsp', '0100A3D008C5C000', 0, 0x80, 'Pokemon Scarlet', '1.0.0');
const upd = nsp('Game Update.nsp', '0100A3D008C5C800', 3 * 65536, 0x81, 'Pokemon Scarlet', '3.0.1');

test('XTS done over ECB matches OpenSSL, for Electron, which has no XTS', () => {
  const data = rnd(0x400);
  assert.ok(S.xtsDecrypt(headerKey, xtsEnc(headerKey, data, 5), 5).equals(data));
});
test('an NSP gives its title ID, type, version number and version string, like Eden', () => {
  const [g] = S.read(base, keys);
  assert.deepStrictEqual([g.titleId, g.type, g.version, g.display, g.name], ['0100A3D008C5C000', 'game', 0, '1.0.0', 'Pokemon Scarlet']);
  const [u] = S.read(upd, keys);
  assert.deepStrictEqual([u.titleId, u.base, u.type, u.version, u.versionText, u.display], ['0100A3D008C5C800', '0100A3D008C5C000', 'update', 196608, 'v0.3.0', '3.0.1']);
});
test('a game folder: the game\'s ID and the highest update', () => {
  const s = S.summary([base, upd], keys);
  assert.deepStrictEqual([s.titleId, s.display, s.update, s.name], ['0100A3D008C5C000', '3.0.1', 196608, 'Pokemon Scarlet']);
});
test('key area keys made from master keys when prod.keys has only those, as Eden derives them', () => {
  const master = rnd(16), kekSrc = rnd(16), keySrc = rnd(16), src = rnd(16);
  const dec = (k, d) => { const c = crypto.createDecipheriv('aes-128-ecb', k, null); c.setAutoPadding(false); return Buffer.concat([c.update(d), c.final()]); };
  const k = S.parseKeys(`master_key_00=${master.toString('hex')}\naes_kek_generation_source=${kekSrc.toString('hex')}\naes_key_generation_source=${keySrc.toString('hex')}\nkey_area_key_application_source=${src.toString('hex')}`);
  assert.ok(S.keyAreaKey(k, 0, 0).equals(dec(dec(dec(master, kekSrc), src), keySrc)));
});
test('no keys: nothing made up', () => {
  assert.deepStrictEqual(S.read(base, {}), []);
});
test('an update installed into Eden\'s NAND: version from its CNMT, version string through the imported ticket', () => {
  const reg = path.join(dir, 'nand/user/Contents/registered'), titleId = '0100A3D008C5C800', ctlId = 'ab'.repeat(16), tk = rnd(16);
  const rights = Buffer.concat([Buffer.from(titleId, 'hex'), Buffer.alloc(8)]);
  const meta = Buffer.alloc(0x20 + 0x38); meta.writeBigUInt64LE(BigInt('0x' + titleId), 0); meta.writeUInt32LE(5 * 65536, 8); meta[0xc] = 0x81; meta.writeUInt16LE(0, 0xe); meta.writeUInt16LE(1, 0x10);
  Buffer.from(ctlId, 'hex').copy(meta, 0x20 + 0x20); meta[0x20 + 0x36] = 3;
  fs.mkdirSync(path.join(reg, '000000A1'), { recursive: true }); fs.mkdirSync(path.join(reg, '000000B2', 'ff'.repeat(16) + '.cnmt.nca'), { recursive: true });
  fs.writeFileSync(path.join(reg, '000000A1', ctlId + '.nca'), nca({ type: 2, titleId, kind: 'romfs', section: romfs('control.nacp', nacpFile('Pokemon Scarlet', '5.0.0')), rights, titleKey: tk }));
  fs.writeFileSync(path.join(reg, '000000B2', 'ff'.repeat(16) + '.cnmt.nca', '00'), nca({ type: 1, titleId, kind: 'pfs', section: pfs0([[`Patch_${titleId}.cnmt`, meta]]) })); // split into parts
  const k = { ...keys, [rights.toString('hex')]: ecbEnc(tkek, tk).toString('hex') }; // title.keys_autogenerated
  const u = S.nandUpdate([reg], '0100A3D008C5C000', k);
  assert.deepStrictEqual([u.version, u.versionText, u.display], [327680, 'v0.5.0', '5.0.0']);
});
