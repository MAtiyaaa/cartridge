// Animated backgrounds. Each renderer is set up once per canvas size / palette and then draws a
// frame for a given time. They are all original designs, only loosely inspired by console menus,
// and they are kept cheap: a handful of paths or pre-rendered sprites per frame, no CSS filters.

const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
function sprite(color, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  r.addColorStop(0, rgba(color, 1));
  r.addColorStop(0.35, rgba(color, 0.55));
  r.addColorStop(1, rgba(color, 0));
  g.fillStyle = r;
  g.fillRect(0, 0, size, size);
  return c;
}
// deterministic pseudo random, so a reduced-motion still frame looks the same every time
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// PSP-style XMB ribbons (the original Cartridge background)
function waves(g, w, h, S) {
  const WAVES = [
    { a: 0.09, k: 1.6, s: 0.10, y: 0.58, h: 0.16, al: 0.10 },
    { a: 0.07, k: 2.3, s: -0.07, y: 0.62, h: 0.10, al: 0.08 },
    { a: 0.11, k: 1.1, s: 0.05, y: 0.55, h: 0.22, al: 0.06 },
    { a: 0.05, k: 3.1, s: 0.13, y: 0.64, h: 0.05, al: 0.12 },
  ];
  const STEP = 18;
  const grads = WAVES.map((wv) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.3, `rgba(255,255,255,${wv.al})`);
    gr.addColorStop(0.7, `rgba(255,255,255,${wv.al * 1.3})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    return gr;
  });
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    WAVES.forEach((wv, wi) => {
      const top = [], bot = [];
      for (let x = 0; x <= w + STEP; x += STEP) {
        const u = x / w;
        const base = wv.y * h + Math.sin(u * Math.PI * wv.k + time * wv.s * 6) * wv.a * h + Math.sin(u * Math.PI * wv.k * 0.5 - time * wv.s * 3) * wv.a * 0.5 * h;
        const thick = wv.h * h * (0.55 + 0.45 * Math.sin(u * Math.PI * 1.3 + time * wv.s * 4));
        top.push(x, base - thick / 2); bot.push(x, base + thick / 2);
      }
      g.beginPath();
      for (let i = 0; i < top.length; i += 2) (i ? g.lineTo(top[i], top[i + 1]) : g.moveTo(top[i], top[i + 1]));
      for (let i = bot.length - 2; i >= 0; i -= 2) g.lineTo(bot[i], bot[i + 1]);
      g.closePath(); g.fillStyle = grads[wi]; g.fill();
      g.beginPath();
      for (let i = 0; i < top.length; i += 2) (i ? g.lineTo(top[i], top[i + 1]) : g.moveTo(top[i], top[i + 1]));
      g.strokeStyle = `rgba(255,255,255,${wv.al * 1.6})`; g.lineWidth = 1.5 * S; g.stroke();
    });
  };
}

// Ribbons: one silky band made of many thin lines (inspired by the PS3 menu wave)
function ribbons(g, w, h, S, pal, light) {
  const N = light ? 14 : 26, STEP = light ? 32 : 20;
  const glow = g.createLinearGradient(0, 0, w, 0);
  glow.addColorStop(0, 'rgba(255,255,255,0)'); glow.addColorStop(0.5, 'rgba(255,255,255,0.09)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    const yOf = (u, k) => h * (0.6 + 0.07 * Math.sin(u * 2.6 + time * 0.22 + k * 0.05) + 0.05 * Math.sin(u * 5.1 - time * 0.31 + k * 0.11)) + (k - N / 2) * h * (light ? 0.014 : 0.009) * (1 + 0.8 * Math.sin(u * 3 + time * 0.4));
    // soft body of the band
    g.beginPath();
    for (let x = 0; x <= w + STEP; x += STEP) { const u = x / w; x ? g.lineTo(x, yOf(u, 0) - h * 0.03) : g.moveTo(x, yOf(u, 0) - h * 0.03); }
    for (let x = Math.ceil((w + STEP) / STEP) * STEP; x >= 0; x -= STEP) { const u = x / w; g.lineTo(x, yOf(u, N) + h * 0.03); }
    g.closePath(); g.fillStyle = glow; g.fill();
    g.lineWidth = 1.1 * S;
    for (let k = 0; k <= N; k++) {
      const edge = Math.abs(k - N / 2) / (N / 2);
      g.strokeStyle = `rgba(255,255,255,${0.07 + 0.22 * (1 - edge)})`;
      g.beginPath();
      for (let x = 0; x <= w + STEP; x += STEP) { const y = yOf(x / w, k); x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
  };
}

// ---------------------------------------------------------------- console backgrounds
// Each follows its console's own look: colours, shapes and how things move. Nothing is copied from
// the consoles themselves. The bright Nintendo ones are toned down so Cartridge's white text reads.
// Their base colour is a CSS gradient (BG_BASE); the canvas draws the motion on top.
const TAU = Math.PI * 2;
// a pattern drawn once, then reused every frame
function once(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// 0.9.15 (owner's pick "A + B for the top five"): five designed scenes (B), calm and slow, each
// drawn from a few pre-rendered glows; every other console gets its own game art (A, artPan).

// soft round glow, drawn once and stamped
function glow(rgb, size) {
  return once(size, size, (c) => { const r = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.4, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = r; c.fillRect(0, 0, size, size); });
}

// PS2: rings of blue light flowing out of a bright core, like the boot screen's tunnel
function ps2(g, w, h, S, pal, light) {
  const cx = w * 0.64, cy = h * 0.42, n = light ? 16 : 26;
  const core = glow('120,165,255', Math.round(h * 0.7));
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.55; g.drawImage(core, cx - core.width / 2, cy - core.height / 2); g.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      const z = (i / n + t / 14) % 1, s = Math.pow(z, 2.4), rad = s * w * 0.95;
      g.strokeStyle = `rgba(80,130,255,${(0.04 + s * 0.42) * (1 - s * 0.6)})`; g.lineWidth = (1 + s * 3) * S;
      g.beginPath(); g.ellipse(cx, cy, Math.max(1, rad), Math.max(1, rad * 0.62), 0, 0, TAU); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  };
}

// GameCube: a lit cube turning slowly in a purple void
function gc(g, w, h, S, pal, light) {
  const cx = w * 0.66, cy = h * 0.4, U = h * 0.16;
  const halo = glow('130,95,235', Math.round(h * 0.9));
  const V = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])));
  const F = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalAlpha = 0.45; g.drawImage(halo, cx - halo.width / 2, cy - halo.height / 2); g.globalAlpha = 1;
    const a = t / 6, b = t / 9 + 0.5;
    const P = V.map(([x, y, z]) => { const X = x * Math.cos(a) - z * Math.sin(a); let Z = x * Math.sin(a) + z * Math.cos(a); const Y = y * Math.cos(b) - Z * Math.sin(b); Z = y * Math.sin(b) + Z * Math.cos(b); const k = 4.8 / (Z + 5.2); return [cx + X * U * k, cy + Y * U * k, Z]; });
    F.map((f) => ({ f, z: f.reduce((s, i) => s + P[i][2], 0) / 4 })).sort((x, y) => y.z - x.z).forEach(({ f, z }) => {
      g.fillStyle = `rgba(${Math.round(110 - z * 25)},${Math.round(85 - z * 20)},${Math.round(215 - z * 20)},${0.5 - z * 0.12})`;
      g.strokeStyle = 'rgba(205,190,255,0.55)'; g.lineWidth = 1.5 * S;
      g.beginPath(); f.forEach((i, k) => (k ? g.lineTo(P[i][0], P[i][1]) : g.moveTo(P[i][0], P[i][1]))); g.closePath(); g.fill(); g.stroke();
    });
  };
}

// Wii: channel tiles gliding sideways over the grey menu, a thin Wii-blue light on each
function wii(g, w, h, S, pal, light) {
  const stripes = once(w, h, (c) => { c.fillStyle = 'rgba(255,255,255,0.04)'; const st = Math.max(2, Math.round(3 * S)); for (let y = 0; y < h; y += st * 2) c.fillRect(0, y, w, st); });
  const cw = w / 5.2, ch = cw * 0.6, rad = ch * 0.18;
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.drawImage(stripes, 0, 0);
    const off = (t * 0.012 * w) % (cw * 1.15);
    g.lineWidth = 2 * S;
    for (let r = 0; r < 4; r++) for (let c = -1; c < 7; c++) {
      const x = c * cw * 1.15 - off + w * 0.04, y = r * ch * 1.25 + h * 0.08;
      g.fillStyle = 'rgba(255,255,255,0.035)'; g.strokeStyle = 'rgba(140,215,255,0.2)';
      rrect(g, x, y, cw, ch, rad); g.fill(); g.stroke();
      const sh = (Math.sin(t / 2 + c + r) + 1) / 2;
      g.fillStyle = `rgba(140,215,255,${0.06 + sh * 0.1})`; g.fillRect(x + 6 * S, y + ch * 0.76, cw - 12 * S, 2 * S);
    }
  };
}

// Xbox 360: a bright green orb sending slow rings outwards
function xbox360(g, w, h, S, pal, light) {
  const cx = w * 0.68, cy = h * 0.42, R = h * 0.15;
  const orb = once(Math.ceil(R * 2), Math.ceil(R * 2), (c) => { const o = c.createRadialGradient(R * 0.85, R * 0.85, 0, R, R, R); o.addColorStop(0, '#e9ffd8'); o.addColorStop(0.35, '#7be04a'); o.addColorStop(1, 'rgba(30,90,20,0)'); c.fillStyle = o; c.beginPath(); c.arc(R, R, R, 0, TAU); c.fill(); });
  return (t) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const k = (i / 7 + t / 10) % 1;
      g.strokeStyle = `rgba(120,230,70,${0.35 * (1 - k)})`; g.lineWidth = (2 + 6 * (1 - k)) * S;
      g.beginPath(); g.arc(cx, cy, Math.max(1, k * w * 0.6), 0, TAU); g.stroke();
    }
    g.drawImage(orb, cx - R, cy - R);
  };
}

// Switch: Joy-Con red and blue light meeting in the middle, dust drifting through
function nswitch(g, w, h, S, pal, light) {
  const red = glow('230,30,50', Math.round(w * 0.9)), blue = glow('0,160,230', Math.round(w * 0.9));
  const r = rng(7), dust = Array.from({ length: light ? 24 : 40 }, () => ({ x: r(), y: r(), v: 0.004 + r() * 0.01 }));
  return (t) => {
    g.clearRect(0, 0, w, h);
    const m = w * (0.5 + Math.sin(t / 7) * 0.05);
    g.globalAlpha = 0.5;
    g.drawImage(red, m - w * 0.28 - red.width / 2, h * 0.5 - red.height / 2);
    g.drawImage(blue, m + w * 0.28 - blue.width / 2, h * 0.5 - blue.height / 2);
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(255,255,255,0.16)';
    for (const d of dust) g.fillRect(((d.x + t * d.v) % 1) * w, d.y * h, 2 * S, 2 * S);
  };
}

// A: a slow, dark, blurred pan over this console's own covers, its colour as a soft light.
// Covers are blurred once when they load; each frame only stamps them.
export function artPan(urls, rgb = '150,150,170') {
  const imgs = [];
  for (const u of urls.slice(0, 24)) { const im = new Image(); im.crossOrigin = 'anonymous'; im.src = u; imgs.push(im); }
  return (g, w, h, S, pal, light) => {
    const tw = Math.round(w / 6), th = Math.round(tw * 4 / 3), blur = Math.max(4, Math.round(w / 110));
    const tiles = [];
    const make = (im) => once(tw, th, (c) => { c.filter = `blur(${blur}px) brightness(0.6) saturate(1.1)`; c.drawImage(im, -blur, -blur, tw + blur * 2, th + blur * 2); });
    const lightG = glow(rgb, Math.round(w * 1.2));
    return (t) => {
      if (tiles.length < imgs.length) for (let i = tiles.length; i < imgs.length && imgs[i].complete; i++) tiles.push(imgs[i].naturalWidth ? make(imgs[i]) : null);
      const ok = tiles.filter(Boolean);
      g.clearRect(0, 0, w, h);
      if (ok.length) {
        const off = (t * 0.012 * w) % (tw * 1.1);
        for (let row = -1; row < 4; row++) for (let col = -1; col < 8; col++) {
          const tile = ok[((row + 10) * 7 + col + 10) % ok.length];
          g.drawImage(tile, col * tw * 1.1 - off + (row % 2) * tw * 0.5, row * th * 1.05 - th * 0.3 + Math.sin(t / 9 + col) * 6 * S);
        }
      }
      g.globalAlpha = 0.3; g.drawImage(lightG, w * 0.85 - lightG.width / 2, h * 0.1 - lightG.height / 2); g.globalAlpha = 1;
      const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0.35)'); v.addColorStop(0.6, 'rgba(0,0,0,0.2)'); v.addColorStop(1, 'rgba(0,0,0,0.75)');
      g.fillStyle = v; g.fillRect(0, 0, w, h);
    };
  };
}

export const RENDERERS = { waves, ribbons, ps2, gc, wii, switch: nswitch, xbox360 };
// Backgrounds from before 0.9.15 whose console now shows its own game art (A)
export const LEGACY_ART = { wiiu: 'wiiu', ds: 'nds', n3ds: '3ds', xbox: 'xbox' };
// Picker entries. The first two follow your theme colours, the console ones use their own.
export const BACKGROUNDS = [
  { v: 'waves', l: 'XMB Waves', sub: 'PSP style, in your theme colours', group: 'Theme' },
  { v: 'ribbons', l: 'Ribbons', sub: 'PS3 style, in your theme colours', group: 'Theme' },
  { v: 'ps2', l: 'PlayStation 2', sub: 'A tunnel of blue light', group: 'Consoles' },
  { v: 'gc', l: 'GameCube', sub: 'A cube turning in a purple void', group: 'Consoles' },
  { v: 'wii', l: 'Wii', sub: 'Channels gliding by, Wii blue', group: 'Consoles' },
  { v: 'xbox360', l: 'Xbox 360', sub: 'The green orb and its rings', group: 'Consoles' },
  { v: 'switch', l: 'Switch', sub: 'Joy-Con red and blue meeting', group: 'Consoles' },
  { v: 'solid', l: 'Still', sub: 'A still gradient, no motion', group: 'Other' },
  { v: 'art', l: 'Game artwork', sub: 'The highlighted game', group: 'Other' },
  { v: 'wallpaper', l: 'Wallpaper', sub: 'An image of your own', group: 'Other' },
];
// The console backgrounds' own base colours (under the canvas)
export const BG_BASE = {
  ps2: 'radial-gradient(120% 90% at 64% 42%, #0e1d5c 0%, #050a22 55%, #01030c 100%)',
  gc: 'radial-gradient(110% 100% at 64% 42%, #2a1a5a 0%, #120a2c 50%, #07040f 100%)',
  wii: 'linear-gradient(180deg, #3d444e 0%, #2b3038 50%, #1a1d22 100%)',
  switch: 'linear-gradient(180deg, #121216 0%, #0b0b0e 60%, #060608 100%)',
  xbox360: 'radial-gradient(100% 100% at 68% 42%, #0c2a0a 0%, #051205 50%, #020802 100%)',
  art: 'linear-gradient(180deg, #0b0b0d 0%, #070708 100%)',
};
// darker base for renderers that need contrast (theme gradient under the canvas)
export const DARK_BASE = new Set([]);

// A still picture of a background for the picker (0.9.3 L): the renderer's frame a few seconds in,
// drawn small over its base colour (theme ones over a dark tint of your accent)
export function bgPreview(v, pal, w = 320, h = 180) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, w, h);
  const css = BG_BASE[v] || '';
  const stops = css.match(/#[0-9a-f]{6}/gi) || ['#0c0e15', pal?.accent || '#2a2f45', '#07080c'];
  stops.forEach((col, i) => base.addColorStop(i / Math.max(1, stops.length - 1), col));
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  if (!BG_BASE[v]) { g.fillStyle = 'rgba(5, 6, 10, 0.55)'; g.fillRect(0, 0, w, h); }
  const R = RENDERERS[v];
  if (R) {
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    try { R(layer.getContext('2d'), w, h, w / 1920, pal, true)(4000); g.drawImage(layer, 0, 0); } catch {}
  }
  return c.toDataURL('image/png');
}
