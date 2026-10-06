// Emulator update versions (0.9.37): build numbers count (RPCS3), and the version RPCS3's log says it runs.
// Run with: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const U = require('../electron/emuUpdates');

test('versions keep a build number after the dash, never a date', () => {
  assert.strictEqual(U.verOf('rpcs3-v0.0.38-18166-77d2d1b4_linux64.AppImage'), '0.0.38.18166');
  assert.strictEqual(U.verOf('v2.5.170-2025-10-05'), '2.5.170');
  assert.strictEqual(U.verOf('Eden-Linux-v0.0.3-amd64'), '0.0.3');
  assert.strictEqual(U.isNewer({ version: '0.0.38.18166' }, { version: '0.0.38-18101', path: '/x' }), true);
  assert.strictEqual(U.isNewer({ version: '0.0.38.18166' }, { version: '0.0.38-18166', path: '/x' }), false);
  assert.strictEqual(U.isNewer({ version: '1.2' }, { version: '1.10', path: '/x' }), false);
});

test('RPCS3 says which build runs, only when its log is newer than the AppImage', () => {
  const H = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-up-'));
  const app = path.join(H, 'Applications/rpcs3.AppImage'), log = path.join(H, '.config/rpcs3/RPCS3.log');
  fs.mkdirSync(path.dirname(app), { recursive: true }); fs.mkdirSync(path.dirname(log), { recursive: true });
  fs.writeFileSync(app, 'x'); fs.writeFileSync(log, '·! 0:00:00.000000 SYS: RPCS3 v0.0.38-18101-1a2b3c4d Alpha | master\n');
  const save = process.env.XDG_CONFIG_HOME; delete process.env.XDG_CONFIG_HOME;
  try {
    const past = new Date(Date.now() - 864e5); fs.utimesSync(app, past, past);
    assert.strictEqual(U.ranVersion('rpcs3', app, H), '0.0.38-18101');
    const later = new Date(Date.now() + 60e3); fs.utimesSync(app, later, later);
    assert.strictEqual(U.ranVersion('rpcs3', app, H), '');
    assert.strictEqual(U.ranVersion('pcsx2', app, H), '');
  } finally { if (save !== undefined) process.env.XDG_CONFIG_HOME = save; }
});

test('a PS5 folder build is laid over its folder, keeping what the emulator keeps there', async () => {
  const H = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-fold-'));
  const src = path.join(H, 'src/sharpemu-0.0.3-linux-x64'), dir = path.join(H, 'Applications/SharpEmu');
  fs.mkdirSync(src, { recursive: true });
  const elf = Buffer.alloc(64); Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1]).copy(elf);
  fs.writeFileSync(path.join(src, 'SharpEmu'), elf); fs.writeFileSync(path.join(src, 'libSkiaSharp.so'), 'x');
  const tgz = path.join(H, 'sharpemu-0.0.3-linux-x64.tar.gz');
  require('child_process').execFileSync('tar', ['-czf', tgz, '-C', path.join(H, 'src'), 'sharpemu-0.0.3-linux-x64']);
  fs.mkdirSync(path.join(dir, 'user/savedata'), { recursive: true }); fs.writeFileSync(path.join(dir, 'user/savedata/s.bin'), 'save');
  await U.layFolder(tgz, dir, path.basename(tgz));
  assert.ok(fs.existsSync(path.join(dir, 'SharpEmu')) && fs.existsSync(path.join(dir, 'libSkiaSharp.so')));
  assert.strictEqual(fs.readFileSync(path.join(dir, 'user/savedata/s.bin'), 'utf8'), 'save');
  assert.ok(!fs.existsSync(dir + '.cartridge-new.d'));
  assert.strictEqual(U.installKind(path.join(dir, 'SharpEmu')), 'folder');
  assert.ok(U.REPOS.kytyps5.asset.test('KytyPS5-2026-10-05-72e4989-Linux-x86_64.tar.gz') && !U.REPOS.kytyps5.asset.test('KytyPS5-2026-10-05-72e4989-Windows-x64.zip'));
  assert.ok(U.REPOS.sharpemu.asset.test('sharpemu-0.0.2-beta.2-linux-x64.tar.gz') && !U.REPOS.sharpemu.asset.test('sharpemu-0.0.2-beta.2-osx-x64.tar.gz'));
});

test('shadPS4 launcher: its builds are all pre-releases, so the newest one is used, Linux zip found', async () => {
  const fetchImpl = async (url) => {
    if (/releases\?per_page/.test(url)) return { ok: true, status: 200, json: async () => [
      { tag_name: 'shadPS4QtLauncher-2026-10-04-abc', prerelease: true, published_at: '2026-10-04', assets: [
        { name: 'shadPS4QtLauncher-win64-qt-2026-10-04-abc.zip', browser_download_url: 'https://x/w.zip', size: 1 },
        { name: 'shadPS4QtLauncher-linux-qt-2026-10-04-abc.zip', browser_download_url: 'https://x/l.zip', size: 2 }] }] };
    if (/releases\/latest/.test(url)) return { ok: true, status: 200, json: async () => ({ tag_name: 'v.0.1.0-old', assets: [{ name: 'shadps4-win64.zip', browser_download_url: 'https://x/o.zip' }] }) };
    return { ok: false, status: 404 };
  };
  const rel = await U.latestRelease('shadps4', { fetchImpl, channel: 'stable' });
  assert.strictEqual(rel.url, 'https://x/l.zip');
  assert.deepStrictEqual(U.channelsOf('shadps4'), { def: 'pre', options: ['pre'] });
});
