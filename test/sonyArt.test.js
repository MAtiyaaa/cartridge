// Sony's marks on RomM's Sony controller pictures (0.9.31): only drawings whose RomM marks all match are changed
const test = require('node:test');
const assert = require('node:assert');
const S = require('../electron/sonyArt');

test('which pictures are Sony controllers', () => {
  assert.strictEqual(S.isSonyArt('/assets/platforms/ps3.svg'), 'ps3');
  assert.strictEqual(S.isSonyArt('/assets/platforms/ps.svg'), 'ps');
  assert.strictEqual(S.isSonyArt('/assets/platforms/snes.svg'), null);
  assert.strictEqual(S.isSonyArt('/assets/cover/ps3.svg'), null);
});
test('a drawing that isn\'t the one measured is left exactly as it is', () => {
  const svg = Buffer.from('<svg viewBox="0 0 1000 1000"><path class="a" d="M0 0h10v10z"/></svg>');
  for (const k of Object.keys(S.FIX)) assert.ok(S.fix(k, svg).equals(svg));
  assert.ok(S.fix('snes', svg).equals(svg));
});
test('every Sony controller has a place for the PlayStation logo, and SONY where RomM wrote ROMMY', () => {
  for (const [k, f] of Object.entries(S.FIX)) {
    assert.strictEqual(f.logo.length, 5, k);
    // SONY goes back where RomM wrote ROMMY (0.9.49: on PS3 too again, owner: "why did you remove Sony")
    assert.strictEqual(!!f.sony, f.text.length > 0, k);
  }
});
