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

// console -> emulators: EMU ids (emulators.js), with where they come from. 0.9.19: checked against
// EmuDeck's install scripts (the same releases): Flycast, RMG, ares, MAME, Supermodel, ScummVM, Xemu
// come from Flathub as EmuDeck installs them; an AppImage that can't be found falls back to the
// emulator's Flatpak (fp) when it has one. name: the AppImage's file name, kept for good (updates
// replace it in place), the names EmuDeck and ES-DE look for.
const GH = (id, name, extra = {}) => ({ id, how: 'appimage', name, ...REPOS[id], ...extra });
const FP = (id, fp) => ({ id, how: 'flatpak', fp });
const MORE = {
  rmg: { repo: 'Rosalie241/RMG', asset: /x86_64\.AppImage$|\.AppImage$/i },
};
const CATALOG = [
  { key: 'psx', name: 'PlayStation', emus: [GH('duckstation', 'DuckStation.AppImage'), FP('retroarch', 'org.libretro.RetroArch')] },
  { key: 'ps2', name: 'PlayStation 2', emus: [GH('pcsx2', 'pcsx2-Qt.AppImage', { fp: 'net.pcsx2.PCSX2' })] },
  { key: 'ps3', name: 'PlayStation 3', emus: [GH('rpcs3', 'rpcs3.AppImage', { fp: 'net.rpcs3.RPCS3' })] },
  { key: 'ps4', name: 'PlayStation 4', emus: [GH('shadps4', 'Shadps4-qt.AppImage')] },
  { key: 'psp', name: 'PSP', emus: [FP('ppsspp', 'org.ppsspp.PPSSPP')] },
  { key: 'psvita', name: 'PS Vita', emus: [GH('vita3k', 'Vita3K.AppImage')] },
  { key: 'gc', name: 'GameCube and Wii', emus: [FP('dolphin', 'org.DolphinEmu.dolphin-emu'), FP('primehack', 'io.github.shiiion.primehack')] },
  { key: 'wiiu', name: 'Wii U', emus: [GH('cemu', 'Cemu.AppImage', { fp: 'info.cemu.Cemu' })] },
  { key: 'switch', name: 'Switch', emus: [GH('eden', 'Eden.AppImage', { fp: 'dev.eden_emu.eden' }), GH('ryujinx', 'Ryujinx.AppImage', { fp: 'io.github.ryubing.Ryujinx' })] },
  { key: 'n3ds', name: 'Nintendo 3DS', emus: [GH('azahar', 'azahar.AppImage', { fp: 'org.azahar_emu.Azahar' })] },
  { key: 'nds', name: 'Nintendo DS', emus: [FP('melonds', 'net.kuribo64.melonDS')] },
  { key: 'gba', name: 'Game Boy Advance', emus: [GH('mgba', 'mGBA.AppImage', { fp: 'io.mgba.mGBA' })] },
  { key: 'n64', name: 'Nintendo 64', emus: [FP('rmg', 'com.github.Rosalie241.RMG'), FP('ares', 'dev.ares.ares')] },
  { key: 'xbox', name: 'Xbox', emus: [FP('xemu', 'app.xemu.xemu')] },
  // 0.9.21 (owner: Xenia installed but listed as Xenia Edge not installed): Xenia Canary first, Edge as the other
  { key: 'xbox360', name: 'Xbox 360', emus: [GH('xenia', 'xenia_canary', { binary: true }), GH('xeniaedge', 'xenia_edge.AppImage')] },
  { key: 'dreamcast', name: 'Dreamcast', emus: [FP('flycast', 'org.flycast.Flycast')] },
  { key: 'saturn', name: 'Saturn', emus: [FP('ares', 'dev.ares.ares'), FP('retroarch', 'org.libretro.RetroArch')] },
  { key: 'arcade', name: 'Arcade', emus: [FP('mame', 'org.mamedev.MAME'), FP('supermodel', 'com.supermodel3.Supermodel')] },
  { key: 'scummvm', name: 'ScummVM', emus: [FP('scummvm', 'org.scummvm.ScummVM')] },
  { key: 'retro', name: 'Retro consoles (NES to N64, Mega Drive, PC Engine and more)', emus: [FP('retroarch', 'org.libretro.RetroArch'), FP('ares', 'dev.ares.ares')] },
];
let appsDir = null; // set from config: <drive>/Emulation/emulators when the user picked a drive (0.9.17)
// ES-DE's console folder names, for the Emulation folder Cartridge makes on the drive the user picks
const ESDE = ['3do', 'arcade', 'atari2600', 'dreamcast', 'gamecube', 'gb', 'gba', 'gbc', 'genesis', 'mastersystem', 'megacd', 'n3ds', 'n64', 'nds', 'neogeo', 'nes', 'pcengine', 'ps2', 'ps3', 'ps4', 'psp', 'psvita', 'psx', 'saturn', 'segacd', 'snes', 'switch', 'wii', 'wiiu', 'xbox', 'xbox360'];
const APPS = () => appsDir || path.join(os.homedir(), 'Applications');
const setAppsDir = (d) => { appsDir = d || null; };
function plainEnv() { const env = { ...process.env }; for (const k of ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'APPDIR', 'APPIMAGE', 'ARGV0', 'OWD']) delete env[k]; return env; }
const hasFlatpak = () => { try { execFileSync('sh', ['-c', 'command -v flatpak'], { stdio: 'ignore', env: plainEnv() }); return true; } catch { return false; } };

