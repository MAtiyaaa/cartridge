<template>
  <div v-if="logo && state !== 'bad'" class="game-logo" :class="{ ready: state === 'ok', inv: logo.dark }" role="heading" aria-level="1" :aria-label="name" :style="box">
    <img :src="logo.url" :alt="name" decoding="async" @load="ok" @error="bad" />
  </div>
  <h1 v-else :class="cls">{{ name }}</h1>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

// Shows the game's logo (trimmed by the main process) at an even visual size, or the title.
// Logos differ wildly in shape: a wide wordmark and a tall emblem at the same height look nothing
// alike. So each one gets the same *area*, clamped to a max width and height.
const props = defineProps({
  logo: { type: Object, default: null }, // { url, w, h, dark }
  name: { type: String, default: '' },
  cls: { type: String, default: '' },
  area: { type: Number, default: 30000 }, // px² of screen space at 1280 wide
  maxW: { type: Number, default: 440 },
  maxH: { type: Number, default: 120 },
});
const known = (globalThis.__cartLogoState ||= new Map());
const state = ref(known.get(props.logo?.url) || 'loading');
watch(() => props.logo?.url, (s) => { state.value = known.get(s) || 'loading'; });
const box = computed(() => {
  const l = props.logo;
  if (!l || !l.w || !l.h) return {};
  const ar = l.w / l.h;
  let h = Math.sqrt(props.area / ar), w = h * ar;
  const k = Math.min(1, props.maxW / w, props.maxH / h);
  w *= k; h *= k;
  // scale with the window a little, like the rest of the UI
  return { width: `min(${Math.round(w)}px, ${(w / 12.8).toFixed(2)}vw * 1.1)`, height: 'auto', aspectRatio: `${l.w} / ${l.h}` };
});
function ok() { known.set(props.logo.url, 'ok'); state.value = 'ok'; }
function bad() { known.set(props.logo.url, 'bad'); state.value = 'bad'; }
</script>

<style>
.game-logo { display: block; margin: 2px 0 8px; opacity: 0; transition: opacity 0.14s ease; max-width: 100%; }
.game-logo.ready { opacity: 1; }
.game-logo img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: left bottom; filter: drop-shadow(0 4px 18px rgba(0, 0, 0, 0.55)); }
/* all-black logos (and no white version on SteamGridDB): draw them white */
.game-logo.inv img { filter: brightness(0) invert(1) drop-shadow(0 4px 18px rgba(0, 0, 0, 0.6)); }
</style>
