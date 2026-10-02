// An emulator's own icon, from where it is installed (0.9.16; owner: real icons instead of the
// placeholder box). Nothing is bundled: the icon comes from the user's copy.
// - Flatpak: its exported icon (user and system installs, hicolor sizes, PNG or SVG)
// - AppImage: its .DirIcon, read from inside the AppImage (detect.readAppImageFile), cached as PNG
// - distro packages: the Icon= of a .desktop entry that runs it, looked up in the hicolor theme
const fs = require('fs');
const path = require('path');
const os = require('os');

const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const ls = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
const SIZES = ['256x256', '512x512', '128x128', '96x96', '64x64', 'scalable'];

function themeIcon(name, home = os.homedir()) {
  if (!name) return null;
  if (path.isAbsolute(name)) return exists(name) ? name : null;
  const roots = [path.join(home, '.local/share/icons/hicolor'), path.join(home, '.local/share/flatpak/exports/share/icons/hicolor'), '/var/lib/flatpak/exports/share/icons/hicolor', '/usr/share/icons/hicolor', '/usr/local/share/icons/hicolor'];
  for (const r of roots) for (const s of SIZES) for (const ext of ['png', 'svg']) { const f = path.join(r, s, 'apps', `${name}.${ext}`); if (exists(f)) return f; }
  for (const ext of ['png', 'svg']) { const f = path.join('/usr/share/pixmaps', `${name}.${ext}`); if (exists(f)) return f; }
  return null;
}

// emu: an EMU entry ({ fp, bin, app }); appImages: AppImage paths the scan found for it
function iconFor(id, emu, { appImages = [], cacheDir, home = os.homedir(), readAppImageFile } = {}) {
  for (const fp of emu?.fp || []) { const f = themeIcon(fp, home); if (f) return f; }
  for (const file of appImages) {
    const stem = cacheDir && path.join(cacheDir, `${id}-${Buffer.from(file).toString('base64url').slice(-16)}`);
    for (const ext of ['.png', '.svg']) if (stem && exists(stem + ext)) return stem + ext;
    try {
      const b = readAppImageFile?.(file, '.DirIcon', 4 << 20);
      if (b && b.length > 64 && cacheDir) {
        const svg = /^\s*(<\?xml|<svg)/.test(b.subarray(0, 200).toString('latin1'));
        fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(stem + (svg ? '.svg' : '.png'), b); return stem + (svg ? '.svg' : '.png');
      }
    } catch {}
  }
  // a .desktop entry that starts one of its programs
  const bins = (emu?.bin || []).map((b) => b.toLowerCase());
  for (const d of [path.join(home, '.local/share/applications'), '/usr/share/applications', '/usr/local/share/applications']) {
    for (const n of ls(d).filter((x) => x.endsWith('.desktop'))) {
      let t = ''; try { t = fs.readFileSync(path.join(d, n), 'utf8'); } catch { continue; }
      const exec = (/^Exec=(.*)$/m.exec(t) || [])[1] || '';
      const prog = path.basename((exec.match(/^\s*"?([^"\s]+)/) || [])[1] || '').toLowerCase();
      if (!bins.includes(prog) && !(emu?.app && emu.app.test(n))) continue;
      const f = themeIcon((/^Icon=(.*)$/m.exec(t) || [])[1]?.trim(), home);
      if (f) return f;
    }
  }
  return null;
}

module.exports = { iconFor, themeIcon };
