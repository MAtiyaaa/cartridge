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

// 0.9.16 (owner: the console scenes must match XMB Waves and Ribbons). Built the way Ribbons is: many
// hair-fine lines on smooth curves, added together ('lighter') over a soft glowing body, slow, fading
// at their ends. No solid shapes. Each in its console's colours, after something from its menu.
function glow(rgb, size) {
  size = Math.max(2, Math.round(size));
  return once(size, size, (c) => { const r = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.4, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = r; c.fillRect(0, 0, size, size); });
}
const stamp = (g, img, x, y, a) => { g.globalAlpha = a; g.drawImage(img, x - img.width / 2, y - img.height / 2); g.globalAlpha = 1; };

// PS2: the boot screen's blue depth, as a tunnel of fine light rings that waver as they flow outwards
function ps2(g, w, h, S, pal, light) {
  const cx = w * 0.64, cy = h * 0.42, N = light ? 22 : 38, SEG = light ? 56 : 110;
  const core = glow('120,160,255', h * 0.8), haze = glow('40,80,220', w * 1.1);
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    stamp(g, haze, cx, cy, 0.22); stamp(g, core, cx, cy, 0.42);
    for (let i = 0; i < N; i++) {
      const z = (i / N + t * 0.03) % 1, R = Math.pow(z, 2.1) * w * 0.95 + h * 0.02;
      const a = 0.34 * Math.pow(Math.sin(Math.PI * z), 1.6);
      if (a < 0.01) continue;
      g.strokeStyle = `rgba(${Math.round(110 + 90 * z)},${Math.round(150 + 70 * z)},255,${a})`;
      g.lineWidth = (0.7 + 1.1 * z) * S;
      g.beginPath();
      for (let j = 0; j <= SEG; j++) {
        const an = (j / SEG) * TAU, wob = 1 + 0.03 * Math.sin(an * 3 + t * 0.45 + i * 0.7) + 0.015 * Math.sin(an * 5 - t * 0.6 + i);
        const x = cx + Math.cos(an) * R * wob, y = cy + Math.sin(an) * R * 0.6 * wob;
        j ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  };
}

// GameCube: the boot cube, turning slowly, drawn only in fine lines of indigo light (each face hatched)
function gc(g, w, h, S, pal, light) {
  const cx = w * 0.7, cy = h * 0.36, U = h * 0.115, K = light ? 8 : 14;
  const halo = glow('125,90,240', h * 1.1);
  const V = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])));
  const F = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    stamp(g, halo, cx, cy, 0.3);
    const a = t / 7, b = 0.55 + Math.sin(t / 11) * 0.25;
    const P = V.map(([x, y, z]) => { const X = x * Math.cos(a) - z * Math.sin(a); let Z = x * Math.sin(a) + z * Math.cos(a); const Y = y * Math.cos(b) - Z * Math.sin(b); Z = y * Math.sin(b) + Z * Math.cos(b); const k = 4.8 / (Z + 5.2); return [cx + X * U * k, cy + Y * U * k, Z]; });
    const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
    g.lineWidth = 0.9 * S;
    for (const f of F) {
      const z = f.reduce((s, i) => s + P[i][2], 0) / 4, front = z < 0;
      const base = front ? 0.2 : 0.07;
      const [p0, p1, p2, p3] = f.map((i) => P[i]);
      g.strokeStyle = `rgba(150,120,255,${base})`;
      g.beginPath();
      for (let k = 1; k < K; k++) { const u = k / K, s0 = lerp(p0, p1, u), s1 = lerp(p3, p2, u); g.moveTo(s0[0], s0[1]); g.lineTo(s1[0], s1[1]); }
      g.stroke();
      g.strokeStyle = `rgba(205,190,255,${front ? 0.55 : 0.18})`;
      g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.lineTo(p3[0], p3[1]); g.closePath(); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  };
}

