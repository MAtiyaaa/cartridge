// CIDE for Steam (0.9.52): the Steam manager's ID rules moved into CIDE (cide.steam) must make every shortcut exactly
// as before. A fake home with RPCS3, Vita3K and shadPS4 games (ISOs with serials inside, PARAM.SFO folders, Vita
// installs, a games.yml) and a corpus of ROM names and real-world shortcut lines run through the whole launch path
// (gameRef + buildLaunch: what goes in Target and Launch options), shortcut learning (learnOne) and "already in Steam"
// matching (inSteamIndex, gameSerial). The answers are compared with test/fixtures/cide-steam-golden.json, recorded
// from the code before the move. Any difference fails. Regenerate only on purpose: CIDE_GOLDEN=write npm test.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const C = require('../electron/cide');

const ROOT = path.join(__dirname, '..');
const GOLDEN = path.join(__dirname, 'fixtures/cide-steam-golden.json');

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
const blob = (text, at = 0x8000, size = 0x10000) => { const b = Buffer.alloc(size); if (text) b.write(text, at, 'latin1'); return b; };

// the fake home: every kind of PS3, PS4 and Vita game the launch path reads
function home() {
  const H = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-cide-'));
  const put = (rel, data = '') => { const f = path.join(H, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
  const R = 'Emulation/roms/';
  put(R + 'ps3/Demons Souls.iso', blob('PS3_DISC.SFB BLUS30443 '));
  put(R + 'ps3/Flower PSN.iso', blob('NPEB01234 data'));
  put(R + 'ps3/No Serial Here.iso', blob('nothing to see'));
  put(R + 'ps3/Lower blus30443 name.iso', blob(''));
  put(R + 'ps3/Uncharted/PS3_GAME/PARAM.SFO', sfo({ TITLE_ID: 'BCES00052', TITLE: 'Uncharted' }));
  put(R + 'ps3/Uncharted/PS3_GAME/USRDIR/EBOOT.BIN', 'x');
  put(R + 'ps3/Wrapped/Inner Game/PS3_GAME/PARAM.SFO', sfo({ TITLE_ID: 'BLES00932' }));
  put(R + 'ps3/Iso In Folder/game.iso', blob('BLJM60066 x'));
  put(R + 'ps3/Plain Folder/readme.txt', 'no serial');
  put(R + 'ps3/Pkg Game/game.pkg', 'pkg');
  put(R + 'ps4/Bloodborne/sce_sys/param.sfo', sfo({ TITLE_ID: 'CUSA00900', TITLE: 'Bloodborne' }));
  put(R + 'ps4/Bloodborne/eboot.bin', 'x');
  put(R + 'ps4/Astro/sce_sys/param.sfo', sfo({ TITLE_ID: 'PPSA01325' }));
  put(R + 'ps4/Astro/eboot.bin', 'x');
  put(R + 'ps4/NoId/eboot.bin', 'x');
  put(R + 'psvita/Persona.vpk', blob('PCSE00120 content', 0x40));
  put(R + 'psvita/Gravity/game.pkg', blob('EP9000-PCSB00999_00 x', 0x30));
  put(R + 'psvita/Unknown.vpk', blob('nothing', 0x40));
  put(R + 'psvita/Named Only.vpk', blob('', 0x40));
  put('.config/rpcs3/games.yml', 'BLUS30443: /games/ds/\nBCES00052: /games/u/\nBLJM60066: /x/\n');
  put('.local/share/Vita3K/Vita3K/ux0/app/PCSE00120/sce_sys/param.sfo', sfo({ TITLE_ID: 'PCSE00120', TITLE: 'Persona 4 Golden' }));
  put('.local/share/Vita3K/Vita3K/ux0/app/PCSB00999/sce_sys/param.sfo', sfo({ TITLE_ID: 'PCSB00999', TITLE: 'Gravity Rush' }));
  put('.local/share/Vita3K/Vita3K/ux0/app/PCSA00011/sce_sys/param.sfo', sfo({ TITLE_ID: 'PCSA00011', TITLE: 'Named Only (USA)' }));
  return H;
}

// everything the Steam manager decides from IDs, for the fake home
function run(H) {
  const code = `
    const path = require('path');
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null, installRecord: () => null });
    const H = ${JSON.stringify(H)}, R = H + '/Emulation/roms/';
    const out = { launch: [], learn: [], match: [], serial: [] };
    const TPL = {
      ps3: [{ exe: '/x/rpcs3.sh', args: '--no-gui "%RPCS3_GAMEID%:{SERIAL}"', kind: 'serial' }, { exe: '/x/rpcs3.sh', args: '--no-gui {SERIAL}', kind: 'serial' }, { exe: '/usr/bin/flatpak', args: 'run net.rpcs3.RPCS3 --no-gui "{ROM}"', kind: 'path' }, { exe: '/x/rpcs3', args: '"{ROM}"', kind: 'eboot' }],
      ps4: [{ exe: '/x/shadPS4.AppImage', args: '-g {SERIAL}', kind: 'titleid' }, { exe: '/x/shadPS4.AppImage', args: '-g "{ROM}"', kind: 'eboot' }, { exe: '/x/shadPS4.AppImage', args: '-g "{ROM}"', kind: 'path' }],
      psvita: [{ exe: '/x/Vita3K', args: '-F -r {SERIAL}', kind: 'vitaid' }, { exe: '/x/vita3k.sh', args: '{SERIAL}', kind: 'vitaid', pre: ['vblank_mode=0'], command: true }],
    };
    const NAMES = {
      ps3: ['Demons Souls', "Demon's Souls [BLUS30443]", 'Demons Souls (BLUS-30443)', 'blus30443', 'Flower NPUB30025', 'ABCD12345 Fake', 'Game', 'Uncharted', 'ULUS10041 psp named', 'PS3 BCES-00052 Dash'],
      ps4: ['Bloodborne', 'Bloodborne CUSA00900', 'bloodborne cusa00900', 'Astro PPSA01325', 'CUSA-00900 dash', 'Game'],
      psvita: ['Persona 4 Golden', 'Persona [PCSE00120]', 'pcse00120 lower', 'Gravity Rush', 'Named Only', 'Unknown', 'PCSB00999'],
    };
    const FILES = {
      ps3: ['ps3/Demons Souls.iso', 'ps3/Flower PSN.iso', 'ps3/No Serial Here.iso', 'ps3/Lower blus30443 name.iso', 'ps3/Uncharted', 'ps3/Wrapped', 'ps3/Iso In Folder', 'ps3/Plain Folder', 'ps3/Pkg Game'],
      ps4: ['ps4/Bloodborne', 'ps4/Astro', 'ps4/NoId'],
      psvita: ['psvita/Persona.vpk', 'psvita/Gravity', 'psvita/Unknown.vpk', 'psvita/Named Only.vpk'],
    };
    let id = 1;
    for (const key of Object.keys(TPL)) for (const name of NAMES[key]) for (const f of FILES[key]) {
      const rom = { id: id++, name, fs_name: name, platform_slug: key };
      for (const t of TPL[key]) { let r; try { r = sm._buildLaunch(rom, R + f, t); } catch (e) { r = { error: e.message }; } out.launch.push([name, f, t.args, r]); }
      out.serial.push([name, f, sm._gameSerial({ rom, file: R + f, key }), key === 'psvita' ? sm._vitaTitleId(rom, R + f) : null, sm.serialOf(rom, R + f)]);
    }
    const LINES = [
      ['RPCS3', '/home/u/Emulation/tools/launchers/rpcs3.sh', '--no-gui "%RPCS3_GAMEID%:BLUS30443"'],
      ['RPCS3 Flatpak', '/usr/bin/flatpak', 'run net.rpcs3.RPCS3 --no-gui %RPCS3_GAMEID%:BCES00052'],
      ['RPCS3 path', '/home/u/Applications/rpcs3.AppImage', '--no-gui "/home/u/Emulation/roms/ps3/Uncharted/PS3_GAME/USRDIR/EBOOT.BIN"'],
      ['shadPS4', '/home/u/Applications/shadPS4.AppImage', '-g CUSA00900'],
      ['shadPS4 quoted', '/home/u/Applications/shadPS4.AppImage', '-g "PPSA01325" --fullscreen true'],
      ['shadPS4 path', '/home/u/Applications/shadPS4.AppImage', '-g "/home/u/Emulation/roms/ps4/Bloodborne/eboot.bin"'],
      ['Vita3K', '/home/u/Applications/Vita3K/Vita3K', '-F -r PCSE00120'],
      ['Vita3K env', '/home/u/Applications/Vita3K/Vita3K', 'vblank_mode=0 %command% -F -r PCSB00999'],
      ['Dolphin', '/usr/bin/flatpak', 'run org.DolphinEmu.dolphin-emu -b -e "/home/u/Emulation/roms/gc/Melee.iso"'],
      ['Xenia', '/home/u/Emulation/roms/xbox360/xenia_canary.exe', '"Z:/home/u/Emulation/roms/xbox360/Halo 3.iso"'],
      ['Nothing', '/usr/bin/true', ''],
      ['Fake serial', '/x/rpcs3.sh', '--no-gui "%RPCS3_GAMEID%:ABCD12345"'],
      ['Lower', '/x/shadPS4', '-g cusa00900'],
      ["Demon's Souls", '/x/rpcs3.sh', '--no-gui %RPCS3_GAMEID%:BLUS30443'],
      ['Bloodborne (PS4)', '/x/shadPS4.AppImage', '-g CUSA00900'],
    ];
    for (const [name, exe, lo] of LINES) { let r; try { r = sm._learnOne({ name, exe, lo, start: '', appid: 1 }); } catch (e) { r = { error: e.message }; } out.learn.push([name, r]); }
    const scs = LINES.map(([name, exe, lo], i) => ({ name, exe, lo, appid: 100 + i, start: '' }));
    const find = sm._inSteamIndex(scs);
    id = 1000;
    for (const key of Object.keys(TPL)) for (const name of [...NAMES[key], "Demon's Souls", 'Bloodborne']) for (const f of [...FILES[key], null]) {
      const rom = { id: id++, name, fs_name: name, platform_slug: key };
      const hit = find({ rom, file: f ? R + f : null, key, platform: { display_name: key } });
      out.match.push([key, name, f, hit ? hit.appid : null]);
    }
    console.log(JSON.stringify(out).split(H).join('~'));`;
  fs.mkdirSync(H + '/cfg', { recursive: true });
  return JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H, XDG_DATA_HOME: '', XDG_CONFIG_HOME: '' }, encoding: 'utf8', maxBuffer: 64 << 20 }).trim().split('\n').pop());
}

