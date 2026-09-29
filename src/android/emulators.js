// Android emulators Cartridge can start a game in, and how to ask each one.
// Package names, activities and launch extras follow the rules ES-DE ships for Android
// (es_find_rules.xml and es_systems.xml). Cartridge never installs or changes an emulator: it only asks
// one that is already installed to open a game, the same way a frontend does.
//
// Tokens inside an intent: {ROM} the file's path, {SAF} the same file as a documents URI (what most
// emulators want), {PROVIDER} a URI Cartridge shares just for this launch, {PKG} the emulator's package,
// {CORE} a RetroArch core, {EXT} the shared storage folder.

const VIEW = 'android.intent.action.VIEW';
const MAIN = 'android.intent.action.MAIN';
const DEFAULT = 'android.intent.category.DEFAULT';
const TASK = ['clearTask', 'clearTop'];
const a = (pkg, activity) => ({ pkg, activity });

export const EMUS = {
  ppsspp: { name: 'PPSSPP', get: 'https://www.ppsspp.org/download', apps: [a('org.ppsspp.ppssppgold', 'org.ppsspp.ppsspp.PpssppActivity'), a('org.ppsspp.ppsspp', 'org.ppsspp.ppsspp.PpssppActivity')], intent: { action: VIEW, category: DEFAULT, data: '{SAF}' } },
  dolphin: { name: 'Dolphin', get: 'https://dolphin-emu.org/download/', apps: [a('org.dolphinemu.dolphinemu', 'org.dolphinemu.dolphinemu.ui.main.TvMainActivity')], intent: { action: MAIN, category: 'android.intent.category.LEANBACK_LAUNCHER', extras: { AutoStartFile: '{SAF}' } } },
  mmjr: { name: 'Dolphin MMJR', get: 'https://github.com/MoonPower/Dolphin-MMJR/releases', apps: [a('org.mm.jr', 'org.dolphinemu.dolphinemu.ui.main.MainActivity'), a('org.dolphinemu.mmjr', 'org.dolphinemu.dolphinemu.ui.main.MainActivity')], intent: { action: VIEW, extras: { AutoStartFile: '{SAF}' } } },
  cemu: { name: 'Cemu', get: 'https://cemu.info/', apps: [a('info.cemu.cemu', 'info.cemu.cemu.emulation.EmulationActivity'), a('info.cemu.Cemu', 'info.cemu.Cemu.emulation.EmulationActivity')], intent: { data: '{SAF}' } },
  azahar: { name: 'Azahar', get: 'https://azahar-emu.org/', apps: [a('org.azahar_emu.azahar', 'org.citra.citra_emu.activities.EmulationActivity')], intent: { data: '{SAF}', flags: TASK } },
  azaharplus: { name: 'AzaharPlus', get: 'https://github.com/AzaharPlus/AzaharPlus/releases', apps: [a('io.github.azaharplus.android', 'org.citra.citra_emu.activities.EmulationActivity')], intent: { data: '{SAF}', flags: TASK } },
  lime3ds: { name: 'Lime3DS', get: 'https://github.com/Lime3DS/lime3ds-archive/releases', apps: [a('io.github.lime3ds.android', 'io.github.lime3ds.android.activities.EmulationActivity')], intent: { data: '{SAF}', flags: TASK } },
  citra: { name: 'Citra', get: 'https://github.com/PabloMK7/citra/releases', apps: [a('org.citra.citra_emu', 'org.citra.citra_emu.activities.EmulationActivity')], intent: { data: '{SAF}', flags: TASK } },
  mandarine: { name: 'Mandarine', get: 'https://github.com/mandarine3ds/mandarine/releases', apps: [a('io.github.mandarine3ds.mandarine', 'io.github.mandarine3ds.mandarine.activities.EmulationActivity')], intent: { data: '{SAF}', flags: TASK } },
  panda3ds: { name: 'Panda3DS', get: 'https://panda3ds.com/', apps: [a('com.panda3ds.pandroid', 'com.panda3ds.pandroid.app.MainActivity')], intent: { data: '{PROVIDER}' } },
  melonds: { name: 'melonDS', get: 'https://play.google.com/store/apps/details?id=me.magnum.melonds', apps: [a('me.magnum.melonds', 'me.magnum.melonds.ui.emulator.EmulatorActivity'), a('me.magnum.melondualds', 'me.magnum.melonds.ui.emulator.EmulatorActivity')], intent: { action: 'me.magnum.melonds.LAUNCH_ROM', extras: { uri: '{SAF}' } } },
  melondsnightly: { name: 'melonDS Nightly', get: 'https://github.com/rafaelvcaetano/melonDS-android/releases', apps: [a('me.magnum.melonds.nightly', 'me.magnum.melonds.ui.emulator.EmulatorActivity')], intent: { action: 'me.magnum.melonds.nightly.LAUNCH_ROM', extras: { uri: '{SAF}' } } },
  drastic: { name: 'DraStic', get: 'https://play.google.com/store/apps/details?id=com.dsemu.drastic', apps: [a('com.dsemu.drastic', 'com.dsemu.drastic.DraSticActivity')], intent: { data: '{SAF}', flags: TASK } },
  noods: { name: 'NooDS', get: 'https://play.google.com/store/apps/details?id=com.hydra.noods', apps: [a('com.hydra.noods', 'com.hydra.noods.FileBrowser')], intent: { extras: { LaunchPath: '{ROM}' }, flags: TASK } },
  duckstation: { name: 'DuckStation', get: 'https://www.duckstation.org/', apps: [a('com.github.stenzek.duckstation', 'com.github.stenzek.duckstation.EmulationActivity')], intent: { extras: { bootPath: '{SAF}' }, bools: { resumeState: false }, flags: TASK } },
  epsxe: { name: 'ePSXe', get: 'https://play.google.com/store/apps/details?id=com.epsxe.ePSXe', apps: [a('com.epsxe.ePSXe', 'com.epsxe.ePSXe.ePSXe')], intent: { action: MAIN, extras: { 'com.epsxe.ePSXe.isoName': '{ROM}' } } },
  fpse: { name: 'FPseNG', get: 'https://play.google.com/store/apps/details?id=com.emulator.fpse64', apps: [a('com.emulator.fpse64', 'com.emulator.fpse64.Main')], intent: { action: VIEW, data: '{PROVIDER}' } },
  armsx2: { name: 'ARMSX2', get: 'https://github.com/ARMSX2/ARMSX2/releases', apps: [a('come.nanodata.armsx2', 'com.armsx2.MainActivity'), a('com.armsx2', 'com.armsx2.MainActivity'), a('com.armsx2.nightly', 'com.armsx2.MainActivity')], intent: { action: VIEW, data: '{SAF}' } },
  nethersx2: { name: 'NetherSX2', get: 'https://www.google.com/search?q=NetherSX2+patch+APK', apps: [a('xyz.aethersx2.android', 'xyz.aethersx2.android.EmulationActivity'), a('xyz.aethersx2.tturnip', 'xyz.aethersx2.android.EmulationActivity'), a('xyz.aethersx2.cturnip', 'xyz.aethersx2.android.EmulationActivity')], intent: { action: MAIN, extras: { bootPath: '{SAF}' }, flags: TASK } },
  play: { name: 'Play!', get: 'https://purei.org/', apps: [a('com.virtualapplications.play', 'com.virtualapplications.play.MainActivity')], intent: { action: VIEW, data: '{SAF}' } },
  aps3e: { name: 'aPS3e', get: 'https://github.com/aenu1/aps3e/releases', apps: [a('aenu.aps3e.premium', 'aenu.aps3e.EmulatorActivity'), a('aenu.aps3e', 'aenu.aps3e.EmulatorActivity')], intent: { action: 'aenu.intent.action.APS3E', extras: { iso_uri: '{SAF}' } }, dirIntent: { action: 'aenu.intent.action.APS3E', extras: { game_dir: '{ROM}' } } },
  eden: { name: 'Eden', get: 'https://eden-emu.dev/', apps: [a('dev.eden.eden_emulator', 'org.yuzu.yuzu_emu.activities.EmulationActivity'), a('dev.legacy.eden_emulator', 'org.yuzu.yuzu_emu.activities.EmulationActivity')], intent: { action: 'android.nfc.action.TECH_DISCOVERED', data: '{PROVIDER}' } },
  skyline: { name: 'Skyline', get: 'https://github.com/skyline-emu/skyline', apps: [a('skyline.emu', 'emu.skyline.EmulationActivity')], intent: { action: VIEW, data: '{PROVIDER}' } },
  kenjinx: { name: 'Kenji-NX', get: 'https://github.com/KenjiNX/Kenji-NX/releases', apps: [a('org.kenjinx.android', 'org.kenjinx.android.MainActivity')], intent: { action: 'org.kenjinx.android.LAUNCH_GAME', extras: { bootPath: '{SAF}' } } },
  flycast: { name: 'Flycast', get: 'https://flycast.org/', apps: [a('com.flycast.emulator', 'com.flycast.emulator.MainActivity')], intent: { action: VIEW, data: '{SAF}' } },
  redream: { name: 'Redream', get: 'https://redream.io/download', apps: [a('io.recompiled.redream', 'io.recompiled.redream.MainActivity')], intent: { action: VIEW, data: '{SAF}' } },
  yaba: { name: 'Yaba Sanshiro 2', get: 'https://play.google.com/store/apps/details?id=org.devmiyax.yabasanshioro2', apps: [a('org.devmiyax.yabasanshioro2.pro', 'org.uoyabause.android.Yabause'), a('org.devmiyax.yabasanshioro2', 'org.uoyabause.android.Yabause')], intent: { action: VIEW, extras: { 'org.uoyabause.android.FileNameUri': '{SAF}' }, flags: TASK } },
  myboy: { name: 'My Boy!', get: 'https://play.google.com/store/apps/details?id=com.fastemulator.gba', apps: [a('com.fastemulator.gba', 'com.fastemulator.gba.EmulatorActivity')], intent: { action: VIEW, data: '{SAF}' } },
  myoldboy: { name: 'My OldBoy!', get: 'https://play.google.com/store/apps/details?id=com.fastemulator.gbc', apps: [a('com.fastemulator.gbc', 'com.fastemulator.gbc.EmulatorActivity')], intent: { action: VIEW, data: '{SAF}' } },
  pizzagba: { name: 'Pizza Boy GBA', get: 'https://play.google.com/store/apps/details?id=it.dbtecno.pizzaboygbapro', apps: [a('it.dbtecno.pizzaboygbapro', 'it.dbtecno.pizzaboygbapro.MainActivity'), a('it.dbtecno.pizzaboygba', 'it.dbtecno.pizzaboygba.MainActivity')], intent: { extras: { rom_uri: '{SAF}' }, flags: TASK } },
  snes9x: { name: 'Snes9x EX+', get: 'https://play.google.com/store/apps/details?id=com.explusalpha.Snes9xPlus', apps: [a('com.explusalpha.Snes9xPlus', 'com.imagine.BaseActivity')], intent: { data: '{SAF}' } },
  mupen: { name: 'M64Plus FZ', get: 'https://play.google.com/store/apps/details?id=org.mupen64plusae.v3.fzurita', apps: [a('org.mupen64plusae.v3.fzurita', 'paulscode.android.mupen64plusae.SplashActivity'), a('org.mupen64plusae.v3.fzurita.pro', 'paulscode.android.mupen64plusae.SplashActivity')], intent: { action: VIEW, data: '{SAF}' } },
  saturnemu: { name: 'Saturn.emu', get: 'https://play.google.com/store/apps/details?id=com.explusalpha.SaturnEmu', apps: [a('com.explusalpha.SaturnEmu', 'com.imagine.BaseActivity')], intent: { data: '{SAF}' } },
  // RetroArch runs any console through a core; it is picked per game by the console's core list below
  retroarch: {
    name: 'RetroArch', get: 'https://play.google.com/store/apps/details?id=com.retroarch.aarch64',
    apps: [a('com.retroarch.aarch64', 'com.retroarch.browser.retroactivity.RetroActivityFuture'), a('com.retroarch', 'com.retroarch.browser.retroactivity.RetroActivityFuture'), a('com.retroarch.ra32', 'com.retroarch.browser.retroactivity.RetroActivityFuture')],
    intent: { extras: { ROM: '{ROM}', LIBRETRO: '/data/data/{PKG}/cores/{CORE}_libretro_android.so', CONFIGFILE: '{EXT}/Android/data/{PKG}/files/retroarch.cfg' }, flags: TASK },
  },
};

