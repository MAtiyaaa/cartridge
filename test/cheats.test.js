// Dolphin and PPSSPP patches and cheats (0.9.16): listed from the emulator's files, turned on the way
// the emulator writes it, and off again only where Cartridge turned them on.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const C = require('../electron/cheats.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-cheats-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));
const put = (f, t) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); };

test('Dolphin: codes from the shipped and user GameSettings, defaults and user choices', () => {
  const home = path.join(TMP, 'd1');
  put(path.join(home, '.config/dolphin-emu/Dolphin.ini'), '[Core]\nCPUThread = True\n');
  const dirs = C.dolphinDirs(home, {});
  assert.strictEqual(dirs.length, 1);
  const dir = dirs[0];
  put(path.join(dir.user, 'GameSettings/GALE01.ini'), '[Gecko]\n$My code [Me]\n04000000 00000000\n[OnFrame_Disabled]\n$Fix B\n');
  const sys = '[OnFrame]\n$Fix A\n0x80001234:dword:0x60000000\n$Fix B\n0x80001238:dword:0x60000000\n[OnFrame_Enabled]\n$Fix A\n$Fix B\n[ActionReplay]\n$Infinite lives\n* Needs the US disc\n00000000 00000000\n';
  const list = C.dolphinList(dir, 'GALE01', sys, {});
  const by = Object.fromEntries(list.map((p) => [p.name, p]));
  assert.deepStrictEqual(list.map((p) => p.name), ['Fix A', 'Fix B', 'Infinite lives', 'My code']);
  assert.strictEqual(by['Fix A'].on, true); assert.strictEqual(by['Fix A'].by, 'emulator');
  assert.strictEqual(by['Fix B'].on, false); // the user turned it off
  assert.strictEqual(by['My code'].author, 'Me');
  assert.match(by['Infinite lives'].notes, /Cheat · Needs the US disc/);

  // turn on a cheat: user _Enabled gets "$Name", Dolphin.ini gets EnableCheats
  let mine = C.dolphinSet(dir, 'GALE01', [{ ...by['Infinite lives'], on: true }, { ...by['Fix B'], on: true }], {});
  const ini = fs.readFileSync(path.join(dir.user, 'GameSettings/GALE01.ini'), 'utf8');
  assert.match(ini, /\[ActionReplay_Enabled\]\n\$Infinite lives/);
  assert.match(ini, /\[OnFrame_Enabled\]\n\$Fix B/);
  assert.doesNotMatch(ini, /\[OnFrame_Disabled\]\n\$Fix B/);
  assert.match(ini, /\$My code \[Me\]\n04000000/); // the user's own code untouched
  assert.match(fs.readFileSync(path.join(dir.config, 'Dolphin.ini'), 'utf8'), /\[Core\]\nCPUThread = True\nEnableCheats = True/);
  const again = C.dolphinList(dir, 'GALE01', sys, mine).find((p) => p.name === 'Infinite lives');
  assert.strictEqual(again.on, true); assert.strictEqual(again.by, 'cartridge');

  // off again: the line goes, and so does the cheats switch Cartridge turned on
  mine = C.dolphinSet(dir, 'GALE01', [{ ...again, on: false }], mine);
  assert.doesNotMatch(fs.readFileSync(path.join(dir.user, 'GameSettings/GALE01.ini'), 'utf8'), /\$Infinite lives/);
  assert.match(fs.readFileSync(path.join(dir.config, 'Dolphin.ini'), 'utf8'), /EnableCheats = False/);
  assert.ok(Object.keys(mine).every((k) => !k.startsWith('@cheats')));
});

test('Dolphin: cheats switch the user turned on stays on', () => {
  const home = path.join(TMP, 'd2');
  put(path.join(home, '.var/app/org.DolphinEmu.dolphin-emu/config/dolphin-emu/Dolphin.ini'), '[Core]\nEnableCheats = True\n');
  const dir = C.dolphinDirs(home, {}).find((d) => d.flatpak);
  const p = C.dolphinList(dir, 'RMGE01', '[Gecko]\n$Code\n00000000 00000000\n', {})[0];
  let mine = C.dolphinSet(dir, 'RMGE01', [{ ...p, on: true }], {});
  mine = C.dolphinSet(dir, 'RMGE01', [{ ...p, on: false }], mine);
  assert.match(fs.readFileSync(path.join(dir.config, 'Dolphin.ini'), 'utf8'), /EnableCheats = True/);
});

