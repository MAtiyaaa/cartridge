// Start's tiles (0.9.19): what each one is, the sizes it comes in (columns by rows of an 8 by 4 screen),
// the first layout, and pinning a game or console from its own page.
import { store, saveConfig, toast } from './store.js';

export const TILES = {
  continue: { name: 'Continue playing', icon: 'mdiPlayCircleOutline', sizes: [[4, 2], [3, 2], [6, 2], [6, 3], [2, 2]] },
  clock: { name: 'Clock', icon: 'mdiClockOutline', sizes: [[2, 1], [3, 1], [2, 2]] },
  storage: { name: 'Storage', icon: 'mdiHarddisk', sizes: [[2, 1], [3, 1], [2, 2]] },
  week: { name: 'This week', icon: 'mdiCalendarWeekOutline', sizes: [[4, 1], [3, 1], [4, 2], [6, 1]] },
  consoles: { name: 'Consoles', icon: 'mdiGamepadSquareOutline', sizes: [[4, 1], [3, 1], [6, 1], [4, 2]] },
  fresh: { name: 'New in your library', icon: 'mdiCreation', sizes: [[4, 1], [3, 1], [6, 1], [4, 2]] },
  recent: { name: 'Recently played', icon: 'mdiHistory', sizes: [[4, 1], [6, 1], [3, 1], [4, 2]] },
  trophies: { name: 'Latest trophies', icon: 'mdiTrophyOutline', sizes: [[4, 1], [3, 1], [2, 2], [4, 2]] },
  downloads: { name: 'Downloads', icon: 'mdiTrayArrowDown', sizes: [[2, 1], [3, 1], [2, 2]] },
  favs: { name: 'Favourites', icon: 'mdiHeartOutline', sizes: [[4, 1], [6, 1], [3, 1], [4, 2]] },
  recs: { name: 'Recommended for you', icon: 'mdiThumbUpOutline', sizes: [[4, 1], [6, 1], [4, 2]] },
  surprise: { name: 'Surprise me', icon: 'mdiDiceMultipleOutline', sizes: [[2, 1], [1, 1], [2, 2]] },
  game: { name: 'A game', icon: 'mdiGamepadVariantOutline', sizes: [[2, 2], [2, 3], [3, 2], [4, 2]] },
  console: { name: 'A console', icon: 'mdiGamepadSquareOutline', sizes: [[2, 1], [3, 1], [2, 2]] },
};

export const DEFAULT = () => [
  { id: 'continue', type: 'continue', w: 4, h: 2 }, { id: 'clock', type: 'clock', w: 2, h: 1 }, { id: 'storage', type: 'storage', w: 2, h: 1 },
  { id: 'week', type: 'week', w: 4, h: 1 }, { id: 'consoles', type: 'consoles', w: 4, h: 1 }, { id: 'fresh', type: 'fresh', w: 4, h: 1 },
  { id: 'recent', type: 'recent', w: 4, h: 1 }, { id: 'trophies', type: 'trophies', w: 4, h: 1 },
];

export const valid = (t) => !!(t && TILES[t.type] && TILES[t.type].sizes.some(([w, h]) => w === t.w && h === t.h));
export function pinToStart(p) {
  const cur = (store.config.ui.start?.tiles || []).filter(valid);
  const tiles = cur.length ? cur : DEFAULT();
  if (tiles.some((t) => t.type === p.type && (p.romId ? t.romId === p.romId : t.platformId === p.platformId))) return toast('Already on Start', 'info', 2000, 'mdiPin');
  const [w, h] = TILES[p.type].sizes[0];
  saveConfig({ ui: { start: { tiles: [...tiles, { id: p.type + '-' + Date.now().toString(36), type: p.type, w, h, ...(p.romId ? { romId: p.romId } : { platformId: p.platformId }) }] } } });
  toast('Pinned to Start', 'ok', 2200, 'mdiPin');
}