test('Steam shortcuts are made exactly as before CIDE (launch lines, learning, in-Steam matching)', () => {
  const H = home();
  try {
    const got = run(H);
    if (process.env.CIDE_GOLDEN === 'write') fs.writeFileSync(GOLDEN, JSON.stringify(got, null, 1) + '\n');
    const want = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
    for (const k of Object.keys(want)) {
      assert.strictEqual(got[k].length, want[k].length, k + ': as many answers');
      want[k].forEach((w, i) => assert.deepStrictEqual(got[k][i], w, `${k} #${i}`));
    }
    // the corpus really covers the ID paths (not a test of nothing)
    assert.ok(want.launch.some((x) => /BLUS30443/.test(JSON.stringify(x[3]))) && want.launch.some((x) => /CUSA00900/.test(JSON.stringify(x[3]))) && want.launch.some((x) => /PCSE00120/.test(JSON.stringify(x[3]))));
    assert.ok(want.match.filter((x) => x[3]).length >= 5);
  } finally { fs.rmSync(H, { recursive: true, force: true }); }
});

test('CIDE\'s Steam rules answer like the old inline ones on a wide name corpus', () => {
  // the old rules, as they were written in steamManager.js before 0.9.52
  const OLD = {
    nameSerial: (t) => { const m = t.match(/\b([A-Z]{4})-?(\d{5})\b/); return m ? m[1] + m[2] : null; },
    plainSerial: (t) => (t.match(/\b([A-Z]{4}\d{5})\b/) || [])[1] || null,
    anySerial: (t) => (t.match(/[A-Z]{4}\d{5}/) || [])[0] || null,
    ps3Disc: (t) => (t.match(/(BL|BC|NP)(US|ES|JS|AS|KS|UB|EB|JM|JB|HB|UA|EA|JA|HA|KA|UJ|UZ)\d{5}/) || [])[0] || null,
    vitaName: (t) => (t.match(/\b(PCS[A-Z]\d{5})\b/) || [])[1] || null,
    vitaAny: (t) => (t.match(/PCS[A-Z]\d{5}/) || [])[0] || null,
    isVitaId: (t) => /^PCS[A-Z]\d{5}$/.test(t),
    ps4Name: (t) => t.match(/\b(CUSA|PPSA)\d{5}\b/i)?.[0]?.toUpperCase() || null,
    ps4Any: (t) => (t.match(/(CUSA|PPSA)\d{5}/) || [])[0] || null,
    isPs4Arg: (t) => /^(CUSA|PPSA)\d{5}$/.test(t),
    isRpcs3Arg: (t) => /%RPCS3_GAMEID%:[A-Z]{4}\d{5}/.test(t),
    launchSerial: (t) => (t.match(/%RPCS3_GAMEID%:([A-Z]{4}\d{5})/) || t.match(/(?:^|\s)["']?((?:CUSA|PPSA)\d{5})\b/) || [])[1] || null,
    toPlaceholder: (t) => t.replace(/[A-Z]{4}\d{5}/, '{SERIAL}'),
  };
  const words = ['BLUS30443', 'BLUS-30443', 'blus30443', 'NPUB30025', 'NPEB01234', 'BCES00052', 'ABCD12345', 'PCSE00120', 'pcse00120', 'PCSB00999', 'CUSA00900', 'cusa00900', 'PPSA01325', 'CUSA-00900', 'SLUS20312', 'ULUS10041', '01007EF00011E000', 'GALE01', 'X', '', '%RPCS3_GAMEID%:BLUS30443', '"%RPCS3_GAMEID%:BCES00052"', '-g CUSA00900', '-g "PPSA01325"', 'ABCDE123456', 'AB12345', 'BLUS304431', '[BLUS30443]', '(PCSE00120)', 'EP9000-PCSB00999_00'];
  const texts = [];
  for (const a of words) { texts.push(a); for (const b of words.slice(0, 12)) texts.push(`${a} ${b}`, `Game ${a}.iso`, `${a}_${b}`); }
  for (const t of texts) for (const k of Object.keys(OLD)) assert.deepStrictEqual(C.steam[k](t), OLD[k](t), `${k}(${JSON.stringify(t)})`);
});
