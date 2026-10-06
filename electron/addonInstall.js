// Putting add-ons where the emulator reads them, and taking them away again (0.9.17). Cartridge only
// adds files: an add-on never replaces a file that is already there, and everything it wrote is listed
// in addons-installed.json, the only files Remove deletes. Zip is read here (yauzl); 7z and rar are
// unpacked by the system's bsdtar or 7z into a temporary folder first, when one is installed.
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const inside = (root, p) => { const r = path.resolve(root) + path.sep; return path.resolve(p).startsWith(r); };
async function sha256(file, algo = 'sha256') {
  const h = crypto.createHash(algo);
  await new Promise((ok, bad) => fs.createReadStream(file).on('data', (d) => h.update(d)).on('end', ok).on('error', bad));
  return h.digest('hex');
}
// parts of a split zip, joined in order into one file
async function join(parts, out) {
  const ws = fs.createWriteStream(out);
  for (const p of parts) await new Promise((ok, bad) => { const rs = fs.createReadStream(p); rs.on('error', bad); rs.on('end', ok); rs.pipe(ws, { end: false }); });
  await new Promise((ok) => ws.end(ok));
}

// every file in an archive: [{ rel, size, read: () => stream }] (zip), or unpacked to tmp (7z, rar)
function zipList(file) {
  const yauzl = require('yauzl');
  return new Promise((ok, bad) => yauzl.open(file, { lazyEntries: true, autoClose: false }, (e, z) => {
    if (e) return bad(e);
    const list = [];
    z.on('entry', (en) => { if (!/\/$/.test(en.fileName) && !/^__MACOSX\//.test(en.fileName)) list.push({ rel: en.fileName.replace(/\\/g, '/'), size: en.uncompressedSize, read: () => new Promise((o, b) => z.openReadStream(en, (er, s) => (er ? b(er) : o(s)))) }); z.readEntry(); });
    z.on('end', () => ok({ list, close: () => z.close() }));
    z.on('error', bad);
    z.readEntry();
  }));
}
const which = (names) => { for (const d of (process.env.PATH || '/usr/bin').split(':').concat(['/usr/bin', '/usr/local/bin'])) for (const n of names) { const f = path.join(d, n); try { fs.accessSync(f, fs.constants.X_OK); return f; } catch {} } return null; };
async function unpackOther(file, tmp) {
  const tool = which(['bsdtar', '7z', '7za', '7zz', 'unrar']);
  if (!tool) throw new Error('This add-on is a 7z or rar file, and neither bsdtar nor 7-Zip is installed here to open it.');
  await fsp.mkdir(tmp, { recursive: true });
  const base = path.basename(tool);
  const args = base === 'bsdtar' ? ['-xf', file, '-C', tmp] : base === 'unrar' ? ['x', '-o-', file, tmp + '/'] : ['x', '-y', `-o${tmp}`, file];
  await new Promise((ok, bad) => execFile(tool, args, { timeout: 30 * 60e3, maxBuffer: 8 << 20 }, (e) => (e ? bad(new Error('The add-on couldn’t be unpacked.')) : ok())));
  const list = [];
  const walk = (d) => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); const st = fs.lstatSync(f); if (st.isSymbolicLink()) continue; if (st.isDirectory()) walk(f); else list.push({ rel: path.relative(tmp, f).split(path.sep).join('/'), size: st.size, read: async () => fs.createReadStream(f) }); } };
  walk(tmp);
  return { list, close: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}
async function openArchive(file, tmp) { return /\.zip$/i.test(file) || (await isZip(file)) ? zipList(file) : unpackOther(file, tmp); }
async function isZip(file) { try { const fd = await fsp.open(file, 'r'); const b = Buffer.alloc(4); await fd.read(b, 0, 4, 0); await fd.close(); return b.readUInt32LE(0) === 0x04034b50; } catch { return false; } }

// Where each file goes: plan(list, kind) -> [{ e, to }] (relative to dest, the game's own folder in
// that emulator). Packs come zipped every which way ("Pack v2/SLUS-21287/replacements/...", a bare
// textures.ini, a rules.txt at the top), so each emulator's layout is found by what it reads (0.9.18,
// owner: per game, the right paths), never by guessing from the archive's top folder:
// - ps2 (EmuCoreX): [SERIAL/]replacements/... -> replacements/..., PNG and DDS only (EmuCoreX's rule)
// - pcsx2, duckstation: textures/<SERIAL>/replacements/<images> (+ DuckStation's config.yaml); the folder
//   above "replacements" is the game folder; a pack with no replacements folder has its images put in one
// - ppsspp: PSP/TEXTURES/<ID>/textures.ini (or textures.zip): the folder holding it is the game folder
// - dolphin: Load/Textures/<GameID>, read with subfolders: a folder named the game ID (6 or 3
//   characters) is the game folder, else the files go in as they are
// - azahar, citra: load/textures/<title ID>, with subfolders: a folder named the title ID, else as they are
// - cemu: graphicPacks/<pack>/rules.txt: each rules.txt's folder is one pack, named after it (or the mod)
// - switch: a mod is <Name>/{romfs,exefs,cheats}; a bare romfs/exefs gets the mod's name as its folder
// - shadps4 (0.9.38): <game folder>-mods, which shadPS4 lays over the game read-only (fs.cpp probe_overlay "-mods"),
//   so a mod mirrors the game's own files (dvdroot_ps4/, Image0/...); found by the game folder's top entries (opts.tops),
//   named as the game names them, and nothing in the game itself is touched
// - plain: folders wrapping everything are dropped, the rest kept as it is
const IMG = /\.(png|dds|jpe?g|webp|tga|bmp)$/i;
const segs = (r) => r.split('/');
const safeName = (n) => String(n).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) || 'Mod';
// the folders every file sits under ("Pack/Inner/"), which mean nothing to the emulator
function wrapper(rels) {
  if (!rels.length) return '';
  let pre = segs(rels[0]).slice(0, -1);
  for (const r of rels) { const s = segs(r).slice(0, -1); let i = 0; while (i < pre.length && i < s.length && pre[i] === s[i]) i++; pre = pre.slice(0, i); }
  return pre.length ? pre.join('/') + '/' : '';
}
// the folder (prefix) above the first match of test(segment) in r, plus where it is
function anchorAt(r, test) { const s = segs(r); for (let i = 0; i < s.length - 1; i++) if (test(s[i], i, s)) return { pre: s.slice(0, i).join('/'), i }; return null; }
function plan(list, kind, { id = '', name = 'Mod', tops: gameTops = [] } = {}) {
  const rels = list.map((e) => e.rel);
  const tops = new Set(rels.map((r) => r.split('/')[0]));
  const ID = String(id || '').toUpperCase();
  let map;
  if (kind === 'ps2') {
    map = (r) => { const m = /^(?:[A-Z]{4}-\d{5}\/)?(replacements\/.+)$/i.exec(r); return m && /\.(png|dds)$/i.test(r) ? m[1].replace(/^replacements/i, 'replacements') : null; };
  } else if (kind === 'pcsx2' && !rels.some((r) => IMG.test(r)) && rels.some((r) => /\.pnach$/i.test(r))) {
    // 0.9.23: a PS2 mod that is a patch (.pnach, as GameBanana's often are) goes in PCSX2's own patches
    // folder (alt.patches), each under its own name, where PCSX2 lists it in the game's Patches
    map = (r) => (/\.pnach$/i.test(r) ? '@patches/' + segs(r).pop() : null);
  } else if (kind === 'dolphin' && rels.some((r) => /(^|\/)metadata\.json$/i.test(r))) {
    // 0.9.23: a Dolphin graphics mod (a metadata.json beside its assets) goes in Load/GraphicMods/<mod>,
    // where Dolphin's Graphics Mods list finds it (GraphicsModGroup)
    const roots = rels.filter((r) => /(^|\/)metadata\.json$/i.test(r)).map((r) => segs(r).slice(0, -1).join('/'));
    map = (r) => {
      const root = roots.filter((d) => !d || r.startsWith(d + '/')).sort((a, b) => b.length - a.length)[0];
      if (root === undefined) return null;
      return `@graphicmods/${root ? segs(root).pop() : safeName(name)}/${root ? r.slice(root.length + 1) : r}`;
    };
  } else if (kind === 'pcsx2' || kind === 'duckstation') {
    const rep = rels.map((r) => anchorAt(r, (x) => /^replacements$/i.test(x))).find(Boolean);
    if (rep) {
      const base = rep.pre ? rep.pre + '/' : '';
      map = (r) => {
        if (!r.startsWith(base)) return null;
        const x = r.slice(base.length);
        if (/^replacements\//i.test(x)) return 'replacements/' + x.slice(13);
        return kind === 'duckstation' && /^config\.ya?ml$/i.test(x) ? x : null; // DuckStation's per-game texture settings
      };
    } else {
      const w = wrapper(rels.filter((r) => IMG.test(r)));
      const strip = (r) => { let x = r.slice(w.length); if (ID && segs(x)[0].toUpperCase() === ID) x = segs(x).slice(1).join('/'); return x; };
      map = (r) => (IMG.test(r) && r.startsWith(w) ? 'replacements/' + strip(r) : null);
    }
  } else if (kind === 'ppsspp') {
    const ini = rels.filter((r) => /(^|\/)textures\.(ini|zip)$/i.test(r)).sort((a, b) => segs(a).length - segs(b).length)[0];
    const base = ini ? segs(ini).slice(0, -1).join('/') : wrapper(rels).replace(/\/$/, '');
    const pre = base ? base + '/' : '';
    map = (r) => (r.startsWith(pre) ? r.slice(pre.length) : null);
  } else if ((kind === 'azahar' || kind === 'citra') && rels.some((r) => /(^|\/)(romfs|exefs|exheader\.bin|code\.(ips|bps)|exefsdir)(\/|$)/i.test(r))) {
    // 0.9.37 (owner: read each emulator's guide): a 3DS mod (romfs/, exefs/, code.ips, exheader.bin) belongs in Azahar's
    // load/mods/<title ID>/ (alt.mods3ds), not with the textures; whatever wraps it (the mod's folder, the title ID) goes
    const LAY = /^(romfs|exefs|exefsdir|exheader\.bin|code\.(ips|bps))$/i;
    const pre = rels.map((r) => { const s2 = segs(r), i = s2.findIndex((x) => LAY.test(x)); return i < 0 ? null : s2.slice(0, i).join('/'); }).filter((x) => x !== null).sort((a, b) => a.length - b.length)[0];
    const p0 = pre ? pre + '/' : '';
    map = (r) => (r.startsWith(p0) && LAY.test(segs(r.slice(p0.length))[0]) ? '@mods3ds/' + r.slice(p0.length) : null);
  } else if (kind === 'dolphin' || kind === 'azahar' || kind === 'citra') {
    const isId = kind === 'dolphin'
      ? (x) => ID && (x.toUpperCase() === ID || (x.length === 3 && x.toUpperCase() === ID.slice(0, 3)))
      : (x) => ID && x.toUpperCase() === ID;
    const r0 = rels.find((r) => anchorAt(r, isId));
    if (r0) { const pre = segs(r0).slice(0, anchorAt(r0, isId).i + 1).join('/') + '/'; map = (r) => (r.startsWith(pre) ? r.slice(pre.length) : null); }
    else { const w = wrapper(rels); map = (r) => r.slice(w.length); }
  } else if (kind === 'cemu') {
    const packs = rels.filter((r) => /(^|\/)rules\.txt$/i.test(r)).map((r) => segs(r).slice(0, -1).join('/'));
    if (!packs.length) return [];
    map = (r) => {
      const p = packs.filter((d) => !d || r.startsWith(d + '/')).sort((a, b) => b.length - a.length)[0];
      if (p === undefined) return null;
      const folder = p ? segs(p).pop() : safeName(name);
      return `${folder}/${p ? r.slice(p.length + 1) : r}`;
    };
  } else if (kind === 'switch') {
    // Eden/yuzu load/<id>/<mod>/{romfs,romfs_ext,exefs,cheats}, Ryujinx mods/contents/<id>/<mod>/... (0.9.37, from their
    // mod guides): Atmosphere's exefs_patches/<name>/*.ips become <name>/exefs/, a loose .ips/.pchtxt goes in the mod's
    // exefs/, a loose <build ID>.txt in its cheats/
    const LAYER = /^(romfs|romfs_ext|exefs|cheats)$/i;
    const safe = safeName(name);
    const strip = tops.size === 1 && id && [...tops][0].toUpperCase() === ID ? [...tops][0] + '/' : '';
    map = (r) => {
      const x = strip && r.startsWith(strip) ? r.slice(strip.length) : r;
      const s = segs(x), i = s.findIndex((p, n) => n < s.length - 1 && LAYER.test(p));
      const ep = s.findIndex((p, n) => n < s.length - 2 && /^exefs_patches$/i.test(p));
      if (ep >= 0) return `${s[ep + 1]}/exefs/${s.slice(ep + 2).join('/')}`;
      if (i < 0 && /\.(ips|pchtxt)$/i.test(x)) return `${safe}/exefs/${s[s.length - 1]}`;
      if (i < 0 && /^[0-9A-F]{16}\.txt$/i.test(s[s.length - 1])) return `${safe}/cheats/${s[s.length - 1]}`;
      if (i < 0) return x;
      // "<Mod>/romfs/..." keeps the mod's own folder; a bare romfs, or one under wrappers, gets the mod's name
      const own = i > 0 && !/^[0-9A-F]{16}$/i.test(s[i - 1]) && s[i - 1].toUpperCase() !== ID ? s[i - 1] : safe; // Atmosphere's contents/<id>/romfs too
      return `${own}/${s.slice(i).join('/')}`;
    };
  } else if (kind === 'shadps4') {
    const own = new Map(gameTops.filter((n) => !/^(eboot\.bin|sce_sys)$/i.test(n)).map((n) => [n.toLowerCase(), n]));
    const at = (r) => segs(r).slice(0, -1).findIndex((x) => own.has(x.toLowerCase()));
    const pre = rels.filter((r) => at(r) >= 0).map((r) => segs(r).slice(0, at(r)).join('/')).sort((a, b) => a.length - b.length)[0];
    if (pre === undefined) return []; // nothing in it matches the game's files: not a mod for this game's layout
    const p0 = pre ? pre + '/' : '';
    map = (r) => { if (!r.startsWith(p0)) return null; const s = segs(r.slice(p0.length)); const o = s.length > 1 && own.get(s[0].toLowerCase()); return o ? [o, ...s.slice(1)].join('/') : null; };
  } else {
    const strip = tops.size === 1 && id && [...tops][0].toUpperCase() === ID && rels.every((r) => r.includes('/')) ? [...tops][0] + '/' : '';
    map = (r) => (strip && r.startsWith(strip) ? r.slice(strip.length) : r);
  }
  return list.map((e) => ({ e, to: map(e.rel) })).filter((x) => x.to && !x.to.split('/').some((p) => p === '..' || p === '' || p === '.'));
}

const EMPTY = {
  ps2: 'There are no PNG or DDS textures in a replacements folder in this pack.',
  pcsx2: 'There are no textures in this add-on.', duckstation: 'There are no textures in this add-on.',
  cemu: 'This isn’t a Cemu graphic pack (no rules.txt in it).',
  shadps4: 'None of this mod’s folders match the game’s own (like dvdroot_ps4), so Cartridge doesn’t know where it goes.',
};
// archive -> dest; refuses before writing anything if a file is already there
// "@patches/x" and "@graphicmods/x" (0.9.23) land in the emulator's other folders (opts.alt)
function where(dest, to, alt = {}) {
  const m = /^@(\w+)\/(.+)$/.exec(to);
  if (!m) return { base: dest, out: path.join(dest, to) };
  if (!alt[m[1]]) return null;
  return { base: alt[m[1]], out: path.join(alt[m[1]], m[2]) };
}
async function install(archive, dest, kind, opts = {}) {
  const tmp = (opts.tmpBase || archive) + '.unpacked';
  const a = await openArchive(archive, tmp);
  try {
    const todo = plan(a.list, kind, opts);
    if (!todo.length) throw new Error(EMPTY[kind] || 'This add-on is empty.');
    for (const t of todo) { const w = where(dest, t.to, opts.alt); if (!w || !inside(w.base, w.out)) throw new Error('Unsafe file path in the add-on.'); if (fs.existsSync(w.out)) throw new Error(`Something is already at ${t.to.replace(/^@\w+\//, '')} in this folder, so nothing was installed. Remove it first.`); }
    const need = todo.reduce((s, t) => s + (t.e.size || 0), 0);
    const free = await fsp.statfs(fs.existsSync(dest) ? dest : path.dirname(dest)).then((st) => st.bavail * st.bsize).catch(() => Infinity);
    if (need > free) throw new Error(`Not enough space: it needs ${Math.ceil(need / 1e9)} GB.`);
    const written = [];
    try {
      for (const [i, t] of todo.entries()) {
        if (opts.signal?.aborted) throw new Error('aborted');
        const out = where(dest, t.to, opts.alt).out;
        await fsp.mkdir(path.dirname(out), { recursive: true });
        const rs = await t.e.read();
        await new Promise((ok, bad) => { const ws = fs.createWriteStream(out, { flags: 'wx' }); rs.on('error', bad); ws.on('error', bad); ws.on('finish', ok); rs.pipe(ws); });
        written.push(t.to);
        opts.onFile?.(i + 1, todo.length);
      }
    } catch (e) { await removeFiles(dest, written, opts.alt); throw e; }
    return { files: written, bytes: need };
  } finally { try { a.close(); } catch {} }
}
// only the files listed, then folders left empty, never above dest
async function removeFiles(dest, files, alt = {}) {
  const dirs = new Set();
  for (const rel of files || []) {
    const w = where(dest, rel, alt);
    if (!w || !inside(w.base, w.out)) continue;
    await fsp.rm(w.out, { force: true });
    for (let d = path.dirname(w.out); inside(w.base, d); d = path.dirname(d)) dirs.add(d);
  }
  for (const d of [...dirs].sort((a, b) => b.length - a.length)) { try { await fsp.rmdir(d); } catch {} }
}

module.exports = { sha256, join, plan, wrapper, install, removeFiles, openArchive };
