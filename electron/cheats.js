// Patches and cheats for GameCube, Wii (Dolphin) and PSP (PPSSPP) (0.9.16, owner: "patches and cheats
// for other consoles like PSP, GameCube, Wii"). Read and written the way each emulator does it itself:
// - Dolphin (Core/PatchEngine, ActionReplay, GeckoCode): the codes are in Sys/GameSettings/<ID>.ini
//   (ID3 and ID6) shipped with Dolphin, plus the user's GameSettings/<ID>.ini; [OnFrame] patches,
//   [ActionReplay] and [Gecko] cheats, "$Name" heads a code. What is on: the sections
//   <Section>_Enabled / <Section>_Disabled, global first, then the user's. Cartridge adds "$Name" to
//   the user's <Section>_Enabled. Cheats (not patches) also need Dolphin.ini [Core] EnableCheats.
// - PPSSPP (Core/CwCheat): PSP/Cheats/<DISC_ID>.ini, "_S ULUS-10041", "_G title", "_C1 name" (on) or
//   "_C0 name" (off), then "_L" code lines. Codes not in the game's file come from PSP/Cheats/cheat.db
//   (PPSSPP's own "Import from cheat.db" copies the same block). Needs ppsspp.ini [General] EnableCheats.
// mine records what Cartridge turned on, the only things it turns off (the cheats switch too).
const fs = require('fs');
const webFetch = require('./webFetch');
const path = require('path');
const os = require('os');
const { iniSet } = require('./raLogin');

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); if (exists(f) && !exists(f + '.cartridge-backup')) fs.copyFileSync(f, f + '.cartridge-backup'); fs.writeFileSync(f + '.tmp', text); fs.renameSync(f + '.tmp', f); };
const K = (...p) => p.join('\u0001');
const iniValue = (text, sec, key) => { let inside = false; for (const l of String(text).split(/\r?\n/)) { const t = l.trim(); if (/^\[.*\]$/.test(t)) { inside = t === `[${sec}]`; continue; } const i = t.indexOf('='); if (inside && i > 0 && t.slice(0, i).trim() === key) return t.slice(i + 1).trim(); } return null; };

