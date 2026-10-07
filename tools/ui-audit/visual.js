// Visual check (0.9.48): every main page, each Settings section that changes most, the game page and its More sheet,
// in all six looks (Plain and Glass with the Cartridge, Light and OLED colours), screenshotted from this build and from
// the last release's build, and compared pixel by pixel. Anything that changed is listed with a picture of the
// difference, so a change nobody meant (a lost focus ring, a Glass rule showing in Plain, text that moved) is seen
// before a release, not by the owner on the TV.
//   npx vite build && node tools/ui-audit/visual.js            compare with origin/main (the last release)
//   node tools/ui-audit/visual.js --base v0.9.40               compare with any git ref
//   node tools/ui-audit/visual.js --strict                     exit 1 when anything changed
// The report (report.html, with the before, after and difference pictures) goes to .ui-audit/visual/ (not committed).
// Time is fixed and motion is off on both sides, the background is Still, and the data is the harness's fake library.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { PNG } = require('pngjs');
const { open, LOOKS } = require('./harness.js');

const ROOT = path.join(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'origin/main'), OUT = path.resolve(arg('--out', path.join(ROOT, '.ui-audit/visual'))), STRICT = process.argv.includes('--strict');
const PAGES = [
  ['start', async (p) => p.click('[data-tab="start"]')],
  ['home', async (p) => p.click('[data-tab="home"]')],
  ['library', async (p) => p.click('[data-tab="library"]')],
  ['consoles', async (p) => p.click('[data-tab="consoles"]')],
  ['achievements', async (p) => p.click('[data-tab="achievements"]')],
  ['downloads', async (p) => p.click('[data-tab="downloads"]')],
  ['settings-look', async (p) => { await p.click('[data-tab="settings"]'); await p.waitForTimeout(300); await p.click('[data-key="sec-ui"]'); }],
  ['settings-emulators', async (p) => { await p.click('[data-tab="settings"]'); await p.waitForTimeout(300); await p.click('[data-key="sec-emu"]'); }],
  ['game', async (p) => { await p.click('[data-tab="library"]'); await p.waitForTimeout(500); await p.locator('.card').first().click(); }],
  ['game-more', async (p) => { await p.click('[data-tab="library"]'); await p.waitForTimeout(500); await p.locator('.card').first().click(); await p.waitForTimeout(800); await p.keyboard.press('y'); }],
];

function buildBase() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-base-'));
  execFileSync('git', ['worktree', 'add', '--detach', dir, BASE], { cwd: ROOT, stdio: 'ignore' });
  try {
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
    execFileSync('npx', ['vite', 'build', '--outDir', path.join(dir, 'dist-base'), '--emptyOutDir'], { cwd: dir, stdio: 'ignore' });
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-base-dist-'));
    fs.cpSync(path.join(dir, 'dist-base'), out, { recursive: true });
    return out;
  } finally { try { execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT, stdio: 'ignore' }); } catch {} }
}
async function shots(dist, tag) {
  const res = {};
  for (const [theme, style] of LOOKS) {
    const { browser, page } = await open({ theme, style, bg: 'solid', dist, freeze: true });
    for (const [name, go] of PAGES) {
      try {
        await go(page); await page.waitForTimeout(900);
        const f = path.join(OUT, `${theme}-${style}-${name}.${tag}.png`);
        await page.screenshot({ path: f, animations: 'disabled' });
        res[`${theme}-${style}-${name}`] = f;
        await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(200);
      } catch (e) { res[`${theme}-${style}-${name}`] = null; }
    }
    await browser.close();
  }
  return res;
}
function diff(a, b, out) {
  const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b));
  if (A.width !== B.width || A.height !== B.height) return 1;
  const D = new PNG({ width: A.width, height: A.height });
  let n = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    const hit = d > 40; if (hit) n++;
    const g = (A.data[i] + A.data[i + 1] + A.data[i + 2]) / 12;
    D.data[i] = hit ? 255 : g; D.data[i + 1] = hit ? 40 : g; D.data[i + 2] = hit ? 60 : g; D.data[i + 3] = 255;
  }
  fs.writeFileSync(out, PNG.sync.write(D));
  return n / (A.width * A.height);
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`Building ${BASE} for comparison...`);
  const baseDist = buildBase();
  const before = await shots(baseDist, 'before'), after = await shots(path.join(ROOT, 'dist'), 'after');
  const rows = [];
  for (const k of Object.keys(after)) {
    if (!before[k] || !after[k]) { rows.push({ k, pct: null }); continue; }
    const pct = diff(before[k], after[k], path.join(OUT, `${k}.diff.png`));
    rows.push({ k, pct });
  }
  const changed = rows.filter((r) => r.pct == null || r.pct > 0.003).sort((a, b) => (b.pct ?? 1) - (a.pct ?? 1));
  const html = `<!doctype html><meta charset="utf-8"><title>Visual check</title><style>body{font:14px system-ui;background:#111;color:#eee;margin:16px}img{width:32%;margin:0 .5% 12px 0;border:1px solid #333}h2{font-size:15px;margin:18px 0 6px}</style><h1>Visual check against ${BASE}</h1><p>${changed.length} of ${rows.length} screens changed.</p>${changed.map((r) => `<h2>${r.k} · ${r.pct == null ? 'could not be taken' : (r.pct * 100).toFixed(2) + '% changed'}</h2><img src="${r.k}.before.png"><img src="${r.k}.after.png"><img src="${r.k}.diff.png">`).join('')}`;
  fs.writeFileSync(path.join(OUT, 'report.html'), html);
  console.log(`${changed.length} of ${rows.length} screens changed against ${BASE}.`);
  for (const r of changed) console.log(`  ${r.k}: ${r.pct == null ? 'could not be taken' : (r.pct * 100).toFixed(2) + '%'}`);
  console.log('Report: ' + path.join(OUT, 'report.html'));
  fs.rmSync(baseDist, { recursive: true, force: true });
  process.exitCode = STRICT && changed.length ? 1 : 0;
})();
