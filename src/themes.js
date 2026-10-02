// Look & Feel: colour themes, surfaces, text, fonts, cards and motion.
// Everything is applied as CSS variables and body classes, so switching is instant and costs nothing.

// ---------------- colour
const hex2rgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgb2hex(f(0) * 255, f(8) * 255, f(4) * 255);
}
// A whole theme from one accent colour: accent shades, a warm second colour and the background
// gradient, all in the same family.
export function themeFrom(accent, label = 'Custom') {
  const [h, s0, l0] = rgb2hsl(...hex2rgb(accent));
  const s = Math.max(0.12, s0), grey = s0 < 0.12;
  const bgS = grey ? 0.08 : Math.min(0.75, s * 0.85);
  return {
    label,
    accent: [hsl(h, s, Math.max(0.5, Math.min(0.68, l0))), hsl(h, s, 0.76), hsl(h, s, 0.42)],
    warm: grey ? '#e6e8ee' : hsl(h + 40, Math.min(1, s + 0.1), 0.75),
    grad: [hsl(h + 12, bgS, 0.66), hsl(h, bgS, 0.42), hsl(h - 4, bgS, 0.32), hsl(h - 8, bgS, 0.2), hsl(h - 10, bgS, 0.11), hsl(h + 6, bgS, 0.26)],
  };
}
export const THEMES = {
  // Cartridge's own: white on neutral greys (the default since 0.9; white highlights, buttons and bars since 0.9.2)
  cartridge: { label: 'Cartridge', grad: ['#3a3d44', '#1c1e23', '#15171b', '#101114', '#0b0c0e', '#1a1c20'], accent: ['#ffffff', '#ffffff', '#d4d4d8'], bgAccent: ['#ef4b23', '#ff7a55'], warm: '#ffb35c', neutral: true },
  purple: { label: 'Purple', grad: ['#b16cf0', '#6a2fc2', '#4a1b92', '#2b0f5e', '#170838', '#3a1170'], accent: ['#8b74e8', '#a18fff', '#6043c8'], warm: '#e1a38d' },
  blue: { label: 'Blue', grad: ['#6fb2ff', '#2f5fd0', '#1f3f9e', '#122768', '#0a1538', '#16307a'], accent: ['#5b8cff', '#8fb1ff', '#3561d6'], warm: '#8fe3ff' },
  red: { label: 'Red', grad: ['#ff7a6b', '#c2302f', '#921c28', '#5e0f1a', '#33070d', '#701223'], accent: ['#f0616a', '#ff8f95', '#c23a44'], warm: '#ffc48f' },
  green: { label: 'Green', grad: ['#7fe3a1', '#2c9c5e', '#1c7445', '#0f4a2c', '#072a18', '#135233'], accent: ['#45c77f', '#7fe3a6', '#26955a'], warm: '#d8f58f' },
  orange: { label: 'Orange', grad: ['#ffb36b', '#d9701f', '#a84d14', '#6b2f0b', '#3a1805', '#7a3810'], accent: ['#f59440', '#ffb877', '#c86a1f'], warm: '#ffe08f' },
  pink: { label: 'Pink', grad: ['#ff8fd4', '#c93a95', '#95226f', '#5e1247', '#330826', '#6e1553'], accent: ['#ee6ab8', '#ff9ad2', '#bd3c8b'], warm: '#ffc0e4' },
  teal: { label: 'Teal', grad: ['#6fe8e0', '#1f9e9a', '#157472', '#0c4a4a', '#052828', '#0f5555'], accent: ['#3cc9c2', '#79e6e0', '#1f9690'], warm: '#b0f5d8' },
  midnight: { label: 'Midnight', grad: ['#5a5f7a', '#262a3a', '#1a1d29', '#11131b', '#08090d', '#1b1e2b'], accent: ['#8b74e8', '#a18fff', '#6043c8'], warm: '#e1a38d' },
  gold: themeFrom('#e8b43a', 'Gold'),
  crimson: themeFrom('#d6284b', 'Crimson'),
  lime: themeFrom('#9bd33c', 'Lime'),
  sky: themeFrom('#3fb6f0', 'Sky'),
  lavender: themeFrom('#b89cf5', 'Lavender'),
  graphite: themeFrom('#9aa3b2', 'Graphite'),
};
// Swatches for the custom colour picker: 12 hues x 3 shades, plus greys
export const CUSTOM_SWATCHES = [
  ...[0.62, 0.5, 0.4].flatMap((l) => Array.from({ length: 12 }, (_, i) => hsl(i * 30, 0.72, l))),
  '#e6e8ee', '#9aa3b2', '#5a6273',
];

