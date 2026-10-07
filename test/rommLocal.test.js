// RomM on this device with several games folders (0.9.49): mounted together inside the container, console by console;
// a console in two folders is kept from the first and reported, never two mounts on one path.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const rl = require('../electron/rommLocal');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'cart-romm-'));
const mk = (root, ...names) => { for (const n of names) fs.mkdirSync(path.join(root, n), { recursive: true }); return fs.realpathSync(root); };

test('one games folder is RomM\'s roms folder', () => {
  const a = mk(tmp(), 'ps2', 'snes');
  const p = rl.planMounts([a], '/lib');
  assert.deepStrictEqual(p.mounts, [[a, '/romm/library/roms']]);
  assert.deepStrictEqual(p.conflicts, []);
});

test('several folders mount console by console; the first keeps a shared console', () => {
  const a = mk(tmp(), 'ps2', 'snes', '.hidden'), b = mk(tmp(), 'PS2', 'gc');
  const p = rl.planMounts([a, b], '/lib');
  assert.deepStrictEqual(p.mounts.map((m) => m[1]).sort(), ['/romm/library/roms/gc', '/romm/library/roms/ps2', '/romm/library/roms/snes']);
  assert.strictEqual(p.mounts.find((m) => m[1].endsWith('/ps2'))[0], path.join(a, 'ps2'));
  assert.deepStrictEqual(p.conflicts, [{ console: 'PS2', kept: a, skipped: b }]);
  assert.ok(p.make.includes(path.join('/lib', 'roms', 'gc')));
});

test('the same folder picked twice (a link to it) counts once', () => {
  const t = tmp(), a = mk(path.join(t, 'real'), 'ps2');
  fs.symlinkSync(a, path.join(t, 'link'));
  assert.deepStrictEqual(rl.planMounts([a, path.join(t, 'link')], '/lib').mounts, [[a, '/romm/library/roms']]);
});

test('the container gets the console mounts after the library', () => {
  const a = mk(tmp(), 'ps2'), b = mk(tmp(), 'gc');
  const d = rl.dirsOf({ roms: [a, b], dataDir: '/data' });
  const args = rl.rommArgs({ DB_PASSWD: 'x', AUTH_KEY: 'y' }, d);
  const vs = args.flatMap((x, i) => (x === '-v' ? [args[i + 1]] : []));
  assert.ok(vs.indexOf('/data/library:/romm/library') < vs.indexOf(`${path.join(b, 'gc')}:/romm/library/roms/gc`));
  assert.strictEqual(rl.dirsOf({ library: '/old', dataDir: '/data' }).library, '/old');
});
