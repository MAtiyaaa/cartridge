// Per-game emulator settings from Cartridge (0.9.23, owner: edit a game's settings from its page, the
// way the emulator's own per-game settings work). Each emulator keeps a per-game file layered over its
// normal settings; Cartridge writes only that file, only the keys you change, and "Emulator's own" takes
// a key out again. Formats and keys read from each emulator's source:
// - RPCS3: config/custom_configs/config_<SERIAL>.yml, applied over its config.yml (Emu/System.cpp);
//   keys from Emu/system_config.h, values as system_config_types.cpp names them
// - PCSX2: gamesettings/<SERIAL>_<CRC>.ini (VMManager::GetGameSettingsPath), layered over PCSX2.ini;
//   keys from Pcsx2Config.cpp ([EmuCore/GS] Renderer, upscale_multiplier; [EmuCore] ...)
// - DuckStation: <data>/gamesettings/<SERIAL>.ini (System::GetGameSettingsPath); keys from settings.cpp
// - Dolphin: <user>/GameSettings/<ID6>.ini; sections Video_Settings/Video_Enhancements/Core map onto
//   GFX.ini/Dolphin.ini (ConfigLoaders/GameConfigLoader.cpp); keys from Config/GraphicsSettings.cpp
// - PPSSPP: PSP/SYSTEM/<GAMEID>_ppsspp.ini (Util/PathUtil.cpp GetGameConfigFilePath); a game file is a
//   full copy of the settings (PPSSPP makes it that way), so a new one starts as a copy of ppsspp.ini
// - shadPS4: <user>/custom_configs/<SERIAL>.json, group "GPU" overrides (core/emulator_settings.cpp)
const fs = require('fs');
const path = require('path');

