// Tour check (0.9.51): runs the whole first-run tour the way a person would, doing each step's task, with the
// on-screen keyboard (Game Mode) and without (desktop). It fails when a step never finishes: a page's own buttons
// once caught the tour's Y (Achievements' Sort), the search step never saw search open and every step after hung.
// Usage: node tools/ui-audit/tour.js   (exits 1 when the tour gets stuck)
const { open } = require('./harness.js');

async function run(keyboard) {
  const { browser, page: p, errors } = await open({ ui: { keyboard } });
  await p.click('[data-tab="settings"]'); await p.waitForTimeout(500);
  await p.click('[data-key="sec-about"]').catch(() => {}); await p.waitForTimeout(500);
  await p.click('text=Take the Tour'); await p.waitForTimeout(1200);
  const title = () => p.evaluate(() => document.querySelector('.bubble h2, .bubble h3, .bubble b')?.textContent?.trim() || '');
  const seen = [];
  let last = '', same = 0;
  for (let n = 0; n < 40; n++) {
    const t = await title();
    if (!t) break; // the tour closed: finished
    if (t === last && ++same >= 3) { await browser.close(); return { ok: false, stuck: t, seen, errors }; }
    if (t !== last) { same = 0; seen.push(t); last = t; }
    const key = /Find Anything/.test(t) ? 'y' : /Close It/.test(t) ? 'Escape' : /Your Tabs/.test(t) ? 'PageDown' : /Downloads/.test(t) ? 'Control+j' : /Quick Menu/.test(t) ? 'm' : 'Enter';
    await p.keyboard.press(key); await p.waitForTimeout(key === 'm' ? 700 : 1100);
    if (key === 'm') { await p.keyboard.press('m'); await p.waitForTimeout(1100); }
  }
  await browser.close();
  return { ok: true, seen, errors };
}
module.exports = { run };
if (require.main === module) (async () => {
  let bad = 0;
  for (const kb of ['builtin', 'auto']) {
    const r = await run(kb);
    console.log(`== tour (${kb === 'builtin' ? 'on-screen keyboard' : 'desktop'}): ${r.ok ? `finished, ${r.seen.length} steps` : `stuck on "${r.stuck}"`}`);
    if (!r.ok) bad++;
    for (const e of r.errors.slice(0, 5)) console.log('  ERROR ' + e);
  }
  process.exitCode = bad ? 1 : 0;
})();
