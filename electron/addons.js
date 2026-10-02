// Add-ons, the parts that can be checked (0.9.15, owner: "build what I can check"): where each
// emulator looks for texture packs, read from its own settings file (keys checked in its source),
// whether it has custom textures turned on, and the folder for one game. Read only: Cartridge
// never changes an emulator's settings; it only says how to turn textures on.
// - PCSX2: PCSX2.ini [Folders] Textures (default "textures" in its data folder), <serial>/replacements;
//   on: [EmuCore/GS] LoadTextureReplacements (default off).
// - DuckStation: settings.ini [Folders] Textures (default "textures"), <serial>/replacements;
//   on: [TextureReplacements] EnableTextureReplacements (default off).
// - Dolphin: Dolphin.ini [General] LoadPath (empty: Load in its user folder), Textures/<game ID>;
//   on: GFX.ini [Settings] HiresTextures (default off).
// - PPSSPP: the memory stick's PSP/TEXTURES/<game ID>; on: ppsspp.ini [Graphics] ReplaceTextures (default on).
// - Azahar (and Citra): load/textures/<title ID> in its data folder; on: qt-config.ini [Utility] custom_textures.
const fs = require('fs');
const path = require('path');
const os = require('os');

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
function iniGet(text, section, key) {
  let inside = false;
  for (const l of String(text).split(/\r?\n/)) {
    const t = l.trim();
    if (/^\[.*\]$/.test(t)) { inside = t === `[${section}]`; continue; }
    const i = t.indexOf('=');
    if (inside && i > 0 && t.slice(0, i).trim() === key) return t.slice(i + 1).trim();
  }
  return null;
}
const truthy = (v, def) => (v == null || v === '' ? def : /^(true|1|yes)$/i.test(v));
const under = (root, v, def) => { const p = v || def; return path.isAbsolute(p) ? p : path.join(root, p); };

function emulators(home = os.homedir(), env = process.env) {
  const cfg = env.XDG_CONFIG_HOME || path.join(home, '.config');
  const data = env.XDG_DATA_HOME || path.join(home, '.local/share');
  const v = (id, ...p) => path.join(home, '.var/app', id, ...p);
  const out = [];
  const add = (e) => { if (!out.some((o) => o.root === e.root)) out.push(e); };
  for (const root of [path.join(cfg, 'PCSX2'), v('net.pcsx2.PCSX2', 'config/PCSX2')]) {
    const ini = path.join(root, 'inis', 'PCSX2.ini'); if (!exists(ini)) continue;
    const t = read(ini);
    add({ id: 'pcsx2', name: 'PCSX2', for: ['ps2'], root, settings: ini, textures: under(root, iniGet(t, 'Folders', 'Textures'), 'textures'), per: '{serial}/replacements', on: truthy(iniGet(t, 'EmuCore/GS', 'LoadTextureReplacements'), false), how: 'In PCSX2: Settings → Graphics → Texture Replacement → Load Textures.' });
  }
  for (const root of [path.join(data, 'duckstation'), v('org.duckstation.DuckStation', 'data/duckstation')]) {
    const ini = path.join(root, 'settings.ini'); if (!exists(ini)) continue;
    const t = read(ini);
    add({ id: 'duckstation', name: 'DuckStation', for: ['psx'], root, settings: ini, textures: under(root, iniGet(t, 'Folders', 'Textures'), 'textures'), per: '{serial}/replacements', on: truthy(iniGet(t, 'TextureReplacements', 'EnableTextureReplacements'), false), how: 'In DuckStation: Settings → Enhancements → Texture Replacement → Enable Texture Replacements.' });
  }
  for (const root of [path.join(cfg, 'dolphin-emu'), v('org.DolphinEmu.dolphin-emu', 'config/dolphin-emu')]) {
    const ini = path.join(root, 'Dolphin.ini'); if (!exists(ini)) continue;
    // Dolphin's user folder: config and data are split on Linux; Load lives with the data
    const dataRoot = root.includes('/.var/app/') ? root.replace(/config\/dolphin-emu$/, 'data/dolphin-emu') : path.join(data, 'dolphin-emu');
    const load = iniGet(read(ini), 'General', 'LoadPath');
    add({ id: 'dolphin', name: 'Dolphin', for: ['ngc', 'gamecube', 'wii'], root, settings: ini, textures: path.join(load || path.join(dataRoot, 'Load'), 'Textures'), per: '{gameId}', on: truthy(iniGet(read(path.join(root, 'GFX.ini')), 'Settings', 'HiresTextures'), false), how: 'In Dolphin: Graphics → Advanced → Load Custom Textures.' });
  }
  for (const root of [path.join(cfg, 'ppsspp'), v('org.ppsspp.PPSSPP', 'config/ppsspp')]) {
    const ini = path.join(root, 'PSP', 'SYSTEM', 'ppsspp.ini'); if (!exists(ini)) continue;
    add({ id: 'ppsspp', name: 'PPSSPP', for: ['psp'], root, settings: ini, textures: path.join(root, 'PSP', 'TEXTURES'), per: '{gameId}', on: truthy(iniGet(read(ini), 'Graphics', 'ReplaceTextures'), true), how: 'PPSSPP replaces textures by default (its Replace textures setting).' });
  }
  for (const [c, d] of [[path.join(cfg, 'azahar-emu'), path.join(data, 'azahar-emu')], [v('org.azahar_emu.Azahar', 'config/azahar-emu'), v('org.azahar_emu.Azahar', 'data/azahar-emu')], [path.join(cfg, 'citra-emu'), path.join(data, 'citra-emu')]]) {
    const ini = path.join(c, 'qt-config.ini'); if (!exists(ini)) continue;
    add({ id: c.includes('citra') ? 'citra' : 'azahar', name: c.includes('citra') ? 'Citra' : 'Azahar', for: ['3ds', 'n3ds'], root: d, settings: ini, textures: path.join(d, 'load', 'textures'), per: '{titleId}', on: truthy(iniGet(read(ini), 'Utility', 'custom_textures'), false), how: 'In Azahar\'s graphics settings, turn on Use Custom Textures.' });
  }
  for (const e of out) e.flatpak = e.root.includes('/.var/app/');
  return out;
}