test('GameCube/Wii game ID from ISO, RVZ and WBFS', () => {
  const iso = path.join(TMP, 'g.iso'); put(iso, Buffer.concat([Buffer.from('GALE01'), Buffer.alloc(100)]));
  const rvz = Buffer.alloc(0x100); rvz.write('RVZ\x01', 0, 'latin1'); rvz.write('RMGE01', 0x58, 'latin1');
  const wbfs = Buffer.alloc(0x300); wbfs.write('WBFS', 0, 'latin1'); wbfs[8] = 9; wbfs.write('RSBE01', 0x200, 'latin1');
  put(path.join(TMP, 'g.rvz'), rvz); put(path.join(TMP, 'g.wbfs'), wbfs);
  assert.strictEqual(C.gcWiiId(iso), 'GALE01');
  assert.strictEqual(C.gcWiiId(path.join(TMP, 'g.rvz')), 'RMGE01');
  assert.strictEqual(C.gcWiiId(path.join(TMP, 'g.wbfs')), 'RSBE01');
});

test('PPSSPP: cheats from the game file and cheat.db, _C0/_C1 and EnableCheats', () => {
  const home = path.join(TMP, 'p1');
  const root = path.join(home, '.config/ppsspp');
  put(path.join(root, 'PSP/SYSTEM/ppsspp.ini'), '[General]\nLanguage = en_US\n');
  put(path.join(root, 'PSP/Cheats/ULUS10041.ini'), '_S ULUS-10041\n_G Game\n_C1 Mine\n_L 0x1 0x2\n');
  put(path.join(root, 'PSP/Cheats/cheat.db'), '_S ULES-00001\n_G Other\n_C0 Nope\n_L 0x0 0x0\n_S ULUS-10041\n_G Game\n_C0 Max money\n_L 0x2000 0x3\n_L 0x2004 0x4\n_C0 Mine\n_L 0x1 0x2\n');
  const dir = C.ppssppDirs(home, {})[0];
  const list = C.ppssppList(dir, 'ULUS10041', {});
  assert.deepStrictEqual(list.map((p) => [p.name, p.on, p.by]), [['Max money', false, null], ['Mine', true, 'emulator']]);
  let mine = C.ppssppSet(dir, 'ULUS10041', [{ ...list[0], on: true }], {}, 'Game');
  const t = fs.readFileSync(path.join(dir.cheats, 'ULUS10041.ini'), 'utf8');
  assert.match(t, /_C1 Max money\n_L 0x2000 0x3\n_L 0x2004 0x4\n/);
  assert.match(t, /_C1 Mine/);
  assert.match(fs.readFileSync(dir.ini, 'utf8'), /EnableCheats = True/);
  const on = C.ppssppList(dir, 'ULUS10041', mine).find((p) => p.name === 'Max money');
  assert.strictEqual(on.by, 'cartridge');
  mine = C.ppssppSet(dir, 'ULUS10041', [{ ...on, on: false }], mine);
  assert.match(fs.readFileSync(path.join(dir.cheats, 'ULUS10041.ini'), 'utf8'), /_C0 Max money/);
  assert.match(fs.readFileSync(dir.ini, 'utf8'), /EnableCheats = False/);
});

test('PPSSPP: a new game file gets the header PPSSPP writes', () => {
  const home = path.join(TMP, 'p2');
  const root = path.join(home, '.config/ppsspp');
  put(path.join(root, 'PSP/SYSTEM/ppsspp.ini'), '[General]\n');
  put(path.join(root, 'PSP/Cheats/cheat.db'), '_S NPUZ-00001\n_G Small\n_C0 One\n_L 0x1 0x1\n');
  const dir = C.ppssppDirs(home, {})[0];
  const p = C.ppssppList(dir, 'NPUZ00001', {})[0];
  C.ppssppSet(dir, 'NPUZ00001', [{ ...p, on: true }], {}, 'Small');
  assert.strictEqual(fs.readFileSync(path.join(dir.cheats, 'NPUZ00001.ini'), 'utf8'), '_S NPUZ-00001\n_G Small\n_C1 One\n_L 0x1 0x1\n');
});
