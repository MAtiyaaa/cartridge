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
   title readable and fades it into the page (no mask: cheaper without the GPU, same look) */
.media { position: absolute; inset: 0; pointer-events: none; overflow: hidden; background: var(--s0); }
.media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, var(--s0) 0%, color-mix(in srgb, var(--s0) 82%, transparent) 28%, color-mix(in srgb, var(--s0) 25%, transparent) 62%, transparent 100%), linear-gradient(0deg, var(--s0) 0%, color-mix(in srgb, var(--s0) 55%, transparent) 30%, transparent 62%); }
.media.empty { background: transparent; }
.media.empty::after { display: none; }
.media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; opacity: 0; transition: opacity var(--d-med) ease-out; }
.media img.on { opacity: 1; }
</style>
