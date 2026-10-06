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

// When the installed copy has no icon to read (RPCS3's AppImage, Xenia's Windows build...): the icon
// from the emulator's own repository, fetched once and kept (0.9.17; each URL checked)
const GH = 'https://raw.githubusercontent.com/';
const ICON_URLS = {
  // 0.9.37: PS5. 0.9.38 (owner: no SharpEmu icon): its logo is in assets/images (the old path was a 404);
  // KytyPS5 has no logo of its own, so its project picture (avatars host: github.com/<name>.png redirects)
  sharpemu: GH + 'sharpemu/sharpemu/main/assets/images/logo_transparent.png', kytyps5: 'https://avatars.githubusercontent.com/KytyPS5?size=256',
  rpcs3: GH + 'RPCS3/rpcs3/master/rpcs3/rpcs3.svg', xenia: GH + 'xenia-canary/xenia-canary/canary_experimental/assets/icon/256.png',
  shadps4: GH + 'shadps4-emu/shadPS4/main/.github/shadps4.png', cemu: GH + 'cemu-project/Cemu/main/dist/linux/info.cemu.Cemu.png',
  xemu: GH + 'xemu-project/xemu/master/ui/icons/xemu_256x256.png', azahar: GH + 'azahar-emu/azahar/master/dist/azahar.svg',
  dolphin: GH + 'dolphin-emu/dolphin/master/Data/dolphin-emu.svg', duckstation: GH + 'stenzek/duckstation/master/data/resources/images/duck.png',
  pcsx2: GH + 'PCSX2/pcsx2/master/bin/resources/icons/AppIconLarge.png', melonds: GH + 'melonDS-emu/melonDS/master/res/icon/melon_256x256.png',
  flycast: GH + 'flyinghead/flycast/master/shell/linux/flycast.png', mgba: GH + 'mgba-emu/mgba/master/res/mgba-256.png',
  // 0.9.21 (owner: icons missing in Get Emulators): every emulator it offers, each URL checked
  ares: GH + 'ares-emulator/ares/master/desktop-ui/resource/ares.png', retroarch: GH + 'libretro/RetroArch/master/media/retroarch-96x96.png',
  scummvm: GH + 'scummvm/scummvm/master/icons/scummvm.svg', ppsspp: GH + 'hrydgard/ppsspp/master/icons/hicolor/256x256/apps/ppsspp.png',
  mame: GH + 'mamedev/mame/master/docs/source/images/MAMElogo.svg', xeniaedge: GH + 'has207/xenia-edge/master/assets/icon/256.png',
  primehack: GH + 'shiiion/dolphin/master/Data/dolphin-emu.svg', vita3k: GH + 'Vita3K/Vita3K/master/vita3k/Vita3K.png',
  rmg: GH + 'Rosalie241/RMG/master/Package/com.github.Rosalie241.RMG.svg', supermodel: GH + 'trzy/Supermodel/master/Docs/Images/Real3D_Logo.png',
  // Ryujinx (Ryubing) is on its own Forgejo too; not checkable from where this was written
  // 0.9.38 (owner: no Ryujinx icon): then the Ryubing project's own picture on GitHub (checked), when its server doesn't answer
  ryujinx: ['https://git.ryujinx.app/ryubing/ryujinx/raw/branch/master/distribution/misc/Logo.svg', 'https://git.ryujinx.app/ryubing/ryujinx/raw/branch/master/src/Ryujinx/Assets/UIImages/Logo_Ryujinx.png', 'https://avatars.githubusercontent.com/Ryubing?size=256'],
  // Eden lives on its own Forgejo (git.eden-emu.dev), not GitHub (0.9.21, owner: no Eden logo); the
  // first of these that answers with an image is kept
  eden: ['https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/dev.eden_emu.eden.svg', 'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/eden.svg', 'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/eden.png', 'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/qt_themes/default/icons/256x256/eden.png'],
};
async function webIcon(id, cacheDir, fetchImpl = require('./webFetch')) {
  const urls = [].concat(ICON_URLS[id] || []); if (!urls.length || !cacheDir) return null;
  for (const ext of ['.svg', '.png']) { const f = path.join(cacheDir, `${id}-repo${ext}`); if (exists(f)) return f; }
  for (const url of urls) {
    try {
      const r = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      const b = Buffer.from(await r.arrayBuffer());
      const svg = /^\s*(<\?xml|<svg)/.test(b.subarray(0, 200).toString('latin1')), png = b.subarray(0, 4).toString('latin1') === '\x89PNG';
      if (b.length < 64 || !(svg || png)) continue; // a page, not an image
      const f = path.join(cacheDir, `${id}-repo${svg ? '.svg' : '.png'}`);
      fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(f, b);
      return f;
    } catch {}
  }
  return null;
}

module.exports = { iconFor, themeIcon, webIcon, ICON_URLS };
