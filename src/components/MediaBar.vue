<template>
  <div class="media" :class="{ empty: !cur.src }">
    <img v-for="(l, i) in layers" :key="i" :src="l.src || undefined" :class="{ on: l.on }" decoding="async" alt="" />
  </div>
</template>
<script setup>
import { reactive, watch } from 'vue';
// Two stacked images; the next one is decoded off-screen first, then swapped in with a short fade.
const props = defineProps({ src: String });
const layers = reactive([{ src: '', on: false }, { src: '', on: false }]);
let idx = 0;
const cur = layers[0];
let token = 0;
watch(() => props.src, async (src) => {
  const my = ++token;
  if (!src) { layers.forEach((l) => (l.on = false)); return; }
  if (layers[idx].src === src && layers[idx].on) return;
  const im = new Image();
  im.src = src;
  try { await im.decode(); } catch { return; }
  if (my !== token) return; // user already moved on
  const next = 1 - idx;
  layers[next].src = src;
  layers[next].on = true;
  layers[idx].on = false;
  idx = next;
  cur.src = src;
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
.media img.on { opacity: 1; animation: media-settle 1600ms cubic-bezier(0.2, 0, 0, 1) both; }
/* 0.9.19: each new picture settles in from slightly closer, once (a weighted arrival, not a loop) */
@keyframes media-settle { from { transform: scale(1.045); } to { transform: none; } }
:global(body.motion-reduce) .media img.on { animation: none; }
</style>
