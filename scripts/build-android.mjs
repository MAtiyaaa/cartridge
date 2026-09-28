// Builds everything the Android app needs from the same source as the desktop app:
//   1. the UI in Android mode        -> android-dist/
//   2. the Node backend project      -> android-dist/nodejs/ (electron/*.js + Electron shim)
//   3. copies both into the Android project (npx cap sync android)
// Flags: --skip-web (reuse android-dist), --no-sync (skip cap sync), --stage <dir> (only stage the Node project there)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const stageArg = args.includes('--stage') ? path.resolve(args[args.indexOf('--stage') + 1]) : null;
const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const WEB = path.join(ROOT, 'android-dist');
const NODE_DEPS = ['socket.io-client', 'pngjs', 'jpeg-js'];

if (!stageArg && !flag('--skip-web')) run('npx vite build --mode android');

const out = stageArg || path.join(WEB, 'nodejs');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const cp = (from, to) => fs.cpSync(path.join(ROOT, from), path.join(out, to), { recursive: true });

// Backend: the desktop files, untouched
cp('electron', 'electron');
cp('build/syslogos', 'build/syslogos');
cp('android-backend/android-main.js', 'android-main.js');
fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({ name: 'cartridge-android-backend', version: rootPkg.version, private: true, main: 'android-main.js' }, null, 2));

// Electron shim in place of the real module
const shim = path.join(out, 'node_modules/electron');
fs.mkdirSync(shim, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'android-backend/electron-shim.js'), path.join(shim, 'index.js'));
fs.copyFileSync(path.join(ROOT, 'android-backend/native-image.js'), path.join(shim, 'native-image.js'));
fs.writeFileSync(path.join(shim, 'package.json'), JSON.stringify({ name: 'electron', version: '0.0.0-android', main: 'index.js' }));

// Production dependencies of the backend, copied from the installed tree (no network needed)
const seen = new Set();
function copyDep(name, fromDir) {
  let dir = fromDir;
  let src = null;
  while (dir.startsWith(ROOT)) {
    const cand = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(cand, 'package.json'))) { src = cand; break; }
    const up = path.dirname(dir); if (up === dir) break; dir = up;
  }
  if (!src) throw new Error('Missing dependency for the Android backend: ' + name + ' (run npm ci)');
  if (seen.has(src)) return;
  seen.add(src);
  fs.cpSync(src, path.join(out, 'node_modules', name), { recursive: true, filter: (p) => !/[\\/]node_modules[\\/].*[\\/]node_modules$/.test(p.slice(src.length)) });
  const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
  for (const d of Object.keys(pkg.dependencies || {})) copyDep(d, src);
}
for (const d of NODE_DEPS) copyDep(d, ROOT);

if (stageArg) { console.log('Staged Android backend in ' + out); process.exit(0); }

// The UI again inside the Node project, served to the second-screen WebView
for (const f of fs.readdirSync(WEB)) if (f !== 'nodejs') fs.cpSync(path.join(WEB, f), path.join(out, 'ui', f), { recursive: true });

if (!flag('--no-sync')) run('npx cap sync android');
console.log('Android web + backend ready (version ' + rootPkg.version + ')');
