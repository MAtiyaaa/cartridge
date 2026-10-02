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

// ---------------------------------------------------------------- shadPS4
const SHAD_XML = `<?xml version="1.0" encoding="utf-8"?>
<Patch>
  <TitleID><ID>CUSA00001</ID></TitleID>
  <Metadata Title="Game" Name="60 FPS" Note="Unlocks the frame rate" Author="someone" PatchVer="1.0" AppVer="01.00" AppElf="eboot.bin">
    <PatchList><Line Type="bytes32" Address="0x10" Value="0x1"/></PatchList>
  </Metadata>
  <Metadata Title="Game" Name="60 FPS" Note="" Author="someone" PatchVer="1.0" AppVer="01.02" AppElf="eboot.bin" isEnabled="true">
    <PatchList><Line Type="bytes32" Address="0x20" Value="0x1"/></PatchList>
  </Metadata>
  <Metadata Title="Game" Name="Skip intro &amp; logos" Note="" Author="other" PatchVer="1.0" AppVer="mask" AppElf="eboot.bin">
    <PatchList><Line Type="mask" Address="aa bb" Value="cc"/></PatchList>
  </Metadata>
</Patch>
`;
function shadSetup(name) {
  const H = path.join(TMP, name);
  const repo = path.join(H, '.local/share/shadPS4/patches/shadPS4');
  fs.mkdirSync(repo, { recursive: true });
  fs.writeFileSync(path.join(repo, 'files.json'), JSON.stringify({ 'Game.xml': ['CUSA00001'] }));
  fs.writeFileSync(path.join(repo, 'Game.xml'), SHAD_XML);
  const old = process.env.XDG_DATA_HOME; delete process.env.XDG_DATA_HOME;
  try { return { dir: P.shadDirs(H)[0], xml: path.join(repo, 'Game.xml') }; } finally { if (old !== undefined) process.env.XDG_DATA_HOME = old; }
}

test('shadPS4: this version and "any version" patches, from files.json', () => {
  const { dir } = shadSetup('shad-list');
  assert.deepStrictEqual(P.shadList(dir, 'CUSA00001', '01.00').map((p) => [p.description, p.version, p.on]), [['60 FPS', '01.00', false], ['Skip intro & logos', 'All', false]]);
  assert.deepStrictEqual(P.shadList(dir, 'CUSA00001', '01.02').map((p) => [p.description, p.on, p.by]), [['60 FPS', true, 'emulator'], ['Skip intro & logos', false, null]]);
  assert.deepStrictEqual(P.shadList(dir, 'CUSA99999', '01.00'), []);
});

test('shadPS4: only isEnabled changes, and only on the patch picked', () => {
  const { dir, xml } = shadSetup('shad-set');
  const [fps, skip] = P.shadList(dir, 'CUSA00001', '01.00');
  let mine = P.shadSet(dir, [{ ...fps, on: true }, { ...skip, on: true }], {});
  const after = fs.readFileSync(xml, 'utf8');
  assert.strictEqual(after.replace(/ isEnabled="true"/g, '').replace('AppVer="01.02" AppElf="eboot.bin"', 'AppVer="01.02" AppElf="eboot.bin" isEnabled="true"'), SHAD_XML);
  assert.deepStrictEqual(P.shadList(dir, 'CUSA00001', '01.00', mine).map((p) => [p.on, p.by]), [[true, 'cartridge'], [true, 'cartridge']]);
  mine = P.shadSet(dir, [{ ...fps, on: false }, { ...skip, on: false }], mine);
  assert.strictEqual(fs.readFileSync(xml, 'utf8').replace(/ isEnabled="false"/g, ''), SHAD_XML);
  // the one the user turned on in shadPS4 can't be turned off from here
  const [theirs] = P.shadList(dir, 'CUSA00001', '01.02');
  P.shadSet(dir, [{ ...theirs, on: false }], mine);
  assert.strictEqual(P.shadList(dir, 'CUSA00001', '01.02')[0].on, true);
});

