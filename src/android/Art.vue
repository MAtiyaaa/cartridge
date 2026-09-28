<template>
  <div class="art" :class="{ shown }">
    <img v-if="url" :src="url" :class="{ blur }" alt="" decoding="async" />
    <slot v-if="!shown" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// An image that is decoded off-screen before it fades in (like MediaBar), so art never pops in half
// drawn or flashes as broken. A failed load (busy server, dropped connection) is retried once.
const props = defineProps({ src: { type: String, default: '' }, blur: Boolean });
const url = ref('');
const shown = ref(false);
let token = 0;

async function load(src, retry = false) {
  const my = ++token;
  const im = new Image();
  im.src = retry ? src + '&r=1' : src;
  try {
    await im.decode();
  } catch {
    if (!retry && my === token) setTimeout(() => my === token && load(src, true), 1500);
    return;
  }
  if (my !== token) return;
  url.value = im.src;
  shown.value = true;
}
watch(() => props.src, (src) => {
  token++;
  shown.value = false;
  url.value = '';
  if (src) load(src);
}, { immediate: true });
</script>

<style scoped>
.art { position: relative; overflow: hidden; }
.art img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.25s var(--ease); }
.art.shown img { opacity: 1; }
.art img.blur { filter: blur(22px) saturate(1.3) brightness(0.8); transform: scale(1.15); }
</style>