// Surfaces: how see-through panels are, and how dark the page behind them is
export const SURFACES = {
  solid: { label: 'Solid', glassA: 1, bg: '#0c0d10' },
  glass: { label: 'Glass', glassA: 0.62, bg: '#06070b' },
  oled: { label: 'OLED black', glassA: 1, bg: '#000000', black: true },
};
export const TEXTS = {
  // three clearly different sets (0.9.3): High contrast lifts the secondary text right up, Soft is
  // dimmer and slightly warm for dark rooms
  normal: { label: 'Standard', text: '#f4f4f5', muted: '#a4a6ad', dim: '#6c6f77' },
  bright: { label: 'High contrast', text: '#ffffff', muted: '#e6e7eb', dim: '#b9bcc4' },
  soft: { label: 'Soft', text: '#cfccc6', muted: '#8a8781', dim: '#5a5853' },
};
// Bundled open-source fonts (SIL Open Font License), display + body
export const FONTS = {
  cartridge: { label: 'Archivo + Inter', display: "'Archivo Variable', 'Inter Variable', Roboto, sans-serif", body: "'Inter Variable', Roboto, 'Noto Sans', system-ui, sans-serif" },
  outfit: { label: 'Outfit', display: "'Outfit Variable', 'Outfit', Roboto, sans-serif", body: "Roboto, 'Noto Sans', system-ui, sans-serif" },
  inter: { label: 'Inter', display: "'Inter Variable', Roboto, sans-serif", body: "'Inter Variable', Roboto, sans-serif" },
  nunito: { label: 'Nunito', display: "'Nunito Variable', Roboto, sans-serif", body: "'Nunito Variable', Roboto, sans-serif" },
  rubik: { label: 'Rubik', display: "'Rubik Variable', Roboto, sans-serif", body: "'Rubik Variable', Roboto, sans-serif" },
  grotesk: { label: 'Space Grotesk', display: "'Space Grotesk Variable', Roboto, sans-serif", body: "Roboto, 'Noto Sans', system-ui, sans-serif" },
  lexend: { label: 'Lexend', display: "'Lexend Variable', Roboto, sans-serif", body: "'Lexend Variable', Roboto, sans-serif" },
};
export const CARD_SHAPES = { rounded: { label: 'Rounded', r: '6px' }, square: { label: 'Square', r: '2px' }, soft: { label: 'Soft', r: '14px' }, round: { label: 'Extra round', r: '22px' } };
export const CARD_SIZES = { sm: { label: 'Small', w: '128px' }, md: { label: 'Medium', w: '152px' }, lg: { label: 'Large', w: '184px' }, xl: { label: 'Huge', w: '220px' } };
export const DENSITIES = { compact: { label: 'Compact', x: '12px', y: '14px' }, normal: { label: 'Normal', x: '18px', y: '22px' }, spacious: { label: 'Spacious', x: '28px', y: '34px' } };

