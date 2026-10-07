// Android launcher icons from Cartridge's brand (0.9.53 "Marquee", as tools/brand/gen.js draws the app icon): the lit
// orange square is the adaptive icon's background layer, the dark panel with the C cut out its foreground; the legacy and
// round icons are the whole picture. node scripts/android-icons.js (needs Playwright, as gen.js).
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const RES = path.join(__dirname, '../android/app/src/main/res');
const MB = 'M8 2h32a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6zM24 11a13 13 0 1 0 11.3 19.4l-5.6-3.2A6.6 6.6 0 1 1 29.7 20.8l5.6-3.2A13 13 0 0 0 24 11z';
const defs = (fx) => `<defs>
 <radialGradient id="glow" cx=".18" cy=".28" r="1.05"><stop offset="0" stop-color="#FFB27A"/><stop offset=".32" stop-color="#F0582B"/><stop offset=".62" stop-color="#B8340F"/><stop offset="1" stop-color="#2a0b03"/></radialGradient>
 <filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="${fx}" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.02" result="fleck"/>
  <feComposite in="fleck" in2="SourceGraphic" operator="in" result="f2"/>
  <feTurbulence type="fractalNoise" baseFrequency="${fx * 0.8}" numOctaves="1" seed="3" result="m"/>
  <feColorMatrix in="m" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .24 -.07" result="lite"/>
  <feComposite in="lite" in2="SourceGraphic" operator="in" result="l2"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="l2"/><feMergeNode in="f2"/></feMerge>
 </filter></defs>`;
// the panel (48-unit path, 44 wide) at `w` of a 512 canvas, centred
const panel = (w) => { const s = w / 44, t = (512 - w) / 2 - 2 * s; return `<g transform="translate(${t} ${t}) scale(${s})"><path fill-rule="evenodd" fill="#121317" d="${MB}"/></g>`; };
const svg = (body) => `<!doctype html><html><head><style>html,body{margin:0;width:512px;height:512px;overflow:hidden;background:transparent}svg{display:block}</style></head><body><svg width="512" height="512" viewBox="0 0 512 512">${defs(0.9)}${body}</svg></body></html>`;
const PICS = {
  ic_launcher: svg(`<rect width="512" height="512" rx="114" fill="url(#glow)" filter="url(#grain)"/>${panel(396)}`), // as the app icon
  ic_launcher_round: svg(`<circle cx="256" cy="256" r="256" fill="url(#glow)" filter="url(#grain)"/>${panel(330)}`),
  ic_launcher_background: svg(`<rect width="512" height="512" fill="url(#glow)" filter="url(#grain)"/>`), // 108dp layer, full bleed
  ic_launcher_foreground: svg(panel(236)), // 50dp of the 72dp the launcher shows, the glow round it as on the app icon
};
const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
(async () => {
  const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  const tmp = path.join(require('os').tmpdir(), 'cartridge-icons'); fs.mkdirSync(tmp, { recursive: true });
  for (const [name, html] of Object.entries(PICS)) {
    const layer = /_(fore|back)ground$/.test(name), dp = layer ? 108 : 48;
    for (const [d, k] of Object.entries(DPI)) {
      const px = Math.round(dp * k);
      await p.setViewportSize({ width: 512, height: 512 }); fs.writeFileSync(path.join(tmp, 'i.html'), html);
      await p.goto('file://' + path.join(tmp, 'i.html')); await p.waitForTimeout(80);
      await p.screenshot({ path: path.join(tmp, 'full.png'), omitBackground: true });
      // scaled down by the browser for a clean result
      await p.setContent(`<html><body style="margin:0;background:transparent"><img src="data:image/png;base64,${fs.readFileSync(path.join(tmp, 'full.png')).toString('base64')}" style="width:${px}px;height:${px}px;display:block"></body></html>`);
      await p.setViewportSize({ width: px, height: px });
      await p.screenshot({ path: path.join(RES, 'mipmap-' + d, name + '.png'), omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
    }
  }
  await b.close(); console.log('Android icons written');
})();
