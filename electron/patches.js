'use strict';
// Emulator patches (0.9.3 D7, owner's option 1). The patches themselves are the emulator's own
// (RPCS3 downloads its patch.yml); Cartridge lists the ones for a game and turns them on or off in
// the emulator's own patch settings, so they stay on exactly as if ticked in the emulator. It only
// ever turns off what it turned on itself (recorded in Cartridge's patches.json); patches you turned
// on in the emulator are shown as on and left alone. Every other entry in the file is kept.
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
// Everything as text (FAILSAFE): RPCS3's app version keys like 01.00 must not turn into numbers
const load = (t) => yaml.load(t, { schema: yaml.FAILSAFE_SCHEMA }) || {};
const dump = (o) => yaml.dump(o, { schema: yaml.FAILSAFE_SCHEMA, lineWidth: -1, noRefs: true });
const readYaml = (f) => { try { const o = load(fs.readFileSync(f, 'utf8')); return o && typeof o === 'object' ? o : {}; } catch { return {}; } };

// PARAM.SFO (PS3, PS4, Vita): header "\0PSF", key table and data table offsets, then entries
// { key offset u16, format u16, length u32, max u32, data offset u32 }. Returns { KEY: value }.
function parseSfo(buf) {
  const out = {};
  try {
    if (buf.readUInt32BE(0) !== 0x00505346) return out;
    const keys = buf.readUInt32LE(8), data = buf.readUInt32LE(12), n = buf.readUInt32LE(16);
    for (let i = 0; i < n; i++) {
      const e = 20 + i * 16;
      const ko = buf.readUInt16LE(e), fmt = buf.readUInt16LE(e + 2), len = buf.readUInt32LE(e + 4), off = buf.readUInt32LE(e + 12);
      const k = buf.toString('latin1', keys + ko, buf.indexOf(0, keys + ko));
      out[k] = fmt === 0x0404 ? buf.readUInt32LE(data + off) : buf.toString('utf8', data + off, data + off + len).replace(/\0+$/, '');
    }
  } catch {}
  return out;
}
const sfoAt = (f) => { try { return parseSfo(fs.readFileSync(f)); } catch { return {}; } };

