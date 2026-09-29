// Prototype (0.9.5, Settings → Android → Blend the top bar with the art): the top bar takes a deep shade of
// the colours of the art on screen (the Home banner, a game's banner), and the art fades into it, so the bar
// and the art read as one piece instead of meeting at a hard line. Leaving art-less pages, the bar goes back.
let last = '', timer = 0;
const root = document.documentElement;

// The art's main colour, pulled to a deep, calm shade that white text reads on
function tintOf(src) {
  return new Promise((resolve) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 24; c.height = 24;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(im, 0, 0, 24, 24);
        const d = x.getImageData(0, 0, 24, 14).data; // the top part: that's what meets the bar
        // the strongest colour, not the average (blue and orange average out to grey): colourful pixels are
        // grouped by hue, and the heaviest group's colour is used
        const bins = Array.from({ length: 12 }, () => [0, 0, 0, 0]);
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          const R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B), c = (mx - mn) / 255;
          r += R; g += G; b += B; w++;
          if (c < 0.12) continue;
          let h = mx === R ? (G - B) / (mx - mn) : mx === G ? (B - R) / (mx - mn) + 2 : (R - G) / (mx - mn) + 4;
          h = ((h / 6) % 1 + 1) % 1;
          const bin = bins[Math.floor(h * 12) % 12], k = c * c;
          bin[0] += R * k; bin[1] += G * k; bin[2] += B * k; bin[3] += k;
        }
        const top = bins.reduce((a, x) => (x[3] > a[3] ? x : a));
        if (top[3] > 0.6) { resolve(deep(top[0] / top[3], top[1] / top[3], top[2] / top[3])); return; }
        resolve(deep(r / w, g / w, b / w));
      } catch { resolve(null); }
    };
    im.onerror = () => resolve(null);
    im.src = src;
  });
}
function deep(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const dd = mx - mn;
    s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
    h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
    h /= 6;
  }
  s = Math.min(0.55, s * 1.1); const L = 0.15; // deep and calm, never loud
  const q = L < 0.5 ? L * (1 + s) : L + s - L * s, p = 2 * L - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255)).join(', ');
}

function currentArt() {
  const el = document.querySelector('.home .media img.on') || document.querySelector('.game .g-banner-img');
  return el?.currentSrc || el?.src || '';
}

async function check(on) {
  const src = on() ? currentArt() : '';
  if (src === last) return;
  last = src;
  if (!src) { document.body.classList.remove('hero-blend'); return; }
  const t = await tintOf(src);
  if (src !== last) return; // moved on meanwhile
  if (t) { root.style.setProperty('--hero-tint', t); document.body.classList.add('hero-blend'); }
  else document.body.classList.remove('hero-blend');
}

// on(): whether the prototype is switched on (Settings → Android)
export function startHeroTint(on) {
  clearInterval(timer);
  timer = setInterval(() => check(on), 400); // two lookups a tick: cheap, and needs no hooks in the views
  check(on);
}
