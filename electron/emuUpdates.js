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
  shadps4: { repo: 'shadps4-emu/shadps4-qtlauncher', asset: /\.AppImage$/i, only: /qt.?launcher/i },
  eden: { repo: 'eden-emulator/Releases', asset: /\.AppImage$/i },
  ryujinx: { repo: 'Ryubing/Stable-Releases', asset: /x64.*\.AppImage$/i },
  flycast: { repo: 'flyinghead/flycast', asset: /x86_64\.AppImage$/i },
  mgba: { repo: 'mgba-emu/mgba', asset: /x64\.AppImage$|x86_64\.AppImage$/i },
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
async function latestRelease(id, { fetchImpl, spec } = {}) {
  const r = spec?.repo ? spec : REPOS[id];
  if (!r) return null;
  // the API first, the release pages when GitHub's API limit answers 403 (0.9.17, github.js)
  const rel = await require('./github').release(r.repo, { tag: r.tag, pre: r.pre, fetchImpl });
  const asset = (rel?.assets || []).find((a) => r.asset.test(a.name) && !/arm|aarch64/i.test(a.name));
  if (!asset) return null;
  return { version: verOf(rel.tag) || verOf(asset.name), tag: rel.tag, name: asset.name, url: asset.url, size: asset.size, date: asset.date || rel.date };
}
// is the release newer than this AppImage? by version when both have one, else by date
function isNewer(rel, have) {
  if (!rel) return false;
  if (verOf(rel.version) && verOf(have.version)) return cmpVer(rel.version, have.version) > 0;
  const mt = (() => { try { return fs.statSync(have.path).mtimeMs; } catch { return 0; } })();
  return !!rel.date && Date.parse(rel.date) > mt + 3600e3;
}
// the new AppImage in place of the old one (same path); the old copy back on any failure
async function replaceAppImage(file, rel, download) {
  const tmp = file + '.cartridge-new', old = file + '.cartridge-old';
  await download(rel.url, tmp);
  if (rel.size && fs.statSync(tmp).size !== rel.size) { fs.rmSync(tmp, { force: true }); throw new Error('The download was incomplete. Try again.'); }
  fs.chmodSync(tmp, 0o755);
  fs.renameSync(file, old);
  try { fs.renameSync(tmp, file); } catch (e) { fs.renameSync(old, file); throw e; }
  fs.rmSync(old, { force: true });
  return true;
}

module.exports = { REPOS, verOf, cmpVer, flatpakUpdates, flatpakUpdate, latestRelease, isNewer, replaceAppImage };