// One entry per console. emus: standalone emulators, best first (the first one installed is used unless
// you pick another). cores: RetroArch cores that run it. bios: what it needs (see biosNeeds).
export const CONSOLES = {
  psp: { name: 'PSP', emus: ['ppsspp'], cores: ['ppsspp'] },
  gc: { name: 'GameCube', emus: ['dolphin', 'mmjr'], cores: ['dolphin'] },
  wii: { name: 'Wii', emus: ['dolphin', 'mmjr'], cores: ['dolphin'] },
  wiiu: { name: 'Wii U', emus: ['cemu'], cores: [] },
  '3ds': { name: 'Nintendo 3DS', emus: ['azahar', 'azaharplus', 'lime3ds', 'citra', 'mandarine', 'panda3ds'], cores: [] },
  nds: { name: 'Nintendo DS', emus: ['melonds', 'melondsnightly', 'drastic', 'noods'], cores: ['melonds', 'desmume'] },
  psx: { name: 'PlayStation', emus: ['duckstation', 'epsxe', 'fpse'], cores: ['pcsx_rearmed', 'mednafen_psx_hw'], bios: 'psx' },
  ps2: { name: 'PlayStation 2', emus: ['armsx2', 'nethersx2', 'play'], cores: [], bios: 'ps2' },
  ps3: { name: 'PlayStation 3', emus: ['aps3e'], cores: [] },
  switch: { name: 'Nintendo Switch', emus: ['eden', 'kenjinx', 'skyline'], cores: [], bios: 'switch' },
  dc: { name: 'Dreamcast', emus: ['flycast', 'redream'], cores: ['flycast'] },
  saturn: { name: 'Saturn', emus: ['yaba', 'saturnemu'], cores: ['yabasanshiro', 'mednafen_saturn'], bios: 'saturn' },
  gba: { name: 'Game Boy Advance', emus: ['myboy', 'pizzagba'], cores: ['mgba', 'gpsp'] },
  gbc: { name: 'Game Boy Color', emus: ['myoldboy'], cores: ['gambatte', 'mgba'] },
  gb: { name: 'Game Boy', emus: ['myoldboy'], cores: ['gambatte', 'mgba'] },
  nes: { name: 'NES', emus: [], cores: ['fceumm', 'nestopia'] },
  snes: { name: 'SNES', emus: ['snes9x'], cores: ['snes9x', 'bsnes'] },
  n64: { name: 'Nintendo 64', emus: ['mupen'], cores: ['mupen64plus_next', 'parallel_n64'] },
  md: { name: 'Mega Drive', emus: [], cores: ['genesis_plus_gx', 'picodrive'] },
  sms: { name: 'Master System', emus: [], cores: ['genesis_plus_gx', 'picodrive'] },
  gg: { name: 'Game Gear', emus: [], cores: ['genesis_plus_gx'] },
  segacd: { name: 'Sega CD', emus: [], cores: ['genesis_plus_gx', 'picodrive'], bios: 'segacd' },
  pce: { name: 'PC Engine', emus: [], cores: ['mednafen_pce_fast', 'mednafen_pce'] },
  arcade: { name: 'Arcade', emus: [], cores: ['fbneo', 'mame2003_plus'] },
  a2600: { name: 'Atari 2600', emus: [], cores: ['stella'] },
  lynx: { name: 'Atari Lynx', emus: [], cores: ['handy', 'mednafen_lynx'] },
  ws: { name: 'WonderSwan', emus: [], cores: ['mednafen_wswan'] },
  ngp: { name: 'Neo Geo Pocket', emus: [], cores: ['mednafen_ngp'] },
};