// ------------------------------------------------------------------ Dolphin
// user folders (UICommon::SetUserDirectory on Linux): ~/.dolphin-emu if it exists, else XDG data
// (GameSettings) and XDG config (Dolphin.ini); the Flatpak keeps both in its sandbox
function dolphinDirs(home = os.homedir(), env = process.env) {
  const out = [];
  const legacy = path.join(home, '.dolphin-emu');
  if (exists(legacy)) out.push({ user: legacy, config: path.join(legacy, 'Config'), flatpak: false });
  else out.push({ user: path.join(env.XDG_DATA_HOME || path.join(home, '.local/share'), 'dolphin-emu'), config: path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'dolphin-emu'), flatpak: false });
  const fp = path.join(home, '.var/app/org.DolphinEmu.dolphin-emu');
  out.push({ user: path.join(fp, 'data/dolphin-emu'), config: path.join(fp, 'config/dolphin-emu'), flatpak: true });
  return out.filter((d) => exists(path.join(d.config, 'Dolphin.ini')) || exists(path.join(d.user, 'GameSettings')));
}
// Dolphin's shipped GameSettings for that kind of install
function dolphinSys(flatpak, home = os.homedir()) {
  const fp = ['/var/lib/flatpak', path.join(home, '.local/share/flatpak')].map((b) => path.join(b, 'app/org.DolphinEmu.dolphin-emu/current/active/files/share/dolphin-emu/sys/GameSettings'));
  const native = ['/usr/share/dolphin-emu/sys/GameSettings', '/usr/local/share/dolphin-emu/sys/GameSettings'];
  return (flatpak ? fp : native).filter(exists);
}
const DOLPHIN_SECS = ['OnFrame', 'ActionReplay', 'Gecko'];
// the codes in one ini text: { OnFrame: [{ name, author, notes }], ..., enabled: Set, disabled: Set } per section
function dolphinParse(text) {
  const out = {};
  for (const s of DOLPHIN_SECS) out[s] = { codes: [], enabled: new Set(), disabled: new Set() };
  let sec = null, kind = null, cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const t = raw.trim();
    const h = /^\[([^\]]+)\]$/.exec(t);
    if (h) { const [s, k] = h[1].split('_'); sec = out[s] ? s : null; kind = sec ? (k === 'Enabled' ? 'enabled' : k === 'Disabled' ? 'disabled' : k ? null : 'codes') : null; cur = null; continue; }
    if (!sec || !kind || !t.startsWith('$')) { if (cur && kind === 'codes' && t.startsWith('*')) cur.notes = [cur.notes, t.slice(1).trim()].filter(Boolean).join(' '); continue; }
    let name = t.slice(1).trim(), author = '';
    // Gecko names carry their creator: "$Name [Creator]"; the enabled lists hold the name alone
    if (sec === 'Gecko') { const m = /^(.*?)\s*\[([^\]]*)\]\s*$/.exec(name); if (m) { name = m[1].trim(); author = m[2].trim(); } }
    if (!name) continue;
    if (kind === 'codes') { cur = { name, author, notes: '' }; out[sec].codes.push(cur); }
    else out[sec][kind].add(name);
  }
  return out;
}
const dolphinFiles = (id) => [id.slice(0, 3) + '.ini', id + '.ini'];
// Dolphin's shipped files: a folder, else read from inside its AppImage
function dolphinSysText(sysDirs, id, appImages = [], readAppImageFile) {
  let text = '';
  for (const n of dolphinFiles(id)) {
    let got = '';
    for (const d of sysDirs) { got = read(path.join(d, n)); if (got) break; }
    if (!got) for (const a of appImages) { const b = readAppImageFile && readAppImageFile(a, 'usr/share/dolphin-emu/sys/GameSettings/' + n, 4 << 20); if (b) { got = b.toString('utf8'); break; } }
    text += got + '\n';
  }
  return text;
}
function dolphinList(dir, id, sysText, mine = {}) {
  const g = dolphinParse(sysText);
  const u = dolphinParse(dolphinFiles(id).map((n) => read(path.join(dir.user, 'GameSettings', n))).join('\n'));
  const out = [];
  for (const s of DOLPHIN_SECS) {
    const seen = new Set();
    for (const c of [...g[s].codes, ...u[s].codes]) {
      if (seen.has(c.name)) continue;
      seen.add(c.name);
      let on = false;
      for (const x of [g[s], u[s]]) { if (x.enabled.has(c.name)) on = true; if (x.disabled.has(c.name)) on = false; }
      const key = K('dolphin', dir.user, id, s, c.name);
      out.push({ key, name: c.name, section: s, description: c.name, notes: [s === 'OnFrame' ? 'Patch' : 'Cheat', c.notes].filter(Boolean).join(' · '), author: c.author, version: 'All', on, by: on ? (mine[key] ? 'cartridge' : 'emulator') : null });
    }
  }
  return out.sort((a, b) => (a.section === 'OnFrame' ? 0 : 1) - (b.section === 'OnFrame' ? 0 : 1) || a.description.localeCompare(b.description)); // patches first
}
// "$Name" lines in or out of one [Section] (the section is made when missing, left empty when emptied)
function nameLines(text, section, name, add) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text ? text.split(/\r?\n/) : [];
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  let start = lines.findIndex((l) => l.trim() === `[${section}]`);
  const isLine = (l) => l.trim().startsWith('$') && l.trim().slice(1).trim() === name;
  if (add) {
    if (start < 0) { if (lines.length) lines.push(''); lines.push(`[${section}]`); start = lines.length - 1; }
    let end = start + 1; while (end < lines.length && !/^\s*\[/.test(lines[end])) end++;
    if (!lines.slice(start + 1, end).some(isLine)) { let at = end; while (at > start + 1 && !lines[at - 1].trim()) at--; lines.splice(at, 0, '$' + name); }
  } else if (start >= 0) {
    let end = start + 1; while (end < lines.length && !/^\s*\[/.test(lines[end])) end++;
    for (let i = end - 1; i > start; i--) if (isLine(lines[i])) lines.splice(i, 1);
  }
  return lines.join(nl) + nl;
}
// switches = { cheats: on/off, file, sec, key, on, off }: the emulator's "cheats on" setting
function cheatSwitch(mine, flag, wanted, sw) {
  const text = read(sw.file);
  const now = /^(true|1)$/i.test(iniValue(text, sw.sec, sw.key) || '');
  if (wanted && !now) { write(sw.file, iniSet(text, sw.sec, { [sw.key]: sw.on })); mine[flag] = true; }
  else if (!wanted && now && mine[flag]) { write(sw.file, iniSet(text, sw.sec, { [sw.key]: sw.off })); delete mine[flag]; }
  else if (!wanted) delete mine[flag];
}
function dolphinSet(dir, id, changes, mine = {}) {
  const rec = { ...mine };
  const todo = changes.filter((c) => c.on || rec[c.key]);
  if (todo.length) {
    const f = path.join(dir.user, 'GameSettings', id + '.ini');
    let text = read(f);
    for (const c of todo) {
      text = nameLines(text, `${c.section}_Enabled`, c.name, c.on);
      if (c.on) { text = nameLines(text, `${c.section}_Disabled`, c.name, false); rec[c.key] = true; } else delete rec[c.key];
    }
    write(f, text);
  }
  // cheats need Dolphin's cheats switch; off again once no cheat Cartridge turned on is left
  const cheats = Object.keys(rec).some((k) => { const p = k.split('\u0001'); return p[0] === 'dolphin' && p[1] === dir.user && p[3] !== 'OnFrame'; });
  cheatSwitch(rec, K('@cheats', dir.user), cheats, { file: path.join(dir.config, 'Dolphin.ini'), sec: 'Core', key: 'EnableCheats', on: 'True', off: 'False' });
  return rec;
}

// GameCube and Wii game ID (6 letters) from the disc image: plain ISO/GCM, RVZ/WIA (its copy of the
// disc header at 0x58), WBFS (the disc header one WBFS sector in), CISO (after its 32 KiB header)
function gcWiiId(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const at = (pos, n = 6) => { const b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, pos); return b; };
    const head = at(0, 12), magic = head.toString('latin1', 0, 4);
    let pos = 0;
    if (head.readUInt32LE(0) === 0xb10bc001) { const img = require('./discImage').open(file); try { const id = img && img.read(0, 6).toString('latin1'); return /^[A-Z0-9]{6}$/.test(id || '') ? id : null; } finally { img?.close(); } } // GCZ
    if (magic === 'RVZ\x01' || magic === 'WIA\x01') pos = 0x58;
    else if (magic === 'WBFS') pos = 1 << head[8];
    else if (magic === 'CISO') pos = 0x8000;
    const id = at(pos).toString('latin1');
    return /^[A-Z0-9]{6}$/.test(id) ? id : null;
  } catch { return null; } finally { if (fd != null) try { fs.closeSync(fd); } catch {} }
}

