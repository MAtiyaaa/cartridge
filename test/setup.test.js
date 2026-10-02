// 0.9.15 welcome: EmuDeck's app the way its install.sh picks it; RomM on this device from RomM's compose.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const W = require('../electron/welcome.js');
const RL = require('../electron/rommLocal.js');

test('EmuDeck: the x86 AppImage, arm64 only on ARM', () => {
  const rel = { assets: [{ name: 'EmuDeck-2.5.0-arm64.AppImage' }, { name: 'EmuDeck-2.5.0.AppImage' }, { name: 'latest-linux.yml' }] };
  assert.strictEqual(W.pickAsset(rel, 'x64').name, 'EmuDeck-2.5.0.AppImage');
  assert.strictEqual(W.pickAsset(rel, 'arm64').name, 'EmuDeck-2.5.0-arm64.AppImage');
  assert.strictEqual(W.pickAsset({ assets: [{ name: 'x.zip' }] }, 'x64'), null);
});

test('RomM: same database settings in both containers, folders where RomM expects them', () => {
  const s = { DB_ROOT: 'r', DB_PASSWD: 'p', AUTH_KEY: 'k' };
  const db = RL.dbArgs(s).join(' ');
  assert.match(db, /MARIADB_DATABASE=romm/);
  assert.match(db, /MARIADB_USER=romm-user/);
  assert.match(db, /MARIADB_PASSWORD=p/);
  assert.match(db, /--pod cartridge-romm/);
  const app = RL.rommArgs(s, { library: '/l', assets: '/a', config: '/c' }, { igdbId: 'i' }).join(' ');
  for (const x of ['DB_HOST=127.0.0.1', 'DB_NAME=romm', 'DB_USER=romm-user', 'DB_PASSWD=p', 'ROMM_AUTH_SECRET_KEY=k', '/l:/romm/library', '/a:/romm/assets', '/c:/romm/config', '/redis-data', 'label=disable']) assert.ok(app.includes(x), x);
  assert.doesNotMatch(app, /IGDB_CLIENT_ID/); // half a key pair is left out
});

test('RomM: secrets file round trip', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rl-')), 'romm-local.env');
  fs.writeFileSync(f, RL.envText({ DB_ROOT: 'a', AUTH_KEY: 'b' }));
  assert.deepStrictEqual(RL.readEnv(f), { DB_ROOT: 'a', AUTH_KEY: 'b' });
});

const A = require('../electron/addons.js');
test('Add-ons: texture folders and on/off read from each emulator\'s settings', () => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-'));
  const put = (p, t) => { fs.mkdirSync(path.dirname(path.join(h, p)), { recursive: true }); fs.writeFileSync(path.join(h, p), t); };
  put('.config/PCSX2/inis/PCSX2.ini', '[Folders]\nTextures = /mnt/tex\n[EmuCore/GS]\nLoadTextureReplacements = true\n');
  put('.local/share/duckstation/settings.ini', '[Main]\n');
  put('.config/dolphin-emu/Dolphin.ini', '[General]\nLoadPath = \n');
  put('.config/dolphin-emu/GFX.ini', '[Settings]\nHiresTextures = True\n');
  put('.config/ppsspp/PSP/SYSTEM/ppsspp.ini', '[Graphics]\n');
  const l = A.emulators(h, {});
  const by = Object.fromEntries(l.map((e) => [e.id, e]));
  assert.strictEqual(by.pcsx2.textures, '/mnt/tex');
  assert.strictEqual(by.pcsx2.on, true);
  assert.strictEqual(by.duckstation.textures, path.join(h, '.local/share/duckstation/textures'));
  assert.strictEqual(by.duckstation.on, false);
  assert.strictEqual(by.dolphin.textures, path.join(h, '.local/share/dolphin-emu/Load/Textures'));
  assert.strictEqual(by.dolphin.on, true);
  assert.strictEqual(by.ppsspp.on, true); // PPSSPP's default
  const g = A.forGame('ps2', { serial: 'SLUS-20062' }, l);
  assert.strictEqual(g[0].folder, '/mnt/tex/SLUS-20062/replacements');
  assert.strictEqual(A.forGame('ngc', {}, l)[0].folder, null); // no ID, no guess
});