// the newest AppImage of one emulator (GitHub API, as Updates reads it)
async function release(e, opts) {
  const r = await latestRelease(e.id, { ...opts, spec: { repo: e.repo, asset: e.asset, tag: e.tag, pre: e.pre, forge: e.forge, first: e.first, zipped: e.zipped } });
  // (Xenia Canary's Linux build is a .tar.gz with the program in it, not an AppImage)
  if (!r) throw new Error(`No Linux build in ${e.repo}'s newest release.`);
  return r;
}
// AppImage into the emulators folder (~/Applications unless a drive was picked) under its lasting name
// (0.9.19: never the release's versioned name, which an update would leave out of date); never over a
// file that's there
async function getAppImage(e, download, opts = {}) {
  const rel = await release(e, opts);
  const name = String(e.name || rel.name).replace(/[\\/]/g, '_');
  const dest = path.join(APPS(), e.binary || /\.AppImage$/i.test(name) ? name : name + '.AppImage'); // binary: a plain program (Xenia Canary's Linux build)
  if (fs.existsSync(dest)) return { path: dest, version: rel.version, already: true };
  fs.mkdirSync(APPS(), { recursive: true });
  const tmp = dest + '.cartridge-new';
  if (rel.zipped) {
    const z = dest + '.cartridge-zip';
    const U = require('./emuUpdates');
    try { await download(rel.url, z, rel.size); if (/\.(tar\.gz|tgz)$/i.test(rel.name || rel.url)) await U.fileFromTar(z, tmp, rel.zipped); else await U.appImageFromZip(z, tmp, rel.zipped); } finally { fs.rmSync(z, { force: true }); }
  } else {
    await download(rel.url, tmp, rel.size);
    if (rel.size && fs.statSync(tmp).size !== rel.size) { fs.rmSync(tmp, { force: true }); throw new Error('The download was incomplete. Try again.'); }
  }
  // never put a broken download in place (0.9.24): an AppImage must be one, a program a real program
  if (!require('./emuUpdates').looksRunnable(tmp, rel.name || name)) { fs.rmSync(tmp, { force: true }); throw new Error('What came down wasn’t a working program. Try again later.'); }
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

module.exports = { CATALOG, MORE, APPS, setAppsDir, ESDE, getAppImage, getFlatpak, release, hasFlatpak };
