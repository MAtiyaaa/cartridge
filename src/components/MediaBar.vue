<template>
  <div class="media" :class="{ empty: !shown }">
    <img v-for="(l, i) in layers" :key="i" :src="l.src || undefined" :class="{ on: l.on, blur: l.blur }" decoding="async" alt="" />
  </div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue';
// Two stacked images; the next one is decoded off-screen first, then swapped in with a short fade.
// 0.9.23 bug sweep: the layer fading out kept its own picture (it was overwritten mid-fade, so there was
// no crossfade), a picture that fails to load clears the old game's instead of leaving it up, and the
// blurred-cover fallback ({ src, blur }) is shown blurred.
const props = defineProps({ src: [String, Object] });
const layers = reactive([{ src: '', on: false, blur: false }, { src: '', on: false, blur: false }]);
const shown = ref('');
let idx = 0, token = 0;
watch(() => props.src, async (v) => {
  const my = ++token;
  const src = typeof v === 'string' ? v : v?.src || '', blur = typeof v === 'object' && !!v?.blur;
  const off = () => { layers.forEach((l) => (l.on = false)); shown.value = ''; };
  if (!src) return off();
  if (layers[idx].src === src && layers[idx].on) { layers[idx].blur = blur; return; }
  const im = new Image();
  im.src = src;
  try { await im.decode(); } catch { if (my === token) off(); return; }
  if (my !== token) return; // user already moved on
  const next = 1 - idx;
  layers[next].src = src; layers[next].blur = blur;
  layers[next].on = true;
  layers[idx].on = false;
  idx = next;
  shown.value = src;
}, { immediate: true });
</script>
<style scoped>
/* 0.9: the hero art runs the full width of the screen; a scrim on the left and at the bottom keeps the
   title readable and fades it into the page (no mask: cheaper without the GPU, same look). 0.9.3 K: also
   a short fade at the top, so no edge shows under the top bar */
.media { position: absolute; inset: 0; pointer-events: none; overflow: hidden; background: var(--s0); }
.media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--s0) 70%, transparent) 0%, transparent 9%), linear-gradient(90deg, var(--s0) 0%, color-mix(in srgb, var(--s0) 78%, transparent) 24%, color-mix(in srgb, var(--s0) 18%, transparent) 56%, transparent 100%), linear-gradient(0deg, var(--s0) 0%, color-mix(in srgb, var(--s0) 55%, transparent) 30%, transparent 62%); }
.media.empty { background: transparent; }
.media.empty::after { display: none; }
.media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; opacity: 0; transition: opacity var(--d-med) ease-out; }
.media img.on { opacity: 1; animation: media-settle 1100ms var(--ease-out) both; }
/* 0.9.19: each new picture settles in from slightly closer, once (a weighted arrival, not a loop) */
@keyframes media-settle { from { transform: scale(1.025); } to { transform: none; } } /* 0.9.23: calmer, it changes with every game you pass */
:global(body.motion-reduce .media img.on) { animation: none; }
/* a cover standing in for a missing hero: blurred and dimmed, never a stretched sharp cover */
.media img.blur { filter: blur(28px) saturate(1.2) brightness(0.7); inset: -40px; width: calc(100% + 80px); height: calc(100% + 80px); }
.media img.blur.on { animation: none; } /* a blur redrawn every frame of the settle costs too much without the GPU */
:global(body.light-fx .media img.blur) { filter: saturate(1.1) brightness(0.55); }
</style>