test('Add-ons: GameCube ID and 3DS title ID from the file header', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'id-'));
  const iso = path.join(d, 'g.iso'); const b = Buffer.alloc(64); b.write('GALE01'); fs.writeFileSync(iso, b);
  assert.strictEqual(A.gcWiiId(iso), 'GALE01');
  const c = Buffer.alloc(0x600); c.write('NCSD', 0x100); c.writeUInt32LE(2, 0x120); c.write('NCCH', 0x400 + 0x100); c.writeBigUInt64LE(0x0004000000055D00n, 0x400 + 0x118);
  const f = path.join(d, 'g.3ds'); fs.writeFileSync(f, c);
  assert.strictEqual(A.n3dsTitleId(f), '0004000000055D00');
});

const EI = require('../electron/emuIcons.js');
test('Emulator icons come from the installed copy: Flatpak export, then a .desktop entry', () => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'ei-'));
  const put = (p, t) => { fs.mkdirSync(path.dirname(path.join(h, p)), { recursive: true }); fs.writeFileSync(path.join(h, p), t); };
  put('.local/share/flatpak/exports/share/icons/hicolor/256x256/apps/net.pcsx2.PCSX2.png', 'png');
  put('.local/share/applications/duck.desktop', '[Desktop Entry]\nExec=/usr/bin/duckstation-qt %f\nIcon=duckstation\n');
  put('.local/share/icons/hicolor/128x128/apps/duckstation.png', 'png');
  assert.match(EI.iconFor('pcsx2', { fp: ['net.pcsx2.PCSX2'] }, { home: h }), /net\.pcsx2\.PCSX2\.png$/);
  assert.match(EI.iconFor('duckstation', { fp: ['org.duckstation.DuckStation'], bin: ['duckstation-qt'] }, { home: h }), /duckstation\.png$/);
  assert.strictEqual(EI.iconFor('dolphin', { fp: ['x.none'], bin: ['dolphin-emu'] }, { home: h }), null);
});

test('Add-ons: textures on, written the way each emulator writes it', () => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'tx-'));
  const put = (p, t) => { fs.mkdirSync(path.dirname(path.join(h, p)), { recursive: true }); fs.writeFileSync(path.join(h, p), t); };
  put('.config/PCSX2/inis/PCSX2.ini', '[EmuCore/GS]\nLoadTextureReplacements = false\nupscale_multiplier = 2\n');
  put('.config/azahar-emu/qt-config.ini', '[Utility]\ncustom_textures\\default=true\ncustom_textures=false\n');
  const l = A.emulators(h, {});
  for (const e of l) A.setTextures(e, true);
  const again = Object.fromEntries(A.emulators(h, {}).map((e) => [e.id, e.on]));
  assert.deepStrictEqual(again, { pcsx2: true, azahar: true });
  assert.match(fs.readFileSync(path.join(h, '.config/PCSX2/inis/PCSX2.ini'), 'utf8'), /upscale_multiplier = 2/);
  assert.match(fs.readFileSync(path.join(h, '.config/azahar-emu/qt-config.ini'), 'utf8'), /^custom_textures\\default=false$/m);
  assert.match(fs.readFileSync(path.join(h, '.config/azahar-emu/qt-config.ini'), 'utf8'), /^custom_textures=true$/m);
});

const EU = require('../electron/emuUpdates.js');
test('Emulator updates: versions compared, the right AppImage picked, swapped in place', async () => {
  assert.ok(EU.cmpVer('v2.3.120', '2.3.99') > 0);
  assert.strictEqual(EU.cmpVer('0.2.0', 'v0.2'), 0);
  const fetchImpl = async (url) => ({ ok: true, status: 200, json: async () => (url.includes('/tags/latest') ? { tag_name: 'latest', assets: [{ name: 'DuckStation-x64.AppImage', browser_download_url: 'https://x/d', size: 4, updated_at: '2030-01-01T00:00:00Z' }, { name: 'DuckStation-arm64.AppImage' }] } : [{ draft: true }, { tag_name: 'v2.4.10', assets: [{ name: 'pcsx2-v2.4.10-linux-appimage-x64-Qt.AppImage', browser_download_url: 'https://x/p', size: 4 }] }]) });
  const d = await EU.latestRelease('duckstation', { fetchImpl });
  assert.strictEqual(d.name, 'DuckStation-x64.AppImage');
  assert.ok(EU.isNewer(d, { version: '', path: '/nope' })); // no version: by date
  const p = await EU.latestRelease('pcsx2', { fetchImpl });
  assert.strictEqual(p.version, '2.4.10');
  assert.ok(EU.isNewer(p, { version: '2.3.0' }));
  assert.ok(!EU.isNewer(p, { version: '2.4.10' }));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eu-')), f = path.join(dir, 'pcsx2.AppImage');
  fs.writeFileSync(f, 'old!');
  await EU.replaceAppImage(f, p, async (url, dest) => fs.writeFileSync(dest, 'new!'));
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'new!');
  assert.ok(!fs.existsSync(f + '.cartridge-old'));
  assert.ok(fs.statSync(f).mode & 0o100);
  await assert.rejects(EU.replaceAppImage(f, { ...p, size: 99 }, async (url, dest) => fs.writeFileSync(dest, 'x')), /incomplete/);
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'new!'); // untouched after a bad download
});

