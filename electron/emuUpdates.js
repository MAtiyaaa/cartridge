// Emulator updates from Cartridge (0.9.16; owner asked: check versions, update from one place).
// Owner-approved exception to "never downloads emulators": only an emulator the user already has,
// only when they press Update, and only from that emulator's own release channel:
// - Flatpak: `flatpak remote-ls --updates` / `flatpak update -y <id>`, user or system install as found
// - AppImage: the newest release on the emulator's own GitHub, written over the old file at the same
//   path (so Steam shortcuts keep working); the old copy stays until the new one is in place
// EmuDeck's script launchers update through EmuDeck; RetroArch cores through RetroArch.
const fs = require('fs');
const webFetch = require('./webFetch');
const path = require('path');
const { execFile } = require('child_process');

// emulator -> its GitHub releases and the Linux AppImage in them (x86_64)
const REPOS = {
  pcsx2: { repo: 'PCSX2/pcsx2', asset: /linux.*appimage.*x64.*\.AppImage$|x64.*\.AppImage$/i, pre: true },
  duckstation: { repo: 'stenzek/duckstation', tag: 'latest', asset: /^DuckStation-x64\.AppImage$/i },
  rpcs3: { repo: 'RPCS3/rpcs3-binaries-linux', asset: /linux64\.AppImage$/i },
  vita3k: { repo: 'Vita3K/Vita3K', tag: 'continuous', asset: /^Vita3K-x86_64\.AppImage$/i },
  azahar: { repo: 'azahar-emu/azahar', asset: /\.AppImage$/i },
  cemu: { repo: 'cemu-project/Cemu', asset: /x86_64\.AppImage$/i },
  xemu: { repo: 'xemu-project/xemu', asset: /x86_64\.AppImage$/i },
  ppsspp: { repo: 'hrydgard/ppsspp', asset: /x86_64\.AppImage$/i },
  // 0.9.17: the rest Cartridge can update itself (owner: no "updates through its own app")
  // 0.9.19: file names checked against the projects' own install scripts (EmuDeck reads the same releases):
  // shadPS4's launcher ships a linux-qt .zip with the AppImage inside; Eden and Ryujinx publish on their
  // own Forgejo servers first (git.eden-emu.org, git.ryujinx.app), GitHub second
  shadps4: { repo: 'shadps4-emu/shadps4-qtlauncher', asset: /linux-qt.*\.zip$|qt.?launcher.*\.AppImage$/i, zipped: /\.AppImage$/i, only: /qt.?launcher/i },
  // 0.9.21 (owner: "couldn't check"): Eden's server is git.eden-emu.dev; .org kept as the older name
  eden: { repo: 'eden-emulator/Releases', asset: /(amd64|x86_64|x64|steamdeck|rog).*\.AppImage$|linux.*\.AppImage$/i, forge: [['https://git.eden-emu.dev', 'eden-emu/eden'], ['https://git.eden-emu.org', 'eden-emu/eden']], first: 'forge' },
  ryujinx: { repo: 'Ryubing/Stable-Releases', asset: /x64.*\.AppImage$/i, forge: [['https://git.ryujinx.app', 'Ryubing/Stable'], ['https://git.ryujinx.app', 'ryubing/ryujinx']], first: 'forge' },
  flycast: { repo: 'flyinghead/flycast', asset: /x86_64\.AppImage$/i },
  mgba: { repo: 'mgba-emu/mgba', asset: /x64\.AppImage$|x86_64\.AppImage$/i },
  xeniaedge: { repo: 'has207/xenia-edge', asset: /\.AppImage$/i },
  // Xenia Canary (0.9.21, owner: "updates in the app", make it updatable): its builds are the release
  // files of xenia-canary-releases; the Linux one is a .tar.gz with the program inside, the Windows one
  // (run through Proton, as EmuDeck does) a .zip with xenia_canary.exe. Only that one file is replaced.
  xenia: { repo: 'xenia-canary/xenia-canary-releases', asset: /linux.*\.(tar\.gz|zip)$|\.AppImage$/i, zipped: /^xenia_canary(\.AppImage)?$|\.AppImage$/i },
  'xenia-win': { repo: 'xenia-canary/xenia-canary-releases', asset: /windows.*\.zip$/i, zipped: /^xenia_canary\.exe$/i },
};
// which release source a copy uses: Xenia Edge's AppImage has its own; a Windows build its own files
const specFor = (id, file = '') => (id === 'xenia' && /edge/i.test(path.basename(file)) ? REPOS.xeniaedge : id === 'xenia' && /\.exe$/i.test(file) ? REPOS['xenia-win'] : REPOS[id]);