// ---------------------------------------------------------------- RPCS3
// fs::get_config_dir(): ~/.config/rpcs3 (or the Flatpak's). patches/ holds patch.yml (RPCS3's
// download), imported_patch.yml and <serial>_patch.yml; the switches are config/patch_config.yml
// (older RPCS3: patch_config.yml next to patches/). bin_patch.cpp, patch_engine.
function rpcs3Dirs(home = os.homedir()) {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  return [path.join(xdg, 'rpcs3'), path.join(home, '.var/app/net.rpcs3.RPCS3/config/rpcs3')]
    .filter((d) => exists(path.join(d, 'patches')) || exists(path.join(d, 'config')))
    .map((root) => ({ root, patches: path.join(root, 'patches'), config: exists(path.join(root, 'patch_config.yml')) && !exists(path.join(root, 'config', 'patch_config.yml')) ? path.join(root, 'patch_config.yml') : path.join(root, 'config', 'patch_config.yml') }));
}
// The game's serial and app version (APP_VER): an installed update in dev_hdd0 wins over the disc
function ps3Version(gameDir, hdds, serial) {
  for (const h of hdds) { const s = sfoAt(path.join(h, 'game', serial, 'PARAM.SFO')); if (s.APP_VER) return s.APP_VER; }
  for (const f of [path.join(gameDir || '', 'PS3_GAME', 'PARAM.SFO'), path.join(gameDir || '', 'PARAM.SFO')]) { const s = sfoAt(f); if (s.APP_VER) return s.APP_VER; }
  return null;
}
// Patches for one game: [{ key, hash, description, title, serial, version, author, notes, group, on, by }]
// by: 'cartridge' when Cartridge turned it on, 'emulator' when turned on in RPCS3, null when off.
function rpcs3List(dir, serial, appVer, mine = {}) {
  const files = ['patch.yml', 'imported_patch.yml', `${serial}_patch.yml`].map((f) => path.join(dir.patches, f)).filter(exists);
  const cfg = readYaml(dir.config);
  const out = [], seen = new Set();
  for (const f of files) {
    const doc = readYaml(f);
    for (const [hash, descs] of Object.entries(doc)) {
      if (hash === 'Version' || hash === 'Anchors' || !descs || typeof descs !== 'object') continue;
      for (const [description, p] of Object.entries(descs)) {
        const games = p?.Games;
        if (!games || typeof games !== 'object') continue;
        for (const [title, serials] of Object.entries(games)) {
          const vers = serials?.[serial];
          if (!Array.isArray(vers)) continue;
          // this game's version, else All; with the version unknown, the one version it lists
          const version = vers.includes(appVer) ? appVer : vers.includes('All') ? 'All' : !appVer && vers.length === 1 ? vers[0] : null;
          if (!version) continue;
          const key = [hash, description, title, serial, version].join('\u0001');
          if (seen.has(key)) continue;
          seen.add(key);
          const node = cfg?.[hash]?.[description]?.[title]?.[serial]?.[version];
          const on = node === 'true' || !!(node && typeof node === 'object' && node.Enabled === 'true');
          out.push({ key, hash, description, title, serial, version, author: p.Author || '', notes: typeof p.Notes === 'string' ? p.Notes : '', group: p.Group || '', on, by: on ? (mine[key] ? 'cartridge' : 'emulator') : null });
        }
      }
    }
  }
  return out.sort((a, b) => a.description.localeCompare(b.description));
}
// Turn patches on (Enabled: true) or off in patch_config.yml. Off only for ones Cartridge turned on.
// Everything else in the file is written back as it was. Returns the new { key: true } record.
function rpcs3Set(dir, changes, mine = {}) {
  const cfg = readYaml(dir.config);
  const rec = { ...mine };
  for (const c of changes) {
    const k = c.key;
    const path5 = [c.hash, c.description, c.title, c.serial, c.version];
    if (c.on) {
      let o = cfg;
      for (const p of path5.slice(0, 4)) { if (!o[p] || typeof o[p] !== 'object') o[p] = {}; o = o[p]; }
      const cur = o[c.version];
      o[c.version] = cur && typeof cur === 'object' ? { ...cur, Enabled: 'true' } : { Enabled: 'true' };
      rec[k] = true;
    } else if (rec[k]) {
      const chain = [cfg]; let o = cfg;
      for (const p of path5.slice(0, 4)) { o = o?.[p]; chain.push(o); }
      const node = o?.[c.version];
      if (node && typeof node === 'object') { delete node.Enabled; if (!Object.keys(node).length) delete o[c.version]; } else if (o) delete o[c.version];
      for (let i = 4; i > 0; i--) if (chain[i] && !Object.keys(chain[i]).length) delete chain[i - 1][path5[i - 1]]; // drop what is now empty
      delete rec[k];
    }
  }
  fs.mkdirSync(path.dirname(dir.config), { recursive: true });
  if (exists(dir.config) && !exists(dir.config + '.cartridge-backup')) fs.copyFileSync(dir.config, dir.config + '.cartridge-backup'); // the file as it was before Cartridge first touched it
  const tmp = dir.config + '.tmp';
  fs.writeFileSync(tmp, dump(cfg));
  fs.renameSync(tmp, dir.config);
  return rec;
}

