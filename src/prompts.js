// Controller button icons (Kenney "Input Prompts", CC0: src/assets/prompts/LICENSE-kenney.txt).
// The icon set follows what you last used: a keyboard, or the controller the app sees
// (Xbox and Xbox-style handhelds like the ROG Ally, Legion Go and MSI Claw, PlayStation,
// Nintendo, Steam Deck). Settings → Look & Feel → Button icons can pin one.
import { computed } from 'vue';
import { store } from './store.js';
import { input } from './nav.js';

const files = import.meta.glob('./assets/prompts/*.svg', { eager: true, query: '?url', import: 'default' });
const ICONS = {};
for (const [p, url] of Object.entries(files)) ICONS[p.slice(p.lastIndexOf('/') + 1, -4)] = url;

export const FAMILIES = [
  { v: 'auto', l: 'Auto' },
  { v: 'xbox', l: 'Xbox' },
  { v: 'ps', l: 'PlayStation' },
  { v: 'nintendo', l: 'Nintendo' },
  { v: 'steamdeck', l: 'Steam Deck' },
  { v: 'keyboard', l: 'Keyboard' },
];

// Controller name (Gamepad API id, or the Android device name) -> icon family
export function familyOf(name = '') {
  const n = String(name).toLowerCase();
  if (/dualsense|dualshock|playstation|sony|054c|ps[345]\b/.test(n)) return 'ps';
  if (/nintendo|switch|pro controller|joy-?con|057e/.test(n)) return 'nintendo';
  if (/steam|valve|28de|deck/.test(n)) return 'steamdeck';
  return 'xbox'; // Xbox, XInput and most handhelds (ROG Ally, Legion Go, MSI Claw, AYN, Retroid)
}

export const promptFamily = computed(() => {
  const pick = store.config?.ui?.prompts || 'auto';
  if (pick !== 'auto') return pick;
  if (input.kb) return 'keyboard';
  if (store.config?.android?.buttonLayout === 'nintendo') return 'nintendo';
  return familyOf(input.padName);
});

// Logical buttons used in hints (A, B, X, Y, LB, RB, LT, RT, SELECT, START) -> icon URL.
// Nintendo icons follow the letters (A confirms, B goes back), as Nintendo players expect.
export function promptIcon(b, family = promptFamily.value) {
  return ICONS[`${family}_${String(b).toLowerCase()}`] || '';
}
