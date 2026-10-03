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
  eden: { repo: 'eden-emulator/Releases', asset: /(amd64|x86_64|x64).*\.AppImage$|linux.*\.AppImage$/i, forge: [['https://git.eden-emu.org', 'eden-emu/eden'], ['https://git.eden-emu.org', 'Eden/Eden']] },
  ryujinx: { repo: 'Ryubing/Stable-Releases', asset: /x64.*\.AppImage$/i, forge: [['https://git.ryujinx.app', 'Ryubing/Stable'], ['https://git.ryujinx.app', 'ryubing/ryujinx']], first: 'forge' },
  flycast: { repo: 'flyinghead/flycast', asset: /x86_64\.AppImage$/i },
  mgba: { repo: 'mgba-emu/mgba', asset: /x64\.AppImage$|x86_64\.AppImage$/i },
  xeniaedge: { repo: 'has207/xenia-edge', asset: /\.AppImage$/i },
};

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
async function latestRelease(id, { fetchImpl, spec } = {}) {
  const r = spec?.repo ? spec : REPOS[id];
  if (!r) return null;
  // each source in turn (0.9.19): GitHub (its API, else its release pages when the API limit answers 403,
  // github.js) and the project's own Forgejo server; the first with a matching file wins
  const gh = () => require('./github').release(r.repo, { tag: r.tag, pre: r.pre, fetchImpl });
  const forges = (r.forge || []).map(([host, repo]) => () => forgeRelease(host, repo, fetchImpl));
  const tries = r.first === 'forge' ? [...forges, gh] : [gh, ...forges];
  let lastErr = null;
  for (const t of tries) {
    let rel = null; try { rel = await t(); } catch (e) { lastErr = e; continue; }
    const asset = (rel?.assets || []).find((a) => r.asset.test(a.name) && !/arm|aarch64/i.test(a.name));
    if (asset) return { version: verOf(rel.tag) || verOf(asset.name), tag: rel.tag, name: asset.name, url: asset.url, size: asset.size, date: asset.date || rel.date, zipped: /\.zip$/i.test(asset.name) ? r.zipped || /\.AppImage$/i : null };
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
  if (rel.zipped) { const z = file + '.cartridge-zip'; try { await download(rel.url, z); if (rel.size && fs.statSync(z).size !== rel.size) throw new Error('The download was incomplete. Try again.'); await appImageFromZip(z, tmp, rel.zipped); } finally { fs.rmSync(z, { force: true }); } }
  else await download(rel.url, tmp);
  if (!rel.zipped && rel.size && fs.statSync(tmp).size !== rel.size) { fs.rmSync(tmp, { force: true }); throw new Error('The download was incomplete. Try again.'); }
  fs.chmodSync(tmp, 0o755);
  fs.renameSync(file, old);
  try { fs.renameSync(tmp, file); } catch (e) { fs.renameSync(old, file); throw e; }
  fs.rmSync(old, { force: true });
  return true;
}

module.exports = { forgeRelease, appImageFromZip, REPOS, verOf, cmpVer, flatpakUpdates, flatpakUpdate, latestRelease, isNewer, replaceAppImage };
