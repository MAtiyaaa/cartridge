'use strict';
// Steam collections the user already has, matched to consoles (0.9.24, owner: read the collections
// that are there and rename them to Cartridge's names, "PlayStation 2" -> "Sony PlayStation 2").
// No imports so it can be tested on its own (test/steamCollections.test.js).

// Words people use for a console. Keys are Cartridge's console keys (PLATFORM_MAP's first name).
const ALIASES = {
  psx: ['ps1', 'psx', 'psone', 'ps one', 'playstation', 'playstation 1', 'playstation one'],
  ps2: ['ps2', 'playstation 2', 'playstation2'],
  ps3: ['ps3', 'playstation 3', 'playstation3'],
  ps4: ['ps4', 'playstation 4', 'playstation4'],
  ps5: ['ps5', 'playstation 5', 'playstation5'],
  psp: ['psp', 'playstation portable'],
  psvita: ['vita', 'ps vita', 'psvita', 'playstation vita'],
  gc: ['gc', 'ngc', 'gamecube', 'game cube', 'gcn'],
  wii: ['wii'],
  wiiu: ['wii u', 'wiiu'],
  switch: ['switch', 'nx', 'nintendo switch'],
  n3ds: ['3ds', 'n3ds', 'new 3ds'],
  nds: ['ds', 'nds'],
  n64: ['n64', 'nintendo 64'],
  snes: ['snes', 'super nintendo', 'super nes', 'super famicom', 'sfc'],
  nes: ['nes', 'famicom', 'nintendo entertainment system'],
  gba: ['gba', 'game boy advance', 'gameboy advance'],
  gbc: ['gbc', 'game boy color', 'gameboy color', 'game boy colour'],
  gb: ['gb', 'game boy', 'gameboy'],
  xbox: ['xbox', 'original xbox', 'og xbox'],
  xbox360: ['xbox 360', 'xbox360', '360', 'x360'],
  dreamcast: ['dreamcast', 'dc'],
  saturn: ['saturn'],
  genesis: ['genesis', 'mega drive', 'megadrive', 'md'],
  megadrive: ['mega drive', 'megadrive', 'genesis', 'md'],
  segacd: ['sega cd', 'mega cd', 'segacd'],
  sega32x: ['32x', 'sega 32x'],
  mastersystem: ['master system', 'sms'],
  gamegear: ['game gear', 'gg'],
  pcengine: ['pc engine', 'turbografx', 'turbografx 16', 'tg16'],
  arcade: ['arcade', 'mame'],
  neogeo: ['neo geo', 'neogeo'],
  atari2600: ['atari 2600', '2600'],
};
// Maker words: "Sony PlayStation 2", "Sega Saturn", "Nintendo GameCube" all name the console without them.
// A collection named only for a maker ("Sega", "Nintendo") holds many consoles, so it's never renamed.
const MAKERS = ['sony', 'nintendo', 'sega', 'microsoft', 'nec', 'snk', 'atari', 'bandai', 'emulator', 'emulators', 'emulation', 'games', 'roms', 'collection'];

const norm = (s) => String(s || '').toLowerCase().replace(/[™®©]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
// a name without its maker words and filler: "Sony PlayStation 2 Games" -> "playstation 2"
const core = (s) => norm(s).split(' ').filter((w) => !MAKERS.includes(w)).join(' ');

// platforms: [{ key, name }] from the library (name = RomM's display name, Cartridge's naming).
// Returns the console each collection is for, or null.
function consoleOf(colName, platforms) {
  const c = core(colName), n = norm(colName);
  if (!c) return null;
  // the library's own names first (exact, with or without the maker), then the alias table
  for (const p of platforms) if (norm(p.name) === n || core(p.name) === c) return p.key;
  for (const p of platforms) if ((ALIASES[p.key] || []).includes(c)) return p.key;
  return null;
}

// collections: [{ id, name, added }]; platforms: [{ key, name }]
// -> [{ id, name, count, key, want, action }] where action is
//   'ok' (already Cartridge's name), 'rename', 'taken' (another collection already has the name),
//   'shared' (two collections look like the same console: only the bigger one is renamed), or 'other'
function analyse(collections, platforms) {
  const out = collections.map((c) => {
    const key = consoleOf(c.name, platforms);
    const p = key && platforms.find((x) => x.key === key);
    return { id: c.id, name: c.name, count: (c.added || []).length, key: key || null, want: p ? p.name : null, action: !p ? 'other' : c.name === p.name ? 'ok' : 'rename' };
  });
  const names = new Set(out.map((x) => x.name));
  for (const x of out) if (x.action === 'rename' && names.has(x.want)) x.action = 'taken';
  // two collections for one console ("PS2", "PlayStation 2"): rename the one with the most games
  const byKey = {};
  for (const x of out) if (x.action === 'rename') (byKey[x.key] ||= []).push(x);
  for (const list of Object.values(byKey)) {
    list.sort((a, b) => b.count - a.count);
    for (const x of list.slice(1)) x.action = 'shared';
  }
  return out;
}

// The collection name to use for a console: the one the user kept, else Cartridge's
function nameFor(key, display, kept) { return (kept && kept[key]) || display; }

module.exports = { ALIASES, MAKERS, norm, core, consoleOf, analyse, nameFor };
