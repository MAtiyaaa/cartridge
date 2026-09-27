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
.media { position: absolute; top: 0; right: 0; bottom: 0; width: 60%; pointer-events: none; overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 42%), linear-gradient(0deg, transparent 0%, #000 38%), linear-gradient(180deg, transparent 0%, #000 12%);
  -webkit-mask-composite: source-in; mask-composite: intersect; }
.media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.18s ease-out; }
.media img.on { opacity: 1; }
</style>
