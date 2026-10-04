// Emulators from a GitHub link (0.9.24): the repo from any link, the right AppImage from a release
const test = require('node:test');
const assert = require('node:assert');
const C = require('../electron/customEmu');

test('repo from links and the x86_64 AppImage from a release', () => {
  assert.strictEqual(C.repoOf('https://github.com/shadps4-emu/shadPS4/releases/tag/v.0.10.0'), 'shadps4-emu/shadPS4');
  assert.strictEqual(C.repoOf('github.com/PCSX2/pcsx2.git'), 'PCSX2/pcsx2');
  assert.strictEqual(C.repoOf('Owner/Fork-Emu'), 'Owner/Fork-Emu');
  assert.strictEqual(C.repoOf('https://gitlab.com/a/b'), null);
  const a = C.pickAsset([{ name: 'emu-aarch64.AppImage' }, { name: 'emu-x86_64.AppImage.zsync' }, { name: 'emu-debug-x86_64.AppImage' }, { name: 'emu-x86_64.AppImage' }, { name: 'emu.tar.gz' }]);
  assert.strictEqual(a.name, 'emu-x86_64.AppImage');
  assert.strictEqual(C.pickAsset([{ name: 'emu.zip' }]), null);
  assert.strictEqual(C.fileName('Owner/Fork-Emu'), 'Fork-Emu.AppImage');
});
