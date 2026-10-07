// ROM hack patches (0.9.52): IPS (with RLE and truncate), UPS (both ways) and BPS (all four commands) applied to a
// made-up ROM, built here with encoders written from each format's specification; wrong source copies are refused.
const test = require('node:test');
const assert = require('node:assert');
const P = require('../electron/romPatch');

const crcLE = (b) => { const o = Buffer.alloc(4); o.writeUInt32LE(P.crc32(b)); return o; };
const enc = (n) => { const o = []; for (;;) { const x = n & 0x7f; n = Math.floor(n / 128); if (n === 0) { o.push(0x80 | x); break; } o.push(x); n--; } return Buffer.from(o); };
const rom = Buffer.from(Array.from({ length: 4096 }, (_, i) => (i * 7 + 3) & 0xff));

test('IPS: plain records, an RLE run, growing the file and the truncate extension', () => {
  const rec = (off, data) => { const h = Buffer.alloc(5); h.writeUIntBE(off, 0, 3); h.writeUInt16BE(data.length, 3); return Buffer.concat([h, data]); };
  const rle = (off, run, v) => { const h = Buffer.alloc(8); h.writeUIntBE(off, 0, 3); h.writeUInt16BE(0, 3); h.writeUInt16BE(run, 5); h[7] = v; return h; };
  const p = Buffer.concat([Buffer.from('PATCH'), rec(0x10, Buffer.from('HACKED')), rle(0x100, 32, 0xaa), rec(4096, Buffer.from('MORE')), Buffer.from('EOF')]);
  const out = P.apply(rom, p, 'x.ips');
  assert.strictEqual(out.toString('latin1', 0x10, 0x16), 'HACKED');
  assert.ok(out.subarray(0x100, 0x120).every((b) => b === 0xaa));
  assert.strictEqual(out.length, 4100);
  assert.strictEqual(out.toString('latin1', 4096), 'MORE');
  assert.strictEqual(out[0], rom[0]);
  const trunc = Buffer.concat([Buffer.from('PATCH'), rec(0, Buffer.from('A')), Buffer.from('EOF'), Buffer.from([0, 0x08, 0])]);
  assert.strictEqual(P.apply(rom, trunc, 'y.ips').length, 2048);
  assert.strictEqual(rom.toString('latin1', 0x10, 0x16) === 'HACKED', false, 'the original is never changed');
});

test('UPS: XOR runs applied, and the same patch takes the hacked copy back', () => {
  const target = Buffer.from(rom); target.write('UPS!', 200, 'latin1'); target[4000] ^= 0x55;
  const body = [Buffer.from('UPS1'), enc(rom.length), enc(target.length)];
  let last = 0;
  for (const [at, len] of [[200, 4], [4000, 1]]) {
    body.push(enc(at - last));
    const x = Buffer.alloc(len + 1); for (let k = 0; k < len; k++) x[k] = rom[at + k] ^ target[at + k]; x[len] = 0; body.push(x);
    last = at + len + 1;
  }
  body.push(crcLE(rom), crcLE(target));
  let p = Buffer.concat(body); p = Buffer.concat([p, crcLE(p)]);
  assert.ok(P.apply(rom, p, 'h.ups').equals(target));
  assert.ok(P.apply(target, p, 'h.ups').equals(rom));
  const other = Buffer.from(rom); other[1] ^= 1;
  assert.throws(() => P.apply(other, p, 'h.ups'), (e) => e.code === 'source' && /different copy/.test(e.message));
});

test('BPS: SourceRead, TargetRead, SourceCopy and TargetCopy, checksums checked', () => {
  // target = rom[0..100) + "BEAT" + rom[2000..2100) + "BEAT" again (TargetCopy) + rom[100..4096)
  const target = Buffer.concat([rom.subarray(0, 100), Buffer.from('BEAT'), rom.subarray(2000, 2100), Buffer.from('BEAT'), rom.subarray(208, 4096)]);
  const cmd = (c, len) => enc(((len - 1) << 2) | c);
  const off = (d) => enc((Math.abs(d) << 1) | (d < 0 ? 1 : 0));
  const parts = [Buffer.from('BPS1'), enc(rom.length), enc(target.length), enc(0),
    cmd(0, 100), // SourceRead 100 at out 0
    cmd(1, 4), Buffer.from('BEAT'), // TargetRead
    cmd(2, 100), off(2000), // SourceCopy from 2000
    cmd(3, 4), off(100), // TargetCopy from target offset 100
    cmd(0, 4096 - 208)]; // SourceRead the rest, at the same offset (208)
  parts.push(crcLE(rom), crcLE(target));
  let p = Buffer.concat(parts); p = Buffer.concat([p, crcLE(p)]);
  assert.ok(P.apply(rom, p, 'h.bps').equals(target));
  assert.throws(() => P.apply(rom.subarray(0, 4000), p, 'h.bps'), (e) => e.code === 'source');
  const broken = Buffer.from(p); broken[10] ^= 0xff;
  assert.throws(() => P.apply(rom, broken, 'h.bps'), (e) => e.code === 'bad');
});

test('kinds and the RetroArch soft-patch name', () => {
  assert.strictEqual(P.kindOf('a.IPS'), 'ips');
  assert.strictEqual(P.kindOf('hack.xdelta'), 'xdelta');
  assert.strictEqual(P.kindOf('noext', Buffer.from('BPS1....')), 'bps');
  assert.ok(P.SOFT.has('bps') && !P.SOFT.has('xdelta'));
  assert.strictEqual(P.softName('/r/snes/Super Metroid (USA).sfc', 'ips'), '/r/snes/Super Metroid (USA).ips');
  assert.throws(() => P.apply(rom, Buffer.from('VCD...'), 'x.xdelta'), (e) => e.code === 'format' && /xdelta/.test(e.message));
});
