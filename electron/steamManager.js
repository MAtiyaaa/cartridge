// Cartridge's Steam ROM manager: adds downloaded games to Steam as non-Steam shortcuts that launch
// the way your existing shortcuts already do.
//
// How a shortcut is built, per console:
//   1. Learned: copied from shortcuts already in Steam (added by Steam ROM Manager, EmuDeck or by
//      hand). Target, Start In and Launch Options are kept exactly; only the game is swapped.
//      Frame generation wrappers (mako-run, lsfg-vk) are left out.
//   2. Found: for consoles with no shortcut to learn from, the emulator is looked up (EmuDeck
//      launcher, AppImage, Flatpak) and started with its documented options.
//   3. Yours: anything can be edited in Settings → Steam → Emulators.
// Steam is closed before its files are written (it overwrites them on exit otherwise). That is done
// by a small helper process (steamHelper.js) so it survives Steam closing Cartridge in Game Mode.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { parseVdf, shortcutId, steamRunning } = require('./steamArt');

const HOME = os.homedir();
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const ls = (p) => { try { return fs.readdirSync(p); } catch { return []; } };
const real = (p) => { try { return fs.realpathSync(p); } catch { return p; } };
const unq = (s) => String(s || '').trim().replace(/^"(.*)"$/, '$1');
const q = (s) => `"${s}"`;

// ---------------------------------------------------------------- Steam install + account
function steamRoots() {
  const seen = new Set();
  return [path.join(HOME, '.local/share/Steam'), path.join(HOME, '.steam/steam'), path.join(HOME, '.steam/root'), path.join(HOME, '.var/app/com.valvesoftware.Steam/data/Steam'), path.join(HOME, '.var/app/com.valvesoftware.Steam/.local/share/Steam')]
    .filter((p) => isDir(p))
    .filter((p) => { const r = real(p); if (seen.has(r)) return false; seen.add(r); return true; });
}
// loginusers.vdf (text) names the accounts and marks the most recent one
function loginUsers(root) {
  const t = (() => { try { return fs.readFileSync(path.join(root, 'config', 'loginusers.vdf'), 'utf8'); } catch { return ''; } })();
  const out = {};
  const re = /"(7656\d{13})"\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(t))) {
    const get = (k) => (m[2].match(new RegExp(`"${k}"\\s*"([^"]*)"`, 'i')) || [])[1] || '';
    const id = String(BigInt(m[1]) - 76561197960265728n);
    out[id] = { name: get('PersonaName') || get('AccountName'), mostRecent: get('MostRecent') === '1', ts: Number(get('Timestamp')) || 0 };
  }
  return out;
}
function environment() {
  const roots = steamRoots();
  if (!roots.length) return { installed: false, reason: 'nosteam' };
  const accounts = [];
  for (const root of roots) {
    const names = loginUsers(root);
    for (const id of ls(path.join(root, 'userdata'))) {
      if (!/^\d+$/.test(id) || id === '0') continue;
      const cfg = path.join(root, 'userdata', id, 'config');
      if (!isDir(cfg)) continue;
      accounts.push({ root, id, name: names[id]?.name || id, mostRecent: !!names[id]?.mostRecent, ts: names[id]?.ts || 0, flatpak: root.includes('com.valvesoftware.Steam') });
    }
  }
  if (!accounts.length) return { installed: true, reason: 'noaccount', roots };
  accounts.sort((a, b) => (b.mostRecent - a.mostRecent) || (b.ts - a.ts));
  return { installed: true, accounts, account: accounts[0], running: steamRunning() };
}
const files = (acc) => ({
  shortcuts: path.join(acc.root, 'userdata', acc.id, 'config', 'shortcuts.vdf'),
  grid: path.join(acc.root, 'userdata', acc.id, 'config', 'grid'),
  cloud: path.join(acc.root, 'userdata', acc.id, 'config', 'cloudstorage', 'cloud-storage-namespace-1.json'),
  config: path.join(acc.root, 'config', 'config.vdf'),
});
function readShortcuts(acc) {
  const f = files(acc).shortcuts;
  if (!exists(f)) return [];
  const data = parseVdf(fs.readFileSync(f));
  return Object.values(data.shortcuts || data.Shortcuts || {}).map((e) => ({
    appid: (e.appid ?? 0) >>> 0, name: e.AppName || e.appname || '', exe: unq(e.Exe || e.exe), exeRaw: e.Exe || e.exe || '',
    start: unq(e.StartDir || ''), lo: e.LaunchOptions || '', last: e.LastPlayTime || 0,
  }));
}
// Collections the user made (dynamic, filter-based ones can't hold chosen games)
function readCollections(acc) {
  try {
    const arr = JSON.parse(fs.readFileSync(files(acc).cloud, 'utf8'));
    const out = [];
    for (const [k, v] of arr) {
      if (!k.startsWith('user-collections.') || v.is_deleted || !v.value) continue;
      try { const c = JSON.parse(v.value); if (c.filterSpec) continue; out.push({ id: c.id, name: c.name, added: c.added || [] }); } catch {}
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  } catch { return []; }
}

// ---------------------------------------------------------------- launch options: tokens
// Split like a shell does, but keep each token's original text (quotes included)
function tokenize(s) {
  const out = [];
  let i = 0;
  s = String(s || '');
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let start = i, val = '', inq = null;
    while (i < s.length && (inq || !/\s/.test(s[i]))) {
      const ch = s[i];
      if (inq) { if (ch === inq) inq = null; else val += ch; }
      else if (ch === '"' || ch === "'") inq = ch;
      else val += ch;
      i++;
    }
    out.push({ raw: s.slice(start, i), val });
  }
  return out;
}
// Frame generation wrappers are not part of how a game launches: leave them out of new shortcuts
const FRAMEGEN = /(^|\/)(mako-run|lsfg(-vk)?|lsfg-vk-.*|framegen)$/i;
const FRAMEGEN_ENV = /^(LSFG_|ENABLE_LSFG|MAKO_)/i;
function stripFramegen(tokens) {
  return tokens.filter((t) => !FRAMEGEN.test(t.val) && !FRAMEGEN_ENV.test(t.val));
}