// Wii: a sheet of fine pinstripes that breathes like fabric, with a Wii-blue light sweeping across it
function wii(g, w, h, S, pal, light) {
  const N = light ? 20 : 38, STEP = light ? 32 : 20;
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    const xs = (((t * 0.035) % 1.5) - 0.25) * w;
    const sweep = g.createLinearGradient(0, 0, w, 0);
    const st = (x, a) => sweep.addColorStop(Math.min(1, Math.max(0, x / w)), a);
    st(0, 'rgba(225,235,245,0.08)'); st(xs - w * 0.22, 'rgba(225,235,245,0.08)'); st(xs, 'rgba(140,215,255,0.6)'); st(xs + w * 0.22, 'rgba(225,235,245,0.08)'); st(w, 'rgba(225,235,245,0.08)');
    g.strokeStyle = sweep; g.lineWidth = 1 * S;
    for (let k = 0; k < N; k++) {
      const base = h * (0.16 + 0.78 * (k / N));
      g.beginPath();
      for (let x = 0; x <= w + STEP; x += STEP) {
        const u = x / w, y = base + h * 0.022 * Math.sin(u * 2.2 + t * 0.15 + k * 0.13) + h * 0.011 * Math.sin(u * 5.3 - t * 0.21 + k * 0.29);
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  };
}

// Xbox 360: fine green arcs with fading tails circling a soft glowing orb, at their own speeds
function xbox360(g, w, h, S, pal, light) {
  const cx = w * 0.68, cy = h * 0.42, M = light ? 10 : 18, TAIL = light ? 8 : 14;
  const r = rng(360);
  const arcs = Array.from({ length: M }, (_, m) => ({ R: h * (0.15 + 0.034 * m + r() * 0.02), v: (0.05 + r() * 0.07) * (m % 2 ? 1 : -1), p: r() * TAU, len: 0.7 + r() * 1.5, wd: 0.8 + r() * 1.6, a: 0.2 + r() * 0.3 }));
  const orb = glow('150,240,90', h * 0.42), halo = glow('60,160,30', w * 0.9);
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    stamp(g, halo, cx, cy, 0.25); stamp(g, orb, cx, cy, 0.85);
    for (const c of arcs) {
      const head = c.p + t * c.v, dir = Math.sign(c.v);
      g.lineWidth = c.wd * S;
      for (let s = 0; s < TAIL; s++) {
        const f0 = s / TAIL, f1 = (s + 1) / TAIL;
        g.strokeStyle = `rgba(140,235,90,${c.a * Math.pow(f1, 1.7)})`;
        g.beginPath();
        const a0 = head - dir * c.len * (1 - f0), a1 = head - dir * c.len * (1 - f1);
        g.arc(cx, cy, c.R, Math.min(a0, a1), Math.max(a0, a1));
        g.stroke();
      }
    }
    g.globalCompositeOperation = 'source-over';
  };
}

// Switch: two silky bands, Joy-Con red from the left and blue from the right, crossing in the middle
function nswitch(g, w, h, S, pal, light) {
  const N = light ? 12 : 22, STEP = light ? 32 : 20;
  const red = g.createLinearGradient(0, 0, w, 0), blue = g.createLinearGradient(0, 0, w, 0);
  red.addColorStop(0, 'rgba(255,70,85,0.55)'); red.addColorStop(0.65, 'rgba(255,70,85,0.18)'); red.addColorStop(1, 'rgba(255,70,85,0.02)');
  blue.addColorStop(0, 'rgba(30,175,240,0.02)'); blue.addColorStop(0.35, 'rgba(30,175,240,0.18)'); blue.addColorStop(1, 'rgba(30,175,240,0.55)');
  const body = (c) => { const b = g.createLinearGradient(0, 0, w, 0); b.addColorStop(c === 'r' ? 0 : 1, c === 'r' ? 'rgba(255,70,85,0.12)' : 'rgba(30,175,240,0.12)'); b.addColorStop(0.5, 'rgba(255,255,255,0.02)'); b.addColorStop(c === 'r' ? 1 : 0, 'rgba(0,0,0,0)'); return b; };
  const bodies = { r: body('r'), b: body('b') };
  const band = (t, k, ph, dirY) => (u) => h * (0.4 + dirY * 0.12 * Math.sin(u * 2.4 + t * 0.2 + ph) + 0.05 * Math.sin(u * 4.9 - t * 0.28 + ph * 2)) + (k - N / 2) * h * 0.008 * (1 + 0.7 * Math.sin(u * 3 + t * 0.35 + ph));
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.lineWidth = 1.1 * S;
    for (const [grad, ph, dy, bk] of [[red, 0, 1, 'r'], [blue, 2.2, -1, 'b']]) {
      // the soft body under the lines, as Ribbons has
      const top = band(t, 0, ph, dy), bot = band(t, N, ph, dy);
      g.beginPath();
      for (let x = 0; x <= w + STEP; x += STEP) { const yy = top(x / w) - h * 0.025; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      for (let x = Math.ceil((w + STEP) / STEP) * STEP; x >= 0; x -= STEP) g.lineTo(x, bot(x / w) + h * 0.025);
      g.closePath(); g.fillStyle = bodies[bk]; g.fill();
      g.strokeStyle = grad;
      for (let k = 0; k <= N; k++) {
        const y = band(t, k, ph, dy);
        g.beginPath();
        for (let x = 0; x <= w + STEP; x += STEP) { const yy = y(x / w); x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.stroke();
      }
    }
    g.globalCompositeOperation = 'source-over';
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
  { v: 'ps2', l: 'PlayStation 2', sub: 'Rings of blue light from the boot screen', group: 'Consoles' },
  { v: 'gc', l: 'GameCube', sub: 'The boot cube, drawn in fine lines of light', group: 'Consoles' },
  { v: 'wii', l: 'Wii', sub: 'Silky pinstripes and a sweep of Wii blue', group: 'Consoles' },
  { v: 'xbox360', l: 'Xbox 360', sub: 'Green arcs circling the glowing orb', group: 'Consoles' },
  { v: 'switch', l: 'Switch', sub: 'Joy-Con red and blue bands crossing', group: 'Consoles' },
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