export function themeOf(ui) {
  if (ui?.theme === 'custom' && /^#[0-9a-f]{6}$/i.test(ui.customColor || '')) return themeFrom(ui.customColor);
  return THEMES[ui?.theme] || THEMES.cartridge;
}

export function applyTheme(uiOrName) {
  const ui = typeof uiOrName === 'string' ? { theme: uiOrName } : uiOrName || {};
  const col = ui.colors || {};
  const ok = (c) => /^#[0-9a-f]{6}$/i.test(c || '');
  let t = themeOf(ui);
  // fine-tuned colours on top of the theme: background, highlights, buttons and bars
  if (ok(col.background)) t = { ...t, grad: themeFrom(col.background).grad };
  const r = document.documentElement.style;
  const lum = (h) => { const [x, y, z] = hex2rgb(h); return (0.299 * x + 0.587 * y + 0.114 * z) / 255; };
  // themeFrom turns white into grey (it clamps lightness), so near-white picks stay white
  const accentOf = (c) => lum(c) > 0.85 ? [c, c, '#d4d4d8'] : themeFrom(c).accent;
  const [a, al, ad] = ok(col.highlight) ? accentOf(col.highlight) : t.accent;
  if (ok(col.buttons)) {
    const [b, bl, bd] = accentOf(col.buttons);
    r.setProperty('--btn', `linear-gradient(120deg, ${bl} 0%, ${b} 55%, ${bd} 100%)`);
    r.setProperty('--on-btn', lum(b) > 0.6 ? '#141018' : '#ffffff');
  } else { r.removeProperty('--btn'); r.removeProperty('--on-btn'); }
  if (ok(col.bars)) { const [b, bl] = accentOf(col.bars); r.setProperty('--bar', `linear-gradient(90deg, ${b}, ${bl})`); }
  else r.removeProperty('--bar');
  document.body.classList.toggle('custom-bars', ok(col.bars));
  const surf = SURFACES[ui.surface] || SURFACES.solid;
  const tx = TEXTS[ui.text] || TEXTS.normal;
  const g = t.grad;
  const rgb = (h) => hex2rgb(h).join(', ');
  const [th, ts] = rgb2hsl(...hex2rgb(g[3]));
  const tint = hex2rgb(hsl(th, Math.min(0.7, ts), 0.1)).join(', ');
  const ah = rgb2hsl(...hex2rgb(a))[0];
  r.setProperty('--primary', a);
  r.setProperty('--primary-l', al);
  r.setProperty('--primary-d', ad);
  r.setProperty('--primary-rgb', rgb(a));
  r.setProperty('--primary-l-rgb', rgb(al));
  const light = lum(a) > 0.75;
  r.setProperty('--primary-t', light ? '#ffffff' : hsl(ah, 0.9, 0.86));
  r.setProperty('--on-primary', light ? '#0c0d10' : hsl(ah, 0.5, 0.1));
  r.setProperty('--knob', light ? '#0c0d10' : '#ffffff');
  r.setProperty('--peach', t.warm);
  // 0.9: one flat accent, no gradients. Focus (where you are) is white, or the Highlights colour
  // when one is picked, with text that reads on it (0.9.2)
  const fo = ok(col.highlight) ? a : '#ffffff', foLight = lum(fo) > 0.6;
  r.setProperty('--grad', `linear-gradient(${a}, ${a})`);
  r.setProperty('--focus', fo);
  r.setProperty('--on-focus', foLight ? '#0c0d10' : '#ffffff');
  r.setProperty('--on-focus-dim', foLight ? 'rgba(12, 13, 16, 0.7)' : 'rgba(255, 255, 255, 0.75)');
  r.setProperty('--ring', `0 0 0 3px var(--s0), 0 0 0 6px ${fo}`);
  r.setProperty('--ring-soft', `0 0 0 2px ${fo}`);
  // surfaces: neutral greys, tinted a little towards the theme for the coloured themes
  const sh = rgb2hsl(...hex2rgb(g[2])), ss = t.neutral ? 0 : Math.min(0.16, sh[1] * 0.25);
  const surfL = surf.black ? [0, 0.055, 0.09, 0.14] : [0.05, 0.085, 0.12, 0.165];
  const S = surfL.map((l) => hsl(sh[0], ss, l));
  if (surf.bg && !surf.black && surf.glassA < 1) S[0] = surf.bg;
  // chosen but not where you are: a lighter grey fill (0.9.2, replaces accent stripes)
  r.setProperty('--sel', hsl(sh[0], ss, surf.black ? 0.22 : 0.26));
  S.forEach((c, i) => r.setProperty('--s' + i, surf.glassA < 1 && i ? `rgba(${rgb(c)}, ${surf.glassA})` : c));
  r.setProperty('--xmb', `radial-gradient(120% 90% at 85% 0%, ${g[0]} 0%, transparent 55%), radial-gradient(90% 80% at 0% 100%, ${g[5]} 0%, transparent 60%), linear-gradient(160deg, ${g[1]} 0%, ${g[2]} 38%, ${g[3]} 70%, ${g[4]} 100%)`);
  r.setProperty('--xmb-base', surf.black ? '#000' : g[4]);
  // Cartridge's own theme: a flat page, so art and panels meet it without a seam
  if (t.neutral) { r.setProperty('--xmb', surf.black ? '#000' : S[0]); r.setProperty('--xmb-base', surf.black ? '#000' : S[0]); }
  for (let i = 0; i < 6; i++) r.setProperty('--g' + i, g[i]);
  r.setProperty('--tint-rgb', surf.black ? '0, 0, 0' : tint);
  r.setProperty('--glass-bg', surf.glassA < 1 ? `rgba(${surf.black ? '0, 0, 0' : tint}, ${surf.glassA})` : S[1]);
  r.setProperty('--bg', surf.black ? '#000' : S[0]);
  r.setProperty('--text', tx.text);
  r.setProperty('--muted', tx.muted);
  r.setProperty('--dim', tx.dim);
  const f = FONTS[ui.font] || FONTS.cartridge;
  r.setProperty('--display', f.display);
  r.setProperty('--body', f.body);
  r.setProperty('--card-r', (CARD_SHAPES[ui.cardShape] || CARD_SHAPES.rounded).r);
  const d = DENSITIES[ui.density] || DENSITIES.normal;
  r.setProperty('--gap-x', d.x);
  r.setProperty('--gap-y', d.y);
  const b = document.body.classList;
  b.toggle('motion-fast', ui.motion === 'fast');
  b.toggle('motion-reduce', ui.motion === 'reduce');
  b.toggle('surface-oled', !!surf.black);
  b.toggle('surface-glass', surf.glassA < 1 && !surf.black);
  b.toggle('no-titles', ui.cardTitles === false);
}
// Colours the animated backgrounds draw with
export function paletteOf(ui) {
  let t = themeOf(ui);
  if (/^#[0-9a-f]{6}$/i.test(ui?.colors?.background || '')) t = { ...t, grad: themeFrom(ui.colors.background).grad };
  if (/^#[0-9a-f]{6}$/i.test(ui?.colors?.highlight || '')) t = { ...t, accent: themeFrom(ui.colors.highlight).accent };
  // animated backgrounds keep the brand colour when the highlights are plain white
  const [pa, pl] = !ui?.colors?.highlight && t.bgAccent ? t.bgAccent : t.accent;
  return { accent: pa, light: pl, warm: t.warm, grad: t.grad, black: !!(SURFACES[ui?.surface] || {}).black };
}
// "Light effects" when the GPU is off (software rendering), unless the user picked otherwise
export function lightEffects(ui, info) {
  const e = ui?.effects || 'auto';
  return e === 'light' || (e === 'auto' && (info?.gpu === false || import.meta.env.MODE === 'android'));
}
