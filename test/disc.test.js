// Compressed disc images read for game IDs (0.9.17): CHD (CD and DVD, LZMA, zlib, zstd), CSO, ZSO,
// GCZ. The CHD files were made with MAME's chdman from small test images (see the fixtures folder).
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const A = require('../electron/addons.js');
const P = require('../electron/patches.js');
const C = require('../electron/cheats.js');
const D = require('../electron/discImage.js');
const F = (n) => path.join(__dirname, 'fixtures/disc', n);

test('PS1 serial from CD CHDs (cdlz, cdzl, cdzs)', () => {
  for (const f of ['ps1-cdlz.chd', 'ps1-cdzl.chd', 'ps1-cdzs.chd']) assert.strictEqual(A.psxSerial(F(f)), 'SLUS-00594', f);
});
test('PS2 serial from DVD CHDs, CSO and ZSO', () => {
  for (const f of ['ps2-lzma.chd', 'ps2-zlib.chd', 'ps2-zstd.chd', 'ps2.cso', 'ps2.zso']) assert.strictEqual(P.ps2IsoInfo(F(f))?.serial, 'SLUS-21386', f);
});
test('the same bytes from every PS2 image', () => {
  const ref = D.open(F('ps2-zlib.chd')).read(0, 200 * 2048);
  for (const f of ['ps2-lzma.chd', 'ps2-zstd.chd', 'ps2.cso']) assert.ok(D.open(F(f)).read(0, 200 * 2048).equals(ref), f);
});
test('GameCube ID from GCZ', () => assert.strictEqual(C.gcWiiId(F('gc.gcz')), 'GALE01'));
test('LZMA decoder against known data', () => {
  // raw LZMA1 (lc=3, lp=0, pb=2) of "hello hello hello hello\n", made with Python's lzma module
  const src = Buffer.from('00341949ee8de9560ac1b620b7ffffba340000', 'hex');
  assert.strictEqual(D.lzmaDecode(src, 24).toString(), 'hello hello hello hello\n');
});
