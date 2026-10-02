// Pick your own emulators (0.9.17, owner: a third choice next to EmuDeck and RetroDECK, also in
// Settings → Emulators). Owner-approved exception to "never downloads emulators": only what the user
// picks, only from the emulator's own GitHub releases (its Linux AppImage, into ~/Applications, where
// EmuDeck keeps them and Cartridge already looks) or, for emulators without an AppImage, its Flathub
// Flatpak installed for this user. Nothing is installed without a press.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');
const { REPOS, latestRelease } = require('./emuUpdates');

// console -> emulators: EMU ids (emulators.js), with where they come from
const GH = (id, extra = {}) => ({ id, how: 'appimage', ...REPOS[id], ...extra });
const FP = (id, fp) => ({ id, how: 'flatpak', fp });
const MORE = {
  shadps4: { repo: 'shadps4-emu/shadps4-qtlauncher', asset: /\.AppImage$/i },
  eden: { repo: 'eden-emulator/Releases', asset: /\.AppImage$/i },
  ryujinx: { repo: 'Ryubing/Stable-Releases', asset: /x64.*\.AppImage$/i },
  flycast: { repo: 'flyinghead/flycast', asset: /x86_64\.AppImage$/i },
};
const CATALOG = [
  { key: 'psx', name: 'PlayStation', emus: [GH('duckstation'), FP('retroarch', 'org.libretro.RetroArch')] },
  { key: 'ps2', name: 'PlayStation 2', emus: [GH('pcsx2')] },
  { key: 'ps3', name: 'PlayStation 3', emus: [GH('rpcs3')] },
  { key: 'ps4', name: 'PlayStation 4', emus: [GH('shadps4', MORE.shadps4)] },
  { key: 'psp', name: 'PSP', emus: [FP('ppsspp', 'org.ppsspp.PPSSPP')] },
  { key: 'psvita', name: 'PS Vita', emus: [GH('vita3k')] },
  { key: 'gc', name: 'GameCube and Wii', emus: [FP('dolphin', 'org.DolphinEmu.dolphin-emu')] },
  { key: 'wiiu', name: 'Wii U', emus: [GH('cemu')] },
  { key: 'switch', name: 'Switch', emus: [GH('eden', MORE.eden), GH('ryujinx', MORE.ryujinx)] },
  { key: 'n3ds', name: 'Nintendo 3DS', emus: [GH('azahar')] },
  { key: 'nds', name: 'Nintendo DS', emus: [FP('melonds', 'net.kuribo64.melonDS')] },
  { key: 'xbox', name: 'Xbox', emus: [GH('xemu')] },
  { key: 'dreamcast', name: 'Dreamcast', emus: [GH('flycast', MORE.flycast)] },
  { key: 'retro', name: 'Retro consoles (NES to N64, Mega Drive, Saturn and more)', emus: [FP('retroarch', 'org.libretro.RetroArch')] },
];
const APPS = () => path.join(os.homedir(), 'Applications');
function plainEnv() { const env = { ...process.env }; for (const k of ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'APPDIR', 'APPIMAGE', 'ARGV0', 'OWD']) delete env[k]; return env; }
const hasFlatpak = () => { try { execFileSync('sh', ['-c', 'command -v flatpak'], { stdio: 'ignore', env: plainEnv() }); return true; } catch { return false; } };

// the newest AppImage of one emulator (GitHub API, as Updates reads it)
async function release(e, opts) {
  const r = await latestRelease(e.id, { ...opts, spec: { repo: e.repo, asset: e.asset, tag: e.tag, pre: e.pre } });
  if (!r) throw new Error(`No Linux AppImage in ${e.repo}'s newest release.`);
  return r;
}
// AppImage into ~/Applications under its release name (never over a file that's there)
async function getAppImage(e, download, opts = {}) {
  const rel = await release(e, opts);
  const name = rel.name.replace(/[\\/]/g, '_');
  const dest = path.join(APPS(), /\.AppImage$/i.test(name) ? name : name + '.AppImage');
  if (fs.existsSync(dest)) return { path: dest, version: rel.version, already: true };
  fs.mkdirSync(APPS(), { recursive: true });
  const tmp = dest + '.cartridge-new';
  await download(rel.url, tmp, rel.size);
  if (rel.size && fs.statSync(tmp).size !== rel.size) { fs.rmSync(tmp, { force: true }); throw new Error('The download was incomplete. Try again.'); }
  fs.chmodSync(tmp, 0o755); fs.renameSync(tmp, dest);
  return { path: dest, version: rel.version };
}
// a Flatpak from Flathub for this user (no password); flatpak prints "NN%" as it goes
function getFlatpak(fp, onProgress = () => {}) {
  if (!hasFlatpak()) return Promise.reject(new Error("Flatpak isn't installed on this system."));
  return new Promise((resolve, reject) => {
    try { execFileSync('flatpak', ['remote-add', '--user', '--if-not-exists', 'flathub', 'https://dl.flathub.org/repo/flathub.flatpakrepo'], { stdio: 'ignore', env: plainEnv(), timeout: 60000 }); } catch {}
    const p = spawn('flatpak', ['install', '--user', '-y', '--noninteractive', 'flathub', fp], { env: plainEnv() });
    let tail = '';
    const read = (b) => { const s = String(b); tail = (tail + s).slice(-2000); const all = [...s.matchAll(/(\d{1,3})%/g)]; if (all.length) onProgress(Math.min(100, Number(all[all.length - 1][1]))); };
    p.stdout.on('data', read); p.stderr.on('data', read);
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve({ fp }) : reject(new Error(`It didn't install: ${(tail.trim().split('\n').pop() || 'flatpak failed').slice(0, 200)}`))));
  });
}

module.exports = { CATALOG, MORE, APPS, getAppImage, getFlatpak, release };
