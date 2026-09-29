// Android emulator profiles: every console points at a real emulator, every package is visible to the app
// (the manifest's <queries>, needed from Android 11), and a launch is built the way the emulator documents.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const load = () => import('../src/android/emulators.js');

test('every console uses emulators that exist, and cores for RetroArch only when RetroArch has some', async () => {
  const { EMUS, CONSOLES } = await load();
  for (const [key, c] of Object.entries(CONSOLES)) {
    for (const id of c.emus) assert.ok(EMUS[id], `${key} lists an unknown emulator ${id}`);
    assert.ok(c.emus.length || c.cores.length, `${key} can not be played at all`);
  }
  for (const [id, e] of Object.entries(EMUS)) assert.ok((e.apps.length || e.family) && e.apps.every((x) => x.pkg && x.activity), `${id} needs a package and an activity (or is found by name)`);
});

test('the manifest lists every emulator package', async () => {
  const { allPackages } = await load();
  const xml = fs.readFileSync(path.join(__dirname, '../android/app/src/main/AndroidManifest.xml'), 'utf8');
  const missing = allPackages().filter((p) => !xml.includes(`<package android:name="${p}" />`));
  assert.deepStrictEqual(missing, [], 'add these to <queries> in AndroidManifest.xml');
});

test('RomM slugs map to consoles', async () => {
  const { consoleKey } = await load();
  assert.strictEqual(consoleKey('ngc'), 'gc');
  assert.strictEqual(consoleKey('genesis-slash-megadrive'), 'md');
  assert.strictEqual(consoleKey('nope', 'psp'), 'psp');
  assert.strictEqual(consoleKey('win'), null);
});

test('launch plans follow the emulators\' own intents', async () => {
  const { EMUS, planLaunch, candidatesFor, coreFor } = await load();
  const ppsspp = planLaunch('ppsspp', EMUS.ppsspp.apps[1]);
  assert.strictEqual(ppsspp.action, 'android.intent.action.VIEW');
  assert.strictEqual(ppsspp.data, '{URI}');
  const ra = planLaunch('retroarch', EMUS.retroarch.apps[0], { core: 'snes9x' });
  assert.strictEqual(ra.extras.LIBRETRO, '/data/data/com.retroarch.aarch64/cores/snes9x_libretro_android.so');
  assert.strictEqual(ra.extras.ROM, '{ROM}');
  assert.deepStrictEqual(planLaunch('duckstation', EMUS.duckstation.apps[0]).bools, { resumeState: false });
  assert.strictEqual(planLaunch('aps3e', EMUS.aps3e.apps[0], { folder: true }).extras.game_dir, '{ROM}');
  // picks: this game, then the console, then the list order; RetroArch only where it has a core
  const found = { dolphin: {}, mmjr: {}, retroarch: {} };
  assert.deepStrictEqual(candidatesFor('gc', found, {}, 1), ['dolphin', 'mmjr', 'retroarch']);
  assert.deepStrictEqual(candidatesFor('gc', found, { emus: { gc: 'mmjr' }, gameEmus: { 1: 'retroarch' } }, 1), ['retroarch', 'mmjr', 'dolphin']);
  assert.deepStrictEqual(candidatesFor('wiiu', found, {}, 1), []);
  assert.strictEqual(coreFor('snes', {}), 'snes9x');
  assert.strictEqual(coreFor('snes', { cores: { snes: 'bsnes' } }), 'bsnes');
});