// ---------------------------------------------------------------- PCSX2 (0.9.3 K)
function gamelistCache(entries) {
  const parts = [Buffer.from([0x47, 0x4c, 0x43, 0x45]), Buffer.alloc(4)];
  parts[1].writeUInt32LE(34);
  const s = (v) => { const b = Buffer.from(v, 'utf8'); const n = Buffer.alloc(4); n.writeUInt32LE(b.length); return Buffer.concat([n, b]); };
  for (const e of entries) {
    const tail = Buffer.alloc(2 + 8 + 8 + 4 + 1); tail.writeUInt32LE(e.crc, 18);
    parts.push(s(e.path), s(e.serial), s('Title'), s('title'), s('Title'), tail);
  }
  return Buffer.concat(parts);
}
function pcsx2Setup(name, ini) {
  const H = path.join(TMP, name), root = path.join(H, '.config/PCSX2');
  for (const d of ['inis', 'cache', 'patches', 'gamesettings']) fs.mkdirSync(path.join(root, d), { recursive: true });
  fs.writeFileSync(path.join(root, 'inis/PCSX2.ini'), '[Folders]\nCache = cache\nPatches = patches\n');
  const rom = path.join(H, 'roms/ps2/Game.chd'); fs.mkdirSync(path.dirname(rom), { recursive: true }); fs.writeFileSync(rom, '');
  fs.writeFileSync(path.join(root, 'cache/gamelist.cache'), gamelistCache([{ path: path.join(H, 'roms/ps2/Other.iso'), serial: 'SLUS-00001', crc: 0x11111111 }, { path: rom, serial: 'SLUS-21386', crc: 0xABCD1234 }]));
  fs.writeFileSync(path.join(root, 'patches/SLUS-21386_ABCD1234.pnach'), 'gametitle=Game\n\n[Widescreen 16:9]\nauthor=someone\ndescription=Wider\npatch=1,EE,00100000,word,00000000\n\n[60 FPS]\ncomment=Smoother // note\npatch=1,EE,00200000,word,00000000\n');
  if (ini != null) fs.writeFileSync(path.join(root, 'gamesettings/SLUS-21386_ABCD1234.ini'), ini);
  const old = process.env.XDG_CONFIG_HOME; delete process.env.XDG_CONFIG_HOME;
  try { return { dir: P.pcsx2Dirs(H)[0], rom, ini: path.join(root, 'gamesettings/SLUS-21386_ABCD1234.ini') }; } finally { if (old !== undefined) process.env.XDG_CONFIG_HOME = old; }
}

test('PCSX2: serial and CRC from its game list, patches from the pnach', async () => {
  const { dir, rom } = pcsx2Setup('p2-list');
  const game = P.pcsx2Game(dir, rom);
  assert.deepStrictEqual(game, { serial: 'SLUS-21386', crc: 0xABCD1234 });
  const l = await P.pcsx2List(dir, game, null, {});
  assert.deepStrictEqual(l.map((p) => [p.description, p.notes, p.author, p.on]), [['60 FPS', 'Smoother', '', false], ['Widescreen 16:9', 'Wider', 'someone', false]]);
});

test('PCSX2: only its own Enable lines are added and removed; the rest of the game ini stays', async () => {
  const USER = '[EmuCore/GS]\nupscale_multiplier = 3\n\n[Patches]\nEnable = Their Patch\n';
  const { dir, rom, ini } = pcsx2Setup('p2-set', USER);
  const game = P.pcsx2Game(dir, rom);
  const [fps] = await P.pcsx2List(dir, game, null, {});
  let mine = P.pcsx2Set(dir, game, [{ ...fps, on: true }], {});
  assert.strictEqual(fs.readFileSync(ini, 'utf8'), '[EmuCore/GS]\nupscale_multiplier = 3\n\n[Patches]\nEnable = Their Patch\nEnable = 60 FPS\n');
  assert.strictEqual((await P.pcsx2List(dir, game, null, mine)).find((p) => p.name === '60 FPS').by, 'cartridge');
  mine = P.pcsx2Set(dir, game, [{ ...fps, on: false }], mine);
  assert.strictEqual(fs.readFileSync(ini, 'utf8'), USER);
  assert.deepStrictEqual(mine, {});
});

test('PCSX2: a game without settings gets a new file with just the patch', async () => {
  const { dir, rom, ini } = pcsx2Setup('p2-new');
  const game = P.pcsx2Game(dir, rom);
  const l = await P.pcsx2List(dir, game, null, {});
  P.pcsx2Set(dir, game, [{ ...l[1], on: true }], {});
  assert.strictEqual(fs.readFileSync(ini, 'utf8'), '[Patches]\nEnable = Widescreen 16:9\n');
});

// ---------------------------------------------------------------- RPCS3 database settings (0.9.3 L)
test('RPCS3 database: writes the game\'s settings once, never over its own', () => {
  const root = path.join(TMP, 'rpcs3db');
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  const dir = { root };
  const DB = JSON.stringify({ return_code: 0, games: { BLUS30443: { config: 'Core:\n  SPU Block Size: Mega\n' } } });
  const a = P.rpcs3ApplyDb(dir, 'BLUS30443', DB, {});
  assert.strictEqual(a.result, 'written');
  assert.strictEqual(fs.readFileSync(path.join(root, 'config/custom_configs/config_BLUS30443.yml'), 'utf8'), 'Core:\n  SPU Block Size: Mega\n');
  assert.ok(a.mine.BLUS30443);
  assert.strictEqual(P.rpcs3ApplyDb(dir, 'BLUS30443', DB, a.mine).result, 'exists');
  assert.strictEqual(P.rpcs3ApplyDb(dir, 'BCUS98137', DB, {}).result, 'none');
});