test('Add-ons: Switch and Wii U mod folders; PS1, CIA and Switch IDs read from the files (0.9.16)', () => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'mods-'));
  const put = (p, t) => { fs.mkdirSync(path.dirname(path.join(h, p)), { recursive: true }); fs.writeFileSync(path.join(h, p), t); };
  put('.config/eden/qt-config.ini', '[Data%20Storage]\nload_directory\\default=true\n');
  put('.config/Ryujinx/Config.json', '{}');
  put('.local/share/Cemu/graphicPacks/x/rules.txt', '');
  const l = A.emulators(h, {});
  const g = A.forGame('switch', { switchId: '0100F2C0115B6000', switchIdLower: '0100f2c0115b6000' }, l);
  assert.deepStrictEqual(g.map((e) => [e.id, e.folder]), [['eden', path.join(h, '.local/share/eden/load/0100F2C0115B6000')], ['ryujinx', path.join(h, '.config/Ryujinx/mods/contents/0100f2c0115b6000')]]);
  assert.strictEqual(A.forGame('wiiu', {}, l)[0].folder, path.join(h, '.local/share/Cemu/graphicPacks'));

  // PS1: raw 2352-byte sectors, SYSTEM.CNF in the root folder
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ps1-'));
  const bin = Buffer.alloc(2352 * 24);
  const sector = (n, data) => { const o = n * 2352; bin[o] = 0; bin.fill(0xff, o + 1, o + 11); bin[o + 15] = 2; data.copy(bin, o + 24); };
  for (let i = 0; i < 24; i++) sector(i, Buffer.alloc(0));
  const pvd = Buffer.alloc(2048); pvd[0] = 1; pvd.write('CD001', 1, 'latin1'); pvd.writeUInt32LE(20, 156 + 2); pvd.writeUInt32LE(2048, 156 + 10);
  const dir = Buffer.alloc(2048); const name = 'SYSTEM.CNF;1'; dir[0] = 33 + name.length; dir.writeUInt32LE(21, 2); dir.writeUInt32LE(60, 10); dir[32] = name.length; dir.write(name, 33, 'latin1');
  sector(16, pvd); sector(20, dir); sector(21, Buffer.from('BOOT = cdrom:\\SLUS_005.94;1\r\nTCB = 4\r\n', 'latin1'));
  fs.writeFileSync(path.join(d, 'g.bin'), bin); fs.writeFileSync(path.join(d, 'g.cue'), 'FILE "g.bin" BINARY\n  TRACK 01 MODE2/2352\n');
  assert.strictEqual(A.psxSerial(path.join(d, 'g.cue')), 'SLUS-00594');

  // CIA: header 0x2020, certs 0xA00, ticket 0x350, TMD signed RSA-2048
  const cia = Buffer.alloc(0x4000); cia.writeUInt32LE(0x2020, 0); cia.writeUInt32LE(0xa00, 8); cia.writeUInt32LE(0x350, 0xc);
  const al = (x) => Math.ceil(x / 64) * 64, tmd = al(al(al(0x2020) + 0xa00) + 0x350);
  cia.writeUInt32BE(0x10004, tmd); cia.writeBigUInt64BE(0x0004000000055D00n, tmd + 4 + 0x13c + 0x4c);
  fs.writeFileSync(path.join(d, 'g.cia'), cia);
  assert.strictEqual(A.ciaTitleId(path.join(d, 'g.cia')), '0004000000055D00');

  // NSP: the ticket's name; an update folds to its game
  const names = Buffer.from('0100f2c0115b6800000000000000000a.tik\0abc.nca\0', 'latin1');
  const nsp = Buffer.alloc(16 + 2 * 24 + names.length); nsp.write('PFS0', 0, 'latin1'); nsp.writeUInt32LE(2, 4); nsp.writeUInt32LE(names.length, 8); names.copy(nsp, 16 + 48);
  fs.writeFileSync(path.join(d, 'u.nsp'), nsp);
  assert.strictEqual(A.switchTitleId(path.join(d, 'u.nsp')), '0100F2C0115B6000');
  assert.strictEqual(A.switchTitleId(path.join(d, 'Game [0100ABCD12340000].xci')), '0100ABCD12340000');
});

