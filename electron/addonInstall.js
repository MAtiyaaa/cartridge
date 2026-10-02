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

// Where each file goes: plan(list) -> [{ from, to }] (relative to dest). Kinds:
// - ps2: [SERIAL/]replacements/... -> replacements/..., PNG and DDS only (EmuCoreX's rule)
// - switch: a mod is <Name>/{romfs,exefs,cheats}; a bare romfs/exefs gets the mod's name as its folder
// - plain: a single top folder named like the game ID is dropped, the rest kept as it is
function plan(list, kind, { id = '', name = 'Mod' } = {}) {
  const rels = list.map((e) => e.rel);
  const tops = new Set(rels.map((r) => r.split('/')[0]));
  let map;
  if (kind === 'ps2') {
    map = (r) => { const m = /^(?:[A-Z]{4}-\d{5}\/)?(replacements\/.+)$/i.exec(r); return m && /\.(png|dds)$/i.test(r) ? m[1].replace(/^replacements/i, 'replacements') : null; };
  } else if (kind === 'switch') {
    const LAYER = /^(romfs|exefs|cheats)$/i;
    const safe = String(name).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) || 'Mod';
    const strip = tops.size === 1 && id && [...tops][0].toUpperCase() === id.toUpperCase() ? [...tops][0] + '/' : '';
    map = (r) => { const x = strip && r.startsWith(strip) ? r.slice(strip.length) : r; return LAYER.test(x.split('/')[0]) ? `${safe}/${x}` : x; };
  } else {
    const strip = tops.size === 1 && id && [...tops][0].toUpperCase() === id.toUpperCase() && rels.every((r) => r.includes('/')) ? [...tops][0] + '/' : '';
    map = (r) => (strip && r.startsWith(strip) ? r.slice(strip.length) : r);
  }
  return list.map((e) => ({ e, to: map(e.rel) })).filter((x) => x.to && !x.to.split('/').some((p) => p === '..' || p === ''));
}

// archive -> dest; refuses before writing anything if a file is already there
async function install(archive, dest, kind, opts = {}) {
  const tmp = archive + '.unpacked';
  const a = await openArchive(archive, tmp);
  try {
    const todo = plan(a.list, kind, opts);
    if (!todo.length) throw new Error(kind === 'ps2' ? 'There are no PNG or DDS textures in a replacements folder in this pack.' : 'This add-on is empty.');
    for (const t of todo) { const out = path.join(dest, t.to); if (!inside(dest, out)) throw new Error('Unsafe file path in the add-on.'); if (fs.existsSync(out)) throw new Error(`Something is already at ${t.to} in this folder, so nothing was installed. Remove it first.`); }
    const need = todo.reduce((s, t) => s + (t.e.size || 0), 0);
    const free = await fsp.statfs(fs.existsSync(dest) ? dest : path.dirname(dest)).then((st) => st.bavail * st.bsize).catch(() => Infinity);
    if (need > free) throw new Error(`Not enough space: it needs ${Math.ceil(need / 1e9)} GB.`);
    const written = [];
    try {
      for (const [i, t] of todo.entries()) {
        if (opts.signal?.aborted) throw new Error('aborted');
        const out = path.join(dest, t.to);
        await fsp.mkdir(path.dirname(out), { recursive: true });
        const rs = await t.e.read();
        await new Promise((ok, bad) => { const ws = fs.createWriteStream(out, { flags: 'wx' }); rs.on('error', bad); ws.on('error', bad); ws.on('finish', ok); rs.pipe(ws); });
        written.push(t.to);
        opts.onFile?.(i + 1, todo.length);
      }
    } catch (e) { await removeFiles(dest, written); throw e; }
    return { files: written, bytes: need };
  } finally { try { a.close(); } catch {} }
}
// only the files listed, then folders left empty, never above dest
async function removeFiles(dest, files) {
  const dirs = new Set();
  for (const rel of files || []) {
    const f = path.join(dest, rel);
    if (!inside(dest, f)) continue;
    await fsp.rm(f, { force: true });
    for (let d = path.dirname(f); inside(dest, d); d = path.dirname(d)) dirs.add(d);
  }
  for (const d of [...dirs].sort((a, b) => b.length - a.length)) { try { await fsp.rmdir(d); } catch {} }
}

module.exports = { sha256, join, plan, install, removeFiles, openArchive };