const B = (on, off) => ({ type: 'bool', on, off });
const SCHEMA = {
  rpcs3: { name: 'RPCS3', items: [
    { id: 'Video.Renderer', label: 'Renderer', options: ['Vulkan', 'OpenGL'] },
    { id: 'Video.Resolution Scale', label: 'Resolution', options: [['100', '720p (native)'], ['150', '1080p'], ['200', '1440p'], ['300', '4K']] },
    { id: 'Video.Frame limit', label: 'Frame limit', options: ['Auto', 'Off', '30', '60', 'PS3 Native'] },
    { id: 'Video.Shader Mode', label: 'Shaders', options: [['Async Recompiler with Shader Interpreter', 'Async with interpreter'], ['Async Recompiler (multi-threaded)', 'Async'], ['Legacy Recompiler (single-threaded)', 'Legacy']] },
    { id: 'Video.Anisotropic Filter Override', label: 'Anisotropic filtering', options: [['0', 'Auto'], '2', '4', '8', '16'] },
    { id: 'Video.Write Color Buffers', label: 'Write color buffers', sub: 'Fixes some games’ effects, slower', ...B('true', 'false') },
    { id: 'Video.Strict Rendering Mode', label: 'Strict rendering', sub: 'More accurate, slower', ...B('true', 'false') },
    { id: 'Core.SPU Block Size', label: 'SPU block size', options: ['Safe', 'Mega', 'Giga'] },
    { id: 'Core.Preferred SPU Threads', label: 'Preferred SPU threads', options: [['0', 'Auto'], '1', '2', '3', '4', '5', '6'] },
  ] },
  pcsx2: { name: 'PCSX2', items: [
    { id: 'EmuCore/GS.Renderer', label: 'Renderer', options: [['-1', 'Automatic'], ['14', 'Vulkan'], ['12', 'OpenGL'], ['13', 'Software']] },
    { id: 'EmuCore/GS.upscale_multiplier', label: 'Resolution', options: [['1', 'Native'], ['2', '2x (720p)'], ['3', '3x (1080p)'], ['4', '4x (1440p)'], ['6', '6x (4K)']] },
    { id: 'EmuCore.EnableWideScreenPatches', label: 'Widescreen patches', ...B('true', 'false') },
    { id: 'EmuCore.EnableNoInterlacingPatches', label: 'No-interlacing patches', ...B('true', 'false') },
    { id: 'EmuCore/Speedhacks.EECycleRate', label: 'EE cycle rate', sub: 'Underclock or overclock the PS2’s CPU', options: [['-3', '50%'], ['-2', '60%'], ['-1', '75%'], ['0', '100%'], ['1', '130%'], ['2', '180%'], ['3', '300%']] },
    { id: 'EmuCore/Speedhacks.EECycleSkip', label: 'EE cycle skip', options: [['0', 'Off'], ['1', 'Mild'], ['2', 'Moderate'], ['3', 'Maximum']] },
  ] },
  duckstation: { name: 'DuckStation', items: [
    { id: 'GPU.Renderer', label: 'Renderer', options: ['Automatic', 'Vulkan', 'OpenGL', 'Software'] },
    { id: 'GPU.ResolutionScale', label: 'Resolution', options: [['1', 'Native'], ['3', '3x (720p)'], ['4', '4x (1080p)'], ['6', '6x (1440p)'], ['9', '9x (4K)']] },
    { id: 'GPU.TextureFilter', label: 'Texture filtering', options: ['Nearest', 'Bilinear', 'JINC2', 'xBR'] },
    { id: 'GPU.WidescreenHack', label: 'Widescreen', ...B('true', 'false') },
    { id: 'GPU.PGXPEnable', label: 'PGXP geometry correction', sub: 'Less wobbly 3D', ...B('true', 'false') },
  ] },
  dolphin: { name: 'Dolphin', items: [
    { id: 'Video_Settings.InternalResolution', label: 'Resolution', options: [['1', 'Native'], ['2', '2x (720p)'], ['3', '3x (1080p)'], ['4', '4x (1440p)'], ['6', '6x (4K)']] },
    { id: 'Video_Settings.AspectRatio', label: 'Aspect ratio', options: [['0', 'Auto'], ['1', 'Force 16:9'], ['2', 'Force 4:3'], ['3', 'Stretch']] },
    { id: 'Video_Settings.wideScreenHack', label: 'Widescreen hack', ...B('True', 'False') },
    { id: 'Video_Enhancements.MaxAnisotropy', label: 'Anisotropic filtering', options: [['0', '1x'], ['1', '2x'], ['2', '4x'], ['3', '8x'], ['4', '16x']] },
    { id: 'Core.CPUThread', label: 'Dual core', sub: 'Faster; turn off if the game is unstable', ...B('True', 'False') },
  ] },
  ppsspp: { name: 'PPSSPP', items: [
    { id: 'Graphics.InternalResolution', label: 'Resolution', options: [['0', 'Auto'], ['1', 'Native'], ['2', '2x'], ['3', '3x (720p)'], ['4', '4x (1080p)'], ['6', '6x (1440p)'], ['8', '8x (4K)']] },
    { id: 'Graphics.FrameSkip', label: 'Frame skip', options: [['0', 'Off'], '1', '2', '3'] },
    { id: 'Graphics.AnisotropyLevel', label: 'Anisotropic filtering', options: [['0', 'Off'], ['1', '2x'], ['2', '4x'], ['3', '8x'], ['4', '16x']] },
    { id: 'Graphics.TexScalingLevel', label: 'Texture upscaling', options: [['1', 'Off'], ['2', '2x'], ['3', '3x'], ['4', '4x'], ['5', '5x']] },
  ] },
  shadps4: { name: 'shadPS4', items: [
    { id: 'GPU.readbacks_mode', label: 'GPU readbacks', sub: 'Some games need them; slower', options: [['0', 'Off'], ['1', 'Relaxed'], ['2', 'Precise']], json: 'int' },
    { id: 'GPU.fsr_enabled', label: 'FSR upscaling', ...B('true', 'false'), json: 'bool' },
    { id: 'GPU.rcas_enabled', label: 'RCAS sharpening', ...B('true', 'false'), json: 'bool' },
    { id: 'GPU.copy_gpu_buffers', label: 'Copy GPU buffers', sub: 'Fixes some games, slower', ...B('true', 'false'), json: 'bool' },
    { id: 'GPU.vblank_frequency', label: 'VBlank frequency', sub: 'Game speed; 60 is normal', options: [['60', '60 Hz'], ['120', '120 Hz'], ['30', '30 Hz']], json: 'int' },
  ] },
};
const split = (id) => { const i = id.lastIndexOf('.'); return [id.slice(0, i), id.slice(i + 1)]; };

