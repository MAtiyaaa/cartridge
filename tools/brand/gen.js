// Brand B (Marquee): a dark panel with the C cut out, lit orange from behind. Renders every asset.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const OUT = process.argv[2] || path.join(__dirname, 'out'); // node tools/brand/gen.js [folder]; then copy into steam-art/, build/icon.png, docs/social-preview.png
fs.mkdirSync(OUT, { recursive: true });
const FONT = require('fs').readdirSync(path.join(__dirname, '../../dist/assets')).filter((f) => /^archivo-latin-wdth/.test(f)).map((f) => path.join(__dirname, '../../dist/assets', f))[0]; // npx vite build first
const MB = 'M8 2h32a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6zM24 11a13 13 0 1 0 11.3 19.4l-5.6-3.2A6.6 6.6 0 1 1 29.7 20.8l5.6-3.2A13 13 0 0 0 24 11z';
const C = 'M24 11a13 13 0 1 0 11.3 19.4l-5.6-3.2A6.6 6.6 0 1 1 29.7 20.8l5.6-3.2A13 13 0 0 0 24 11z';
const defs = (fx) => `<defs>
 <radialGradient id="glow" cx=".18" cy=".28" r="1.05"><stop offset="0" stop-color="#FFB27A"/><stop offset=".32" stop-color="#F0582B"/><stop offset=".62" stop-color="#B8340F"/><stop offset="1" stop-color="#2a0b03"/></radialGradient>
 <radialGradient id="glowW" cx=".14" cy=".42" r=".95"><stop offset="0" stop-color="#FFB27A"/><stop offset=".28" stop-color="#EF4B23"/><stop offset=".7" stop-color="#2a0a02"/><stop offset="1" stop-color="#0D0E11"/></radialGradient>
 <filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="${fx}" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.02" result="fleck"/>
  <feComposite in="fleck" in2="SourceGraphic" operator="in" result="f2"/>
  <feTurbulence type="fractalNoise" baseFrequency="${fx * 0.8}" numOctaves="1" seed="3" result="m"/>
  <feColorMatrix in="m" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .24 -.07" result="lite"/>
  <feComposite in="lite" in2="SourceGraphic" operator="in" result="l2"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="l2"/><feMergeNode in="f2"/></feMerge>
 </filter></defs>`;
const page = (w, h, body, bg = '#0D0E11') => `<!doctype html><html><head><style>@font-face{font-family:Arch;src:url(file://${FONT}) format('woff2');font-weight:100 900;font-stretch:62% 125%}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${bg}}svg{display:block}</style></head><body>${body}</body></html>`;
const wm = (x, y, size, fill, anchor = 'start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arch" font-weight="850" font-stretch="96%" font-size="${size}" letter-spacing="${-size * 0.035}" fill="${fill}">Cartridge</text>`;
// the mark: lit square, dark panel over it with the C open
const markAt = (x, y, s, r = 0.125) => `<g transform="translate(${x} ${y}) scale(${s / 48})"><rect x="2" y="2" width="44" height="44" rx="6" fill="url(#glow)" filter="url(#grain)"/><path fill-rule="evenodd" fill="#121317" d="${MB}"/></g>`;
const icon = (s) => page(s, s, `<svg width="${s}" height="${s}" viewBox="0 0 512 512">${defs(0.9)}<rect width="512" height="512" rx="114" fill="url(#glow)" filter="url(#grain)"/><g transform="translate(40 40) scale(9)"><path fill-rule="evenodd" fill="#121317" d="${MB}"/></g></svg>`, 'transparent');
const ASSETS = {
  'icon.png': [512, 512, icon(512), true],
  'grid.png': [600, 900, page(600, 900, `<svg width="600" height="900">${defs(0.85)}<rect width="600" height="900" fill="url(#glow)" filter="url(#grain)"/><rect x="40" y="40" width="520" height="820" rx="28" fill="none" stroke="#121317" stroke-width="12"/><g transform="translate(220 250) scale(3.33)"><path fill-rule="evenodd" fill="#121317" d="${MB}"/></g>${wm(300, 560, 104, '#121317', 'middle')}</svg>`)],
  'hero.png': [1920, 620, page(1920, 620, `<svg width="1920" height="620">${defs(0.8)}<rect width="1920" height="620" fill="url(#glowW)" filter="url(#grain)"/><rect width="1920" height="44" fill="#121317"/><rect y="576" width="1920" height="44" fill="#121317"/></svg>`)],
  'wide.png': [920, 430, page(920, 430, `<svg width="920" height="430">${defs(0.85)}<rect width="920" height="430" fill="url(#glow)" filter="url(#grain)"/><rect x="24" y="24" width="872" height="382" rx="22" fill="none" stroke="#121317" stroke-width="8"/><g transform="translate(110 147) scale(2.83)"><path fill-rule="evenodd" fill="#121317" d="${MB}"/></g>${wm(282, 262, 118, '#121317')}</svg>`)],
  'logo.png': [1280, 400, page(1280, 400, `<svg width="1280" height="400">${defs(1.6)}${markAt(40, 100, 200)}${wm(290, 262, 196, '#F4F3EF')}</svg>`, 'transparent'), true],
  // README logo on GitHub's light theme: the same, with a dark wordmark
  'logo-light.png': [1280, 400, page(1280, 400, `<svg width="1280" height="400">${defs(1.6)}${markAt(40, 100, 200)}${wm(290, 262, 196, '#121317')}</svg>`, 'transparent'), true],
  'social.png': [1280, 640, page(1280, 640, `<svg width="1280" height="640">${defs(0.85)}<rect width="1280" height="640" fill="url(#glowW)" filter="url(#grain)"/>${markAt(96, 180, 150)}${wm(96, 430, 132, '#F4F3EF')}<text x="100" y="500" font-family="Arch" font-weight="500" font-size="34" fill="#F4F3EF" fill-opacity=".8">Your RomM library, set up for your controller.</text></svg>`)],
};
(async () => {
  const b = await pw.chromium.launch(); const p = await b.newPage();
  for (const [name, [w, h, html, clear]] of Object.entries(ASSETS)) {
    await p.setViewportSize({ width: w, height: h }); fs.writeFileSync(path.join(OUT, '_t.html'), html);
    await p.goto('file://' + path.join(OUT, '_t.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(OUT, name), omitBackground: !!clear });
  }
  await b.close(); console.log('done');
})();
