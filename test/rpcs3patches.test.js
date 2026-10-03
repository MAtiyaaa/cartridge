// RPCS3 patches (0.9.19): the patch list is read as forgivingly as RPCS3's own yaml-cpp, so a key written
// twice (which made js-yaml throw and the whole list vanish) or a line js-yaml rejects never hides it.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const P = require('../electron/patches.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-rp-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const LIST = `Version: 1.2

Anchors:
  sth: &sth
    - [ be32, 0x1, 0x2 ]

PPU-abc:
  "60 FPS":
    Games:
      "Demon's Souls":
        BLUS30443: [ 01.00, 01.04 ]
    Author: "Someone"
    Notes: |
      Line: one
    Patch Version: 1.0
    Patch:
      - [ load, *sth ]
  "60 FPS":
    Games:
      "Demon's Souls":
        BLUS30443: [ 01.04 ]
    Author: Later
PPU-def:
  "Skip intro":
    Games:
      "Demon's Souls":
        BLUS30443: [ All ]
    Author: x
`;

test('a duplicate key no longer hides the patch list; turning one on writes what RPCS3 reads', () => {
  const root = path.join(TMP, 'rpcs3');
  fs.mkdirSync(path.join(root, 'patches'), { recursive: true }); fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.writeFileSync(path.join(root, 'patches', 'patch.yml'), LIST);
  const dir = P.rpcs3Dirs(TMP).find((d) => d.root === root) || { root, patches: path.join(root, 'patches'), config: path.join(root, 'config', 'patch_config.yml') };
  const list = P.rpcs3List(dir, 'BLUS30443', '01.04');
  assert.deepStrictEqual(list.map((x) => [x.description, x.version, x.author]).sort(), [['60 FPS', '01.04', 'Later'], ['Skip intro', 'All', 'x']]);
  P.rpcs3Set(dir, [{ ...list.find((x) => x.description === '60 FPS'), on: true }]);
  const cfg = fs.readFileSync(dir.config, 'utf8');
  assert.match(cfg, /PPU-abc:\n\s+60 FPS:\n\s+Demon's Souls:\n\s+BLUS30443:\n\s+'?01\.04'?:\n\s+Enabled: '?true'?/);
  assert.ok(P.rpcs3List(dir, 'BLUS30443', '01.04').find((x) => x.description === '60 FPS').on);
});

test('the forgiving reader keeps lists, flow lists, quotes and skips block text', () => {
  const o = P.loosePatchYaml(`A:\n  "k: q":\n    - one\n    - 'two'\n  b: [ 01.00, "x" ]\n  n: |\n    c: d\n  e: f\n`);
  assert.deepStrictEqual(o, { A: { 'k: q': ['one', 'two'], b: ['01.00', 'x'], n: '', e: 'f' } });
});
