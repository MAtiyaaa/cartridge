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
    let contentType = null, flags = 0;
    if (metaOff && metaCount && metaCount < 64) {
      const m = Buffer.alloc(4096);
      const n = fs.readSync(fd, m, 0, m.length, metaOff);
      for (let i = 0, o = 0; i < metaCount && o + 8 <= n; i++) {
        const id = m.readUInt32BE(o), size = m.readUInt32BE(o + 4);
        if (size === 4 && o + 12 <= n) { if (id === 2) contentType = m.readUInt32BE(o + 8); if (id === 3) flags = m.readUInt32BE(o + 8); }
        o += 8 + size;
      }
    }
    return { file, contentId, titleId: SERIAL.test(titleId) ? titleId : null, platform, contentType, patch: !!(flags & 0x10) };
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

// Deleting a game from RPCS3's storage: only one Cartridge installed, and only when all of this
// holds (plan D3): recorded as created by Cartridge; the folder name is a serial and nothing else;
// its real path (links followed) sits directly in one of RPCS3's game folders; its own PARAM.SFO
// says the same serial. Returns { ok, dir } or { ok: false, why }.
function safeToRemove(rec, hdds) {
  if (!rec || rec.emu !== 'rpcs3' || !rec.created) return { ok: false, why: 'Cartridge didn’t install this game in RPCS3.' };
  if (!SERIAL.test(rec.serial || '') || path.basename(rec.dir || '') !== rec.serial) return { ok: false, why: 'The folder isn’t named after the game’s serial.' };
  let lst; try { lst = fs.lstatSync(rec.dir); } catch { return { ok: false, why: 'The game’s folder is gone.' }; }
  if (lst.isSymbolicLink() || !lst.isDirectory()) return { ok: false, why: 'The game’s folder is a link, not a folder.' };
  const dir = real(rec.dir);
  const games = hdds.map((h) => real(path.join(h, 'game')));
  if (!games.includes(path.dirname(dir)) || games.includes(dir)) return { ok: false, why: 'The folder isn’t inside RPCS3’s game folder.' };
  if (sfoSerial(dir) !== rec.serial) return { ok: false, why: 'The game’s PARAM.SFO is missing or names another game.' };
  return { ok: true, dir };
}

module.exports = { pkgInfo, packagesIn, rpcs3Hdds, sfoSerial, install, safeToRemove };
