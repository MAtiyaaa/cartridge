// Cartridge Installer links (0.9.24): Emulation/saves and storage point at the emulator's own folders,
// nothing already there is replaced and nothing is made inside the emulator's folders
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path');
const L = require('../electron/esdeLinks');

test('links follow the install kind and never replace what is there', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'esde-')), root = path.join(home, 'Emulation');
  fs.mkdirSync(path.join(root, 'saves', 'pcsx2', 'saves'), { recursive: true }); // the user's own folder
  const n = L.make('pcsx2', { root, home, kind: 'flatpak' });
  assert.strictEqual(n, 3); // states, textures, cheats; saves was already a folder
  assert.ok(fs.statSync(path.join(root, 'saves', 'pcsx2', 'saves')).isDirectory());
  assert.strictEqual(fs.readlinkSync(path.join(root, 'saves', 'pcsx2', 'states')), path.join(home, '.var/app/net.pcsx2.PCSX2/config/PCSX2/sstates'));
  assert.ok(!fs.existsSync(path.join(home, '.var'))); // nothing made in the emulator's folders
  assert.strictEqual(L.make('pcsx2', { root, home, kind: 'flatpak' }), 0);
  assert.strictEqual(L.plan('dolphin', { root, home, kind: 'appimage' })[0].target, path.join(home, '.local/share/dolphin-emu/GC'));
  assert.deepStrictEqual(L.plan('unknown', { root, home }), []);
  fs.rmSync(home, { recursive: true, force: true });
});
