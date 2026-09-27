<template>
  <div v-if="src && state !== 'bad'" class="game-logo" :class="[cls, { ready: state === 'ok' }]" role="heading" aria-level="1" :aria-label="name">
    <img :src="src" :alt="name" decoding="async" @load="ok" @error="bad" />
  </div>
  <h1 v-else :class="cls">{{ name }}</h1>
</template>

<script setup>
import { ref, watch } from 'vue';

// Shows the game's transparent logo when RomM has one, and the plain title otherwise.
const props = defineProps({ src: { type: String, default: '' }, name: { type: String, default: '' }, cls: { type: String, default: '' } });
const known = (globalThis.__cartLogoState ||= new Map()); // src -> 'ok' | 'bad', shared across views
const state = ref(known.get(props.src) || 'loading');
watch(() => props.src, (s) => { state.value = known.get(s) || 'loading'; });
function ok(e) {
  const im = e.target;
  // tiny or blank images are placeholders, not logos
  if (im.naturalWidth < 40 || im.naturalHeight < 16) return bad();
  known.set(props.src, 'ok'); state.value = 'ok';
}
function bad() { known.set(props.src, 'bad'); state.value = 'bad'; }
</script>

<style>
.game-logo { display: flex; align-items: flex-end; height: var(--logo-h, 104px); max-width: min(520px, 52vw); margin: 2px 0 10px; opacity: 0; transition: opacity 0.14s ease; }
.game-logo.ready { opacity: 1; }
.game-logo img { max-height: 100%; max-width: 100%; object-fit: contain; object-position: left bottom; filter: drop-shadow(0 4px 18px rgba(0, 0, 0, 0.55)); }
</style>
