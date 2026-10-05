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

// 0.9.32 (owner: a GR2 fork with only a Linux .zip)
test('no AppImage: the Linux x86_64 archive, never Windows, macOS, ARM or the source', () => {
  const C = require('../electron/customEmu');
  assert.strictEqual(C.pickArchive([{ name: 'GR2-windows-x64.zip' }, { name: 'GR2-macos-universal.zip' }, { name: 'GR2-linux-aarch64.zip' }, { name: 'GR2-linux-x64.zip' }, { name: 'source.tar.gz' }])?.name, 'GR2-linux-x64.zip');
  assert.strictEqual(C.pickArchive([{ name: 'emu-win64.7z' }, { name: 'emu-darwin.tar.xz' }]), null);
  assert.strictEqual(C.pickArchive([{ name: 'emu.tar.gz' }])?.name, 'emu.tar.gz');
});
test('in the unpacked folder: AppImages first, else programs; libraries and helpers left out', () => {
  const C = require('../electron/customEmu');
  const f = (rel, o = {}) => ({ rel, size: 5e6, appimage: false, elf: false, ...o });
  assert.deepStrictEqual(C.programsIn([f('GR2/shadPS4.AppImage', { appimage: true }), f('GR2/Updater.AppImage', { appimage: true }), f('GR2/lib/libfoo.so', { elf: true })]).map((x) => x.rel), ['GR2/shadPS4.AppImage']);
  assert.deepStrictEqual(C.programsIn([f('bin/emu', { elf: true }), f('bin/emu-crash-handler', { elf: true }), f('lib/libQt.so.6', { elf: true }), f('README.txt')]).map((x) => x.rel), ['bin/emu']);
});