test('RomM on this device: Podman needs the user\'s ID ranges in /etc/subuid and /etc/subgid (0.9.17)', () => {
  const RL = require('../electron/rommLocal.js');
  const etc = fs.mkdtempSync(path.join(os.tmpdir(), 'etc-'));
  const u = os.userInfo().username;
  assert.strictEqual(RL.hasIds(etc), false);
  fs.writeFileSync(path.join(etc, 'subuid'), `other:100000:65536\n${u}:100000:65536\n`);
  assert.strictEqual(RL.hasIds(etc), false); // subgid missing
  fs.writeFileSync(path.join(etc, 'subgid'), `${os.userInfo().uid}:100000:65536\n`);
  assert.strictEqual(RL.hasIds(etc), true);
});

test('Emulator setup: game folders added to PCSX2, DuckStation and Dolphin as they write them (0.9.17)', () => {
  const F = require('../electron/emuFolders.js');
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'ef-'));
  const put = (p, t) => { fs.mkdirSync(path.dirname(path.join(h, p)), { recursive: true }); fs.writeFileSync(path.join(h, p), t); };
  put('.config/PCSX2/inis/PCSX2.ini', '[UI]\nTheme = dark\n\n[GameList]\nRecursivePaths = /old\n\n[Folders]\nBios = bios\n');
  put('.local/share/duckstation/settings.ini', '[Main]\nX = 1\n');
  put('.config/dolphin-emu/Dolphin.ini', '[General]\nISOPaths = 1\nISOPath0 = /games/old\n[Core]\nCPUThread = True\n');
  const roms = path.join(h, 'roms'); for (const d of ['ps2', 'psx', 'gc', 'wii']) fs.mkdirSync(path.join(roms, d), { recursive: true });
  const folders = { ps2: path.join(roms, 'ps2'), psx: path.join(roms, 'psx'), gc: path.join(roms, 'gc'), wii: path.join(roms, 'wii') };
  const r = F.addGameDirs(folders, { home: h, env: {} });
  assert.deepStrictEqual(r.map((x) => [x.id, x.added.length]), [['pcsx2', 1], ['duckstation', 1], ['dolphin', 2]]);
  assert.match(fs.readFileSync(path.join(h, '.config/PCSX2/inis/PCSX2.ini'), 'utf8'), new RegExp(`\\[GameList\\]\\nRecursivePaths = /old\\nRecursivePaths = ${folders.ps2}\\n\\n\\[Folders\\]`));
  assert.match(fs.readFileSync(path.join(h, '.local/share/duckstation/settings.ini'), 'utf8'), new RegExp(`\\[GameList\\]\\nRecursivePaths = ${folders.psx}\\n`));
  const dol = fs.readFileSync(path.join(h, '.config/dolphin-emu/Dolphin.ini'), 'utf8');
  assert.match(dol, /ISOPaths = 3/); assert.match(dol, new RegExp(`ISOPath1 = ${folders.gc}\\nISOPath2 = ${folders.wii}`)); assert.match(dol, /ISOPath0 = \/games\/old/);
  assert.deepStrictEqual(F.addGameDirs(folders, { home: h, env: {} }).map((x) => x.added.length), [0, 0, 0]); // already there
  const busy = F.addGameDirs({ ps2: path.join(h, 'x') }, { home: h, env: {}, running: new Set(['pcsx2']) });
  assert.deepStrictEqual(busy, []); // folder missing: nothing to add
});

