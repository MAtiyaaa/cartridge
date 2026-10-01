// Emulator patches (0.9.3 D7): RPCS3's patch list for a game, and turning patches on and off in
// its patch_config.yml without touching anything else in it.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const P = require('../electron/patches.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-patch-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// a PARAM.SFO with text entries
function sfo(entries) {
  const keys = Object.keys(entries);
  const kt = Buffer.from(keys.map((k) => k + '\0').join(''), 'latin1');
  const vals = keys.map((k) => Buffer.from(entries[k] + '\0', 'utf8'));
  const head = Buffer.alloc(20 + keys.length * 16);
  head.writeUInt32BE(0x00505346, 0); head.writeUInt32LE(0x101, 4);
  head.writeUInt32LE(head.length, 8); head.writeUInt32LE(head.length + kt.length, 12); head.writeUInt32LE(keys.length, 16);
  let ko = 0, vo = 0;
  keys.forEach((k, i) => { const e = 20 + i * 16; head.writeUInt16LE(ko, e); head.writeUInt16LE(0x0204, e + 2); head.writeUInt32LE(vals[i].length, e + 4); head.writeUInt32LE(vals[i].length, e + 8); head.writeUInt32LE(vo, e + 12); ko += k.length + 1; vo += vals[i].length; });
  return Buffer.concat([head, kt, ...vals]);
}

const PATCH_YML = `Version: 1.2

PPU-aaaa1111:
  "60 FPS":
    Games:
      "Tokyo Jungle":
        NPUA80523: [ 01.00, 01.01 ]
    Author: someone
    Notes: Needs a fast CPU
    Patch Version: 1.0
    Patch:
      - [ be32, 0x10, 0x60000000 ]
  "Disable blur":
    Games:
      "Tokyo Jungle":
        NPUA80523: [ All ]
    Patch Version: 1.0
    Patch:
      - [ be32, 0x20, 0x60000000 ]
PPU-bbbb2222:
  "Other game patch":
    Games:
      "Other":
        BLUS30001: [ 01.00 ]
    Patch:
      - [ be32, 0x30, 0x0 ]
`;
// what the user already had: a patch for another game, turned on in RPCS3
const USER_CFG = `PPU-bbbb2222:
  Other game patch:
    Other:
      BLUS30001:
        01.00:
          Enabled: true
`;

function setup(name) {
  const root = path.join(TMP, name, '.config/rpcs3');
  fs.mkdirSync(path.join(root, 'patches'), { recursive: true }); fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.writeFileSync(path.join(root, 'patches/patch.yml'), PATCH_YML);
  fs.writeFileSync(path.join(root, 'config/patch_config.yml'), USER_CFG);
  const old = process.env.XDG_CONFIG_HOME; delete process.env.XDG_CONFIG_HOME;
  try { return P.rpcs3Dirs(path.join(TMP, name))[0]; } finally { if (old !== undefined) process.env.XDG_CONFIG_HOME = old; }
}

test('reads PARAM.SFO entries', () => {
  assert.deepStrictEqual(P.parseSfo(sfo({ APP_VER: '01.01', TITLE_ID: 'NPUA80523' })), { APP_VER: '01.01', TITLE_ID: 'NPUA80523' });
});

test('an installed update decides the game version', () => {
  const hdd = path.join(TMP, 'ver/dev_hdd0');
  fs.mkdirSync(path.join(hdd, 'game/NPUA80523'), { recursive: true });
  fs.writeFileSync(path.join(hdd, 'game/NPUA80523/PARAM.SFO'), sfo({ APP_VER: '01.01', TITLE_ID: 'NPUA80523' }));
  assert.strictEqual(P.ps3Version(path.join(TMP, 'ver/disc'), [hdd], 'NPUA80523'), '01.01');
});

test('lists this game and version only; versions stay text (01.00, not 1)', () => {
  const d = setup('list');
  const l = P.rpcs3List(d, 'NPUA80523', '01.01');
  assert.deepStrictEqual(l.map((p) => [p.description, p.version, p.on]), [['60 FPS', '01.01', false], ['Disable blur', 'All', false]]);
  assert.strictEqual(l[0].notes, 'Needs a fast CPU');
  assert.deepStrictEqual(P.rpcs3List(d, 'NPUA80523', '02.00').map((p) => p.description), ['Disable blur']);
});

test('turning on and off writes RPCS3\'s own format and keeps the user\'s entries exactly', () => {
  const d = setup('set');
  const [fps] = P.rpcs3List(d, 'NPUA80523', '01.00');
  let mine = P.rpcs3Set(d, [{ ...fps, on: true }], {});
  const cfg = P.load(fs.readFileSync(d.config, 'utf8'));
  assert.strictEqual(cfg['PPU-aaaa1111']['60 FPS']['Tokyo Jungle'].NPUA80523['01.00'].Enabled, 'true');
  assert.strictEqual(cfg['PPU-bbbb2222']['Other game patch'].Other.BLUS30001['01.00'].Enabled, 'true');
  assert.match(fs.readFileSync(d.config, 'utf8'), /01\.00/); // still 01.00 for RPCS3
  assert.strictEqual(P.rpcs3List(d, 'NPUA80523', '01.00', mine)[0].by, 'cartridge');
  assert.ok(fs.existsSync(d.config + '.cartridge-backup'));
  mine = P.rpcs3Set(d, [{ ...fps, on: false }], mine);
  assert.deepStrictEqual(P.load(fs.readFileSync(d.config, 'utf8')), P.load(USER_CFG));
  assert.deepStrictEqual(mine, {});
});

test('a patch turned on in RPCS3 is never turned off by Cartridge', () => {
  const d = setup('theirs');
  const [other] = P.rpcs3List(d, 'BLUS30001', '01.00');
  assert.strictEqual(other.by, 'emulator');
  P.rpcs3Set(d, [{ ...other, on: false }], {});
  assert.strictEqual(P.rpcs3List(d, 'BLUS30001', '01.00')[0].on, true);
});