// ------------------------------------------------------------------ PPSSPP
function ppssppDirs(home = os.homedir(), env = process.env) {
  const cfg = env.XDG_CONFIG_HOME || path.join(home, '.config');
  return [{ root: path.join(cfg, 'ppsspp'), flatpak: false }, { root: path.join(home, '.var/app/org.ppsspp.PPSSPP/config/ppsspp'), flatpak: true }]
    .filter((d) => exists(path.join(d.root, 'PSP', 'SYSTEM', 'ppsspp.ini')))
    .map((d) => ({ ...d, cheats: path.join(d.root, 'PSP', 'Cheats'), ini: path.join(d.root, 'PSP', 'SYSTEM', 'ppsspp.ini') }));
}
const dashed = (id) => id.replace(/^([A-Z]{4})-?(\d{5})$/, '$1-$2');
// the cheats for one game in a CwCheat text: [{ name, on, lines }] (lines: the code lines under it)
function cwParse(text, id) {
  const want = id.replace('-', '');
  const out = []; let inGame = false, title = '', cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const t = raw.trim();
    if (t.startsWith('_S ')) { inGame = t.slice(3).trim().replace('-', '').toUpperCase() === want; cur = null; continue; }
    if (!inGame) continue;
    if (t.startsWith('_G ')) { title = title || t.slice(3).trim(); continue; }
    const c = /^_C(\d)\s*(.*)$/.exec(t);
    if (c) { cur = { name: c[2].trim(), on: c[1] !== '0', lines: [] }; out.push(cur); continue; }
    if (cur && t.startsWith('_L')) cur.lines.push(t);
  }
  return { title, cheats: out };
}
function ppssppList(dir, id, mine = {}) {
  const own = cwParse(read(path.join(dir.cheats, id + '.ini')), id), db = cwParse(read(path.join(dir.cheats, 'cheat.db')), id);
  const seen = new Set(), out = [];
  for (const c of [...own.cheats, ...db.cheats.map((x) => ({ ...x, on: false }))]) {
    if (!c.name || seen.has(c.name)) continue;
    seen.add(c.name);
    const key = K('ppsspp', dir.root, id, c.name);
    out.push({ key, name: c.name, description: c.name, notes: 'Cheat', version: 'All', on: c.on, by: c.on ? (mine[key] ? 'cartridge' : 'emulator') : null, lines: c.lines });
  }
  return out.sort((a, b) => a.description.localeCompare(b.description));
}
// "_C0" <-> "_C1" in the game's file; a cheat only in cheat.db is copied in first (as PPSSPP's import does)
function ppssppSet(dir, id, changes, mine = {}, title = '') {
  const rec = { ...mine };
  const todo = changes.filter((c) => c.on || rec[c.key]);
  if (todo.length) {
    const f = path.join(dir.cheats, id + '.ini');
    let text = read(f);
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    const lines = text ? text.split(/\r?\n/) : [];
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    const want = id.replace('-', '');
    for (const c of todo) {
      let inGame = false, hit = false;
      for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (t.startsWith('_S ')) { inGame = t.slice(3).trim().replace('-', '').toUpperCase() === want; continue; }
        const m = inGame && /^_C(\d)\s*(.*)$/.exec(t);
        if (m && m[2].trim() === c.name) { lines[i] = `_C${c.on ? 1 : 0} ${c.name}`; hit = true; }
      }
      if (!hit && c.on) {
        if (!lines.some((l) => l.trim().startsWith('_S ') && l.trim().slice(3).trim().replace('-', '').toUpperCase() === want)) lines.push(`_S ${dashed(id)}`, `_G ${title || id}`);
        lines.push(`_C1 ${c.name}`, ...(c.lines || []));
      }
      if (c.on) rec[c.key] = true; else delete rec[c.key];
    }
    write(f, lines.join(nl) + nl);
  }
  const cheats = Object.keys(rec).some((k) => { const p = k.split('\u0001'); return p[0] === 'ppsspp' && p[1] === dir.root; });
  cheatSwitch(rec, K('@cheats', dir.root), cheats, { file: dir.ini, sec: 'General', key: 'EnableCheats', on: 'True', off: 'False' });
  return rec;
}