// RomM platform slugs (and the common spellings of them) -> a console above
const SLUGS = {
  psp: 'psp', ngc: 'gc', gc: 'gc', gamecube: 'gc', wii: 'wii', wiiu: 'wiiu', '3ds': '3ds', n3ds: '3ds', new3ds: '3ds', nds: 'nds', ds: 'nds', nintendods: 'nds', ndsi: 'nds', nintendodsi: 'nds',
  ps: 'psx', psx: 'psx', playstation: 'psx', ps2: 'ps2', playstation2: 'ps2', ps3: 'ps3', playstation3: 'ps3',
  switch: 'switch', nintendoswitch: 'switch', dc: 'dc', dreamcast: 'dc', saturn: 'saturn', segasaturn: 'saturn',
  gba: 'gba', gameboyadvance: 'gba', gbc: 'gbc', gameboycolor: 'gbc', gb: 'gb', gameboy: 'gb',
  nes: 'nes', famicom: 'nes', fds: 'nes', snes: 'snes', sfam: 'snes', superfamicom: 'snes', n64: 'n64', nintendo64: 'n64',
  'genesis-slash-megadrive': 'md', genesis: 'md', megadrive: 'md', segamegadrive: 'md', sms: 'sms', mastersystem: 'sms', segamastersystem: 'sms', gamegear: 'gg', segagamegear: 'gg',
  segacd: 'segacd', 'sega-cd': 'segacd', 'turbografx16--1': 'pce', tg16: 'pce', pce: 'pce', pcengine: 'pce', arcade: 'arcade', mame: 'arcade', fbneo: 'arcade', neogeo: 'arcade',
  atari2600: 'a2600', lynx: 'lynx', atarilynx: 'lynx', wonderswan: 'ws', ws: 'ws', wonderswancolor: 'ws', ngp: 'ngp', neogeopocket: 'ngp', ngpc: 'ngp',
};
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
export function consoleKey(...slugs) {
  for (const s of slugs) {
    const raw = String(s || '').toLowerCase();
    if (SLUGS[raw]) return SLUGS[raw];
    if (SLUGS[norm(raw)]) return SLUGS[norm(raw)];
  }
  return null;
}

