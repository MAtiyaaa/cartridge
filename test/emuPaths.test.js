// Emulator folders (0.9.24): read and change only the folder's line, in each emulator's own format
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const P = require('../electron/emuPaths');

function home() {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-paths-'));
  process.env.XDG_CONFIG_HOME = path.join(h, '.config'); process.env.XDG_DATA_HOME = path.join(h, '.local/share');
  return h;
}

test('ini: repeated keys and a single key are replaced in place, other lines kept', () => {
  let t = '[Folders]\nBios = bios\nKeep = 1\n[GameList]\nRecursivePaths = /a\nRecursivePaths = /b\n';
  assert.deepStrictEqual(P.iniAll(t, 'GameList', 'RecursivePaths'), ['/a', '/b']);
  t = P.iniSet(t, 'GameList', 'RecursivePaths', ['/c']);
  assert.deepStrictEqual(P.iniAll(t, 'GameList', 'RecursivePaths'), ['/c']);
  t = P.iniSet(t, 'Folders', 'Bios', ['/x/bios']);
  assert.match(t, /Bios = \/x\/bios\nKeep = 1/);
  t = P.iniSet(t, 'New', 'K', ['v']);
  assert.match(t, /\[New\]\nK = v/);
});

test('PCSX2 folders read relative to its folder, and a change writes PCSX2.ini', () => {
  const h = home(), root = path.join(h, '.config/PCSX2');
  fs.mkdirSync(path.join(root, 'inis'), { recursive: true });
  fs.writeFileSync(path.join(root, 'inis/PCSX2.ini'), '[Folders]\nBios = bios\nMemoryCards = memcards\n[GameList]\nRecursivePaths = /games/ps2\n');
  const d = P.describe('pcsx2', h);
  assert.strictEqual(d.items.find((x) => x.id === 'Folders.Bios').path, path.join(root, 'bios'));
  assert.deepStrictEqual(d.items.find((x) => x.id === 'GameList.RecursivePaths').value, ['/games/ps2']);
  P.setPath('pcsx2', 'Folders.MemoryCards', path.join(h, 'saves'), h);
  const t = fs.readFileSync(path.join(root, 'inis/PCSX2.ini'), 'utf8');
  assert.match(t, new RegExp('MemoryCards = ' + path.join(h, 'saves')));
  assert.ok(fs.existsSync(path.join(root, 'inis/PCSX2.ini.cartridge-bak')));
});

test('RPCS3 vfs.yml keeps $(EmulatorDir) and Eden writes the default flag', () => {
  const h = home(), r = path.join(h, '.config/rpcs3');
  fs.mkdirSync(path.join(r, 'config'), { recursive: true }); fs.mkdirSync(path.join(r, 'patches'));
  fs.writeFileSync(path.join(r, 'config/vfs.yml'), '$(EmulatorDir): ""\n/dev_hdd0/: $(EmulatorDir)dev_hdd0/\n/games/: $(EmulatorDir)games/\n');
  assert.strictEqual(P.describe('rpcs3', h).items[0].path, path.join(r, 'dev_hdd0'));
  // paths inside the test home: setPath makes the new folder, and CI runs as a normal user (no /mnt)
  const big = path.join(h, 'big/hdd0'), nand = path.join(h, 'nand');
  P.setPath('rpcs3', '/dev_hdd0/', big, h);
  assert.ok(fs.readFileSync(path.join(r, 'config/vfs.yml'), 'utf8').split('\n').includes(`/dev_hdd0/: ${big}/`));
  const e = path.join(h, '.config/eden'); fs.mkdirSync(e, { recursive: true });
  fs.writeFileSync(path.join(e, 'qt-config.ini'), '[Data%20Storage]\nnand_directory\\default=true\nnand_directory=/old/nand/\n');
  P.setPath('eden', 'Data%20Storage.nand_directory', nand, h);
  const t = fs.readFileSync(path.join(e, 'qt-config.ini'), 'utf8');
  assert.ok(t.split('\n').includes(`nand_directory=${nand}/`)); assert.match(t, /^nand_directory\\default=false$/m);
});

test('TOML lists for shadPS4', () => {
  let t = '[General]\nx = 1\n[GUI]\ninstallDirs = ["/a"]\n';
  assert.deepStrictEqual(P.tomlGet(t, 'GUI', 'installDirs'), ['/a']);
  t = P.tomlSet(t, 'GUI', 'installDirs', ['/a', '/b']);
  assert.deepStrictEqual(P.tomlGet(t, 'GUI', 'installDirs'), ['/a', '/b']);
  t = P.tomlSet(t, 'GUI', 'addonInstallDir', '/dlc');
  assert.strictEqual(P.tomlGet(t, 'GUI', 'addonInstallDir'), '/dlc');
});