// Game IDs the emulators name texture folders by
// GameCube/Wii: in cheats.js (ISO, GCM, RVZ, WIA, WBFS, CISO)
const gcWiiId = (file) => require('./cheats').gcWiiId(file);
// 3DS cartridge dump (NCSD: .3ds/.cci): partition 0's NCCH program ID, as Azahar names the folder
function n3dsTitleId(file) {
  try {
    const fd = fs.openSync(file, 'r'); const h = Buffer.alloc(0x200); fs.readSync(fd, h, 0, 0x200, 0);
    if (h.toString('latin1', 0x100, 0x104) !== 'NCSD') { fs.closeSync(fd); return null; }
    const off = h.readUInt32LE(0x120) * 0x200;
    const n = Buffer.alloc(0x200); fs.readSync(fd, n, 0, 0x200, off); fs.closeSync(fd);
    if (n.toString('latin1', 0x100, 0x104) !== 'NCCH') return null;
    return n.readBigUInt64LE(0x118).toString(16).toUpperCase().padStart(16, '0');
  } catch { return null; }
}
const fill = (per, ids) => per.replace(/\{(\w+)\}/g, (_, k) => ids[k] || '');

// One game: the folder in each emulator that can run it, with whether textures are on
function forGame(platformSlug, ids, list) {
  return list.filter((e) => e.for.includes(platformSlug)).map((e) => {
    const need = (e.per.match(/\{(\w+)\}/) || [])[1];
    const known = !need || !!ids[need];
    return { id: e.id, name: e.name, flatpak: e.flatpak, on: e.on, how: e.how, emuRoot: e.root, root: e.textures, folder: known ? path.join(e.textures, fill(e.per, ids)) : null, has: known && exists(path.join(e.textures, fill(e.per, ids))) };
  });
}

// Turn custom textures on (or back off) in the emulator's own settings (0.9.16, owner asked; the one
// setting Cartridge changes for texture packs). Only while the emulator is closed: it writes its
// settings back when it quits. Each key as the emulator itself writes it.
const TEX_KEY = {
  pcsx2: { file: (e) => e.settings, sec: 'EmuCore/GS', key: 'LoadTextureReplacements', on: 'true', off: 'false' },
  duckstation: { file: (e) => e.settings, sec: 'TextureReplacements', key: 'EnableTextureReplacements', on: 'true', off: 'false' },
  dolphin: { file: (e) => path.join(e.root, 'GFX.ini'), sec: 'Settings', key: 'HiresTextures', on: 'True', off: 'False' },
  ppsspp: { file: (e) => e.settings, sec: 'Graphics', key: 'ReplaceTextures', on: 'True', off: 'False' },
  // Qt keeps "<name>\default": while it says true, the value is ignored, so it goes false too
  azahar: { file: (e) => e.settings, sec: 'Utility', key: 'custom_textures', on: 'true', off: 'false', qt: true },
  citra: { file: (e) => e.settings, sec: 'Utility', key: 'custom_textures', on: 'true', off: 'false', qt: true },
};
function setTextures(e, on) {
  const k = TEX_KEY[e.id];
  if (!k) throw new Error(`${e.name} can't be switched from Cartridge.`);
  const { iniSet } = require('./raLogin');
  const f = k.file(e);
  let text = ''; try { text = fs.readFileSync(f, 'utf8'); } catch {}
  const pairs = { [k.key]: on ? k.on : k.off, ...(k.qt ? { [`${k.key}\\default`]: 'false' } : {}) };
  const tmp = f + '.cartridge-tmp';
  let out = iniSet(text, k.sec, pairs);
  if (k.qt) out = out.replace(new RegExp(`^(${k.key}(?:\\\\default)?) = `, 'gm'), '$1='); // Qt's own key=value, no spaces
  fs.writeFileSync(tmp, out); fs.renameSync(tmp, f);
  return true;
}

module.exports = { emulators, forGame, gcWiiId, n3dsTitleId, iniGet, setTextures, TEX_KEY };
