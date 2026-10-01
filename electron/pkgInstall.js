'use strict';
// PS3 packages installed through RPCS3 (0.9.3 D1, D3, D6). Cartridge never unpacks a PS3 .pkg
// itself: RPCS3 does (`rpcs3 --headless --installpkg <file>`, rpcs3.cpp: no window, licences
// .rap/.edat copied into exdata). RPCS3 always exits 0, so what was installed is read back from
// its game folder. Games installed this way are recorded (installs.json); only those can ever be
// deleted from RPCS3's storage, and only after every check in safeToRemove passes.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const SERIAL = /^[A-Z]{4}\d{5}$/;
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const ls = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
const real = (p) => { try { return fs.realpathSync(p); } catch { return p; } };

// PKG header (RPCS3 Crypto/unpkg.h): magic 7F 'PKG', platform u16 at 6 (1 PS3, 2 PSP/Vita),
// metadata offset and count u32 at 8 and 12, content ID at 0x30 (UP9000-BCUS98137_00-...). RPCS3
// names the install folder after characters 7 to 15 of it. Metadata packets {id u32, size u32,
// data}: 2 content type (5 a game, 4 game data such as DLC and updates), 3 flags (0x10 a patch).
function pkgInfo(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const h = Buffer.alloc(0x60);
    if (fs.readSync(fd, h, 0, h.length, 0) < h.length || h.readUInt32BE(0) !== 0x7f504b47) return null;
    const platform = h.readUInt16BE(6), metaOff = h.readUInt32BE(8), metaCount = h.readUInt32BE(12);
    const contentId = h.toString('latin1', 0x30, 0x30 + 36).replace(/\0[\s\S]*$/, '');
    const titleId = contentId.slice(7, 16);
    let contentType = null, flags = 0, drm = null;
    if (metaOff && metaCount && metaCount < 64) {
      const m = Buffer.alloc(4096);
      const n = fs.readSync(fd, m, 0, m.length, metaOff);
      for (let i = 0, o = 0; i < metaCount && o + 8 <= n; i++) {
        const id = m.readUInt32BE(o), size = m.readUInt32BE(o + 4);
        if (size === 4 && o + 12 <= n) { if (id === 1) drm = m.readUInt32BE(o + 8); if (id === 2) contentType = m.readUInt32BE(o + 8); if (id === 3) flags = m.readUInt32BE(o + 8); }
        o += 8 + size;
      }
    }
    // DRM type 1 (network) and 2 (local) need a licence: <content ID>.rap in RPCS3's exdata
    return { file, contentId, titleId: SERIAL.test(titleId) ? titleId : null, platform, contentType, patch: !!(flags & 0x10), drm, needsRap: drm === 1 || drm === 2 };
  } catch { return null; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
}

