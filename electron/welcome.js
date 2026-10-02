// The welcome's "Get your emulators" step (0.9.15 onboarding). Owner-approved exception to "never
// downloads emulators": only when the user picks it, Cartridge fetches EmuDeck's official app the way
// EmuDeck's own install.sh does (latest emudeck-electron release, ~/Applications/EmuDeck.AppImage,
// chmod +x, run it), or installs RetroDECK from Flathub for this user. EmuDeck or RetroDECK then
// install the emulators; Cartridge never installs one itself.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');

const EMUDECK_API = 'https://api.github.com/repos/EmuDeck/emudeck-electron/releases/latest';
const RETRODECK = 'net.retrodeck.retrodeck';

// a child that isn't ours: none of Cartridge's AppImage or Steam runtime variables
function plainEnv() {
  const env = { ...process.env };
  for (const k of ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'APPDIR', 'APPIMAGE', 'ARGV0', 'OWD', 'CARTRIDGE_FROM_STEAM']) delete env[k];
  return env;
}
function start(cmd, args) {
  const p = spawn(cmd, args, { detached: true, stdio: 'ignore', env: plainEnv(), cwd: os.homedir() });
  p.on('error', () => {});
  p.unref();
}
const has = (bin) => { try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; } catch { return false; } };

// EmuDeck's install.sh: the release's .AppImage asset (arm64 only on ARM)
function pickAsset(release, arch = process.arch) {
  const all = (release?.assets || []).filter((a) => /\.AppImage$/i.test(a.name || ''));
  const arm = arch === 'arm64';
  return all.find((a) => /arm64/i.test(a.name) === arm) || null;
}

async function getEmuDeck(onProgress = () => {}, { fetchImpl = fetch, home = os.homedir(), run = true } = {}) {
  const r = await fetchImpl(EMUDECK_API, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`GitHub answered ${r.status}. Try again later, or get EmuDeck from emudeck.com.`);
  const asset = pickAsset(await r.json());
  if (!asset) throw new Error("EmuDeck's latest release has no AppImage for this device.");
  const dir = path.join(home, 'Applications');
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, 'EmuDeck.AppImage');
  const part = dest + '.partial';
  const d = await fetchImpl(asset.browser_download_url);
  if (!d.ok || !d.body) throw new Error(`Download failed (${d.status})`);
  const total = Number(d.headers.get('content-length')) || asset.size || 0;
  const out = fs.createWriteStream(part);
  let got = 0;
  try {
    for await (const chunk of d.body) {
      got += chunk.length;
      if (!out.write(chunk)) await new Promise((res) => out.once('drain', res));
      onProgress({ got, total, percent: total ? Math.round((got / total) * 100) : null });
    }
    await new Promise((res, rej) => out.end((e) => (e ? rej(e) : res())));
  } catch (e) { out.destroy(); try { fs.unlinkSync(part); } catch {} throw e; }
  fs.renameSync(part, dest);
  fs.chmodSync(dest, 0o755);
  // EmuDeck's script passes --no-sandbox on Ubuntu (its AppArmor blocks Electron's sandbox)
  const ubuntu = /^ID=("?)ubuntu\1$/m.test((() => { try { return fs.readFileSync('/etc/os-release', 'utf8'); } catch { return ''; } })());
  if (run) start(dest, ubuntu ? ['--no-sandbox'] : []);
  return { path: dest, version: asset.name };
}

// RetroDECK from Flathub, for this user only (no password); flatpak prints "NN%" while it works
function getRetroDeck(onProgress = () => {}, { run = true } = {}) {
  if (!has('flatpak')) return Promise.reject(new Error("Flatpak isn't installed on this system, so RetroDECK can't be installed from here."));
  return new Promise((resolve, reject) => {
    try { execFileSync('flatpak', ['remote-add', '--user', '--if-not-exists', 'flathub', 'https://dl.flathub.org/repo/flathub.flatpakrepo'], { stdio: 'ignore', env: plainEnv(), timeout: 60000 }); } catch {}
    const p = spawn('flatpak', ['install', '--user', '-y', '--noninteractive', 'flathub', RETRODECK], { env: plainEnv() });
    let tail = '';
    const read = (b) => {
      const s = String(b); tail = (tail + s).slice(-2000);
      const all = [...s.matchAll(/(\d{1,3})%/g)];
      if (all.length) onProgress({ percent: Math.min(100, Number(all[all.length - 1][1])) });
    };
    p.stdout.on('data', read); p.stderr.on('data', read);
    p.on('error', (e) => reject(e));
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`RetroDECK didn't install: ${(tail.trim().split('\n').pop() || 'flatpak failed').slice(0, 200)}`));
      if (run) start('flatpak', ['run', RETRODECK]);
      resolve({ id: RETRODECK });
    });
  });
}

module.exports = { getEmuDeck, getRetroDeck, pickAsset };
