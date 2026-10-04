<template>
  <span v-if="i < cands.length" class="picon" :style="{ width: size + 'px', height: size + 'px' }">
    <img :src="img(cands[i])" crossorigin="anonymous" @error="i++" @load="fit" :key="cands[i]" :style="{ transform: tf }" />
  </span>
  <Icon v-else name="mdiGamepadVariantOutline" :size="size" style="color: var(--muted)" />
</template>
<script setup>
// A console's picture from RomM. 0.9.17 (owner: Nintendo's looked small): RomM's pictures leave very
// different margins around the drawing (Switch with its Joy-Cons, GameCube, SNES), so each one is
// measured once (its drawn area, from the alpha channel) and scaled so the drawing fills the box.
import { computed, ref, watch } from 'vue';
import { img } from '../store.js';
import Icon from './Icon.vue';
import { IS_ANDROID } from '../platform.js';
// Android also knows RomM's x360 slugs (its own consoles list uses them)
const ALIAS = { 'genesis-slash-megadrive': 'genesis', ps: 'psx', 'turbografx16--1': 'tg16', sfam: 'snes', gc: 'ngc', n3ds: '3ds', ...(IS_ANDROID && { x360: 'xbox360', 'xbox-360': 'xbox360' }) };
const props = defineProps({ p: Object, size: { type: Number, default: 32 } });
const i = ref(0), tf = ref('');
const cands = computed(() => {
  const names = [...new Set([props.p.slug, props.p.fs_slug, ALIAS[props.p.slug]].filter(Boolean).map((s) => s.toLowerCase()))];
  return [...names.map((n) => `/assets/platforms/${n}.svg`), ...names.map((n) => `/assets/platforms/${n}.ico`)];
});
watch(cands, () => { i.value = 0; tf.value = ''; });
const FITS = (window.__piconFits ||= new Map());
function fit(e) {
  const el = e.target, key = el.currentSrc || el.src;
  if (FITS.has(key)) { tf.value = FITS.get(key); return; }
  let t = '';
  try {
    const N = 96, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d', { willReadFrequently: true });
    const w = el.naturalWidth || N, h = el.naturalHeight || N, k = Math.min(N / w, N / h);
    const dw = w * k, dh = h * k, ox = (N - dw) / 2, oy = (N - dh) / 2;
    g.drawImage(el, ox, oy, dw, dh);
    const d = g.getImageData(0, 0, N, N).data;
    let x0 = N, y0 = N, x1 = -1, y1 = -1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 > x0 && y1 > y0) {
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = Math.min(1.8, (N * 1.18) / bw, (N * 0.94) / bh); // 0.9.23: a wide drawing (Switch) may run a little past the box sideways, so it isn't tiny
      const cx = (x0 + x1 + 1) / 2 - N / 2, cy = (y0 + y1 + 1) / 2 - N / 2;
      if (s > 1.04 || Math.abs(cx) > 2 || Math.abs(cy) > 2) t = `scale(${s.toFixed(3)}) translate(${((-cx / N) * 100).toFixed(2)}%, ${((-cy / N) * 100).toFixed(2)}%)`;
    }
  } catch {} // a picture that can't be read (no CORS) stays as it is
  FITS.set(key, t);
  tf.value = t;
}
</script>
<style scoped>
.picon { display: inline-flex; align-items: center; justify-content: center; flex: none; overflow: visible; }
.picon img { width: 100%; height: 100%; object-fit: contain; transform-origin: center; }
</style>
