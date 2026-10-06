// 0.9.38: installing Flatpak when it's missing takes the password typed in Cartridge (sudo -S), never
// waits for a desktop password window (pkexec hung in Game Mode), and says why when it fails.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// a PATH holding only what the test gives: sh and its basics, a fake sudo and apt-get
function fakeBin({ sudo }) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-'));
  for (const b of ['sh', 'cat', 'chmod', 'mkdir', 'sleep', 'echo', 'printf', 'test', '[']) { const w = require('child_process').execSync(`command -v ${b} || true`, { shell: '/bin/sh' }).toString().trim(); if (w && w.startsWith('/')) fs.symlinkSync(w, path.join(bin, b)); }
  // apt-get "installs" flatpak by writing a flatpak program into the same folder
  fs.writeFileSync(path.join(bin, 'apt-get'), `#!/bin/sh\necho "Setting up flatpak"\nprintf '#!/bin/sh\\nexit 0\\n' > "${bin}/flatpak"\nchmod +x "${bin}/flatpak"\n`);
  fs.writeFileSync(path.join(bin, 'sudo'), sudo);
  for (const f of ['apt-get', 'sudo']) fs.chmodSync(path.join(bin, f), 0o755);
  return bin;
}
const fresh = () => { delete require.cache[require.resolve('../electron/emuGet.js')]; return require('../electron/emuGet.js'); };
// the fake sudo reads the password from stdin like sudo -S, then runs what follows --
const SUDO = (pass) => `#!/bin/sh\nread p\nif [ "$p" != "${pass}" ]; then echo "Sorry, try again." >&2; exit 1; fi\nwhile [ "$1" != "--" ]; do shift; done; shift\nexec "$@"\n`;

test('Flatpak: installed with the password typed in Cartridge', async () => {
  const bin = fakeBin({ sudo: SUDO('secret') }), old = process.env.PATH;
  process.env.PATH = bin;
  try {
    const G = fresh();
    assert.deepStrictEqual(G.flatpakPlan(), { cmd: ['apt-get', 'install', '-y', 'flatpak'], pm: 'apt-get' });
    await assert.rejects(G.ensureFlatpak(() => {}, null), /needs your password/);
    const r = await G.ensureFlatpak(() => {}, 'secret');
    assert.strictEqual(r.installed, true);
  } finally { process.env.PATH = old; }
});

test('Flatpak: a wrong password says so, and nothing hangs', async () => {
  const bin = fakeBin({ sudo: SUDO('secret') }), old = process.env.PATH;
  process.env.PATH = bin;
  try {
    const G = fresh();
    await assert.rejects(G.ensureFlatpak(() => {}, 'nope'), /password wasn’t right/);
  } finally { process.env.PATH = old; }
});

test('Flatpak: without sudo the command to run is given', () => {
  const bin = fakeBin({ sudo: '#!/bin/sh\nexit 1\n' }), old = process.env.PATH;
  fs.rmSync(path.join(bin, 'sudo'));
  process.env.PATH = bin;
  try { assert.match(fresh().flatpakPlan().why, /apt-get install -y flatpak/); } finally { process.env.PATH = old; }
});
