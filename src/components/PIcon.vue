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
// 0.9.24 (owner: controllers clipped on console cards): never past the box; a box can be wider than tall
// (`aspect`, console cards give wide drawings a wide box), and the drawing's shape is told (`shape`).
import { computed, ref, watch } from 'vue';
import { img } from '../store.js';
import Icon from './Icon.vue';
import { IS_ANDROID } from '../platform.js';
// Android also knows RomM's x360 slugs (its own consoles list uses them)
const ALIAS = { 'genesis-slash-megadrive': 'genesis', ps: 'psx', 'turbografx16--1': 'tg16', sfam: 'snes', gc: 'ngc', n3ds: '3ds', ...(IS_ANDROID && { x360: 'xbox360', 'xbox-360': 'xbox360' }) };
const props = defineProps({ p: Object, size: { type: Number, default: 32 }, aspect: { type: Number, default: 1 } });
const emit = defineEmits(['shape']);
const i = ref(0), box = ref(null);
const cands = computed(() => {
  const names = [...new Set([props.p.slug, props.p.fs_slug, ALIAS[props.p.slug]].filter(Boolean).map((s) => s.toLowerCase()))];
  return [...names.map((n) => `/assets/platforms/${n}.svg`), ...names.map((n) => `/assets/platforms/${n}.ico`)];
});
watch(cands, () => { i.value = 0; box.value = null; });
const N = 96;
const FITS = (window.__piconBoxes ||= new Map());
const tf = computed(() => {
  const b = box.value; if (!b) return '';
  const a = props.aspect || 1, s = Math.min(1.8, (N * 0.94 * a) / b.bw, (N * 0.94) / b.bh);
  if (s <= 1.04 && Math.abs(b.cx) <= 2 && Math.abs(b.cy) <= 2) return '';
  return `scale(${s.toFixed(3)}) translate(${((-b.cx / N) * 100 / a).toFixed(2)}%, ${((-b.cy / N) * 100).toFixed(2)}%)`;
});
function fit(e) {
  const el = e.target, key = el.currentSrc || el.src;
  if (!FITS.has(key)) {
    let b = null;
    try {
      const c = document.createElement('canvas'); c.width = c.height = N;
      const g = c.getContext('2d', { willReadFrequently: true });
      const w = el.naturalWidth || N, h = el.naturalHeight || N, k = Math.min(N / w, N / h);
      const dw = w * k, dh = h * k, ox = (N - dw) / 2, oy = (N - dh) / 2;
      g.drawImage(el, ox, oy, dw, dh);
      const d = g.getImageData(0, 0, N, N).data;
      let x0 = N, y0 = N, x1 = -1, y1 = -1;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 > x0 && y1 > y0) b = { bw: x1 - x0 + 1, bh: y1 - y0 + 1, cx: (x0 + x1 + 1) / 2 - N / 2, cy: (y0 + y1 + 1) / 2 - N / 2 };
    } catch {} // a picture that can't be read (no CORS) stays as it is
    FITS.set(key, b);
  }
  box.value = FITS.get(key);
  if (box.value) emit('shape', box.value.bw / box.value.bh);
}
</script>
<style scoped>
.picon { display: inline-flex; align-items: center; justify-content: center; flex: none; overflow: visible; }
.picon img { width: 100%; height: 100%; object-fit: contain; transform-origin: center; }
</style>
