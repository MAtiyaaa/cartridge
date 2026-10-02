// Steam shortcuts: the folder shadPS4 starts in (0.9.3, A10). shadPS4 and its Qt launcher use a "user"
// folder in the folder they start in, else ~/.local/share/shadPS4. Each case runs in its own process
// so HOME is read fresh. Run with: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-steam-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// the Start in a shadPS4 shortcut gets, for a home built from a list of folders
function startFor(name, dirs) {
  const H = path.join(TMP, name);
  for (const d of ['Documents/Apps', ...dirs]) fs.mkdirSync(path.join(H, d), { recursive: true });
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null });
    const apps = ${JSON.stringify(path.join(H, 'Documents/Apps'))};
    console.log(sm._startOf({ exe: apps + '/shadPS4QtLauncher-qt.AppImage', start: apps }).replace(${JSON.stringify(H)}, '~'));`;
  fs.mkdirSync(H + '/cfg', { recursive: true });
  return execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H, XDG_DATA_HOME: '' }, encoding: 'utf8' }).trim().split('\n').pop();
}

test('never next to the AppImage, as shadPS4\'s own shortcuts (they start inside its temporary mount)', () => {
  assert.strictEqual(startFor('plain', ['.local/share/shadPS4', '.local/share/shadPS4QtLauncher']), '~/.local/share/shadPS4QtLauncher');
  assert.strictEqual(startFor('fresh', []), '~');
});
test('a stray user folder next to the AppImage is avoided when shadPS4 has its normal data folder', () => {
  assert.strictEqual(startFor('stray', ['Documents/Apps/user', '.local/share/shadPS4', '.local/share/shadPS4QtLauncher']), '~/.local/share/shadPS4QtLauncher');
  assert.strictEqual(startFor('stray2', ['Documents/Apps/user', '.local/share/shadPS4']), '~/.local/share/shadPS4');
});
test('a portable install (its user folder is the only shadPS4 data) keeps starting there', () => {
  assert.strictEqual(startFor('portable', ['Documents/Apps/user']), '~/Documents/Apps');
});

// 0.9.3 D: a PS3 game Cartridge installed into RPCS3 starts by its serial, never a path in RPCS3's storage
test('a PS3 game installed in RPCS3 starts by serial; any other emulator keeps the path', () => {
  const H = path.join(TMP, 'ps3');
  fs.mkdirSync(H + '/cfg', { recursive: true });
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null,
      installRecord: (id) => (id === 5 ? { emu: 'rpcs3', serial: 'BLUS30001', dir: '/x/dev_hdd0/game/BLUS30001', created: true } : null) });
    const rom = { id: 5, platform_slug: 'ps3', fs_name: 'Game' };
    console.log(JSON.stringify([
      sm._buildLaunch(rom, '/roms/ps3/Game', { exe: '/usr/bin/flatpak', args: 'run net.rpcs3.RPCS3 --no-gui "{ROM}"', kind: 'path' }).args,
      sm._buildLaunch(rom, '/roms/ps3/Game', { exe: '/x/rpcs3.sh', args: '--no-gui "%RPCS3_GAMEID%:{SERIAL}"', kind: 'serial' }).args,
      sm._buildLaunch({ ...rom, id: 6 }, '/roms/ps3/Other.iso', { exe: '/x/rpcs3.sh', args: '--no-gui "{ROM}"', kind: 'path' }).args,
    ]));`;
  const out = JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H }, encoding: 'utf8' }).trim().split('\n').pop());
  assert.deepStrictEqual(out, ['run net.rpcs3.RPCS3 --no-gui "%RPCS3_GAMEID%:BLUS30001"', '--no-gui "%RPCS3_GAMEID%:BLUS30001"', '--no-gui "/roms/ps3/Other.iso"']);
});

test('a PS3 game that came as .pkg can only be added to Steam once installed in RPCS3', () => {
  const H = path.join(TMP, 'ps3pkg');
  const dl = path.join(H, 'roms/ps3/Game');
  fs.mkdirSync(dl, { recursive: true }); fs.mkdirSync(H + '/cfg', { recursive: true });
  const b = Buffer.alloc(0x100); b.writeUInt32BE(0x7f504b47, 0); b.writeUInt16BE(1, 6); b.write('UP0001-NPUA80523_00-GAME000000000000', 0x30, 'latin1');
  fs.writeFileSync(path.join(dl, 'Game.pkg'), b);
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null, installRecord: () => null });
    const r = sm._buildLaunch({ id: 7, platform_slug: 'ps3', fs_name: 'Game' }, ${JSON.stringify(dl)}, { exe: '/x/rpcs3.sh', args: '--no-gui "{ROM}"', kind: 'path' });
    console.log(JSON.stringify(r.missing || null));`;
  const out = JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H }, encoding: 'utf8' }).trim().split('\n').pop());
  assert.match(out, /Install it in RPCS3 first/);
});

// 0.9.3 K (A10): shadPS4's core on its own, the build the Qt launcher has selected, in its own folder
test('shadPS4 core without the launcher: the selected version, started in its own folder', () => {
  const H = path.join(TMP, 'shadcore');
  const L = path.join(H, '.local/share/shadPS4QtLauncher');
  const v1 = path.join(L, 'versions/v.0.12.0'), v2 = path.join(L, 'versions/Pre-release-abc');
  for (const d of [v1, v2, H + '/cfg']) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(v1, 'Shadps4-sdl.AppImage'), ''); fs.writeFileSync(path.join(v2, 'Shadps4-sdl.AppImage'), '');
  fs.writeFileSync(path.join(L, 'versions.json'), JSON.stringify([{ name: 'v.0.12.0', path: path.join(v1, 'Shadps4-sdl.AppImage'), date: '2026-08-01' }, { name: 'Pre-release-abc', path: path.join(v2, 'Shadps4-sdl.AppImage'), date: '2026-09-20' }]));
  fs.writeFileSync(path.join(L, 'qt_ui.ini'), `[general]\nx=1\n\n[version_manager]\nversionSelected=${path.join(v1, 'Shadps4-sdl.AppImage')}\n`);
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null });
    const c = sm._candidates('ps4').find((x) => x.id === 'shadps4@core');
    console.log(JSON.stringify(c && [c.t.exe.replace(${JSON.stringify(H)}, '~'), sm._startOf(c.t).replace(${JSON.stringify(H)}, '~'), c.t.args, c.t.kind]));`;
  const run = () => JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H, XDG_DATA_HOME: '' }, encoding: 'utf8' }).trim().split('\n').pop());
  assert.deepStrictEqual(run(), ['~/.local/share/shadPS4QtLauncher/versions/v.0.12.0/Shadps4-sdl.AppImage', '~/.local/share/shadPS4QtLauncher/versions/v.0.12.0', '-g "{ROM}" -f true', 'eboot']);
  // the selected one was removed: the newest still there
  fs.rmSync(v1, { recursive: true });
  assert.strictEqual(run()[0], '~/.local/share/shadPS4QtLauncher/versions/Pre-release-abc/Shadps4-sdl.AppImage');
});

