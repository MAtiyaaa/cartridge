// Runs the UI audits: focus and contrast in all six looks (Plain and Glass, in the Cartridge, Light and OLED colours). Before a release:
//   npx vite build && node tools/ui-audit/run.js
// then clipping (0.9.49: text its box cuts off, every page and widget at 1280x800 and 1920x1080).
// Needs Playwright with a Chromium (CHROMIUM=/path/to/chrome to pick one). Exits 1 when a focus can't be seen or a text is cut.
const focus = require('./focus.js'), contrast = require('./contrast.js'), clipping = require('./clipping.js'), tour = require('./tour.js');
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
  let cut = 0;
  for (const [w, h] of [[1280, 800], [1920, 1080]]) for (const r of [await clipping.pages(w, h), await clipping.widgets(w, h)]) { cut += r.bad.length; for (const x of r.bad) console.log('  CUT   ' + x); }
  console.log(`== clipping: ${cut} cut text${cut === 1 ? '' : 's'}`);
  let stuck = 0;
  for (const kb of ['builtin', 'auto']) { const r = await tour.run(kb); if (!r.ok) stuck++; console.log(`== tour (${kb}): ${r.ok ? 'finished' : 'stuck on ' + r.stuck}`); }
  process.exitCode = hidden || cut || stuck ? 1 : 0;
})();
