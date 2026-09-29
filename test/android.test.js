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
  for (const [id, e] of Object.entries(EMUS)) assert.ok(e.apps.length && e.apps.every((x) => x.pkg && x.activity), `${id} needs a package and an activity`);
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
  assert.strictEqual(ppsspp.data, '{SAF}');
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