// cheat.db the way PPSSPP's Cheats → "Download" gets it (UI/CwCheatScreen.cpp): its list at
// metadata.ppsspp.org/cheats.json ({ databases: [{ name, maintainer, url }] }), first one, saved as
// PSP/Cheats/cheat.db. Only when there is none: PPSSPP's own download would replace it, this never does.
const CHEAT_LIST = 'https://metadata.ppsspp.org/cheats.json';
const CHEAT_FALLBACK = 'https://raw.githubusercontent.com/Saramagrean/CWCheat-Database-Plus-/master/cheat.db'; // the list's usual pick
async function ppssppDownloadDb(dir, { fetchImpl = webFetch } = {}) {
  const f = path.join(dir.cheats, 'cheat.db');
  if (exists(f)) return { updated: false };
  const get = (u, ms) => fetchImpl(u, { headers: { 'User-Agent': 'Cartridge' }, signal: AbortSignal.timeout(ms) });
  let url = CHEAT_FALLBACK;
  try { const r = await get(CHEAT_LIST, 10000); if (r.ok) { const j = await r.json(); const db = (j?.databases || []).find((d) => d && typeof d.url === 'string' && /^https:\/\//.test(d.url)); if (db) url = db.url; } } catch {}
  const r = await get(url, 120000);
  if (!r.ok) throw new Error(`The cheat list answered ${r.status}`);
  const text = await r.text();
  if (!/^_S /m.test(text) || !/^_C\d/m.test(text)) throw new Error('That isn’t a cheat list');
  fs.mkdirSync(dir.cheats, { recursive: true });
  fs.writeFileSync(f + '.tmp', text); fs.renameSync(f + '.tmp', f);
  return { updated: true, url };
}

module.exports = { ppssppDownloadDb, dolphinDirs, dolphinSys, dolphinParse, dolphinSysText, dolphinList, dolphinSet, nameLines, gcWiiId, ppssppDirs, cwParse, ppssppList, ppssppSet };
