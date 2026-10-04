<template>
  <!-- Two stacked pictures: the next one is decoded first, then fades in over the one showing. Moving from game
       to game (or to a console) goes picture to picture, never through an empty, dark frame. -->
  <div class="xart">
    <img v-for="(l, i) in layers" :key="i" :src="l.src || undefined" :class="{ on: l.on, blur: l.blur, top: i === cur.i }" alt="" decoding="async" />
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({ src: { type: String, default: '' }, blur: Boolean });
const layers = reactive([{ src: '', on: false, blur: false }, { src: '', on: false, blur: false }]);
const cur = reactive({ i: 0 }); // the layer on top
let token = 0, offT = 0;

async function show(src, blur) {
  const my = ++token;
  if (!src) { layers.forEach((l) => { l.on = false; }); return; }
  const top = layers[cur.i];
  if (top.on && top.src === src) { top.blur = blur; return; }
  const im = new Image();
  im.src = src;
  try { await im.decode(); } catch {
    // a busy server: once more, then keep whatever shows
    await new Promise((r) => setTimeout(r, 1500));
    if (my !== token) return;
    im.src = src + (src.includes('?') ? '&' : '?') + 'r=1';
    try { await im.decode(); } catch { return; }
  }
  if (my !== token) return; // already moved on
  // the new picture fades in on top of the old one, which goes once it's covered (no dip in between)
  const old = cur.i, next = 1 - old;
  layers[next].src = im.src;
  layers[next].blur = blur;
  layers[next].on = true;
  cur.i = next;
  clearTimeout(offT);
  offT = setTimeout(() => { if (cur.i === next) layers[old].on = false; }, 380);
}
watch(() => [props.src, props.blur], ([s, b]) => show(s, b), { immediate: true });
</script>

<style scoped>
.xart { position: relative; overflow: hidden; }
.xart img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.34s var(--ease); }
.xart img.on { opacity: 1; }
.xart img.top { z-index: 1; }
.xart img.blur { filter: blur(22px) saturate(1.3) brightness(0.8); transform: scale(1.15); }
</style>
