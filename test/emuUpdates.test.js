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
