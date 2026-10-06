// Animated backgrounds. Each renderer is set up once per canvas size / palette and then draws a
// frame for a given time. They are all original designs, only loosely inspired by console menus,
// and they are kept cheap: a handful of paths or pre-rendered sprites per frame, no CSS filters.

// 0.9.38 (owner): on the Light theme the same lines are drawn in dark ink, laid over the page normally instead of
// added together (adding light to an off-white page shows nothing). Set by setInk() before a renderer is made.
let INK = '255,255,255', COMP = 'lighter';
export function setInk(ink) { INK = ink || '255,255,255'; COMP = ink ? 'source-over' : 'lighter'; }
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
    gr.addColorStop(0, `rgba(${INK},0)`);
    gr.addColorStop(0.3, `rgba(${INK},${wv.al})`);
    gr.addColorStop(0.7, `rgba(${INK},${wv.al * 1.3})`);
    gr.addColorStop(1, `rgba(${INK},0)`);
    return gr;
  });
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = COMP;
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
      g.strokeStyle = `rgba(${INK},${wv.al * 1.6})`; g.lineWidth = 1.5 * S; g.stroke();
    });
  };
}

// Ribbons: one silky band made of many thin lines (inspired by the PS3 menu wave)
function ribbons(g, w, h, S, pal, light) {
  const N = light ? 14 : 26, STEP = light ? 32 : 20;
  const glow = g.createLinearGradient(0, 0, w, 0);
  glow.addColorStop(0, `rgba(${INK},0)`); glow.addColorStop(0.5, `rgba(${INK},0.09)`); glow.addColorStop(1, `rgba(${INK},0)`);
  return (time) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = COMP;
    const yOf = (u, k) => h * (0.6 + 0.07 * Math.sin(u * 2.6 + time * 0.22 + k * 0.05) + 0.05 * Math.sin(u * 5.1 - time * 0.31 + k * 0.11)) + (k - N / 2) * h * (light ? 0.014 : 0.009) * (1 + 0.8 * Math.sin(u * 3 + time * 0.4));
    // soft body of the band
    g.beginPath();
    for (let x = 0; x <= w + STEP; x += STEP) { const u = x / w; x ? g.lineTo(x, yOf(u, 0) - h * 0.03) : g.moveTo(x, yOf(u, 0) - h * 0.03); }
    for (let x = Math.ceil((w + STEP) / STEP) * STEP; x >= 0; x -= STEP) { const u = x / w; g.lineTo(x, yOf(u, N) + h * 0.03); }
    g.closePath(); g.fillStyle = glow; g.fill();
    g.lineWidth = 1.1 * S;
    for (let k = 0; k <= N; k++) {
      const edge = Math.abs(k - N / 2) / (N / 2);
      g.strokeStyle = `rgba(${INK},${0.07 + 0.22 * (1 - edge)})`;
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

// glow sprite (used by Drift and by Game artwork's light)
function glow(rgb, size) {
  size = Math.max(2, Math.round(size));
  return once(size, size, (c) => { const r = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.4, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = r; c.fillRect(0, 0, size, size); });
}
const rgbOf = (hex) => { const n = parseInt(String(hex || '#ffffff').slice(1).padEnd(6, '0').slice(0, 6), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };

// ---------------------------------------------------------------- styles (0.9.19)
// The owner retired the console scenes ("they all look bad, except Ribbons and XMB"): backgrounds
// are styles now, made the way Ribbons is: hair-fine lines or soft points added together ('lighter'),
// slow, fading at their edges, in your theme's colours. Each costs a few hundred draw calls a frame.

// Aurora: two curtains of light hanging from a slow curving fold: fine rays rise from the fold, bright
// where they start and fading upwards, over a soft glow that follows it
function aurora(g, w, h, S, pal, light) {
  const N = light ? 90 : 220, R = rng(7);
  const acc = rgbOf(pal?.accent), lig = rgbOf(pal?.light || pal?.accent);
  const rays = Array.from({ length: N }, (_, i) => ({ u: (i + R()) / N, ph: R() * TAU, k: R() }));
  const CURT = [{ rgb: acc, y: 0.5, amp: 0.09, sp: 0.11, len: 0.34, off: 0 }, { rgb: lig, y: 0.36, amp: 0.06, sp: -0.08, len: 0.22, off: 2.1 }];
  const body = glow(acc, Math.round(h * 0.7));
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = COMP;
    g.lineWidth = 2.2 * S; // softer, wider rays read as light rather than strands
    for (const c of CURT) {
      const fold = (u) => h * (c.y + c.amp * Math.sin(u * 3.1 + t * c.sp + c.off) + c.amp * 0.45 * Math.sin(u * 7.3 - t * c.sp * 1.6));
      // the glow along the fold, a few soft stamps
      for (let i = 0; i <= 6; i++) { const u = i / 6; g.globalAlpha = 0.07; g.drawImage(body, u * w - body.width / 2, fold(u) - body.height * 0.62); }
      g.globalAlpha = 1;
      for (const r of rays) {
        const x = r.u * w + Math.sin(t * 0.13 + r.ph) * w * 0.006, y0 = fold(r.u);
        // ray length breathes slowly along the curtain, so brightness travels across it
        const pulse = 0.5 + 0.5 * Math.sin(r.u * 9 - t * 0.35 + c.off + r.ph * 0.3);
        const len = h * c.len * (0.35 + 0.65 * pulse) * (0.7 + 0.3 * r.k);
        const gr = g.createLinearGradient(0, y0, 0, y0 - len);
        gr.addColorStop(0, `rgba(${c.rgb},${0.05 + 0.13 * pulse})`); gr.addColorStop(0.3, `rgba(${c.rgb},${0.03 + 0.06 * pulse})`); gr.addColorStop(1, `rgba(${c.rgb},0)`);
        g.strokeStyle = gr;
        g.beginPath(); g.moveTo(x, y0); g.lineTo(x + Math.sin(r.ph + t * 0.05) * w * 0.004, y0 - len); g.stroke();
      }
    }
  };
}

// Contours: slowly shifting height lines, like a map's, drawn by marching squares over a moving field
function contours(g, w, h, S, pal, light) {
  const C = light ? 40 : 72, Rw = Math.ceil(C * h / w), dx = w / C, dy = h / Rw;
  const NL = light ? 9 : 17, LEVELS = Array.from({ length: NL }, (_, i) => -0.8 + (1.6 * i) / (NL - 1));
  const f = new Float32Array((C + 1) * (Rw + 1));
  const acc = rgbOf(pal?.accent);
  return (t) => {
    const T = t * 0.05;
    for (let j = 0; j <= Rw; j++) for (let i = 0; i <= C; i++) {
      const x = i / C * 3.2, y = j / Rw * 1.8;
      f[j * (C + 1) + i] = 0.55 * Math.sin(x * 1.3 + T * 1.7 + Math.sin(y * 1.1 - T)) + 0.45 * Math.cos(y * 1.9 - T * 1.3 + Math.sin(x * 0.7 + T * 0.6)) * Math.sin(x * 0.5 + y * 0.4 + T * 0.4);
    }
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = COMP;
    g.lineWidth = 1.05 * S;
    LEVELS.forEach((L, li) => {
      g.beginPath();
      for (let j = 0; j < Rw; j++) for (let i = 0; i < C; i++) {
        const a = f[j * (C + 1) + i], b = f[j * (C + 1) + i + 1], c = f[(j + 1) * (C + 1) + i + 1], d = f[(j + 1) * (C + 1) + i];
        const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
        if (k === 0 || k === 15) continue;
        const x0 = i * dx, y0 = j * dy;
        const T_ = [x0 + dx * (L - a) / (b - a), y0], R_ = [x0 + dx, y0 + dy * (L - b) / (c - b)], B_ = [x0 + dx * (L - d) / (c - d), y0 + dy], L_ = [x0, y0 + dy * (L - a) / (d - a)];
        const seg = (p, q) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
        switch (k) {
          case 1: case 14: seg(L_, B_); break; case 2: case 13: seg(B_, R_); break; case 3: case 12: seg(L_, R_); break;
          case 4: case 11: seg(T_, R_); break; case 5: seg(L_, T_); seg(B_, R_); break; case 6: case 9: seg(T_, B_); break;
          case 7: case 8: seg(L_, T_); break; case 10: seg(T_, R_); seg(L_, B_); break;
        }
      }
      // every fourth line heavier, as maps draw their index lines; the middle one in your colour
      const idx = li % 4 === 0, mid = li === (LEVELS.length - 1) / 2;
      g.lineWidth = (idx ? 1.6 : 1) * S;
      g.strokeStyle = mid ? `rgba(${acc},0.34)` : `rgba(${INK},${(idx ? 0.13 : 0.065) * (1.1 - Math.abs(L) * 0.5)})`;
      g.stroke();
    });
    // the lines fade towards the left, where the page's words are
    g.globalCompositeOperation = 'destination-out';
    const fade = g.createLinearGradient(0, 0, w * 0.55, 0); fade.addColorStop(0, 'rgba(0,0,0,0.85)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fade; g.fillRect(0, 0, w * 0.55, h);
    g.globalCompositeOperation = 'source-over';
  };
}

// Drift: soft points of light floating by at three depths, the near ones large and faint
function drift(g, w, h, S, pal, light) {
  const R = rng(11), N = light ? 30 : 64;
  const acc = rgbOf(pal?.accent);
  // small motes white, the out-of-focus ones in your colour
  const sprites = [glow(INK, 36 * S), glow(acc, 140 * S), glow(acc, 320 * S)];
  const pts = Array.from({ length: N }, () => { const z = R(); return { x: R(), y: R(), z, d: z < 0.55 ? 0 : z < 0.88 ? 1 : 2, ph: R() * TAU, sp: 0.4 + R() * 0.6 }; });
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = COMP;
    for (const p of pts) {
      const v = (0.006 + p.z * 0.018) * p.sp;
      const x = ((p.x + t * v) % 1.2 - 0.1) * w + Math.sin(t * 0.3 + p.ph) * 14 * S;
      const y = ((p.y - t * v * 0.35 + 10) % 1.2 - 0.1) * h + Math.cos(t * 0.23 + p.ph) * 10 * S;
      const twinkle = 0.55 + 0.45 * Math.sin(t * 0.8 * p.sp + p.ph);
      const a = [0.32, 0.13, 0.07][p.d] * twinkle;
      const img = sprites[p.d];
      g.globalAlpha = a; g.drawImage(img, x - img.width / 2, y - img.height / 2);
    }
    g.globalAlpha = 1;
  };
}

// Tide: a sea of fine points in perspective, rising and falling in long slow swells
function tide(g, w, h, S, pal, light) {
  const COLS = light ? 46 : 84, ROWS = light ? 18 : 30;
  const acc = rgbOf(pal?.accent);
  return (t) => {
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = COMP;
    const horizon = h * 0.46, sz = 1.6 * S;
    for (let r = 0; r < ROWS; r++) {
      const z = 1 + r * 0.42; // depth: near rows first
      const persp = 1 / z;
      const a = Math.min(0.75, 0.9 * persp) * (r < 2 ? 0.6 : 1);
      g.fillStyle = r % 7 === 3 ? `rgba(${acc},${a})` : `rgba(${INK},${a * 0.75})`;
      for (let c = 0; c <= COLS; c++) {
        const xw = (c / COLS - 0.5) * 2.6;
        const yw = 0.22 * Math.sin(xw * 1.7 + t * 0.32 + z * 0.55) * Math.cos(z * 0.33 - t * 0.21) + 0.08 * Math.sin(xw * 4.1 - t * 0.5 + z);
        const X = w / 2 + xw * w * 0.5 * persp * 1.4, Y = horizon + (0.95 - yw) * h * 0.55 * persp;
        if (X < -10 || X > w + 10 || Y > h + 10) continue;
        const s = sz * (0.6 + persp * 1.2);
        g.fillRect(X - s / 2, Y - s / 2, s, s);
      }
    }
  };
}

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

export const RENDERERS = { waves, ribbons, aurora, contours, drift, tide };
// Backgrounds from before 0.9.15 whose console now shows its own game art (A)
export const LEGACY_ART = { wiiu: 'wiiu', ds: 'nds', n3ds: '3ds', xbox: 'xbox', ps2: 'ps2', gc: 'ngc', wii: 'wii', xbox360: 'xbox360', switch: 'switch' }; // 0.9.19: the console scenes retired too (owner)
// Picker entries. The first two follow your theme colours, the console ones use their own.
export const BACKGROUNDS = [
  { v: 'ribbons', l: 'Ribbons', sub: 'One silky band of fine lines', group: 'Theme' },
  { v: 'waves', l: 'XMB Waves', sub: 'Soft waves of light', group: 'Theme' },
  { v: 'aurora', l: 'Aurora', sub: 'Curtains of light that sway and shimmer', group: 'Theme' },
  { v: 'contours', l: 'Contours', sub: 'Slow height lines, like a map', group: 'Theme' },
  { v: 'drift', l: 'Drift', sub: 'Soft lights floating by', group: 'Theme' },
  { v: 'tide', l: 'Tide', sub: 'A sea of points rising and falling', group: 'Theme' },
  { v: 'solid', l: 'Still', sub: 'A still gradient, no motion', group: 'Other' },
  { v: 'art', l: 'Game artwork', sub: 'The highlighted game', group: 'Other' },
  { v: 'wallpaper', l: 'Wallpaper', sub: 'An image of your own', group: 'Other' },
];
// The console backgrounds' own base colours (under the canvas)
export const BG_BASE = {
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
  const ink = pal?.ink || ''; // the Light theme's previews look like its page (0.9.38)
  const stops = css.match(/#[0-9a-f]{6}/gi) || (ink ? ['#f0efeb', '#e4e3de', '#d8d7d1'] : ['#0c0e15', pal?.accent || '#2a2f45', '#07080c']);
  stops.forEach((col, i) => base.addColorStop(i / Math.max(1, stops.length - 1), col));
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  if (!BG_BASE[v] && !ink) { g.fillStyle = 'rgba(5, 6, 10, 0.55)'; g.fillRect(0, 0, w, h); }
  const R = RENDERERS[v];
  if (R) {
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    const was = [INK, COMP];
    setInk(ink);
    try { R(layer.getContext('2d'), w, h, w / 1920, pal, true)(4000); g.drawImage(layer, 0, 0); } catch {}
    [INK, COMP] = was; // the live background keeps its own
  }
  return c.toDataURL('image/png');
}