// What a downloaded game holds for RPCS3: licences first (a game needing one won't install its
// data right without it), then the game itself, then DLC, then updates oldest first (by name:
// update packages carry their version, A0101-V0102).
function packagesIn(p) {
  const files = [];
  const walk = (d, depth) => { for (const n of ls(d).sort()) { const f = path.join(d, n); if (isDir(f)) { if (depth < 2) walk(f, depth + 1); } else files.push(f); } };
  if (isDir(p)) walk(p, 0); else files.push(p);
  const lic = files.filter((f) => /\.(rap|edat)$/i.test(f));
  const pkgs = files.filter((f) => /\.pkg$/i.test(f)).map(pkgInfo).filter((x) => x && x.platform === 1 && x.titleId);
  const rank = (x) => (x.patch ? 2 : x.contentType === 5 ? 0 : 1);
  pkgs.sort((a, b) => rank(a) - rank(b) || path.basename(a.file).localeCompare(path.basename(b.file), undefined, { numeric: true }));
  return { licences: lic, pkgs, order: [...lic, ...pkgs.map((x) => x.file)], titleIds: [...new Set(pkgs.map((x) => x.titleId))] };
}
// Licences. RPCS3 copies a .rap into exdata under the file's own name and, when booting, looks for
// exactly <content ID>.rap (main_window.cpp InstallFileInExData), so a .rap named anything else is
// as good as none ("Failed to decrypt content"). licencePlan says, for each package that needs
// one, where its licence comes from: already in RPCS3, in the download under its right name, a
// .rap to copy under the right name (the only unmatched one, for the only package missing one,
// or one you picked), or missing.
const exdataHas = (hdds, cid) => hdds.some((h) => ls(path.join(h, 'home')).some((u) => fs.existsSync(path.join(h, 'home', u, 'exdata', cid + '.rap'))));
function licencePlan(p, hdds, picked = {}) {
  const need = [...new Map(p.pkgs.filter((x) => x.needsRap).map((x) => [x.contentId, x])).values()];
  const raps = p.licences.filter((f) => /\.rap$/i.test(f));
  const named = new Map(raps.map((f) => [path.basename(f).replace(/\.rap$/i, '').toUpperCase(), f]));
  const out = need.map((x) => {
    if (picked[x.contentId]) return { contentId: x.contentId, titleId: x.titleId, from: 'picked', file: picked[x.contentId] };
    if (named.has(x.contentId.toUpperCase())) return { contentId: x.contentId, titleId: x.titleId, from: 'download', file: named.get(x.contentId.toUpperCase()) };
    if (exdataHas(hdds, x.contentId)) return { contentId: x.contentId, titleId: x.titleId, from: 'rpcs3' };
    return { contentId: x.contentId, titleId: x.titleId, from: 'missing' };
  });
  const loose = raps.filter((f) => !need.some((x) => x.contentId.toUpperCase() === path.basename(f).replace(/\.rap$/i, '').toUpperCase()));
  const missing = out.filter((x) => x.from === 'missing');
  if (missing.length === 1 && loose.length === 1) Object.assign(missing[0], { from: 'renamed', file: loose[0] });
  return out;
}
// An installed PSN game's content ID and whether it needs a licence, from its EBOOT.BIN's NPD
// header ("NPD\0", version, licence 1 network / 2 local / 3 free, type, content ID at +16)
function npdOf(gameDir) {
  let fd;
  try {
    fd = fs.openSync(path.join(gameDir, 'USRDIR', 'EBOOT.BIN'), 'r');
    const b = Buffer.alloc(8192); const n = fs.readSync(fd, b, 0, b.length, 0);
    const i = b.subarray(0, n).indexOf(Buffer.from('NPD\0', 'latin1'));
    if (i < 0 || i + 0x40 > n) return null;
    const licence = b.readInt32BE(i + 8), contentId = b.toString('latin1', i + 16, i + 16 + 36).replace(/\0[\s\S]*$/, '');
    return /^[A-Z]{2}\d{4}-[A-Z]{4}\d{5}_\d\d-/.test(contentId) ? { contentId, needsRap: licence === 1 || licence === 2 } : null;
  } catch { return null; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
}
// .rap files to hand RPCS3, each under its right name (copied into a temporary folder when renamed)
function stageLicences(plan, tmpDir) {
  const files = [];
  for (const l of plan) {
    if (l.from === 'download') files.push(l.file);
    else if (l.from === 'renamed' || l.from === 'picked') {
      fs.mkdirSync(tmpDir, { recursive: true });
      const to = path.join(tmpDir, l.contentId + '.rap');
      fs.copyFileSync(l.file, to);
      files.push(to);
    }
  }
  return files;
}

// RPCS3's dev_hdd0 folders, found the same way as its trophies (trophies.js): its vfs.yml first
// (dev_hdd0 can be moved anywhere), else next to its config; EmuDeck keeps it in storage/rpcs3.
function rpcs3Hdds(home = os.homedir(), emulationRoots = []) {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  const out = [];
  for (const cd of [path.join(xdg, 'rpcs3'), path.join(home, '.var/app/net.rpcs3.RPCS3/config/rpcs3')]) {
    if (!isDir(cd)) continue;
    let hdd = path.join(cd, 'dev_hdd0');
    for (const vf of [path.join(cd, 'config', 'vfs.yml'), path.join(cd, 'vfs.yml')]) {
      let t = ''; try { t = fs.readFileSync(vf, 'utf8'); } catch { continue; }
      const m = t.match(/^\s*\/dev_hdd0\/\s*:\s*(.+?)\s*$/m);
      if (m) { hdd = m[1].replace(/^["']|["']$/g, '').replace('$(EmulatorDir)', cd + '/'); break; }
    }
    out.push(hdd);
  }
  for (const r of emulationRoots) out.push(path.join(r, 'storage', 'rpcs3', 'dev_hdd0'));
  const seen = new Set();
  return out.filter((h) => isDir(path.join(h, 'game')) && !seen.has(real(h)) && seen.add(real(h)));
}
const gamesIn = (hdds) => new Map(hdds.flatMap((h) => ls(path.join(h, 'game')).map((n) => [path.join(h, 'game', n), n])));
// the serial a game folder's PARAM.SFO says (TITLE_ID), or null
function sfoSerial(dir) {
  try { const m = fs.readFileSync(path.join(dir, 'PARAM.SFO')).toString('latin1').match(/[A-Z]{4}\d{5}/); return m ? m[0] : null; } catch { return null; }
}

// Runs RPCS3 once per file, in order. cmd: { exe, args } (args: what goes before RPCS3's own
// options, `run net.rpcs3.RPCS3` for the Flatpak). onStep({ step, of, file }). Returns the games
// found afterwards: [{ serial, dir, created }].
async function install({ cmd, hdds, files, titleIds, onStep = () => {}, signal }) {
  const before = gamesIn(hdds);
  const env = { ...process.env };
  for (const k of ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'APPDIR', 'APPIMAGE', 'ARGV0', 'OWD']) delete env[k]; // Cartridge's own AppImage, not RPCS3's
  const t0 = Date.now();
  for (const [i, f] of files.entries()) {
    if (signal?.aborted) throw new Error('Cancelled');
    onStep({ step: i + 1, of: files.length, file: path.basename(f) });
    await new Promise((resolve, reject) => {
      const p = spawn(cmd.exe, [...cmd.args, '--headless', '--installpkg', f], { env, stdio: 'ignore' });
      const kill = () => { try { p.kill(); } catch {} };
      const timer = setTimeout(kill, 60 * 60e3);
      signal?.addEventListener('abort', kill, { once: true });
      p.on('error', (e) => { clearTimeout(timer); reject(new Error(`RPCS3 didn't start: ${e.message}`)); });
      p.on('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
  // what is there now for each title ID: created by this install, or updated (PARAM.SFO newer)
  const after = gamesIn(hdds);
  const out = [];
  for (const id of titleIds) {
    const dir = [...after].find(([d, n]) => n === id && sfoSerial(d) === id)?.[0];
    if (!dir) continue;
    const created = ![...before.values()].includes(id);
    let touched = created;
    try { touched ||= fs.statSync(path.join(dir, 'PARAM.SFO')).mtimeMs >= t0 - 2000 || newestIn(dir) >= t0 - 2000; } catch {}
    out.push({ serial: id, dir, created, touched });
  }
  return out;
}
function newestIn(dir) { let t = 0; for (const n of ls(dir)) { try { t = Math.max(t, fs.statSync(path.join(dir, n)).mtimeMs); } catch {} } return t; }

// ---------------------------------------------------------------- Vita through Vita3K (D2)
// Vita3K (main.cpp, config.cpp): `--pkg <file> --zrif <key>` installs with no window and quits;
// a .vpk or .zip given as the game installs it, then opens Vita3K and starts it, so Cartridge
// waits for Vita3K to close. Its own --deleted-id is never used: it deletes saves too.
const VITA_ID = /^PCS[A-Z]\d{5}$/;
// Vita3K's pref path (where ux0 lives): its config.yml "pref-path", else its default, EmuDeck's storage
function vitaPrefs(home = os.homedir(), emulationRoots = []) {
  const out = [];
  for (const c of [path.join(home, '.config/Vita3K/config.yml'), path.join(home, '.local/share/Vita3K/Vita3K/config.yml')]) {
    try { const m = fs.readFileSync(c, 'utf8').match(/^pref-path:\s*(.+)$/m); const v = m && m[1].trim().replace(/^['"]|['"]$/g, ''); if (v) out.push(v); } catch {}
  }
  out.push(path.join(home, '.local/share/Vita3K/Vita3K'), path.join(home, '.local/share/Vita3K'), ...emulationRoots.map((r) => path.join(r, 'storage/Vita3K')));
  const seen = new Set();
  return out.filter((p) => isDir(path.join(p, 'ux0')) && !seen.has(real(p)) && seen.add(real(p)));
}
// the title ID in a Vita game's sce_sys/param.sfo (inside a .vpk/.zip, read with yauzl)
function zipTitleId(file) {
  return new Promise((resolve) => {
    let yauzl; try { yauzl = require('yauzl'); } catch { return resolve(null); }
    yauzl.open(file, { lazyEntries: true }, (err, zip) => {
      if (err) return resolve(null);
      let done = false;
      const end = (v) => { if (!done) { done = true; try { zip.close(); } catch {} resolve(v); } };
      zip.on('entry', (e) => {
        if (!/(^|\/)sce_sys\/param\.sfo$/i.test(e.fileName) || e.uncompressedSize > 1 << 20) return zip.readEntry();
        zip.openReadStream(e, (er, st) => {
          if (er) return end(null);
          const parts = []; st.on('data', (d) => parts.push(d));
          st.on('end', () => end((Buffer.concat(parts).toString('latin1').match(/PCS[A-Z]\d{5}/) || [])[0] || null));
          st.on('error', () => end(null));
        });
      });
      zip.on('end', () => end(null)); zip.on('error', () => end(null));
      zip.readEntry();
    });
  });
}
// A zRIF (the key a Vita .pkg needs, base64 starting KO5i) from a small text file that came with it
function findZrif(files) {
  for (const f of files.filter((x) => /\.(zrif|txt|tsv|rif64)$/i.test(x))) {
    try { if (fs.statSync(f).size > 256 * 1024) continue; const m = fs.readFileSync(f, 'latin1').match(/KO5i[0-9A-Za-z+/=]{40,}/); if (m) return m[0]; } catch {}
  }
  return null;
}
// What a downloaded Vita game holds: { kind: 'pkg' | 'vpk', file, titleId, zrif }, or null
async function vitaContent(p) {
  const files = [];
  const walk = (d, depth) => { for (const n of ls(d).sort()) { const f = path.join(d, n); if (isDir(f)) { if (depth < 2) walk(f, depth + 1); } else files.push(f); } };
  if (isDir(p)) walk(p, 0); else files.push(p);
  const pkg = files.map((f) => (/\.pkg$/i.test(f) ? pkgInfo(f) : null)).find((x) => x && x.platform === 2 && VITA_ID.test(x.contentId.slice(7, 16)));
  if (pkg) return { kind: 'pkg', file: pkg.file, titleId: pkg.contentId.slice(7, 16), zrif: findZrif(files) };
  for (const f of files.filter((x) => /\.(vpk|zip)$/i.test(x))) { const id = await zipTitleId(f); if (id) return { kind: 'vpk', file: f, titleId: id, zrif: null }; }
  return null;
}
const appsIn = (prefs) => new Map(prefs.flatMap((p) => ls(path.join(p, 'ux0/app')).map((n) => [path.join(p, 'ux0/app', n), n])));
const vitaSfoId = (dir) => { try { return (fs.readFileSync(path.join(dir, 'sce_sys/param.sfo')).toString('latin1').match(/PCS[A-Z]\d{5}/) || [])[0] || null; } catch { return null; } };
// A Vita game needs its licence to start: work.bin inside the game (NoNpDrm .vpk), or a .rif that
// a .pkg install with its zRIF puts in ux0/license/<title ID>. Homebrew (not PCS...) needs none.
function vitaLicenced(pref, id, dir) {
  if (!VITA_ID.test(id)) return true;
  if (fs.existsSync(path.join(dir, 'sce_sys/package/work.bin'))) return true;
  return ls(path.join(pref, 'ux0/license', id)).some((n) => /\.rif$/i.test(n)) || ls(path.join(pref, 'ux0/license/app', id)).some((n) => /\.rif$/i.test(n));
}
// Runs Vita3K for one game; returns [{ serial, dir, created }] for what is in ux0/app afterwards
async function installVita({ cmd, prefs, item, zrif, onStep = () => {}, signal }) {
  const before = appsIn(prefs);
  const env = { ...process.env };
  for (const k of ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'APPDIR', 'APPIMAGE', 'ARGV0', 'OWD']) delete env[k];
  const args = item.kind === 'pkg' ? ['--pkg', item.file, '--zrif', zrif || item.zrif] : [item.file];
  onStep({ step: 1, of: 1, file: path.basename(item.file), opens: item.kind !== 'pkg' });
  await new Promise((resolve, reject) => {
    const p = spawn(cmd.exe, [...cmd.args, ...args], { env, stdio: 'ignore' });
    const kill = () => { try { p.kill(); } catch {} };
    const timer = setTimeout(kill, 3 * 60 * 60e3);
    signal?.addEventListener('abort', kill, { once: true });
    p.on('error', (e) => { clearTimeout(timer); reject(new Error(`Vita3K didn't start: ${e.message}`)); });
    p.on('exit', () => { clearTimeout(timer); resolve(); });
  });
  const dir = [...appsIn(prefs)].find(([d, n]) => n === item.titleId && vitaSfoId(d) === item.titleId)?.[0];
  if (!dir) return [];
  const pref = prefs.find((p) => dir.startsWith(path.join(p, 'ux0/app') + path.sep)) || prefs[0];
  return [{ serial: item.titleId, dir, created: ![...before.values()].includes(item.titleId), licenced: vitaLicenced(pref, item.titleId, dir) }];
}

// Deleting a game from an emulator's storage: only one Cartridge installed, and only when all of
// this holds (plan D3): recorded as created by Cartridge; the folder name is a serial and nothing
// else; its real path (links followed) sits directly in the emulator's game folder (RPCS3
// dev_hdd0/game, Vita3K ux0/app); the game's own PARAM.SFO says the same serial. roots: RPCS3's
// dev_hdd0 folders or Vita3K's pref paths. Returns { ok, dir } or { ok: false, why }.
const RULES = {
  rpcs3: { name: 'RPCS3', id: SERIAL, games: (r) => path.join(r, 'game'), serialOf: sfoSerial },
  vita3k: { name: 'Vita3K', id: VITA_ID, games: (r) => path.join(r, 'ux0/app'), serialOf: vitaSfoId },
};
function safeToRemove(rec, roots) {
  const R = RULES[rec?.emu];
  if (!R || !rec.created) return { ok: false, why: `Cartridge didn’t install this game${R ? ' in ' + R.name : ''}.` };
  if (!R.id.test(rec.serial || '') || path.basename(rec.dir || '') !== rec.serial) return { ok: false, why: 'The folder isn’t named after the game’s serial.' };
  let lst; try { lst = fs.lstatSync(rec.dir); } catch { return { ok: false, why: 'The game’s folder is gone.' }; }
  if (lst.isSymbolicLink() || !lst.isDirectory()) return { ok: false, why: 'The game’s folder is a link, not a folder.' };
  const dir = real(rec.dir);
  const games = roots.map((r) => real(R.games(r)));
  if (!games.includes(path.dirname(dir)) || games.includes(dir)) return { ok: false, why: `The folder isn’t inside ${R.name}’s game folder.` };
  if (R.serialOf(dir) !== rec.serial) return { ok: false, why: 'The game’s PARAM.SFO is missing or names another game.' };
  return { ok: true, dir };
}

module.exports = { pkgInfo, packagesIn, licencePlan, stageLicences, exdataHas, npdOf, rpcs3Hdds, sfoSerial, install, vitaPrefs, vitaContent, findZrif, installVita, safeToRemove };