// 0.9.3 K (K2): Flatpak Steam starts emulators outside its sandbox through flatpak-spawn --host
test('Flatpak Steam: shortcuts go through flatpak-spawn --host with folder, env and wrappers', () => {
  const H = path.join(TMP, 'fpsteam');
  const ud = path.join(H, '.var/app/com.valvesoftware.Steam/data/Steam/userdata/123/config');
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(H + '/cfg', { recursive: true });
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null });
    console.log(JSON.stringify([sm._hostLaunch('/home/u/Apps/Cemu.AppImage', '-f -g "/roms/wiiu/Game.rpx"', '/home/u/Apps', ['vblank_mode=0', 'gamemoderun', '%command%']), sm.flatpakSteamAccess()]));`;
  const out = JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H }, encoding: 'utf8' }).trim().split('\n').pop());
  assert.deepStrictEqual(out[0], { target: '"/usr/bin/flatpak-spawn"', launch: '--host --directory="/home/u/Apps" --env=vblank_mode=0 gamemoderun "/home/u/Apps/Cemu.AppImage" -f -g "/roms/wiiu/Game.rpx"' });
  assert.strictEqual(out[1], 'needed');
});

test('Flatpak Steam: a flatpak-spawn shortcut reads back as the emulator, its folder and options', () => {
  const H = path.join(TMP, 'fpread');
  const cfg = path.join(H, '.var/app/com.valvesoftware.Steam/data/Steam/userdata/123/config');
  fs.mkdirSync(cfg, { recursive: true }); fs.mkdirSync(H + '/cfg', { recursive: true });
  const { writeVdf } = require('../electron/steamArt.js');
  fs.writeFileSync(path.join(cfg, 'shortcuts.vdf'), writeVdf({ shortcuts: { 0: { appid: 1, AppName: 'Game', Exe: '"/usr/bin/flatpak-spawn"', StartDir: '"/home/u"', LaunchOptions: '--host --directory="/home/u/Apps" --env=vblank_mode=0 gamemoderun "/home/u/Apps/Cemu.AppImage" -f -g "/roms/wiiu/Game.rpx"' } } }));
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null });
    const sc = sm._readShortcuts();
    console.log(JSON.stringify(sc.map((x) => [x.exe, x.start, x.lo, x.host])));`;
  const out = JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H }, encoding: 'utf8' }).trim().split('\n').pop());
  assert.deepStrictEqual(out, [['/home/u/Apps/Cemu.AppImage', '/home/u/Apps', 'vblank_mode=0 gamemoderun %command% -f -g "/roms/wiiu/Game.rpx"', true]]);
});

// J13: Shortcut health finds a shortcut whose emulator moved and offers the copy that is there now
test('Shortcut health: emulator moved, and the fix points at the one installed now', () => {
  // its own temp folder: a path with "cartridge" in it reads as Cartridge's own shortcut
  const H = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-health-'));
  test.after(() => fs.rmSync(H, { recursive: true, force: true }));
  const cfg = path.join(H, '.local/share/Steam/userdata/123/config');
  for (const d of [cfg, H + '/cfg', H + '/Applications', H + '/roms/ps2']) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(H, 'Applications/pcsx2-v2.2.0-linux-appimage-x64-Qt.AppImage'), '');
  fs.writeFileSync(path.join(H, 'roms/ps2/Game.iso'), '');
  const { writeVdf } = require('../electron/steamArt.js');
  fs.writeFileSync(path.join(cfg, 'shortcuts.vdf'), writeVdf({ shortcuts: { 0: { appid: 7, AppName: 'Game', Exe: `"${H}/Old/pcsx2-v1.7.0.AppImage"`, StartDir: `"${H}/Old"`, LaunchOptions: `-batch -fullscreen "${H}/roms/ps2/Game.iso"` } } }));
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: { ps2: ['ps2'] }, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null });
    const h = sm.health();
    console.log(JSON.stringify(h.problems.map((p) => [p.name, p.issues.map((i) => [i.kind, i.fix && i.fix.to])])));`;
  const out = JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H, XDG_DATA_HOME: '' }, encoding: 'utf8' }).trim().split('\n').pop());
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0][1][0][0], 'emulator');
  assert.match(out[0][1][0][1] || '', /pcsx2-v2\.2\.0/);
});
