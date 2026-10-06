// shadPS4 versions from Cartridge (0.9.23, owner: see which games run which version, add versions
// without opening shadPS4, pick one per game). Done the way shadPS4's Qt launcher does it, read from
// shadps4-qtlauncher (common/versions.cpp, common/path_util.cpp, qt_gui/version_dialog.cpp,
// qt_gui/gui_settings.cpp, main.cpp):
// - its folder is $XDG_DATA_HOME/shadPS4QtLauncher (else ~/.local/share/shadPS4QtLauncher);
// - versions.json there is an array of { name, path, date, codename, type } (type 0 release, 1 nightly,
//   2 custom), written with 4-space indents;
// - qt_ui.ini [version_manager] versionPath is where versions are unpacked (Cartridge falls back to the
//   launcher's own versions/ folder), versionSelected the default one (-d);
// - a release is the shadPS4 GitHub release's "linux-sdl" zip, unpacked into
//   "<versionPath>/<release name without 'shadps4 ' and 'codename '> - <date>" (a nightly into
//   "Pre-release"), whose program is Shadps4-sdl.AppImage; a nightly replaces the previous nightly;
// - a game is started with a given version through -e <name|path> (main.cpp), which Cartridge already
//   writes per game (steamManager withShadVersion).
const fs = require('fs');
const os = require('os');
const path = require('path');

const launcherDir = (home = os.homedir()) => path.join(process.env.XDG_DATA_HOME || path.join(home, '.local/share'), 'shadPS4QtLauncher');
const EXE = 'Shadps4-sdl.AppImage';