test('a game with an update and DLC becomes one bundle, and launches the base game', async () => {
  const { makeBundle, playablePath, versionOf, cleanName, compareVersions } = await import('../src/android/bundle.js');
  const files = [
    { file_name: 'Mario Kart 8 Deluxe.nsp', full_path: 'switch/roms/MK8/Mario Kart 8 Deluxe.nsp', file_size_bytes: 16e9, category: 'game' },
    { file_name: 'Mario Kart 8 Deluxe [v3.0.4] Update.nsp', full_path: 'switch/roms/MK8/update/Mario Kart 8 Deluxe [v3.0.4] Update.nsp', file_size_bytes: 3e9, category: 'update' },
    { file_name: 'Mario Kart 8 Deluxe v2.0.0 Update.nsp', full_path: 'switch/roms/MK8/update/Mario Kart 8 Deluxe v2.0.0 Update.nsp', file_size_bytes: 2e9, category: null },
    { file_name: 'Booster Course Pass [0100152000023001].nsp', full_path: 'switch/roms/MK8/dlc/Booster Course Pass [0100152000023001].nsp', file_size_bytes: 1e9, category: 'dlc' },
    { file_name: 'notes.txt', full_path: 'switch/roms/MK8/notes.txt', file_size_bytes: 10, category: 'game' },
  ];
  const scan = { folder: true, files: [{ rel: 'Mario Kart 8 Deluxe.nsp', size: 16e9 }, { rel: 'update/Mario Kart 8 Deluxe [v3.0.4] Update.nsp', size: 3e9 }, { rel: 'dlc/Booster Course Pass [0100152000023001].nsp', size: 1e9 }] };
  const b = makeBundle({ files, prefix: 'switch/roms/MK8/', scan });
  assert.strictEqual(b.extras, true);
  assert.deepStrictEqual(b.groups.map((g) => g.cat), ['game', 'update', 'dlc']);
  assert.strictEqual(b.latest.version, '3.0.4');
  assert.strictEqual(b.dlc, 1);
  assert.strictEqual(b.groups[2].items[0].name, 'Booster Course Pass');
  assert.strictEqual(b.groups[1].items.find((x) => x.version === '2.0.0').on, false); // on the server, not on the device
  assert.strictEqual(playablePath('/sd/switch/MK8', b, scan), '/sd/switch/MK8/Mario Kart 8 Deluxe.nsp');
  assert.strictEqual(playablePath('/sd/psp/Game.iso', null, { folder: false, files: [] }), '/sd/psp/Game.iso');
  assert.strictEqual(versionOf('Game [v131072].nsp'), 'v131072');
  assert.strictEqual(cleanName('Game (USA) [0100AB].nsp'), 'Game (USA)');
  assert.ok(compareVersions('3.0.4', '3.0.10') < 0);
  // no category from an old server: the folder says it
  const old = makeBundle({ scan: { files: [{ rel: 'Game.iso', size: 5 }, { rel: 'DLC/Pack.iso', size: 4 }] } });
  assert.deepStrictEqual(old.groups.map((g) => g.cat), ['game', 'dlc']);
  // a plain single game is not shown as a bundle
  assert.strictEqual(makeBundle({ files: [files[0]], prefix: 'x/' }).extras, false);
});

test('forks and betas are found by name and offered after the known builds', async () => {
  const { familyOf, candidatesFor, emuName } = await import('../src/android/emulators.js');
  assert.strictEqual(familyOf('io.github.azahar.next', 'Azahar Next'), 'azahar');
  assert.strictEqual(familyOf('dev.citron.citron_emu', 'Citron'), 'eden');
  assert.strictEqual(familyOf('mobi.mgeek.TunnyBrowser', 'Dolphin Browser'), null);
  assert.strictEqual(familyOf('com.example.notes', 'Notes'), null);
  const found = { azahar: { pkg: 'org.azahar_emu.azahar' }, 'azahar~io.github.azahar.next': { pkg: 'io.github.azahar.next', label: 'Azahar Next' } };
  assert.deepStrictEqual(candidatesFor('3ds', found, {}, 1), ['azahar', 'azahar~io.github.azahar.next']);
  assert.deepStrictEqual(candidatesFor('3ds', found, { emus: { '3ds': 'azahar~io.github.azahar.next' } }, 1)[0], 'azahar~io.github.azahar.next');
  assert.strictEqual(emuName('azahar~io.github.azahar.next', found), 'Azahar Next');
});

test('the ARM emulators start the way their frontends document', async () => {
  const { EMUS, planLaunch, serialOf, candidatesFor, familyOf } = await load();
  const at = (id) => EMUS[id].apps[0];
  assert.strictEqual(planLaunch('armsx2', at('armsx2')).data, '{URI}');
  assert.strictEqual(planLaunch('armsx1', at('armsx1')).activity, 'com.armsx2.Main');
  assert.strictEqual(planLaunch('armsx3', at('armsx3')).extras.path, '{ROM}');
  assert.strictEqual(planLaunch('armsx3', at('armsx3'), { serial: 'BLUS30001' }).extras.title_id, 'BLUS30001');
  assert.deepStrictEqual(planLaunch('vita3k', at('vita3k'), { serial: 'PCSB00245' }).arrays.AppStartParameters, ['-r', 'PCSB00245']);
  assert.strictEqual(planLaunch('vita3k', at('vita3k')).openOnly, true); // no title ID: just open it
  assert.strictEqual(planLaunch('ax360e', at('ax360e')).action, 'aenu.intent.action.AX360E');
  assert.strictEqual(serialOf('Game Name [CUSA12345]'), 'CUSA12345');
  assert.strictEqual(serialOf('Assassins Creed Bloodlines'), '');
  // emulators found by name are only opened
  assert.strictEqual(familyOf('net.rpcsx', 'RPCSX'), 'rpcsx');
  const found = { 'rpcsx~net.rpcsx': { pkg: 'net.rpcsx' }, aps3e: { pkg: 'aenu.aps3e' } };
  assert.deepStrictEqual(candidatesFor('ps3', found, {}, 1), ['aps3e', 'rpcsx~net.rpcsx']);
  assert.strictEqual(planLaunch('rpcsx~net.rpcsx', { pkg: 'net.rpcsx', activity: '' }).openOnly, true);
});
