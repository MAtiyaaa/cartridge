// Steam shortcuts: the folder shadPS4 starts in (0.9.3, A10). shadPS4 and its Qt launcher use a "user"
// folder in the folder they start in, else ~/.local/share/shadPS4. Each case runs in its own process
// so HOME is read fresh. Run with: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-steam-'));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// the Start in a shadPS4 shortcut gets, for a home built from a list of folders
function startFor(name, dirs) {
  const H = path.join(TMP, name);
  for (const d of ['Documents/Apps', ...dirs]) fs.mkdirSync(path.join(H, d), { recursive: true });
  const code = `
    const sm = require(${JSON.stringify(path.join(ROOT, 'electron/steamManager.js'))})({ USER_DATA: ${JSON.stringify(H + '/cfg')}, log() {}, PLATFORM_MAP: {}, getConfig: () => ({}), saveConfig() {}, broadcast() {},
      emulationRoots: () => [], getLibrary: () => null, installed: () => ({}), romById: () => null, isGamescope: () => false, artFor: () => ({}), MARKED: 'm', markedPath: () => null });
    const apps = ${JSON.stringify(path.join(H, 'Documents/Apps'))};
    console.log(sm._startOf({ exe: apps + '/shadPS4QtLauncher-qt.AppImage', start: apps }).replace(${JSON.stringify(H)}, '~'));`;
  fs.mkdirSync(H + '/cfg', { recursive: true });
  return execFileSync(process.execPath, ['-e', code], { env: { ...process.env, HOME: H, XDG_DATA_HOME: '' }, encoding: 'utf8' }).trim().split('\n').pop();
}

test('never next to the AppImage, as shadPS4\'s own shortcuts (they start inside its temporary mount)', () => {
  assert.strictEqual(startFor('plain', ['.local/share/shadPS4', '.local/share/shadPS4QtLauncher']), '~/.local/share/shadPS4QtLauncher');
  assert.strictEqual(startFor('fresh', []), '~');
});
test('a stray user folder next to the AppImage is avoided when shadPS4 has its normal data folder', () => {
  assert.strictEqual(startFor('stray', ['Documents/Apps/user', '.local/share/shadPS4', '.local/share/shadPS4QtLauncher']), '~/.local/share/shadPS4QtLauncher');
  assert.strictEqual(startFor('stray2', ['Documents/Apps/user', '.local/share/shadPS4']), '~/.local/share/shadPS4');
});
test('a portable install (its user folder is the only shadPS4 data) keeps starting there', () => {
  assert.strictEqual(startFor('portable', ['Documents/Apps/user']), '~/Documents/Apps');
});