// ---- ini files (PCSX2, DuckStation, Dolphin, PPSSPP)
function iniGet(text, sec, key) {
  let cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const l = raw.trim(), m = /^\[(.+)\]$/.exec(l);
    if (m) { cur = m[1]; continue; }
    if (cur !== sec) continue;
    const i = l.indexOf('=');
    if (i > 0 && l.slice(0, i).trim() === key) return l.slice(i + 1).trim();
  }
  return undefined;
}
// set or remove one key in one section, keeping everything else as it was
function iniPut(text, sec, key, value) {
  const lines = String(text || '').split(/\r?\n/);
  let cur = null, secAt = -1, keyAt = -1, endAt = -1;
  lines.forEach((raw, n) => {
    const l = raw.trim(), m = /^\[(.+)\]$/.exec(l);
    if (m) { if (cur === sec) endAt = n; cur = m[1]; if (cur === sec) { secAt = n; endAt = -1; } return; }
    if (cur === sec) { const i = l.indexOf('='); if (i > 0 && l.slice(0, i).trim() === key) keyAt = n; }
  });
  if (value === undefined) { if (keyAt >= 0) lines.splice(keyAt, 1); return lines.join('\n'); }
  const line = `${key} = ${value}`;
  if (keyAt >= 0) lines[keyAt] = line;
  else if (secAt >= 0) { let at = endAt >= 0 ? endAt : lines.length; while (at > secAt + 1 && !lines[at - 1].trim()) at--; lines.splice(at, 0, line); }
  else { while (lines.length && !lines[lines.length - 1].trim()) lines.pop(); if (lines.length) lines.push(''); lines.push(`[${sec}]`, line); }
  return lines.join('\n').replace(/\n*$/, '\n');
}
const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };

// ---- RPCS3's YAML (two levels: "Video:" then "  Renderer: Vulkan")
function ymlGet(text, sec, key) {
  try { const y = require('js-yaml').load(String(text || ''), { schema: require('js-yaml').FAILSAFE_SCHEMA }) || {}; const v = y[sec]?.[key]; return v == null ? undefined : String(v); } catch { return undefined; }
}
function ymlPut(text, sec, key, value) {
  const Y = require('js-yaml');
  let y = {}; try { y = Y.load(String(text || ''), { schema: Y.FAILSAFE_SCHEMA }) || {}; } catch { y = {}; }
  if (value === undefined) { if (y[sec]) { delete y[sec][key]; if (!Object.keys(y[sec]).length) delete y[sec]; } }
  else (y[sec] ||= {})[key] = value;
  return Y.dump(y, { lineWidth: -1 }).replace(/'(true|false|\d+)'/g, '$1');
}

