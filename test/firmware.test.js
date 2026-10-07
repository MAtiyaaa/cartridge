// Firmware installs (0.9.52, run for real in the build container: RPCS3 0.0.43 with Sony's PS3 4.93 PUP, Vita3K build
// 4111 with Sony's Vita 3.74 PUP). RPCS3 writes "Successfully installed PS3 firmware" to its log and then ends with
// exit code 143 or stays open, so Cartridge judges by the log or the modules written, never by the exit code.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const run = (home, since) => JSON.parse(execFileSync(process.execPath, ['-e', `console.log(JSON.stringify(require(${JSON.stringify(path.join(ROOT, 'electron/pkgInstall.js'))}).rpcs3FwDone(${since}, '')))`], { env: { ...process.env, HOME: home, XDG_CONFIG_HOME: '', XDG_CACHE_HOME: '' }, encoding: 'utf8' }).trim());

test('RPCS3 firmware: done when its log says so, or when the modules were written during this run', () => {
  const H = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-fw-'));
  try {
    const since = Date.now();
    assert.strictEqual(run(H, since), null);
    fs.mkdirSync(path.join(H, '.cache/rpcs3'), { recursive: true });
    fs.writeFileSync(path.join(H, '.cache/rpcs3/RPCS3.log'), '·! TAR Loader: written file dev_flash/x\n·S 0:00:03.6 GUI: Successfully installed PS3 firmware version 4.93.\n');
    assert.deepStrictEqual(run(H, since), { version: '4.93' });
    fs.rmSync(path.join(H, '.cache'), { recursive: true });
    const mod = path.join(H, '.config/rpcs3/dev_flash/vsh/module');
    fs.mkdirSync(mod, { recursive: true });
    for (let i = 0; i < 60; i++) fs.writeFileSync(path.join(mod, `m${i}.sprx`), 'x');
    assert.deepStrictEqual(run(H, since), { version: null });
    assert.strictEqual(run(H, Date.now() + 60000), null, 'modules from an earlier install don’t count');
  } finally { fs.rmSync(H, { recursive: true, force: true }); }
});
