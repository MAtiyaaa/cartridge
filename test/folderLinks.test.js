// Linked Folders (0.9.33): a fork's save folder linked to the original's, its own folder kept aside and put back.
// Run with: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('../electron/folderLinks');

const H = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-links-')));
test.after(() => fs.rmSync(H, { recursive: true, force: true }));
const mk = (p, files = {}) => { fs.mkdirSync(path.join(H, p), { recursive: true }); for (const [n, t] of Object.entries(files)) fs.writeFileSync(path.join(H, p, n), t); };

test('a portable fork is found beside its program, by the save folder\'s top folder', () => {
  mk('Applications/GR2/user/savedata');
  fs.writeFileSync(path.join(H, 'Applications/GR2/shadPS4-GR2.AppImage'), '');
  const b = L.findForkBase(path.join(H, 'Applications/GR2/shadPS4-GR2.AppImage'), 'user/savedata', H);
  assert.deepStrictEqual(b, { base: path.join(H, 'Applications/GR2'), how: 'portable' });
});
test('a fork with its own folder in ~/.local/share is found by its name', () => {
  mk('.local/share/shadPS4-BB/user');
  fs.writeFileSync(path.join(H, 'Applications/shadPS4-BB-v0.5.0-x86_64.AppImage'), '');
  const b = L.findForkBase(path.join(H, 'Applications/shadPS4-BB-v0.5.0-x86_64.AppImage'), 'user/savedata', H);
  assert.deepStrictEqual(b, { base: path.join(H, '.local/share/shadPS4-BB'), how: 'own' });
});
test('linking keeps the fork\'s own saves aside, unlinking puts them back exactly', () => {
  mk('.local/share/shadPS4/user/savedata/CUSA00001', { 'save.dat': 'donor' });
  mk('Applications/GR2/user/savedata/CUSA00002', { 'save.dat': 'fork' });
  const from = path.join(H, 'Applications/GR2/user/savedata'), to = path.join(H, '.local/share/shadPS4/user/savedata');
  assert.strictEqual(L.status(from, to).state, 'folder');
  const r = L.link(from, to, H);
  assert.strictEqual(r.kept, from + '.cartridge-kept');
  assert.ok(fs.lstatSync(from).isSymbolicLink());
  assert.strictEqual(fs.readFileSync(path.join(from, 'CUSA00001/save.dat'), 'utf8'), 'donor');
  assert.strictEqual(L.status(from, to).state, 'linked');
  assert.strictEqual(L.link(from, to, H).already, true);
  L.unlink({ from, to, kept: r.kept });
  assert.ok(!fs.lstatSync(from).isSymbolicLink());
  assert.strictEqual(fs.readFileSync(path.join(from, 'CUSA00002/save.dat'), 'utf8'), 'fork');
  assert.strictEqual(fs.readFileSync(path.join(to, 'CUSA00001/save.dat'), 'utf8'), 'donor');
});
test('a missing fork folder is created as the link; removing it leaves an empty folder', () => {
  mk('.local/share/eden/nand/user/save');
  const from = path.join(H, 'Applications/citron/user/nand/user/save'), to = path.join(H, '.local/share/eden/nand/user/save');
  assert.strictEqual(L.status(from, to).state, 'missing');
  const r = L.link(from, to, H);
  assert.strictEqual(r.kept, null);
  L.unlink({ from, to, kept: null });
  assert.ok(fs.statSync(from).isDirectory());
});
test('refuses home itself, folders inside each other, other links and a folder already set aside', () => {
  const to = path.join(H, '.local/share/shadPS4/user/savedata');
  assert.match(L.check(path.join(H, 'x'), to, '/nowhere'), /home folder/);
  assert.match(L.check(path.join(to, 'sub'), to, H), /inside/);
  mk('other'); mk('linkdir/a');
  fs.symlinkSync(path.join(H, 'other'), path.join(H, 'linkdir/b'));
  assert.throws(() => L.link(path.join(H, 'linkdir/b'), to, H), /already a link/);
  mk('linkdir/a.cartridge-kept');
  assert.throws(() => L.link(path.join(H, 'linkdir/a'), to, H), /already there/);
  assert.ok(fs.statSync(path.join(H, 'linkdir/a')).isDirectory());
  assert.throws(() => L.unlink({ from: path.join(H, 'linkdir/a'), to }), /left as it is/);
});