// Every package name above, for the manifest's <queries> (Android 11+ hides apps that are not listed)
export const allPackages = () => [...new Set(Object.values(EMUS).flatMap((e) => e.apps.map((x) => x.pkg)))].sort();

// BIOS, keys and firmware. dirs are looked in when Cartridge can read them; Android hides other apps'
// own folders (Android/data) from Android 11, so the answer is often "can't tell" and you confirm it.
export const BIOS = {
  psx: { label: 'PlayStation BIOS', names: /^(scph|psxonpsp|ps1_rom|ps-)/i, dirs: ['BIOS', 'bios', 'RetroArch/system', 'Android/data/com.github.stenzek.duckstation/files/bios', 'Android/data/com.retroarch/files/system', 'Android/data/com.retroarch.aarch64/files/system', 'Android/data/com.retroarch.aarch64/files/RetroArch/system'], hint: 'Put your PS1 BIOS (scph5501.bin or similar) in DuckStation\'s BIOS folder.' },
  ps2: { label: 'PS2 BIOS', names: /\.(bin|rom0)$/i, minSize: 3.5e6, dirs: ['BIOS', 'bios', 'Android/data/xyz.aethersx2.android/files/bios', 'Android/data/come.nanodata.armsx2/files/bios', 'Android/data/com.armsx2/files/bios', 'ARMSX2/bios'], hint: 'Put your PS2 BIOS in the emulator\'s bios folder.' },
  switch: { label: 'Switch keys and firmware', names: /^prod\.keys$/i, dirs: ['Android/data/dev.eden.eden_emulator/files/keys', 'Android/data/dev.legacy.eden_emulator/files/keys', 'Android/data/org.kenjinx.android/files/system', 'eden/keys'], hint: 'Add prod.keys and install firmware from the emulator\'s settings.' },
  saturn: { label: 'Saturn BIOS', names: /^(sega_101|mpr-17933|saturn_bios|sega_bios)/i, dirs: ['BIOS', 'bios', 'RetroArch/system', 'Android/data/com.retroarch/files/system', 'Android/data/com.retroarch.aarch64/files/system'], hint: 'Put your Saturn BIOS in the emulator\'s bios folder.', optional: true },
  segacd: { label: 'Sega CD BIOS', names: /^(bios_cd_|segacd)/i, dirs: ['BIOS', 'bios', 'RetroArch/system', 'Android/data/com.retroarch/files/system', 'Android/data/com.retroarch.aarch64/files/system'], hint: 'Put bios_CD_U/E/J.bin in RetroArch\'s system folder.' },
};

