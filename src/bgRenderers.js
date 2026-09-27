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

// Bokeh: soft floating lights (inspired by the PS5 home screen)
function bokeh(g, w, h, S, pal, light) {
  const r = rng(7);
  const sprites = [sprite(pal.light), sprite(pal.warm), sprite('#ffffff'), sprite(pal.accent)];
  const n = light ? 22 : 34;
  const dots = Array.from({ length: n }, () => ({ x: r(), y: r(), z: 0.3 + r() * 0.7, s: sprites[Math.floor(r() * sprites.length)], p: r() * Math.PI * 2, v: 0.004 + r() * 0.01 }));
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    for (const d of dots) {
      const size = (60 + d.z * 260) * (h / 1080);
      const y = ((d.y - time * d.v * d.z) % 1.2 + 1.2) % 1.2 - 0.1;
      const x = d.x + Math.sin(time * 0.2 + d.p) * 0.02;
      g.globalAlpha = (0.1 + 0.26 * d.z) * (0.7 + 0.3 * Math.sin(time * 0.7 + d.p));
      g.drawImage(d.s, x * w - size / 2, y * h - size / 2, size, size);
    }
    g.globalAlpha = 1;
  };
}

// Blades: big translucent panels sweeping slowly (inspired by the Xbox dashboard)
function blades(g, w, h, S, pal) {
  const cols = [pal.accent, pal.light, pal.warm, '#ffffff', pal.accent];
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    cols.forEach((c, i) => {
      const off = ((time * (0.012 + i * 0.004) + i * 0.23) % 1.6) - 0.3;
      const x0 = (off - 0.2) * w, bw = w * (0.18 + 0.06 * i), skew = h * 0.5;
      const gr = g.createLinearGradient(x0, 0, x0 + bw + skew, h);
      gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(0.5, rgba(c, 0.13 - i * 0.012)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(x0 + skew, 0); g.lineTo(x0 + skew + bw, 0); g.lineTo(x0 + bw, h); g.lineTo(x0, h);
      g.closePath(); g.fill();
    });
    // a thin bright edge that drifts across
    const ex = (((time * 0.02) % 1.4) - 0.2) * w;
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 2 * S;
    g.beginPath(); g.moveTo(ex + h * 0.5, 0); g.lineTo(ex, h); g.stroke();
  };
}

// Dots: a calm grid of rounded dots with a slow wave running through it (inspired by Nintendo menus)
function dots(g, w, h, S, pal, light) {
  const gap = (light ? 64 : 46) * S;
  const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
  const buckets = 5;
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    const paths = Array.from({ length: buckets }, () => new Path2D());
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * gap + (j % 2) * gap * 0.5, y = j * gap;
        const v = 0.5 + 0.5 * Math.sin(i * 0.35 + j * 0.25 - time * 0.9) * Math.sin(j * 0.18 + time * 0.3);
        const b = Math.min(buckets - 1, Math.floor(v * buckets));
        const rr = (1.6 + b * 1.1) * S;
        paths[b].moveTo(x + rr, y);
        paths[b].arc(x, y, rr, 0, Math.PI * 2);
      }
    }
    paths.forEach((p, b) => { g.fillStyle = `rgba(255,255,255,${0.05 + b * 0.05})`; g.fill(p); });
  };
}

// Glow: deep colour with slow drifting light (inspired by Steam Big Picture)
function glow(g, w, h, S, pal) {
  const sprites = [sprite(pal.accent, 256), sprite(pal.light, 256), sprite(pal.warm, 256)];
  const blobs = [
    { s: 0, x: 0.2, y: 0.25, r: 0.9, px: 0.07, py: 0.05, t: 0.05 },
    { s: 1, x: 0.8, y: 0.7, r: 0.8, px: 0.06, py: 0.07, t: 0.04 },
    { s: 2, x: 0.55, y: 0.95, r: 0.7, px: 0.09, py: 0.03, t: 0.06 },
  ];
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const size = b.r * Math.max(w, h);
      const x = (b.x + Math.sin(time * b.t * 2.1) * b.px) * w, y = (b.y + Math.cos(time * b.t * 1.7) * b.py) * h;
      g.globalAlpha = 0.3;
      g.drawImage(sprites[b.s], x - size / 2, y - size / 2, size, size);
    }
    g.globalAlpha = 1;
    // faint diagonal light streak
    const sx = (((time * 0.015) % 1.5) - 0.25) * w;
    const gr = g.createLinearGradient(sx, 0, sx + w * 0.25, h);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  };
}

export const RENDERERS = { waves, ribbons, bokeh, blades, dots, glow };
// Picker entries (label + what it is loosely inspired by)
export const BACKGROUNDS = [
  { v: 'waves', l: 'XMB Waves', sub: 'Inspired by the PSP' },
  { v: 'ribbons', l: 'Ribbons', sub: 'Inspired by the PS3' },
  { v: 'bokeh', l: 'Bokeh', sub: 'Inspired by the PS5' },
  { v: 'blades', l: 'Blades', sub: 'Inspired by the Xbox' },
  { v: 'dots', l: 'Dots', sub: 'Inspired by Nintendo' },
  { v: 'glow', l: 'Glow', sub: 'Inspired by Steam' },
  { v: 'solid', l: 'Still', sub: 'A still gradient, no motion' },
  { v: 'art', l: 'Game artwork', sub: 'The highlighted game' },
  { v: 'wallpaper', l: 'Wallpaper', sub: 'An image of your own' },
];
// darker base for renderers that need contrast
export const DARK_BASE = new Set(['bokeh', 'glow', 'blades', 'dots']);