// where a game's file is, and the emulator's own settings to show beside it
// ctx: { emu, serial, crc, rpcs3Root, pcsx2: { gamesettings, root }, duckRoot, dolphin: { user, config }, ppsspp: { root, ini }, shadUser }
function files(ctx) {
  const e = ctx.emu;
  if (e === 'rpcs3') return { file: path.join(ctx.rpcs3Root, 'config', 'custom_configs', `config_${ctx.serial}.yml`), base: [path.join(ctx.rpcs3Root, 'config', 'config.yml'), path.join(ctx.rpcs3Root, 'config.yml')], kind: 'yml' };
  if (e === 'pcsx2') return { file: path.join(ctx.pcsx2.gamesettings, ctx.serial ? `${ctx.serial}_${ctx.crc}.ini` : `${ctx.crc}.ini`), base: [path.join(ctx.pcsx2.root, 'inis', 'PCSX2.ini')], kind: 'ini' };
  if (e === 'duckstation') return { file: path.join(ctx.duckRoot, 'gamesettings', `${ctx.serial}.ini`), base: [path.join(ctx.duckRoot, 'settings.ini')], kind: 'ini' };
  if (e === 'dolphin') return { file: path.join(ctx.dolphin.user, 'GameSettings', `${ctx.serial}.ini`), base: [path.join(ctx.dolphin.config, 'GFX.ini'), path.join(ctx.dolphin.config, 'Dolphin.ini')], kind: 'ini', dolphin: true };
  if (e === 'ppsspp') return { file: path.join(ctx.ppsspp.root, 'PSP', 'SYSTEM', `${ctx.serial}_ppsspp.ini`), base: [ctx.ppsspp.ini], kind: 'ini', copyBase: true };
  if (e === 'shadps4') return { file: path.join(ctx.shadUser, 'custom_configs', `${ctx.serial}.json`), base: [], kind: 'json' };
  return null;
}
// Dolphin's game sections live under other names in its main files
const DOLPHIN_BASE = { Video_Settings: 'Settings', Video_Enhancements: 'Enhancements', Video_Hacks: 'Hacks', Core: 'Core' };
function getIn(kind, text, sec, key) {
  if (text == null) return undefined;
  if (kind === 'yml') return ymlGet(text, sec, key);
  if (kind === 'json') { try { const v = JSON.parse(text)?.[sec]?.[key]; return v == null ? undefined : String(v); } catch { return undefined; } }
  return iniGet(text, sec, key);
}
// what the screen shows: each setting with the game's value (or none) and the emulator's own
function describe(ctx) {
  const S = SCHEMA[ctx.emu], F = files(ctx);
  if (!S || !F) return null;
  const own = read(F.file);
  const bases = F.base.map(read);
  const items = S.items.map((it) => {
    const [sec, key] = split(it.id);
    const game = own != null && !(F.copyBase && !ownMarked(ctx, F.file, it.id)) ? getIn(F.kind, own, sec, key) : undefined;
    let base;
    for (const t of bases) { base = getIn(F.kind, t, F.dolphin ? DOLPHIN_BASE[sec] || sec : sec, key); if (base !== undefined) break; }
    const opts = it.type === 'bool' ? [[it.on, 'On'], [it.off, 'Off']] : it.options.map((o) => (Array.isArray(o) ? o : [o, o]));
    return { id: it.id, label: it.label, sub: it.sub || '', options: opts.map(([v, l]) => ({ value: v, label: l })), game: game ?? null, base: base ?? null, type: it.type || 'choice' };
  });
  return { emu: ctx.emu, name: S.name, file: F.file, exists: own != null, items };
}
// PPSSPP's game file is a full copy, so only the keys Cartridge set count as "this game's" (the rest
// came from your normal settings when the file was made); records in game-settings.json
let recsFile = null;
const recs = () => { try { return JSON.parse(fs.readFileSync(recsFile, 'utf8')); } catch { return {}; } };
const saveRecs = (r) => { if (recsFile) { fs.mkdirSync(path.dirname(recsFile), { recursive: true }); fs.writeFileSync(recsFile, JSON.stringify(r, null, 1)); } };
function ownMarked(ctx, file, id) { const r = recs()[file]; return !r || !r.copied || (r.keys || []).includes(id); }
// changes: [{ id, value }] (value null = back to the emulator's own)
function apply(ctx, changes) {
  const S = SCHEMA[ctx.emu], F = files(ctx);
  if (!S || !F) throw new Error('Cartridge can’t change this emulator’s per-game settings.');
  let text = read(F.file);
  const r = recs(), rec = r[F.file] || { created: text == null, keys: [] };
  if (text == null) {
    text = F.copyBase && F.base[0] ? read(F.base[0]) || '' : F.kind === 'json' ? '{}' : '';
    rec.copied = !!(F.copyBase && text);
  }
  for (const c of changes) {
    const it = S.items.find((x) => x.id === c.id);
    if (!it) continue;
    const [sec, key] = split(it.id);
    let value = c.value == null ? undefined : String(c.value);
    if (value !== undefined && it.type !== 'bool' && !(it.options || []).some((o) => String(Array.isArray(o) ? o[0] : o) === value)) throw new Error(`${it.label}: that value isn’t one Cartridge offers.`);
    if (value !== undefined && it.type === 'bool' && value !== it.on && value !== it.off) throw new Error(`${it.label}: on or off only.`);
    if (F.copyBase && value === undefined && rec.copied) { // PPSSPP: back to your normal setting's value
      const b = F.base[0] && getIn('ini', read(F.base[0]), sec, key);
      value = b;
    }
    if (F.kind === 'yml') text = ymlPut(text, sec, key, value);
    else if (F.kind === 'json') { let j = {}; try { j = JSON.parse(text || '{}'); } catch {} if (value === undefined) { if (j[sec]) { delete j[sec][key]; if (!Object.keys(j[sec]).length) delete j[sec]; } } else (j[sec] ||= {})[key] = it.json === 'bool' ? value === 'true' : it.json === 'int' ? Number(value) : value; text = JSON.stringify(j, null, 4); }
    else text = iniPut(text, sec, key, value);
    rec.keys = c.value == null ? rec.keys.filter((k) => k !== it.id) : [...new Set([...rec.keys, it.id])];
  }
  // a file Cartridge made that holds nothing of yours any more goes away again
  const empty = F.kind === 'json' ? (() => { try { return !Object.keys(JSON.parse(text)).length; } catch { return false; } })() : F.kind === 'yml' ? !String(text).replace(/\{\}\s*/g, '').trim() : !String(text).split(/\r?\n/).some((l) => l.includes('='));
  fs.mkdirSync(path.dirname(F.file), { recursive: true });
  if (rec.created && (!rec.keys.length && (empty || rec.copied))) { fs.rmSync(F.file, { force: true }); delete r[F.file]; }
  else { const tmp = F.file + '.cartridge-new'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, F.file); r[F.file] = rec; }
  saveRecs(r);
  return describe(ctx);
}
module.exports = { SCHEMA, describe, apply, files, iniGet, iniPut, ymlPut, ymlGet, setRecsFile: (f) => { recsFile = f; } };