function plainEnv() { const env = { ...process.env }; for (const k of ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'APPDIR', 'APPIMAGE', 'ARGV0', 'OWD']) delete env[k]; return env; }
const run = (cmd, args, timeout = 60000) => new Promise((resolve, reject) => execFile(cmd, args, { env: plainEnv(), timeout, maxBuffer: 8 << 20 }, (e, out, err) => (e ? reject(new Error(String(err || e.message).trim().split('\n').pop())) : resolve(String(out)))));

// version text from a tag or file name: v2.3.120 -> 2.3.120
const verOf = (s) => (String(s || '').match(/\d+(?:\.\d+){1,3}/) || [])[0] || '';
const cmpVer = (a, b) => { const x = verOf(a).split('.').map(Number), y = verOf(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };

// Flatpak: which of these app ids have an update, per installation
async function flatpakUpdates(ids) {
  const out = {};
  for (const where of ['--user', '--system']) {
    let t = ''; try { t = await run('flatpak', ['remote-ls', where, '--updates', '--app', '--columns=application,version']); } catch { continue; }
    for (const line of t.split('\n')) { const [id, version] = line.trim().split(/\t+|\s{2,}/); if (ids.includes(id)) out[id] = { version: version || '', where }; }
  }
  return out;
}
const flatpakUpdate = (id, where) => run('flatpak', ['update', where || '--user', '-y', '--noninteractive', id], 30 * 60e3);

// GitHub: the newest release's AppImage for one emulator (cached by the caller)
// a Forgejo/Gitea server's newest release (the same shape GitHub's API gives)
async function forgeRelease(host, repo, fetchImpl = require('./webFetch')) {
  const r = await fetchImpl(`${host}/api/v1/repos/${repo}/releases?limit=5`, { headers: { 'User-Agent': 'Cartridge', Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${new URL(host).host} answered ${r.status}`);
  const j = (await r.json()).find((x) => !x.draft && !x.prerelease) || null;
  return j && { tag: j.tag_name, date: j.published_at || j.created_at || '', assets: (j.assets || []).map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size || 0 })) };
}
// several builds in one release (Eden: amd64, Steam Deck...): the one whose name shares most words with the copy you have
const words = (n) => new Set(String(n).toLowerCase().replace(/\d+(\.\d+)*/g, ' ').split(/[^a-z]+/).filter((w) => w.length > 1));
function pickAsset(assets, re, file) {
  const ok = (assets || []).filter((a) => re.test(a.name) && !/arm|aarch64/i.test(a.name));
  if (!file || ok.length < 2) return ok[0];
  const mine = words(path.basename(file));
  return [...ok].sort((a, b) => [...words(b.name)].filter((w) => mine.has(w)).length - [...words(a.name)].filter((w) => mine.has(w)).length)[0];
}
async function latestRelease(id, { fetchImpl, spec, file } = {}) {
  const r = spec?.repo ? spec : specFor(id, file);
  if (!r) return null;
  // each source in turn (0.9.19): GitHub (its API, else its release pages when the API limit answers 403,
  // github.js) and the project's own Forgejo server; the first with a matching file wins
  const gh = () => require('./github').release(r.repo, { tag: r.tag, pre: r.pre, fetchImpl });
  const forges = (r.forge || []).map(([host, repo]) => () => forgeRelease(host, repo, fetchImpl));
  const tries = r.first === 'forge' ? [...forges, gh] : [gh, ...forges];
  let lastErr = null;
  for (const t of tries) {
    let rel = null; try { rel = await t(); } catch (e) { lastErr = e; continue; }
    const asset = pickAsset(rel?.assets, r.asset, file);
    if (asset) return { version: verOf(rel.tag) || verOf(asset.name), tag: rel.tag, name: asset.name, url: asset.url, size: asset.size, date: asset.date || rel.date, zipped: /\.(zip|tar\.gz|tgz)$/i.test(asset.name) ? r.zipped || /\.AppImage$/i : null };
  }
  if (lastErr) throw lastErr; // every source refused: say why
  return null;
}
// the AppImage inside a downloaded .zip (shadPS4's launcher ships one), written to dest
async function appImageFromZip(zipFile, dest, want = /\.AppImage$/i) {
  const yauzl = require('yauzl');
  await new Promise((resolve, reject) => yauzl.open(zipFile, { lazyEntries: true }, (err, z) => {
    if (err) return reject(err);
    let found = false;
    z.on('entry', (e) => {
      if (found || !want.test(e.fileName.split('/').pop())) return z.readEntry();
      found = true;
      z.openReadStream(e, (er, st) => { if (er) return reject(er); const ws = fs.createWriteStream(dest); st.on('error', reject); ws.on('error', reject); ws.on('finish', () => { z.close(); resolve(); }); st.pipe(ws); });
    });
    z.on('end', () => { if (!found) reject(new Error('There was no AppImage in the download.')); });
    z.on('error', reject);
    z.readEntry();
  }));
  fs.chmodSync(dest, 0o755);
}
// the program inside a downloaded .tar.gz (Xenia Canary's Linux build), through the system's tar
async function fileFromTar(tarFile, dest, want) {
  const dir = dest + '.d';
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  try {
    await run('tar', ['-xzf', tarFile, '-C', dir], 10 * 60e3);
    const all = []; const walk = (d) => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); if (fs.statSync(f).isDirectory()) walk(f); else all.push(f); } };
    walk(dir);
    const hit = all.find((f) => want.test(path.basename(f)));
    if (!hit) throw new Error('The program wasn’t in the download.');
    fs.copyFileSync(hit, dest); fs.chmodSync(dest, 0o755);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
// is the release newer than this AppImage? by version when both have one, else by date
function isNewer(rel, have) {
  if (!rel) return false;
  if (verOf(rel.version) && verOf(have.version)) return cmpVer(rel.version, have.version) > 0;
  const mt = (() => { try { return fs.statSync(have.path).mtimeMs; } catch { return 0; } })();
  return !!rel.date && Date.parse(rel.date) > mt + 3600e3;
}
// the new AppImage in place of the old one (same path); the old copy back on any failure
// The file keeps its name and place (owner, 0.9.19: an update must never rename an AppImage, or
// launch options and shortcuts pointing at it break); Cartridge records the new version itself.
async function replaceAppImage(file, rel, download) {
  const tmp = file + '.cartridge-new', old = file + '.cartridge-old';
  if (rel.zipped) { const z = file + '.cartridge-zip'; try { await download(rel.url, z); if (rel.size && fs.statSync(z).size !== rel.size) throw new Error('The download was incomplete. Try again.'); if (/\.(tar\.gz|tgz)$/i.test(rel.name || rel.url)) await fileFromTar(z, tmp, rel.zipped); else await appImageFromZip(z, tmp, rel.zipped); } finally { fs.rmSync(z, { force: true }); } }
  else await download(rel.url, tmp);
  if (!rel.zipped && rel.size && fs.statSync(tmp).size !== rel.size) { fs.rmSync(tmp, { force: true }); throw new Error('The download was incomplete. Try again.'); }
  fs.chmodSync(tmp, 0o755);
  fs.renameSync(file, old);
  try { fs.renameSync(tmp, file); } catch (e) { fs.renameSync(old, file); throw e; }
  fs.rmSync(old, { force: true });
  return true;
}

module.exports = { specFor, pickAsset, fileFromTar, forgeRelease, appImageFromZip, REPOS, verOf, cmpVer, flatpakUpdates, flatpakUpdate, latestRelease, isNewer, replaceAppImage };