// ---------------------------------------------------------------- consoles
const EMU_CONSOLE = [
  [/rpcs3/i, 'ps3'], [/shadps4/i, 'ps4'], [/pcsx2/i, 'ps2'], [/(eden|yuzu|citron|sudachi|ryujinx|suyu)/i, 'switch'],
  [/cemu/i, 'wiiu'], [/xenia/i, 'xbox360'], [/xemu/i, 'xbox'], [/vita3k/i, 'psvita'], [/ppsspp/i, 'psp'],
  [/duckstation/i, 'psx'], [/(azahar|citra|lime3ds)/i, 'n3ds'], [/melonds/i, 'nds'],
];
module.exports = function createSteamManager(ctx) {
  const { USER_DATA, log, PLATFORM_MAP } = ctx;
  const cfg = () => { const c = ctx.getConfig(); c.steam ||= {}; return c.steam; };
  const REG_FILE = path.join(USER_DATA, 'steam-games.json');
  const QUEUE_FILE = path.join(USER_DATA, 'steam-queue.json');
  const JOB_DIR = path.join(USER_DATA, 'steam-jobs');
  const BACKUP_DIR = path.join(USER_DATA, 'steam-backups');
  const reg = (() => { try { return JSON.parse(fs.readFileSync(REG_FILE, 'utf8')); } catch { return {}; } })(); // appid -> { romId, name, console, exe, at }
  let queue = (() => { try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch { return { add: [], remove: [], collections: {} }; } })();
  const GONE_FILE = path.join(USER_DATA, 'steam-games-removed.json'); // so Undo can bring them back as ours
  const gone = (() => { try { return JSON.parse(fs.readFileSync(GONE_FILE, 'utf8')); } catch { return {}; } })();
  const saveReg = () => { try { fs.writeFileSync(REG_FILE, JSON.stringify(reg, null, 1)); fs.writeFileSync(GONE_FILE, JSON.stringify(gone)); } catch {} };
  const saveQueue = () => { try { fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue)); } catch {} ctx.broadcast('steam-queue', queueInfo()); };

  // folder name under roms/ -> RomM slug (prefer slugs the library actually has)
  function folderSlug(folder) {
    const f = String(folder || '').toLowerCase();
    const lib = ctx.getLibrary();
    const have = new Set((lib?.platforms || []).flatMap((p) => [p.slug, p.fs_slug]));
    const hits = Object.entries(PLATFORM_MAP).filter(([, names]) => names.includes(f)).map(([slug]) => slug);
    return hits.find((s) => have.has(s)) || hits[0] || f;
  }
  const consoleKey = (slug) => { // group slug aliases (ps/psx, gc/ngc…) under one key
    const names = PLATFORM_MAP[slug];
    return names ? names[0] : slug;
  };
  const keyOf = (slug, fsSlug) => (PLATFORM_MAP[slug] ? consoleKey(slug) : PLATFORM_MAP[fsSlug] ? consoleKey(fsSlug) : (fsSlug || slug));

  // ---------------------------------------------------------------- learning
  // Returns { console, template } for one existing shortcut, or null when no game is referenced.
  function learnOne(sc) {
    const toks = tokenize(sc.lo);
    const ci = toks.findIndex((t) => t.val === '%command%');
    const pre = ci >= 0 ? toks.slice(0, ci) : [];
    const args = ci >= 0 ? toks.slice(ci + 1) : toks;
    let gi = -1, kind = null, folder = null, sub = '', romRoot = '', sample = '';
    // RPCS3's own shortcut format: "%RPCS3_GAMEID%:BLUS30405"
    gi = args.findIndex((t) => /%RPCS3_GAMEID%:[A-Z]{4}\d{5}/.test(t.val));
    if (gi >= 0) { kind = 'serial'; folder = 'ps3'; }
    if (gi < 0) {
      gi = args.findIndex((t) => /\/roms\/[^/]+\//i.test(t.val));
      if (gi >= 0) {
        const v = args[gi].val;
        const m = v.match(/^(.*?\/roms\/)([^/]+)\/(.*)$/i); // the first roms/ (Wii U keeps its own roms/ inside)
        folder = m[2]; romRoot = m[1]; sample = v;
        const rest = m[3].split('/');
        sub = rest.length > 1 ? rest.slice(0, -1).join('/') : '';
        kind = /eboot\.bin$/i.test(v) ? 'eboot' : /\.rpx$/i.test(v) ? 'rpx' : 'path';
      }
    }
    if (gi < 0) {
      // a PS4 game started by its title ID ("-g CUSA12345")
      gi = args.findIndex((t) => /^(CUSA|PPSA)\d{5}$/.test(t.val));
      if (gi >= 0) { kind = 'titleid'; folder = 'ps4'; }
    }
    if (gi < 0) {
      // no roms/ folder: a quoted absolute path to an existing file, console from the emulator
      gi = args.findIndex((t) => t.val.startsWith('/') && /\.[a-z0-9]{2,5}$/i.test(t.val));
      const emu = EMU_CONSOLE.find(([re]) => re.test(sc.exe));
      if (gi < 0 || !emu) return null;
      folder = emu[1]; kind = /eboot\.bin$/i.test(args[gi].val) ? 'eboot' : 'path'; sample = args[gi].val;
    }
    const slug = folderSlug(folder);
    const placeholder = kind === 'serial' || kind === 'titleid' ? args[gi].raw.replace(/[A-Z]{4}\d{5}/, '{SERIAL}') : args[gi].raw.replace(args[gi].val, '{ROM}');
    const argT = args.map((t, i) => (i === gi ? placeholder : t.raw));
    const preT = stripFramegen(pre).map((t) => t.raw);
    let start = sc.start;
    if (/^\/tmp\/\.mount_/.test(start) || !start) start = path.dirname(sc.exe);
    return {
      console: consoleKey(slug), slug,
      template: { exe: sc.exe, start, pre: preT, command: ci >= 0, args: argT.join(' '), kind, romRoot, sub, sample, from: sc.name, fromId: sc.appid, how: 'learned' },
    };
  }
  let romRoots = [];
  function learnAll(scs) {
    const by = {};
    const roots = new Set();
    for (const sc of scs) {
      if (reg[sc.appid] || /cartridge/i.test(sc.name + ' ' + sc.exe)) continue; // ours: never learn from those
      let l = null;
      try { l = learnOne(sc); } catch {}
      if (!l) continue;
      if (l.template.romRoot) roots.add(l.template.romRoot);
      const key = l.console;
      const sig = [l.template.exe, l.template.pre.join(' '), l.template.args].join('|');
      (by[key] ||= {});
      const e = (by[key][sig] ||= { n: 0, last: 0, t: l.template, slug: l.slug });
      e.n++; e.last = Math.max(e.last, sc.last || 0);
    }
    const out = {};
    for (const [k, sigs] of Object.entries(by)) {
      // the pattern most of that console's shortcuts use; ties go to the most recently played
      const best = Object.values(sigs).sort((a, b) => (b.n - a.n) || (b.last - a.last))[0];
      out[k] = { ...best.t, count: best.n, slug: best.slug };
    }
    romRoots = [...roots];
    return out;
  }

  // ---------------------------------------------------------------- finding emulators
  const APP_DIRS = () => require('./trophies').APP_DIRS();
  function launchersDirs() { return ctx.emulationRoots().map((r) => path.join(r, 'tools', 'launchers')).filter(isDir); }
  let flatpaks = null;
  function flatpakApps() {
    if (flatpaks) return flatpaks;
    try { flatpaks = execFileSync('flatpak', ['list', '--app', '--columns=application'], { encoding: 'utf8', timeout: 8000 }).split('\n').map((s) => s.trim()).filter(Boolean); } catch { flatpaks = []; }
    return flatpaks;
  }
  // console -> emulators to try: [launcher script names, AppImage name pattern, flatpak id, default args]
  const EMUS = {
    ps2: [['pcsx2-qt.sh', 'pcsx2.sh'], /pcsx2/i, 'net.pcsx2.PCSX2', '-batch -fullscreen -nogui "{ROM}"'],
    psx: [['duckstation.sh'], /duckstation/i, 'org.duckstation.DuckStation', '-batch -fullscreen "{ROM}"'],
    gc: [['dolphin-emu.sh'], /dolphin/i, 'org.DolphinEmu.dolphin-emu', '-b -e "{ROM}"'],
    wii: [['dolphin-emu.sh'], /dolphin/i, 'org.DolphinEmu.dolphin-emu', '-b -e "{ROM}"'],
    wiiu: [['cemu.sh'], /cemu/i, 'info.cemu.Cemu', '-f -g "{ROM}"'],
    switch: [['eden.sh', 'citron.sh', 'yuzu.sh', 'ryujinx.sh'], /(eden|citron|yuzu|sudachi|suyu)/i, 'org.yuzu_emu.yuzu', '-f -g "{ROM}"'],
    ps3: [['rpcs3.sh'], /rpcs3/i, 'net.rpcs3.RPCS3', '--no-gui "{ROM}"'],
    ps4: [['shadps4.sh'], /shadps4/i, 'net.shadps4.shadPS4', '-g "{ROM}"'],
    psp: [['ppsspp.sh'], /ppsspp/i, 'org.ppsspp.PPSSPP', '"{ROM}"'],
    n3ds: [['azahar.sh', 'lime3ds.sh', 'citra.sh'], /(azahar|lime3ds|citra)/i, 'org.azahar_emu.Azahar', '"{ROM}"'],
    nds: [['melonds.sh'], /melonds/i, 'net.kuribo64.melonDS', '"{ROM}"'],
    xbox: [['xemu.sh'], /xemu/i, 'app.xemu.xemu', '-dvd_path "{ROM}"'],
    xbox360: [['xenia.sh'], null, null, '"{ROM}"'],
    psvita: [['vita3k.sh'], /vita3k/i, null, '"{ROM}"'],
  };
  // retro consoles go through RetroArch with a core
  const CORES = {
    nes: ['mesen', 'fceumm', 'nestopia'], snes: ['snes9x', 'bsnes'], gb: ['gambatte', 'sameboy', 'mgba'], gbc: ['gambatte', 'sameboy', 'mgba'], gba: ['mgba'],
    genesis: ['genesis_plus_gx', 'picodrive'], megadrive: ['genesis_plus_gx', 'picodrive'], mastersystem: ['genesis_plus_gx'], gamegear: ['genesis_plus_gx'], segacd: ['genesis_plus_gx'],
    n64: ['mupen64plus_next', 'parallel_n64'], pcengine: ['mednafen_pce_fast', 'mednafen_pce'], dreamcast: ['flycast'], saturn: ['mednafen_saturn', 'yabasanshiro'],
    arcade: ['fbneo', 'mame'], atari2600: ['stella'], atarilynx: ['handy', 'mednafen_lynx'], ngp: ['mednafen_ngp'], ngpc: ['mednafen_ngp'], wonderswan: ['mednafen_wswan'], wonderswancolor: ['mednafen_wswan'],
  };
  function coreDirs() { return [path.join(HOME, '.var/app/org.libretro.RetroArch/config/retroarch/cores'), path.join(HOME, '.config/retroarch/cores'), '/usr/lib/libretro', '/usr/lib64/libretro']; }
  function findTemplate(key) {
    const L = launchersDirs();
    const spec = EMUS[key];
    if (spec) {
      const [scripts, re, fp, args] = spec;
      for (const d of L) for (const s of scripts) if (exists(path.join(d, s))) return { exe: path.join(d, s), start: d, pre: [], command: true, args, kind: key === 'ps4' ? 'eboot' : key === 'wiiu' ? 'rpx' : 'path', how: 'emudeck', from: 'EmuDeck launcher' };
      if (re) {
        for (const d of APP_DIRS()) {
          const hit = ls(d).filter((n) => re.test(n) && /\.appimage$/i.test(n) && !/qtlauncher/i.test(n)).sort().pop()
            || ls(d).filter((n) => re.test(n) && /\.appimage$/i.test(n)).sort().pop();
          if (hit) {
            const qt = /qtlauncher/i.test(hit);
            return { exe: path.join(d, hit), start: d, pre: [], command: true, args: qt ? '-d -g "{ROM}"' : args, kind: key === 'ps4' ? 'eboot' : key === 'wiiu' ? 'rpx' : 'path', how: 'appimage', from: hit };
          }
        }
      }
      if (fp && flatpakApps().includes(fp)) return { exe: '/usr/bin/flatpak', start: '/usr/bin', pre: [], command: true, args: `run ${fp} ${args}`, kind: key === 'ps4' ? 'eboot' : key === 'wiiu' ? 'rpx' : 'path', how: 'flatpak', from: fp };
    }
    const cores = CORES[key];
    if (cores) {
      const core = coreDirs().flatMap((d) => cores.map((c) => path.join(d, `${c}_libretro.so`))).find(exists);
      if (core) {
        for (const d of L) if (exists(path.join(d, 'retroarch.sh'))) return { exe: path.join(d, 'retroarch.sh'), start: d, pre: [], command: true, args: `-L "${core}" "{ROM}"`, kind: 'path', how: 'emudeck', from: 'EmuDeck RetroArch' };
        if (flatpakApps().includes('org.libretro.RetroArch')) return { exe: '/usr/bin/flatpak', start: '/usr/bin', pre: [], command: true, args: `run org.libretro.RetroArch -L "${core}" "{ROM}"`, kind: 'path', how: 'flatpak', from: 'RetroArch (Flatpak)' };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------- per-game details
  function serialOf(rom, p) {
    const tag = String(rom.fs_name || '') + ' ' + String(rom.name || '');
    const m = tag.match(/\b([A-Z]{4}\d{5})\b/);
    if (m) return m[1];
    // a folder game: PS3_GAME/PARAM.SFO holds the serial
    for (const f of [path.join(p, 'PS3_GAME', 'PARAM.SFO'), path.join(p, 'PARAM.SFO')]) {
      try { const b = fs.readFileSync(f); const s = b.toString('latin1').match(/[A-Z]{4}\d{5}/); if (s) return s[0]; } catch {}
    }
    // a disc image: look for the serial near the start of the ISO (PS3_DISC.SFB / PARAM.SFO)
    try {
      const fd = fs.openSync(p, 'r'); const b = Buffer.alloc(1024 * 1024);
      fs.readSync(fd, b, 0, b.length, 0); fs.closeSync(fd);
      const s = b.toString('latin1').match(/(BL|BC|NP)(US|ES|JS|AS|KS|UB|EB|JM|JB|HB)\d{5}/);
      if (s) return s[0];
    } catch {}
    return null;
  }
  function rpcs3Knows(serial) {
    for (const f of [path.join(HOME, '.config/rpcs3/games.yml'), path.join(HOME, '.var/app/net.rpcs3.RPCS3/config/rpcs3/games.yml')]) {
      try { if (new RegExp(`^${serial}\\s*:`, 'm').test(fs.readFileSync(f, 'utf8'))) return true; } catch {}
    }
    return false;
  }
  function ps4TitleId(dir) {
    for (const f of [path.join(dir, 'sce_sys', 'param.sfo')]) {
      try { const m = fs.readFileSync(f).toString('latin1').match(/(CUSA|PPSA)\d{5}/); if (m) return m[0]; } catch {}
    }
    return null;
  }
  function findEboot(dir) {
    const walk = (d, depth) => {
      for (const n of ls(d)) {
        const p = path.join(d, n);
        if (/^eboot\.bin$/i.test(n)) return p;
        if (depth < 3 && isDir(p)) { const r = walk(p, depth + 1); if (r) return r; }
      }
      return null;
    };
    return isDir(dir) ? walk(dir, 0) : null;
  }
  // Write the game's path the way that console's shortcuts write theirs (/run/media vs /media…)
  // (the console's own shortcuts first, then any other shortcut's roms folder on the same drive)
  function styled(file, t) {
    const rf = real(file);
    for (const root of [t.romRoot, ...romRoots].filter(Boolean)) {
      let rr = real(root.replace(/\/+$/, ''));
      if (!rr) continue;
      rr = rr.endsWith('/') ? rr : rr + '/';
      if (rf.startsWith(rr)) return (root.endsWith('/') ? root : root + '/') + rf.slice(rr.length);
    }
    return file;
  }
  // What goes in place of the game in the launch options
  function gameRef(rom, file, t) {
    if (t.kind === 'serial') {
      const serial = serialOf(rom, file);
      if (serial && rpcs3Knows(serial)) return { SERIAL: serial };
      // RPCS3 doesn't know this game yet: launch it by path instead
      const target = isDir(file) ? (findEboot(file) || file) : file;
      return { ROM: styled(target, t), fallback: 'path' };
    }
    if (t.kind === 'titleid') {
      const id = (String(rom.fs_name || '') + ' ' + path.basename(file) + ' ' + (rom.name || '')).match(/\b(CUSA|PPSA)\d{5}\b/i)?.[0]?.toUpperCase() || ps4TitleId(file);
      if (id) return { SERIAL: id };
      const e = findEboot(file);
      return { ROM: styled(e || file, t), fallback: 'path' };
    }
    if (t.kind === 'eboot') { const e = findEboot(file); return { ROM: styled(e || file, t) }; }
    if (t.kind === 'rpx' && isDir(file)) { // Wii U game folder: code/<name>.rpx
      const code = path.join(file, 'code');
      const rpx = ls(code).find((n) => /\.rpx$/i.test(n));
      return { ROM: styled(rpx ? path.join(code, rpx) : file, t) };
    }
    return { ROM: styled(file, t) };
  }

  // ---------------------------------------------------------------- templates for every console
  let learned = {}, learnedAt = 0;
  function refreshLearned() {
    const env = environment();
    if (!env.account) { learned = {}; return env; }
    try { learned = learnAll(readShortcuts(env.account)); } catch (e) { log('steam learn failed', e.message); learned = {}; }
    learnedAt = Date.now();
    return env;
  }
  function templateFor(key) {
    const own = cfg().templates?.[key];
    if (own && own.exe) return { ...own, how: 'yours' };
    if (Date.now() - learnedAt > 60000) refreshLearned();
    if (learned[key]) return learned[key];
    return findTemplate(key);
  }
  function buildLaunch(rom, file, t) {
    const ref = gameRef(rom, file, t);
    let args = t.args;
    if (ref.fallback === 'path') args = args.replace(/"?%RPCS3_GAMEID%:\{SERIAL\}"?/, '"{ROM}"').replace(/(^|\s)(["']?)\{SERIAL\}\2(?=\s|$)/, '$1"{ROM}"');
    args = args.replace(/\{ROM\}/g, ref.ROM || '').replace(/\{SERIAL\}/g, ref.SERIAL || '');
    const lo = [...(t.pre || []), ...(t.command ? ['%command%'] : []), args].filter(Boolean).join(' ');
    return { lo, fallback: ref.fallback };
  }

  // ---------------------------------------------------------------- library view
  const SHORT = { ps2: 'PS2', ps3: 'PS3', ps4: 'PS4', psx: 'PS1', psp: 'PSP', psvita: 'Vita', gc: 'GameCube', wii: 'Wii', wiiu: 'Wii U', switch: 'Switch', n3ds: '3DS', nds: 'DS', n64: 'N64', snes: 'SNES', nes: 'NES', gba: 'GBA', gb: 'Game Boy', gbc: 'GBC', xbox: 'Xbox', xbox360: 'Xbox 360', dreamcast: 'Dreamcast', genesis: 'Genesis', megadrive: 'Mega Drive', saturn: 'Saturn' };
  const normPath = (p) => real(String(p || '')).replace(/\/+$/, '');
  function installedGames() {
    const lib = ctx.getLibrary();
    const inst = ctx.installed();
    const out = [];
    for (const p of lib?.platforms || []) {
      for (const r of lib.roms[p.id] || []) {
        let file = inst[r.id];
        if (!file) continue;
        if (file === ctx.MARKED) file = ctx.markedPath(r) || null;
        out.push({ rom: r, file, platform: p, key: keyOf(p.slug, p.fs_slug) });
      }
    }
    return out;
  }
  // Which downloaded games are already in Steam (ours, or added some other way)
  const nameKey = (n) => String(n || '').toLowerCase().replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();
  function inSteamIndex(scs) {
    const byPath = new Map(), byName = new Map();
    for (const sc of scs) {
      for (const t of tokenize(sc.lo)) if (t.val.startsWith('/')) byPath.set(normPath(t.val), sc);
      const serial = (sc.lo.match(/%RPCS3_GAMEID%:([A-Z]{4}\d{5})/) || sc.lo.match(/(?:^|\s)["']?((?:CUSA|PPSA)\d{5})\b/) || [])[1];
      if (serial) byPath.set('serial:' + serial, sc);
      let con = null;
      try { con = learnOne(sc)?.console || null; } catch {}
      if (!con) { const emu = EMU_CONSOLE.find(([re]) => re.test(sc.exe)); con = emu ? emu[1] : null; }
      const k = nameKey(sc.name);
      (byName.get(k) || byName.set(k, []).get(k)).push({ sc, con });
    }
    return (g) => {
      const f = g.file && normPath(g.file);
      if (f && byPath.has(f)) return byPath.get(f);
      if (f) for (const [k, sc] of byPath) if (k.startsWith(f + '/')) return sc; // eboot inside a game folder
      const serial = (String(g.rom.fs_name + ' ' + (g.file ? path.basename(g.file) : '')).match(/\b([A-Z]{4}\d{5})\b/) || [])[1];
      if (serial && byPath.has('serial:' + serial)) return byPath.get('serial:' + serial);
      // same name: only when it's for the same console (or Cartridge can't tell which console)
      const short = SHORT[g.key] || g.platform?.display_name || '';
      const plain = byName.get(nameKey(g.rom.name)) || [];
      const tagged = byName.get(nameKey(`${g.rom.name} (${short})`)) || [];
      const hit = plain.find((x) => x.con === g.key) || tagged.find((x) => x.con === g.key || !x.con);
      if (hit) return hit.sc;
      return null;
    };
  }
  function overview() {
    const env = refreshLearned();
    const scs = env.account ? readShortcuts(env.account) : [];
    const find = inSteamIndex(scs);
    const games = installedGames().map((g) => {
      const sc = find(g);
      const ours = sc && reg[sc.appid];
      const queued = queue.add.some((a) => a.romId === g.rom.id) ? 'add' : sc && queue.remove.includes(sc.appid) ? 'remove' : null;
      return { romId: g.rom.id, name: g.rom.name, console: g.key, platform: g.platform.display_name, inSteam: !!sc, ours: !!ours, appid: sc?.appid || null, queued, file: g.file };
    });
    const keys = [...new Set(games.map((g) => g.console))];
    const consoles = keys.map((k) => {
      const t = templateFor(k);
      const ps = games.filter((g) => g.console === k);
      return { key: k, label: SHORT[k] || ps[0]?.platform || k, platform: ps[0]?.platform || k, games: ps.length, inSteam: ps.filter((g) => g.inSteam).length, template: t ? { exe: t.exe, start: t.start, lo: [...(t.pre || []), ...(t.command ? ['%command%'] : []), t.args].join(' '), how: t.how, from: t.from, kind: t.kind } : null, mode: (cfg().modes || {})[k] || 'direct' };
    }).sort((a, b) => a.platform.localeCompare(b.platform));
    return {
      steam: env.installed ? (env.account ? { account: env.account.name, accounts: env.accounts.map((a) => a.name), running: env.running, flatpak: env.account.flatpak } : { error: 'Steam is installed but no account has signed in yet. Open Steam once, then come back.' }) : { error: 'Steam was not found on this device.' },
      games, consoles, queue: queueInfo(), last: lastStatus(), ours: Object.keys(reg).length,
      collections: env.account ? readCollections(env.account).map((c) => ({ id: c.id, name: c.name })) : [],
      backups: listBackups().length,
    };
  }

  // One game: is it in Steam, and would Cartridge know how to add it?
  function forRom(romId) {
    const env = environment();
    const g = installedGames().find((x) => x.rom.id === romId);
    const out = { steam: !!env.account, installed: !!g, console: g?.key || consoleOfRom(romId), needsFolder: !!g && !g.file, inSteam: false, ours: false, appid: null, queued: null };
    if (!env.account || !g) return out;
    const sc = inSteamIndex(readShortcuts(env.account))(g);
    out.inSteam = !!sc; out.ours = !!(sc && reg[sc.appid]); out.appid = sc?.appid || null;
    out.queued = queue.add.some((a) => a.romId === romId) ? 'add' : sc && queue.remove.includes(sc.appid) ? 'remove' : null;
    out.lastCollections = (cfg().lastCollections || {})[out.console] || null;
    return out;
  }
  // ---------------------------------------------------------------- queue
  function queueInfo() { return { add: queue.add.length, remove: queue.remove.length, total: queue.add.length + queue.remove.length }; }
  function queueAdd(items) { // [{ romId, collections? }]
    for (const it of items) {
      queue.remove = queue.remove.filter((a) => reg[a]?.romId !== it.romId);
      const i = queue.add.findIndex((a) => a.romId === it.romId);
      if (i >= 0) queue.add[i] = it; else queue.add.push(it);
    }
    saveQueue();
    return queueInfo();
  }
  function queueRemove(appids) {
    for (const id of appids) { if (!queue.remove.includes(id >>> 0)) queue.remove.push(id >>> 0); queue.add = queue.add.filter((a) => a.appid !== (id >>> 0)); }
    saveQueue();
    return queueInfo();
  }
  function queueClear() { queue = { add: [], remove: [], collections: {} }; saveQueue(); return queueInfo(); }

  // ---------------------------------------------------------------- plan: what exactly gets written
  function plan() {
    const env = refreshLearned();
    if (!env.account) throw new Error(env.reason === 'nosteam' ? 'Steam was not found on this device.' : 'Open Steam once and sign in, then try again.');
    const scs = readShortcuts(env.account);
    const names = new Set(scs.map((s) => s.name.toLowerCase()));
    const byRom = new Map(installedGames().map((g) => [g.rom.id, g]));
    const entries = [], skipped = [];
    const nameCount = {};
    for (const a of queue.add) { const g = byRom.get(a.romId); if (g) nameCount[g.rom.name.toLowerCase()] = (nameCount[g.rom.name.toLowerCase()] || 0) + 1; }
    for (const a of queue.add) {
      const g = byRom.get(a.romId);
      if (!g) { skipped.push({ romId: a.romId, why: 'not on this device any more' }); continue; }
      if (!g.file) { skipped.push({ romId: a.romId, name: g.rom.name, why: 'Cartridge does not know where this game\'s folder is. Open the game and use Add to Steam to pick it.' }); continue; }
      const t = a.template || templateFor(g.key);
      if (!t) { skipped.push({ romId: a.romId, name: g.rom.name, why: `No emulator found for ${SHORT[g.key] || g.platform.display_name}. Set one in Settings → Steam → Emulators.` }); continue; }
      const mode = (cfg().modes || {})[g.key] || 'direct';
      let name = g.rom.name.replace(/\s+/g, ' ').trim();
      const always = cfg().consoleInName === 'always';
      if (always || nameCount[name.toLowerCase()] > 1 || (names.has(name.toLowerCase()) && !find(scs, g))) name = `${name} (${SHORT[g.key] || g.platform.display_name})`;
      const { lo, fallback } = buildLaunch(g.rom, g.file, t);
      let exe = t.exe, start = t.start, launch = lo;
      if (mode === 'script') { exe = scriptPath(); start = path.dirname(scriptPath()); launch = String(g.rom.id); }
      const appid = shortcutId(q(exe), name);
      entries.push({
        romId: g.rom.id, console: g.key, name, exe, start, lo: launch, directLo: lo, directExe: t.exe, directStart: t.start, appid, how: t.how, from: t.from, fallback,
        proton: /\.exe$/i.test(t.exe) ? (cfg().proton || 'proton_experimental') : null,
        collections: a.collections || [],
      });
    }
    const removing = queue.remove.map((id) => ({ appid: id, name: reg[id]?.name || scs.find((s) => s.appid === id)?.name || String(id) }));
    return { account: env.account, entries, skipped, removing };
    function find(list, g) { return inSteamIndex(list)(g); }
  }
  function preview() {
    const p = plan();
    return { account: p.account.name, entries: p.entries.map((e) => ({ romId: e.romId, name: e.name, target: q(e.exe), start: q(e.start), lo: e.lo, how: e.how, from: e.from, fallback: e.fallback, collections: e.collections, proton: e.proton })), skipped: p.skipped, removing: p.removing };
  }

  // ---------------------------------------------------------------- launch script (optional mode)
  const scriptPath = () => path.join(USER_DATA, 'play.sh');
  function writeScript() {
    const ai = process.env.APPIMAGE || '';
    const sh = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
    const lines = ['#!/bin/bash', '# Written by Cartridge: launches games added to Steam in "Cartridge script" mode.', '# Rewritten every time Cartridge starts or applies Steam changes.', 'case "$1" in'];
    const byRom = new Map(installedGames().map((g) => [g.rom.id, g]));
    for (const [appid, r] of Object.entries(reg)) {
      if (r.mode !== 'script') continue;
      const g = byRom.get(r.romId);
      const t = g && templateFor(g.key);
      if (!g || !t) { lines.push(`  ${r.romId}) ${ai ? `exec ${sh(ai)} --game ${r.romId}` : 'exit 1'} ;;`); continue; }
      const { lo } = buildLaunch(g.rom, g.file, t);
      const cmd = lo.replace('%command%', sh(t.exe));
      lines.push(`  ${r.romId}) [ -e ${sh(g.file)} ] || ${ai ? `exec ${sh(ai)} --game ${r.romId}` : 'exit 1'}; cd ${sh(t.start)}; ${t.command ? cmd : `${sh(t.exe)} ${cmd}`}; exit $? ;;`);
    }
    lines.push(`  *) ${ai ? `exec ${sh(ai)} --game "$1"` : 'exit 1'} ;;`, 'esac', '');
    try { fs.writeFileSync(scriptPath(), lines.join('\n'), { mode: 0o755 }); } catch (e) { log('play.sh write failed', e.message); }
  }

  // ---------------------------------------------------------------- artwork
  async function writeArt(e, grid) {
    fs.mkdirSync(grid, { recursive: true });
    const rom = ctx.romById(e.romId);
    const out = {};
    const put = async (name, getter) => {
      const f = path.join(grid, name);
      try { const buf = await getter(); if (buf) { fs.writeFileSync(f, buf); out[name] = true; } } catch (err) { log('steam art', name, err.message); }
    };
    const art = ctx.artFor(e.romId) || {};
    const cover = art.grid || rom?.path_cover_large || rom?.path_cover_small || rom?.url_cover;
    const hero = art.hero || rom?.shot || null;
    await put(`${e.appid}p.png`, async () => (cover ? ctx.fetchImage(cover) : ctx.sgdbImage(rom?.name, 'grid')));
    await put(`${e.appid}_hero.png`, async () => (hero ? ctx.fetchImage(hero) : ctx.sgdbImage(rom?.name, 'hero')));
    await put(`${e.appid}.png`, async () => { // wide banner: SteamGridDB's, else cut from the background
      const w = await ctx.sgdbImage(rom?.name, 'wide').catch(() => null);
      if (w) return w;
      const src = hero ? await ctx.fetchImage(hero) : null;
      return src ? ctx.cropTo(src, 920, 430) : null;
    });
    await put(`${e.appid}_logo.png`, async () => { const l = await ctx.logoFile(rom); return l ? fs.readFileSync(l) : null; });
    return out;
  }

  // ---------------------------------------------------------------- apply
  function lastStatus() {
    const f = path.join(JOB_DIR, 'last.status.json');
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
  }
  function listBackups() { return ls(BACKUP_DIR).filter((f) => /^shortcuts\.vdf\.\d/.test(f)).sort().reverse(); }
  async function apply({ restart = true } = {}) {
    const p = plan();
    if (!p.entries.length && !p.removing.length) throw new Error('Nothing to apply');
    const f = files(p.account);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    // artwork can be written while Steam runs (it reads the grid folder when it starts)
    for (const e of p.entries) await writeArt(e, f.grid);
    const collections = {};
    for (const e of p.entries) for (const c of e.collections || []) (collections[c] ||= []).push(e.appid >>> 0);
    const add = p.entries.map((e) => ({
      proton: e.proton,
      entry: { appid: e.appid >>> 0, AppName: e.name, Exe: q(e.exe), StartDir: q(e.start), icon: '', ShortcutPath: '', LaunchOptions: e.lo, IsHidden: 0, AllowDesktopConfig: 1, AllowOverlay: 1, OpenVR: 0, Devkit: 0, DevkitGameID: '', DevkitOverrideAppID: 0, LastPlayTime: 0, FlatpakAppID: '', tags: {} },
    }));
    const removeIds = p.removing.map((r) => r.appid >>> 0);
    for (const id of removeIds) if (reg[id]) for (const n of [`${id}p.png`, `${id}.png`, `${id}_hero.png`, `${id}_logo.png`]) { try { fs.rmSync(path.join(f.grid, n), { force: true }); } catch {} }
    // our registry first, so the launch script knows the games before Steam starts them
    for (const e of p.entries) reg[e.appid] = { romId: e.romId, name: e.name, console: e.console, exe: e.exe, mode: (cfg().modes || {})[e.console] || 'direct', at: Date.now(), account: p.account.id, collections: e.collections };
    for (const id of removeIds) { if (reg[id]) gone[id] = reg[id]; delete reg[id]; }
    saveReg();
    writeScript();
    runHelper('last', {
      id: stamp, stamp, add, remove: removeIds, collections, restart, gamescope: !!ctx.isGamescope(), flatpakSteam: !!p.account.flatpak,
      shortcutsFile: f.shortcuts, cloudFile: Object.keys(collections).length ? f.cloud : null, configFile: add.some((a) => a.proton) ? f.config : null,
      backupDir: BACKUP_DIR, logFile: path.join(USER_DATA, 'steam-apply.log'),
    });
    const lc = cfg().lastCollections ||= {};
    for (const e of p.entries) lc[e.console] = e.collections || [];
    ctx.saveConfig();
    queue = { add: [], remove: [], collections: queue.collections || {} };
    saveQueue();
    log('steam apply started', p.entries.length, 'add,', removeIds.length, 'remove');
    return { started: true, added: p.entries.length, removed: removeIds.length, steamWillRestart: steamRunning() };
  }
  // Put back the shortcuts file from before the last change (Steam has to be closed for it)
  async function undo() {
    const env = environment();
    if (!env.account) throw new Error('Steam was not found.');
    const b = listBackups()[0];
    if (!b) throw new Error('No earlier version to go back to.');
    const restore = path.join(BACKUP_DIR, b);
    const keep = new Set(Object.values(parseVdf(fs.readFileSync(restore)).shortcuts || {}).map((e) => (e.appid ?? 0) >>> 0));
    for (const id of Object.keys(reg)) if (!keep.has(Number(id) >>> 0)) { gone[id] = reg[id]; delete reg[id]; }
    for (const id of Object.keys(gone)) if (keep.has(Number(id) >>> 0)) { reg[id] = gone[id]; delete gone[id]; }
    saveReg();
    runHelper('last', { id: 'undo', stamp: 'undo-' + Date.now(), restore, shortcutsFile: files(env.account).shortcuts, backupDir: BACKUP_DIR, logFile: path.join(USER_DATA, 'steam-apply.log'), restart: true, gamescope: !!ctx.isGamescope(), flatpakSteam: !!env.account.flatpak });
    return { started: true, steamWillRestart: steamRunning() };
  }
  // Every write goes through the helper (copied out of the AppImage, whose mount goes away
  // when Cartridge closes) running as plain Node from Cartridge's own binary
  function runHelper(name, job) {
    fs.mkdirSync(JOB_DIR, { recursive: true });
    const jobFile = path.join(JOB_DIR, name + '.json');
    fs.writeFileSync(jobFile, JSON.stringify(job, (k, v) => (typeof v === 'bigint' ? { __big: String(v) } : v)));
    try { fs.rmSync(path.join(JOB_DIR, name + '.status.json'), { force: true }); } catch {}
    const helper = path.join(JOB_DIR, 'steamHelper.js');
    fs.copyFileSync(path.join(__dirname, 'steamHelper.js'), helper);
    const bin = process.env.APPIMAGE || process.execPath;
    // The AppImage's launcher puts --no-sandbox in front of the arguments on systems without
    // user namespaces, which Node mode rejects. Passing it last stops that (the helper ignores it).
    const argv = [helper, jobFile, '--no-sandbox'];
    const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
    delete env.LD_PRELOAD;
    // Steam ends everything it started when it closes, Cartridge included. A user service
    // (systemd-run) lives outside Steam, so the helper can finish and start Steam again.
    if (!process.env.CARTRIDGE_NO_SYSTEMD_RUN && hasCmd('systemd-run')) {
      const pass = ['PATH', 'HOME', 'USER', 'DISPLAY', 'WAYLAND_DISPLAY', 'XDG_RUNTIME_DIR', 'DBUS_SESSION_BUS_ADDRESS', 'XDG_CURRENT_DESKTOP', 'XDG_SESSION_TYPE', 'XAUTHORITY', 'APPIMAGE_EXTRACT_AND_RUN'].filter((k) => env[k]);
      // KillMode=process: Steam, if the helper starts it, must outlive the helper
      const args = ['--user', '--collect', '--quiet', '-p', 'KillMode=process', '--unit', 'cartridge-steam-' + Date.now(), '--setenv=ELECTRON_RUN_AS_NODE=1', ...pass.map((k) => `--setenv=${k}=${env[k]}`), bin, ...argv];
      try {
        execFileSync('systemd-run', args, { timeout: 8000, stdio: 'ignore' });
        log('steam helper started as a user service', name);
        // if it never reports in (a user service manager that can't run it), start it directly
        const statusFile = jobFile.replace(/\.json$/, '') + '.status.json';
        setTimeout(() => { if (!exists(statusFile)) { log('steam helper service silent, starting it directly'); spawn(bin, argv, { detached: true, stdio: 'ignore', env }).unref(); } }, 5000);
        return;
      } catch (e) { log('systemd-run failed, starting the helper directly', e.message); }
    }
    spawn(bin, argv, { detached: true, stdio: 'ignore', env }).unref();
  }
  function hasCmd(c) { return (process.env.PATH || '/usr/bin:/bin').split(':').some((d) => exists(path.join(d, c))); }
  // Put games back into collections Steam dropped
  function fixCollections() {
    const env = environment();
    if (!env.account) throw new Error('Steam was not found.');
    const miss = verifyCollections() || [];
    if (!miss.length) return { fixed: 0 };
    const collections = {};
    for (const m of miss) (collections[m.collection] ||= []).push(Number(m.appid) >>> 0);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    runHelper('last', { id: stamp, stamp, add: [], remove: [], collections, restart: true, gamescope: !!ctx.isGamescope(), flatpakSteam: !!env.account.flatpak, shortcutsFile: files(env.account).shortcuts, cloudFile: files(env.account).cloud, backupDir: BACKUP_DIR, logFile: path.join(USER_DATA, 'steam-apply.log') });
    return { fixed: miss.length, steamWillRestart: steamRunning() };
  }
  function removeAllOurs() { return queueRemove(Object.keys(reg).map(Number)); }
  function restartSteam() {
    const env = environment();
    runHelper('restart', { id: 'restart', stamp: 'restart-' + Date.now(), onlyRestart: true, restart: true, gamescope: !!ctx.isGamescope(), flatpakSteam: !!env.account?.flatpak, backupDir: BACKUP_DIR, logFile: path.join(USER_DATA, 'steam-apply.log') });
    return true;
  }
  // After Steam restarts: were the collections kept? (Steam Cloud can replace the local file)
  function verifyCollections() {
    const env = environment();
    if (!env.account) return null;
    const cols = readCollections(env.account);
    const missing = [];
    for (const [appid, r] of Object.entries(reg)) {
      for (const c of r.collections || []) {
        const col = cols.find((x) => x.name === c);
        if (!col || !col.added.map((x) => x >>> 0).includes(Number(appid) >>> 0)) missing.push({ appid, name: r.name, collection: c });
      }
    }
    return missing;
  }
  // Test one console's launch setup: does the Target exist and run?
  // Shown once after Cartridge starts: how the last Steam change went, and any collections
  // Steam dropped (Steam Cloud can replace the local collections file)
  function startupReport() {
    const last = lastStatus();
    const c = cfg();
    let report = null;
    if (last && last.job && c.seenJob !== last.job + ':' + last.state && ['done', 'error'].includes(last.state)) {
      report = last;
      c.seenJob = last.job + ':' + last.state; ctx.saveConfig();
    }
    let missing = [];
    try { if (Object.keys(reg).length) missing = verifyCollections() || []; } catch {}
    return { last: report, missing };
  }
  function parseTemplate(t) {
    const toks = tokenize(t.lo);
    const ci = toks.findIndex((x) => x.val === '%command%');
    return { exe: unq(t.exe), start: unq(t.start), pre: ci >= 0 ? toks.slice(0, ci).map((x) => x.raw) : [], command: ci >= 0, args: (ci >= 0 ? toks.slice(ci + 1) : toks).map((x) => x.raw).join(' '), kind: /\{SERIAL\}/.test(t.lo) ? (key4(t) === 'ps4' ? 'titleid' : 'serial') : /eboot/i.test(t.lo) ? 'eboot' : 'path', from: 'Set by you' };
    function key4(x) { return /shadps4/i.test(x.exe) ? 'ps4' : 'ps3'; }
  }
  function test(key, given) {
    const t = given ? parseTemplate(given) : templateFor(key);
    if (!t || !t.exe) return { ok: false, error: 'No emulator set for this console' };
    if (t.exe === '/usr/bin/flatpak') { const id = (t.args.match(/run\s+(\S+)/) || [])[1]; return flatpakApps().includes(id) ? { ok: true, note: `Flatpak ${id} is installed` } : { ok: false, error: `Flatpak ${id} is not installed` }; }
    if (!exists(t.exe)) return { ok: false, error: `Target not found: ${t.exe}` };
    try { fs.accessSync(t.exe, fs.constants.X_OK); } catch { return { ok: false, error: `Target is not executable: ${t.exe}` }; }
    const bios = ctx.biosCheck?.(key);
    return { ok: true, note: bios || 'Target found' };
  }
  function setTemplate(key, t) {
    const c = cfg();
    c.templates ||= {};
    if (!t) delete c.templates[key];
    else c.templates[key] = parseTemplate(t);
    ctx.saveConfig();
    return templateFor(key);
  }
  function setMode(key, mode) { const c = cfg(); c.modes ||= {}; c.modes[key] = mode; ctx.saveConfig(); return true; }

  // after a download / delete (when the automatic options are on)
  function onDownloaded(romId) { if (cfg().autoAdd) { queueAdd([{ romId, collections: (cfg().lastCollections || {})[consoleOfRom(romId)] || [] }]); return true; } return false; }
  function onDeleted(romId) {
    if (!cfg().autoRemove) return false;
    const ids = Object.entries(reg).filter(([, r]) => r.romId === romId).map(([id]) => Number(id));
    if (ids.length) queueRemove(ids);
    return ids.length > 0;
  }
  function consoleOfRom(romId) { const r = ctx.romById(romId); return r ? keyOf(r.platform_slug, r.platform_fs_slug) : null; }

  writeScript();
  return {
    overview, preview, apply, undo, restartSteam, removeAllOurs, queueAdd, queueRemove, queueClear, queueInfo, test, setTemplate, setMode, verifyCollections,
    collections: () => { const env = environment(); return env.account ? readCollections(env.account) : []; },
    onDownloaded, onDeleted, lastStatus, writeScript, startupReport, forRom, fixCollections,
    // exposed for tests
    _learnOne: learnOne, _tokenize: tokenize, _buildLaunch: buildLaunch, _learnAll: learnAll,
  };
};