// ---------------------------------------------------------------- shadPS4
// shadPS4's user folder (common/path_util.cpp: ~/.local/share/shadPS4, or $XDG_DATA_HOME) holds
// patches/<repository>/files.json ({ "<file>.xml": [serials] }) and the XML files. A patch is a
// <Metadata Name AppVer Author Note isEnabled> element; the launcher shows those whose AppVer is the
// game's version, or "mask" (any version), and turns one on by writing isEnabled="true"
// (qt_gui/cheats_patches.cpp, common/memory_patcher.cpp). Only that attribute is changed here.
function shadDirs(home = os.homedir()) {
  const data = process.env.XDG_DATA_HOME || path.join(home, '.local/share');
  return [...new Set([path.join(data, 'shadPS4'), path.join(home, '.local/share/shadPS4')])].filter((d) => exists(path.join(d, 'patches')));
}
// a PS4 game's version: an update folder next to it (Game-UPDATE, Game-patch) wins over the game
function ps4Version(gameDir) {
  for (const d of [`${gameDir}-UPDATE`, `${gameDir}-patch`, gameDir]) { const s = sfoAt(path.join(d, 'sce_sys', 'param.sfo')); if (s.APP_VER) return s.APP_VER; }
  return null;
}
const unXml = (v) => String(v).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attrsOf = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map((m) => [m[1], m[2]]));
function shadFiles(userDir, serial) {
  const out = [];
  const pd = path.join(userDir, 'patches');
  let repos = []; try { repos = fs.readdirSync(pd, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch {}
  for (const repo of repos) {
    let map = {}; try { map = JSON.parse(fs.readFileSync(path.join(pd, repo, 'files.json'), 'utf8')); } catch { continue; }
    const file = Object.keys(map).find((f) => Array.isArray(map[f]) && map[f].includes(serial));
    if (file && exists(path.join(pd, repo, file))) out.push({ repo, file, full: path.join(pd, repo, file) });
  }
  return out;
}
function shadList(userDir, serial, version, mine = {}) {
  const out = [];
  for (const f of shadFiles(userDir, serial)) {
    let xml = ''; try { xml = fs.readFileSync(f.full, 'utf8'); } catch { continue; }
    for (const m of xml.matchAll(/<Metadata\b([^>]*?)\/?>/g)) {
      const a = attrsOf(m[1]);
      if (!(a.AppVer === version || a.AppVer === 'mask')) continue;
      const key = ['shadps4', f.repo, f.file, a.Name, a.AppVer].join('\u0001');
      const on = a.isEnabled === 'true';
      out.push({ key, repo: f.repo, file: f.file, name: a.Name, appVer: a.AppVer, description: unXml(a.Name || ''), version: a.AppVer === 'mask' ? 'All' : a.AppVer, author: unXml(a.Author || ''), notes: unXml(a.Note || ''), group: f.repo, on, by: on ? (mine[key] ? 'cartridge' : 'emulator') : null });
    }
  }
  return out.sort((a, b) => a.description.localeCompare(b.description));
}
// sets isEnabled on the matching <Metadata> tags; the rest of each file stays byte for byte
function shadSet(userDir, changes, mine = {}) {
  const rec = { ...mine };
  const byFile = new Map();
  for (const c of changes) { if (!c.on && !rec[c.key]) continue; const f = path.join(userDir, 'patches', c.repo, c.file); (byFile.get(f) || byFile.set(f, []).get(f)).push(c); }
  for (const [f, list] of byFile) {
    let xml = fs.readFileSync(f, 'utf8');
    xml = xml.replace(/<Metadata\b([^>]*?)(\/?)>/g, (whole, body, slash) => {
      const a = attrsOf(body);
      const c = list.find((x) => x.name === a.Name && x.appVer === a.AppVer);
      if (!c) return whole;
      const val = c.on ? 'true' : 'false';
      const nb = /\bisEnabled\s*=\s*"[^"]*"/.test(body) ? body.replace(/\bisEnabled\s*=\s*"[^"]*"/, `isEnabled="${val}"`) : `${body.replace(/\s*$/, '')} isEnabled="${val}"`;
      return `<Metadata${nb}${slash}>`;
    });
    if (!exists(f + '.cartridge-backup')) fs.copyFileSync(f, f + '.cartridge-backup');
    fs.writeFileSync(f + '.tmp', xml); fs.renameSync(f + '.tmp', f);
    for (const c of list) { if (c.on) rec[c.key] = true; else delete rec[c.key]; }
  }
  return rec;
}

// ---------------------------------------------------------------- PCSX2 (PS2)
// From PCSX2's source (pcsx2/Patch.cpp, GameList.cpp, VMManager.cpp, Pcsx2Config.cpp):
// - a game's patches are <SERIAL>_<CRC>.pnach (or <CRC>.pnach) in its own patches.zip (resources
//   folder of the install, inside the AppImage too) and in the user's patches folder;
// - [Name] starts a patch, author= and description= (else comment=) describe it;
// - which are on: the game's own settings file gamesettings/<SERIAL>_<CRC>.ini, section [Patches],
//   one "Enable = <Name>" line each;
// - serial and CRC come from PCSX2's game list cache (cache/gamelist.cache, version 34: per game
//   path, serial, title, title_sort, title_en as u32-length strings, type u8, region u8, size u64,
//   modified u64, crc u32, rating u8, little-endian). So the game must be in PCSX2's game list.
// Data folder: $XDG_CONFIG_HOME/PCSX2, ~/.config/PCSX2, the Flatpak's; folders from inis/PCSX2.ini.
function pcsx2Dirs(home = os.homedir()) {
  const roots = [process.env.XDG_CONFIG_HOME && path.join(process.env.XDG_CONFIG_HOME, 'PCSX2'), path.join(home, '.config/PCSX2'), path.join(home, '.var/app/net.pcsx2.PCSX2/config/PCSX2')].filter(Boolean);
  const out = [];
  for (const root of [...new Set(roots)]) {
    if (!exists(path.join(root, 'inis'))) continue;
    let ini = ''; try { ini = fs.readFileSync(path.join(root, 'inis', 'PCSX2.ini'), 'utf8'); } catch {}
    const folders = iniSection(ini, 'Folders');
    const at = (k, def) => { const v = (folders.find((x) => x[0] === k) || [])[1] || def; return path.isAbsolute(v) ? v : path.join(root, v); };
    out.push({ root, cache: at('Cache', 'cache'), patches: at('Patches', 'patches'), gamesettings: at('GameSettings', 'gamesettings'), flatpak: root.includes('/.var/app/') });
  }
  return out;
}
// [Section] key = value pairs, in order, repeated keys kept
function iniSection(text, name) {
  const out = []; let inside = false;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (/^\[.*\]$/.test(line)) { inside = line.slice(1, -1).trim() === name; continue; }
    if (!inside || !line || /^[;#]/.test(line)) continue;
    const i = line.indexOf('=');
    if (i > 0) out.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
  return out;
}
function pcsx2GameList(cacheDir) {
  const out = [];
  let b; try { b = fs.readFileSync(path.join(cacheDir, 'gamelist.cache')); } catch { return out; }
  if (b.length < 8 || b.readUInt32LE(0) !== 0x45434c47 || b.readUInt32LE(4) !== 34) return out;
  let p = 8;
  const str = () => { const n = b.readUInt32LE(p); p += 4; if (n > 1 << 20 || p + n > b.length) throw new Error('bad'); const v = b.toString('utf8', p, p + n); p += n; return v; };
  try {
    while (p < b.length) {
      const file = str(), serial = str(); str(); str(); str();
      p += 2 + 8 + 8; const crc = b.readUInt32LE(p); p += 4 + 1;
      out.push({ path: file, serial, crc });
    }
  } catch {}
  return out;
}
// serial and CRC for a game file Cartridge knows, by its real path (or, failing that, its name)
function pcsx2Game(dir, file) {
  const list = pcsx2GameList(dir.cache);
  const real = (f) => { try { return fs.realpathSync(f); } catch { return f; } };
  const want = real(file);
  const hit = list.find((g) => real(g.path) === want) || list.find((g) => path.basename(g.path) === path.basename(file));
  return hit && hit.crc ? { serial: hit.serial, crc: hit.crc } : null;
}
const crcHex = (crc) => (crc >>> 0).toString(16).toUpperCase().padStart(8, '0');
// patches.zip from the PCSX2 that is installed: AppImage (read from inside it), Flatpak, distro package
function pcsx2ZipSources(home = os.homedir(), appImages = []) {
  const files = [];
  for (const base of ['/var/lib/flatpak', path.join(home, '.local/share/flatpak')]) for (const sub of ['files/bin/resources', 'files/share/PCSX2/resources']) files.push(path.join(base, 'app/net.pcsx2.PCSX2/current/active', sub, 'patches.zip'));
  files.push('/usr/share/PCSX2/resources/patches.zip', '/usr/share/pcsx2/resources/patches.zip', '/usr/lib/pcsx2/resources/patches.zip', '/usr/bin/resources/patches.zip', '/opt/pcsx2/resources/patches.zip');
  return { files: files.filter(exists), appImages };
}
function pcsx2ZipBuffer(src, readAppImageFile) {
  for (const f of src.files) { try { return fs.readFileSync(f); } catch {} }
  for (const a of src.appImages) { const b = readAppImageFile && readAppImageFile(a, 'usr/bin/resources/patches.zip'); if (b) return b; }
  return null;
}
function zipEntryText(buf, names) {
  const yauzl = require('yauzl');
  return new Promise((resolve) => {
    yauzl.fromBuffer(buf, { lazyEntries: true }, (err, zip) => {
      if (err) return resolve(null);
      let done = false;
      zip.on('entry', (e) => {
        if (!names.includes(e.fileName)) return zip.readEntry();
        zip.openReadStream(e, (er, st) => {
          if (er) return resolve(null);
          const parts = []; st.on('data', (c) => parts.push(c)); st.on('end', () => { done = true; zip.close(); resolve(Buffer.concat(parts).toString('utf8')); });
        });
      });
      zip.on('end', () => { if (!done) resolve(null); });
      zip.readEntry();
    });
  });
}
// the patches in a .pnach text: [Name] blocks with their author and description
function pnachList(text) {
  const out = []; let cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.replace(/\/\/.*$/, '').trim();
    if (!line) continue;
    if (line.length > 2 && line[0] === '[' && line.endsWith(']')) { cur = { name: line.slice(1, -1), author: '', description: '' }; if (!out.some((x) => x.name === cur.name)) out.push(cur); continue; }
    const i = line.indexOf('=');
    if (!cur || i < 0) continue;
    const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
    if (k === 'author') cur.author = v;
    else if (k === 'description') cur.description = v;
    else if (k === 'comment' && !cur.description) cur.description = v;
  }
  return out;
}
async function pcsx2List(dir, game, zipBuf, mine = {}) {
  const names = [`${game.serial}_${crcHex(game.crc)}.pnach`, `${crcHex(game.crc)}.pnach`];
  const texts = [];
  for (const n of names) { try { texts.push(fs.readFileSync(path.join(dir.patches, n), 'utf8')); } catch {} }
  if (zipBuf) { const t = await zipEntryText(zipBuf, names); if (t) texts.push(t); }
  const enabled = new Set(iniSection(readIni(dir, game), 'Patches').filter(([k]) => k === 'Enable').map(([, v]) => v));
  const seen = new Set(), out = [];
  for (const p of texts.flatMap(pnachList)) {
    if (seen.has(p.name)) continue; // the first one loaded wins, as in PCSX2
    seen.add(p.name);
    const key = ['pcsx2', game.serial, crcHex(game.crc), p.name].join('\u0001');
    const on = enabled.has(p.name);
    out.push({ key, name: p.name, description: p.name, notes: p.description, author: p.author, version: 'All', on, by: on ? (mine[key] ? 'cartridge' : 'emulator') : null });
  }
  return out.sort((a, b) => a.description.localeCompare(b.description));
}
const gameIni = (dir, game) => path.join(dir.gamesettings, `${game.serial ? game.serial.replace(/[\\/:*?"<>|]/g, '_') + '_' : ''}${crcHex(game.crc)}.ini`);
function readIni(dir, game) { try { return fs.readFileSync(gameIni(dir, game), 'utf8'); } catch { return ''; } }
// adds or removes only "Enable = <name>" lines for the patches picked; the rest of the file stays as it is
function pcsx2Set(dir, game, changes, mine = {}) {
  const rec = { ...mine };
  const todo = changes.filter((c) => c.on || rec[c.key]);
  if (!todo.length) return rec;
  const f = gameIni(dir, game);
  let text = readIni(dir, game);
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  let lines = text ? text.split(/\r?\n/) : [];
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  let start = lines.findIndex((l) => l.trim() === '[Patches]');
  for (const c of todo) {
    const isLine = (l) => { const m = /^\s*Enable\s*=\s*(.*?)\s*$/.exec(l); return m && m[1] === c.name; };
    if (c.on) {
      if (start < 0) { if (lines.length) lines.push(''); lines.push('[Patches]'); start = lines.length - 1; }
      let end = start + 1; while (end < lines.length && !/^\s*\[/.test(lines[end])) end++;
      if (!lines.slice(start + 1, end).some(isLine)) { let at = end; while (at > start + 1 && !lines[at - 1].trim()) at--; lines.splice(at, 0, `Enable = ${c.name}`); }
      rec[c.key] = true;
    } else {
      if (start >= 0) { let end = start + 1; while (end < lines.length && !/^\s*\[/.test(lines[end])) end++; for (let i = end - 1; i > start; i--) if (isLine(lines[i])) lines.splice(i, 1); }
      delete rec[c.key];
    }
  }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (exists(f) && !exists(f + '.cartridge-backup')) fs.copyFileSync(f, f + '.cartridge-backup');
  fs.writeFileSync(f + '.tmp', lines.join(nl) + nl); fs.renameSync(f + '.tmp', f);
  return rec;
}

module.exports = { parseSfo, sfoAt, rpcs3Dirs, ps3Version, rpcs3List, rpcs3Set, shadDirs, ps4Version, shadList, shadSet, load, dump, pcsx2Dirs, pcsx2GameList, pcsx2Game, pcsx2ZipSources, pcsx2ZipBuffer, pnachList, pcsx2List, pcsx2Set, crcHex };
