// Background color themes (PSP XMB style). Each theme sets the gradient and the accent colors.
export const THEMES = {
  purple: { label: 'Purple', grad: ['#b16cf0', '#6a2fc2', '#4a1b92', '#2b0f5e', '#170838', '#3a1170'], accent: ['#8b74e8', '#a18fff', '#6043c8'], warm: '#e1a38d' },
  blue: { label: 'Blue', grad: ['#6fb2ff', '#2f5fd0', '#1f3f9e', '#122768', '#0a1538', '#16307a'], accent: ['#5b8cff', '#8fb1ff', '#3561d6'], warm: '#8fe3ff' },
  red: { label: 'Red', grad: ['#ff7a6b', '#c2302f', '#921c28', '#5e0f1a', '#33070d', '#701223'], accent: ['#f0616a', '#ff8f95', '#c23a44'], warm: '#ffc48f' },
  green: { label: 'Green', grad: ['#7fe3a1', '#2c9c5e', '#1c7445', '#0f4a2c', '#072a18', '#135233'], accent: ['#45c77f', '#7fe3a6', '#26955a'], warm: '#d8f58f' },
  orange: { label: 'Orange', grad: ['#ffb36b', '#d9701f', '#a84d14', '#6b2f0b', '#3a1805', '#7a3810'], accent: ['#f59440', '#ffb877', '#c86a1f'], warm: '#ffe08f' },
  pink: { label: 'Pink', grad: ['#ff8fd4', '#c93a95', '#95226f', '#5e1247', '#330826', '#6e1553'], accent: ['#ee6ab8', '#ff9ad2', '#bd3c8b'], warm: '#ffc0e4' },
  teal: { label: 'Teal', grad: ['#6fe8e0', '#1f9e9a', '#157472', '#0c4a4a', '#052828', '#0f5555'], accent: ['#3cc9c2', '#79e6e0', '#1f9690'], warm: '#b0f5d8' },
  midnight: { label: 'Midnight', grad: ['#5a5f7a', '#262a3a', '#1a1d29', '#11131b', '#08090d', '#1b1e2b'], accent: ['#8b74e8', '#a18fff', '#6043c8'], warm: '#e1a38d' },
};

export function applyTheme(name) {
  const t = THEMES[name] || THEMES.purple;
  const r = document.documentElement.style;
  const [a, al, ad] = t.accent;
  r.setProperty('--primary', a);
  r.setProperty('--primary-l', al);
  r.setProperty('--primary-d', ad);
  r.setProperty('--peach', t.warm);
  r.setProperty('--grad', `linear-gradient(120deg, ${al} 0%, ${a} 45%, ${t.warm} 100%)`);
  r.setProperty('--ring', `0 0 0 2px #fff, 0 0 0 5px ${a}e6, 0 12px 40px ${a}73`);
  const g = t.grad;
  r.setProperty('--xmb', `radial-gradient(120% 90% at 85% 0%, ${g[0]} 0%, transparent 55%), radial-gradient(90% 80% at 0% 100%, ${g[5]} 0%, transparent 60%), linear-gradient(160deg, ${g[1]} 0%, ${g[2]} 38%, ${g[3]} 70%, ${g[4]} 100%)`);
  r.setProperty('--xmb-base', g[4]);
}
