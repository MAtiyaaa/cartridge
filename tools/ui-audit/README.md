# UI audits

Checks a person used to do by eye, run by a script before every release (0.9.47, after the owner kept finding the
same kinds of mistake: a focus that can't be seen in one colour, a chosen state that looks like focus, pale text on
Light). They load the built UI in Chromium with fake data (`harness.js`), so no Electron, RomM server or controller
is needed. Nothing here ships in the AppImage.

```
npx vite build
npm run audit:ui            # both audits, all six looks; exits 1 if a focus can't be seen
npm run audit:visual        # screenshots against the last release (report in .ui-audit/visual/)
node tools/ui-audit/focus.js light glass     # one audit, one look
node tools/ui-audit/contrast.js oled plain
```

Needs Playwright (`npm i -g playwright`, or a local copy) and a Chromium; `CHROMIUM=/path/to/chrome` picks one.

- `focus.js`: focuses (as a controller does) the first two of every kind of focusable thing on Start, Home, Library,
  Consoles, Achievements, Downloads, every Settings section, the game page and its More sheet, and compares the pixels
  around it before and after. Less than 4% changed, and less than a 1.2 px ring's worth, is reported. This is the
  check that would have caught the Light focus rings lost to a shadow rule, the chosen swatch that looked focused,
  and the clock tile's white ring on a day sky.
- `contrast.js`: text under 2.6:1 against the solid colour behind it, plain and focused. Text over pictures,
  gradients or blurred glass is skipped, so read each line before changing anything: some are the measurement, not
  the page.
- The looks: Plain and Glass, each in the Cartridge, Light and OLED colours (`LOOKS` in `harness.js`).

- `styleModes.js` (also run by `npm test`): no Liquid Glass token or see-through (backdrop-filter) outside Glass, no
  Plain token outside Plain. It found two leaks when it was written (the collection badge and the welcome keyboard
  were frosted in Plain too).
- `visual.js` (`npm run audit:visual`): builds the last release (`origin/main`, or `--base <ref>`) in a temporary git
  worktree, screenshots ten screens in all six looks from both builds with a fixed clock and no motion, and writes
  `.ui-audit/visual/report.html` with the before, after and difference pictures of every screen that changed.
  `--strict` makes any change an error. A change you meant is fine: the report is there so nothing changes unseen.

What they don't check: motion, real artwork, the Welcome, sizes other than 1280x800, touch. The real app against a
mock RomM (docs/HANDOVER-0.9.22-to-0.9.37.md) covers navigation; a device covers the rest.