function iniValue(text, section, key) {
  let cur = '';
  for (const raw of String(text).split(/\r?\n/)) {
    const l = raw.trim();
    const m = /^\[(.+)\]$/.exec(l);
    if (m) { cur = m[1]; continue; }
    if (cur !== section) continue;
    const i = l.indexOf('=');
    if (i > 0 && l.slice(0, i).trim() === key) return l.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return '';
}
function settings(home) {
  const dir = launcherDir(home);
  let ini = ''; try { ini = fs.readFileSync(path.join(dir, 'qt_ui.ini'), 'utf8'); } catch {}
  const versionPath = iniValue(ini, 'version_manager', 'versionPath') || path.join(dir, 'versions');
  return { dir, versionPath, selected: iniValue(ini, 'version_manager', 'versionSelected') };
}
function readList(home) {
  try { const l = JSON.parse(fs.readFileSync(path.join(launcherDir(home), 'versions.json'), 'utf8')); return Array.isArray(l) ? l.filter((v) => v && typeof v === 'object') : []; } catch { return []; }
}
function writeList(list, home) {
  const f = path.join(launcherDir(home), 'versions.json');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = f + '.cartridge-new';
  fs.writeFileSync(tmp, JSON.stringify(list.map((v) => ({ name: v.name, path: v.path, date: v.date || 'never', codename: v.codename || '', type: Number(v.type) || 0 })), null, 4));
  fs.renameSync(tmp, f);
}
// what's installed: [{ name, path, date, codename, type, here, selected }]
function installed(home) {
  const s = settings(home);
  return readList(home).map((v) => ({ name: String(v.name || ''), path: String(v.path || ''), date: v.date || '', codename: v.codename || '', type: Number(v.type) || 0, here: !!v.path && fs.existsSync(v.path), selected: !!v.path && v.path === s.selected }));
}
// the launcher's folder name for a release (version_dialog.cpp)
function folderName(rel) {
  if (rel.prerelease) return 'Pre-release';
  const name = String(rel.name || rel.tag).replace(/^shadps4 /i, '').replace(/\bcodename\s+/gi, '');
  return `${name} - ${String(rel.date || '').slice(0, 10)}`;
}
const codenameOf = (rel) => { const m = / - codename (.+)$/i.exec(String(rel.name || '')); return m ? m[1].trim() : ''; };

// the releases on shadPS4's GitHub: [{ tag, name, date, prerelease, asset: { name, url, size } }]
async function available({ fetchImpl = require('./webFetch') } = {}) {
  const r = await fetchImpl('https://api.github.com/repos/shadps4-emu/shadPS4/releases?per_page=40', { headers: { 'User-Agent': 'Cartridge', Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(r.status === 403 ? 'GitHub is busy (its limit for this address). Try again in a while.' : `GitHub answered ${r.status}.`);
  const out = [];
  let nightly = false;
  for (const j of await r.json()) {
    if (j.draft) continue;
    const a = (j.assets || []).find((x) => /linux-sdl/i.test(x.name) && /\.zip$/i.test(x.name));
    if (!a) continue;
    if (j.prerelease) { if (nightly) continue; nightly = true; } // the launcher keeps one nightly
    out.push({ tag: j.tag_name, name: j.name || j.tag_name, date: j.published_at || '', prerelease: !!j.prerelease, asset: { name: a.name, url: a.browser_download_url, size: a.size || 0 } });
  }
  return out;
}
// unpack a downloaded release zip and add it to versions.json; returns the version entry
async function addRelease(rel, zipFile, home) {
  const s = settings(home);
  const dest = path.join(s.versionPath, folderName(rel));
  if (!path.resolve(dest).startsWith(path.resolve(s.versionPath) + path.sep)) throw new Error('That release name can’t be used as a folder.');
  const tmp = dest + '.cartridge-new';
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const yauzl = require('yauzl');
  await new Promise((resolve, reject) => yauzl.open(zipFile, { lazyEntries: true }, (err, z) => {
    if (err) return reject(err);
    z.on('entry', (e) => {
      const rel2 = e.fileName.replace(/\\/g, '/');
      if (rel2.endsWith('/')) return z.readEntry();
      const out = path.join(tmp, rel2);
      if (!path.resolve(out).startsWith(path.resolve(tmp) + path.sep)) return z.readEntry();
      fs.mkdirSync(path.dirname(out), { recursive: true });
      z.openReadStream(e, (er, st) => { if (er) return reject(er); const ws = fs.createWriteStream(out); st.on('error', reject); ws.on('error', reject); ws.on('finish', () => z.readEntry()); st.pipe(ws); });
    });
    z.on('end', resolve); z.on('error', reject);
    z.readEntry();
  }));
  // the program may sit one folder down in some zips
  let exe = path.join(tmp, EXE);
  if (!fs.existsSync(exe)) { const sub = fs.readdirSync(tmp).map((n) => path.join(tmp, n, EXE)).find((f) => fs.existsSync(f)); if (sub) exe = sub; }
  if (!fs.existsSync(exe)) { fs.rmSync(tmp, { recursive: true, force: true }); throw new Error(`The download had no ${EXE}.`); }
  fs.chmodSync(exe, 0o755);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(tmp, dest);
  const exePath = path.join(dest, path.relative(tmp, exe));
  const entry = { name: rel.prerelease ? 'Pre-release (Nightly)' : rel.tag, path: exePath.split(path.sep).join('/'), date: String(rel.date || '').slice(0, 10), codename: rel.prerelease ? '' : codenameOf(rel), type: rel.prerelease ? 1 : 0 };
  let list = readList(home).filter((v) => v.name !== entry.name && !(rel.prerelease && (Number(v.type) === 1 || /pre-release/i.test(v.name || ''))));
  list.push(entry);
  writeList(list, home);
  return entry;
}
// remove a version: its entry, and its folder only when it sits in the versions folder and isn't the default
function remove(name, home) {
  const s = settings(home);
  const list = readList(home), v = list.find((x) => x.name === name);
  if (!v) throw new Error('That version isn’t installed.');
  if (v.path && v.path === s.selected) throw new Error('This is shadPS4’s default version. Pick another default in shadPS4 first.');
  const dir = v.path ? path.dirname(v.path) : '';
  if (dir && path.resolve(dir).startsWith(path.resolve(s.versionPath) + path.sep) && path.resolve(dir) !== path.resolve(s.versionPath)) fs.rmSync(dir, { recursive: true, force: true });
  writeList(list.filter((x) => x !== v), home);
  return true;
}
// which shadPS4 actually ran last (0.9.24, owner: how can I be sure a game starts with the version I picked?):
// shadPS4 writes its version near the top of log/shad_log.txt in its user folder, the shared one or a version's
// own portable user/ folder. The newest log says the version, the game's ID and when.
function lastRun(home = os.homedir(), extra = []) {
  const data = process.env.XDG_DATA_HOME || path.join(home, '.local/share');
  const dirs = [path.join(data, 'shadPS4'), path.join(home, '.local/share/shadPS4'), path.join(home, '.var/app/net.shadps4.shadPS4/data/shadPS4'), ...extra];
  for (const v of installed(home)) if (v.path) dirs.push(path.join(path.dirname(v.path), 'user'));
  let best = null;
  for (const d of [...new Set(dirs)]) {
    const f = path.join(d, 'log', 'shad_log.txt');
    let st; try { st = fs.statSync(f); } catch { continue; }
    if (best && st.mtimeMs <= best.at) continue;
    let head = ''; try { const fd = fs.openSync(f, 'r'); const b = Buffer.alloc(65536); const n = fs.readSync(fd, b, 0, b.length, 0); fs.closeSync(fd); head = b.slice(0, n).toString('utf8'); } catch { continue; }
    const v = /shadps4[^\n]{0,80}?\bv?(\d+\.\d+\.\d+[\w.+-]*)/i.exec(head) || /Version[:\s]+v?(\d+\.\d+\.\d+[\w.+-]*)/i.exec(head);
    const g = /\b(CUSA\d{5}|PPSA\d{5}|PCJS\d{5}|PLJM\d{5})\b/.exec(head);
    best = { at: st.mtimeMs, version: v ? v[1] : '', serial: g ? g[1] : '', file: f, nightly: /nightly|pre-?release|\b[0-9a-f]{7,}\b/i.test((v && head.slice(v.index, v.index + 120)) || '') };
  }
  return best;
}
// the launcher's default version (qt_ui.ini [version_manager] versionSelected), set only when none is: the other
// lines of the file stay as they are (QSettings ini)
function setDefaultIfNone(exePath, home) {
  const f = path.join(launcherDir(home), 'qt_ui.ini');
  let ini = ''; try { ini = fs.readFileSync(f, 'utf8'); } catch {}
  if (iniValue(ini, 'version_manager', 'versionSelected')) return false;
  const lines = ini ? ini.split(/\r?\n/) : [];
  const at = lines.findIndex((l) => l.trim() === '[version_manager]');
  if (at >= 0) { const i = lines.findIndex((l, j) => j > at && /^versionSelected\s*=/.test(l.trim())); if (i >= 0) lines[i] = `versionSelected=${exePath}`; else lines.splice(at + 1, 0, `versionSelected=${exePath}`); }
  else { if (lines.length && lines[lines.length - 1] !== '') lines.push(''); lines.push('[version_manager]', `versionSelected=${exePath}`, ''); }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f + '.cartridge-new', lines.join('\n')); fs.renameSync(f + '.cartridge-new', f);
  return true;
}

module.exports = { setDefaultIfNone, lastRun, launcherDir, settings, installed, available, addRelease, remove, folderName, iniValue, EXE };
