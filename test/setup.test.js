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
