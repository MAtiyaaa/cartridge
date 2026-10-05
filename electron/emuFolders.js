// Your game folders in the emulators' own game lists (0.9.17, owner: set emulators up from Cartridge).
// Only adds a folder, written the way each emulator writes it, never while it runs:
// - PCSX2 inis/PCSX2.ini and DuckStation settings.ini: [GameList] RecursivePaths = <dir>, one line per
//   folder (both read every RecursivePaths line, SimpleIni with repeated keys)
// - Dolphin Dolphin.ini: [General] ISOPaths = <count>, ISOPath<n> = <dir>
// Returns what was added, recorded by the caller (emu-folders.json).
const fs = require('fs');
const path = require('path');
const os = require('os');

const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
const write = (f, t) => { if (!fs.existsSync(f + '.cartridge-backup')) fs.copyFileSync(f, f + '.cartridge-backup'); fs.writeFileSync(f + '.tmp', t); fs.renameSync(f + '.tmp', f); };
// lines of one [section]: { lines, start, end } (end: first line after it)
function section(lines, name) {
  let start = lines.findIndex((l) => l.trim() === `[${name}]`);
  if (start < 0) { if (lines.length && lines[lines.length - 1].trim()) lines.push(''); lines.push(`[${name}]`); start = lines.length - 1; }
  let end = start + 1; while (end < lines.length && !/^\s*\[.*\]\s*$/.test(lines[end])) end++;
  let at = end; while (at > start + 1 && !lines[at - 1].trim()) at--;
  return { start, end, at };
}
const values = (lines, s, key) => lines.slice(s.start + 1, s.end).map((l) => /^\s*([^=;#]+?)\s*=\s*(.*?)\s*$/.exec(l)).filter((m) => m && m[1] === key).map((m) => m[2]);
function addMulti(file, sec, key, dirs) {
  const t = read(file); if (t == null) return [];
  const nl = t.includes('\r\n') ? '\r\n' : '\n';
  const lines = t.split(/\r?\n/); if (lines[lines.length - 1] === '') lines.pop();
  const s = section(lines, sec), have = new Set(values(lines, s, key).map((v) => path.resolve(v)));
  const add = dirs.filter((d) => !have.has(path.resolve(d)));
  if (!add.length) return [];
  lines.splice(s.at, 0, ...add.map((d) => `${key} = ${d}`));
  write(file, lines.join(nl) + nl);
  return add;
}
function addDolphin(file, dirs) {
  const t = read(file); if (t == null) return [];
  const nl = t.includes('\r\n') ? '\r\n' : '\n';
  const lines = t.split(/\r?\n/); if (lines[lines.length - 1] === '') lines.pop();
  const s = section(lines, 'General');
  const kv = Object.fromEntries(lines.slice(s.start + 1, s.end).map((l) => /^\s*([^=;#]+?)\s*=\s*(.*?)\s*$/.exec(l)).filter(Boolean).map((m) => [m[1], m[2]]));
  const n = Number(kv.ISOPaths) || 0;
  const have = new Set(Array.from({ length: n }, (_, i) => kv['ISOPath' + i]).filter(Boolean).map((v) => path.resolve(v)));
  const add = dirs.filter((d) => !have.has(path.resolve(d)));
  if (!add.length) return [];
  const rm = lines.findIndex((l, i) => i > s.start && i < s.end && /^\s*ISOPaths\s*=/.test(l));
  const fresh = [`ISOPaths = ${n + add.length}`, ...add.map((d, i) => `ISOPath${n + i} = ${d}`)];
  if (rm >= 0) lines.splice(rm, 1, fresh[0]); else lines.splice(s.at, 0, fresh[0]);
  const s2 = section(lines, 'General');
  lines.splice(s2.at, 0, ...fresh.slice(1));
  write(file, lines.join(nl) + nl);
  return add;
}
// the emulators' settings files found here (native and Flatpak)
function targets(home = os.homedir(), env = process.env) {
  const cfg = env.XDG_CONFIG_HOME || path.join(home, '.config'), data = env.XDG_DATA_HOME || path.join(home, '.local/share');
  const v = (id, ...p) => path.join(home, '.var/app', id, ...p);
  return [
    ...[path.join(cfg, 'PCSX2/inis/PCSX2.ini'), v('net.pcsx2.PCSX2', 'config/PCSX2/inis/PCSX2.ini')].map((f) => ({ id: 'pcsx2', name: 'PCSX2', file: f, for: ['ps2'] })),
    ...[path.join(data, 'duckstation/settings.ini'), v('org.duckstation.DuckStation', 'data/duckstation/settings.ini')].map((f) => ({ id: 'duckstation', name: 'DuckStation', file: f, for: ['psx'] })),
    ...[path.join(cfg, 'dolphin-emu/Dolphin.ini'), v('org.DolphinEmu.dolphin-emu', 'config/dolphin-emu/Dolphin.ini')].map((f) => ({ id: 'dolphin', name: 'Dolphin', file: f, for: ['gc', 'ngc', 'wii'] })),
  ].filter((t) => fs.existsSync(t.file)).map((t) => ({ ...t, flatpak: t.file.includes('/.var/app/') }));
}
// folders: { slug: dir or [dirs] }; running: emulator ids open now (skipped)
function addGameDirs(folders, { home, env, running = new Set() } = {}) {
  const out = [];
  for (const t of targets(home, env)) {
    const dirs = [...new Set(t.for.flatMap((k) => [].concat(folders[k] || [])).filter((d) => d && fs.existsSync(d)))]; // one folder or several (0.9.38: other drives)
    if (!dirs.length) continue;
    if (running.has(t.id)) { out.push({ ...t, skipped: 'running' }); continue; }
    const added = t.id === 'dolphin' ? addDolphin(t.file, dirs) : addMulti(t.file, 'GameList', 'RecursivePaths', dirs);
    out.push({ ...t, added });
  }
  return out;
}
module.exports = { targets, addGameDirs, addMulti, addDolphin };