test('Emulator setup: BIOS copied into emulator folders that are set up, never over a file (0.9.17)', () => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-'));
  const code = `
    const B = require(${JSON.stringify(path.join(__dirname, '../electron/bios.js'))});
    console.log(JSON.stringify(B.place('psx', ${JSON.stringify(path.join(h, 'bios'))}).map((f) => f.replace(${JSON.stringify(h)}, '~'))));`;
  fs.mkdirSync(path.join(h, 'bios')); fs.writeFileSync(path.join(h, 'bios/scph5501.bin'), 'bios'); fs.writeFileSync(path.join(h, 'bios/other.bin'), 'x');
  fs.mkdirSync(path.join(h, '.local/share/duckstation'), { recursive: true }); // DuckStation set up, its bios folder not made yet
  fs.mkdirSync(path.join(h, '.var/app/org.duckstation.DuckStation/data/duckstation/bios'), { recursive: true });
  fs.writeFileSync(path.join(h, '.var/app/org.duckstation.DuckStation/data/duckstation/bios/scph5501.bin'), 'mine');
  const out = JSON.parse(require('child_process').execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: h }, encoding: 'utf8' }).trim());
  assert.deepStrictEqual(out, ['~/.local/share/duckstation/bios/scph5501.bin']);
  assert.strictEqual(fs.readFileSync(path.join(h, '.var/app/org.duckstation.DuckStation/data/duckstation/bios/scph5501.bin'), 'utf8'), 'mine');
});

test('GitHub: when the API answers 403, the release pages are read (0.9.17)', async () => {
  const G = require('../electron/github.js');
  const seen = [];
  const fetchImpl = async (u) => {
    seen.push(u);
    if (u.startsWith('https://api.github.com')) return { ok: false, status: 403 };
    if (u.endsWith('/releases/latest')) return { ok: true, status: 200, url: 'https://github.com/RPCS3/rpcs3-binaries-linux/releases/tag/build-abc', text: async () => '' };
    return { ok: true, status: 200, text: async () => '<a href="/RPCS3/rpcs3-binaries-linux/releases/download/build-abc/rpcs3-v0.0.38-1234_linux64.AppImage">x</a>' };
  };
  const r = await G.release('RPCS3/rpcs3-binaries-linux', { fetchImpl });
  assert.strictEqual(r.tag, 'build-abc');
  assert.deepStrictEqual(r.assets.map((a) => a.name), ['rpcs3-v0.0.38-1234_linux64.AppImage']);
  const U = require('../electron/emuUpdates.js');
  const rel = await U.latestRelease('rpcs3', { fetchImpl });
  assert.strictEqual(rel.version, '0.0.38');
});

test('Without RomM: a library from the console folders already on the device (0.9.17)', () => {
  const L = require('../electron/localLibrary.js');
  const r = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-'));
  const put = (p, t = 'x') => { fs.mkdirSync(path.dirname(path.join(r, p)), { recursive: true }); fs.writeFileSync(path.join(r, p), t); };
  put('ps2/God of War (USA).iso'); put('ps2/notes.txt');
  put('psx/FF7 (Disc 1).cue'); put('psx/FF7 (Disc 1).bin'); put('psx/FF7 (Disc 2).cue'); put('psx/FF7 (Disc 2).bin'); put('psx/FF7.m3u', 'FF7 (Disc 1).cue\nFF7 (Disc 2).cue\n');
  fs.mkdirSync(path.join(r, 'ps3/Uncharted 2 [BCUS98123]/PS3_GAME'), { recursive: true });
  fs.mkdirSync(path.join(r, 'bios')); fs.mkdirSync(path.join(r, 'gamecube'));
  const lib = L.build(r);
  const by = Object.fromEntries(lib.platforms.map((p) => [p.slug, lib.roms[p.id].map((x) => x.name)]));
  assert.deepStrictEqual(by, { ps2: ['God of War'], ps3: ['Uncharted 2'], psx: ['FF7'] });
  assert.ok(lib.platforms.every((p) => p.id < 0) && Object.values(lib.roms).flat().every((x) => x.id < 0));
  assert.strictEqual(lib.platforms.find((p) => p.slug === 'psx').display_name, 'PlayStation');
});