// The emulators of this console that are installed (found: id -> { pkg, activity, version }), in the order
// they will be offered: the game's own pick, then the console's pick, then the list's order.
export function candidatesFor(key, found, cfg = {}, romId) {
  const c = CONSOLES[key];
  if (!c) return [];
  const ids = [...c.emus.filter((id) => found[id]), ...(c.cores.length && found.retroarch ? ['retroarch'] : [])];
  const first = [cfg.gameEmus?.[romId], cfg.emus?.[key]].filter((x) => x && ids.includes(x));
  return [...new Set([...first, ...ids])];
}

// Which RetroArch core to use: the one picked for this console, else the first
export const coreFor = (key, cfg = {}) => {
  const list = CONSOLES[key]?.cores || [];
  return list.includes(cfg.cores?.[key]) ? cfg.cores[key] : list[0];
};

const fill = (v, t) => (typeof v === 'string' ? v.replace(/\{PKG\}/g, t.pkg || '').replace(/\{CORE\}/g, t.core || '') : v);

// The intent to fire for one game. Native fills {ROM}, {SAF}, {PROVIDER} and {EXT} from the path.
export function planLaunch(emuId, app, { core, folder } = {}) {
  const e = EMUS[emuId];
  if (!e || !app) return null;
  const base = folder && e.dirIntent ? e.dirIntent : e.intent;
  const t = { pkg: app.pkg, core };
  const extras = {};
  for (const [k, v] of Object.entries(base.extras || {})) extras[k] = fill(v, t);
  return {
    pkg: app.pkg, activity: app.activity, action: base.action || '', category: base.category || '', data: base.data || '',
    extras, bools: base.bools || {}, flags: base.flags || [],
  };
}
