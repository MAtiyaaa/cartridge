// Runs both UI audits in all six looks (Plain and Glass, in the Cartridge, Light and OLED colours). Before a release:
//   npx vite build && node tools/ui-audit/run.js
// Needs Playwright with a Chromium (CHROMIUM=/path/to/chrome to pick one). Exits 1 when a focus can't be seen.
const focus = require('./focus.js'), contrast = require('./contrast.js');
const { LOOKS } = require('./harness.js');
(async () => {
  let hidden = 0;
  for (const [th, st] of LOOKS) {
    const f = await focus(th, st), c = await contrast(th, st);
    hidden += f.bad.length;
    console.log(`== ${th} ${st}: ${f.bad.length} focus hard to see, ${c.bad.length} low-contrast texts to look at${f.errors.length ? `, ${f.errors.length} page errors` : ''}`);
    for (const x of f.bad) console.log('  FOCUS ' + x);
    for (const x of c.bad) console.log('  TEXT  ' + x);
    for (const e of f.errors) console.log('  ERROR ' + e);
  }
  process.exitCode = hidden ? 1 : 0;
})();
