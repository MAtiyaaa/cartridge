// Which controller is in your hands, so buttons can be drawn the way they look on it.
// Steam Input hands every app a virtual Xbox 360 pad, so the browser can't tell. The main process
// reads the real devices from Linux (/proc/bus/input/devices) instead.
import { ref, computed, watch } from 'vue';
import { store, call } from './store.js';
import { input } from './nav.js';
import { IS_ANDROID } from './platform.js';

const detected = ref('xbox');
export const padInfo = ref(null);
export const padKind = computed(() => {
  const pref = store.config?.ui?.buttons || 'auto';
  if (pref !== 'auto') return pref;
  if (IS_ANDROID && store.config?.android?.buttonLayout === 'nintendo') return 'nintendo'; // Settings → Android → Button layout
  return detected.value;
});
function fromId(id) {
  const s = String(id || '').toLowerCase();
  if (/054c|dualsense|dualshock|playstation|wireless controller/.test(s)) return 'playstation';
  if (/057e|pro controller|joy-con|nintendo/.test(s)) return 'nintendo';
  if (/28de-1205|28de-110[12]|28de-1142|steam deck|steam controller/.test(s)) return 'steam';
  return null;
}
export async function detectPad() {
  try {
    const r = await call('pad:detect');
    padInfo.value = r;
    if (r?.kind) { detected.value = r.kind; return; }
  } catch {}
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  for (const p of pads) { const k = fromId(p.id); if (k) { detected.value = k; return; } }
  // Android: the controller names come from the system (input.padName), not from /proc
  const k = IS_ANDROID && fromId(input.padName);
  if (k) { detected.value = k; return; }
  detected.value = 'xbox';
}
window.addEventListener('gamepadconnected', () => setTimeout(detectPad, 400));
window.addEventListener('gamepaddisconnected', () => setTimeout(detectPad, 400));
setInterval(detectPad, 30000);
if (IS_ANDROID) watch(() => input.padName, () => detectPad());
