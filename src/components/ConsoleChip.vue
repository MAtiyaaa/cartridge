<template>
  <span class="cchip" :style="tint">
    <img v-if="logo && !fail" class="cchip-logo" :src="logo" :alt="p.display_name" @error="fail = true" />
    <span v-else class="cchip-ico"><PIcon :p="p" :size="28" /><b>{{ short }}</b></span>
  </span>
</template>
<script setup>
// A console as a small coloured chip with its white wordmark (Start's Consoles tile, 0.9.19). Same logo
// cache and colours as SysTile, so the two always match.
import { computed, ref, watch } from 'vue';
import { call } from '../store.js';
import { consoleColors } from '../consoleColors.js';
import PIcon from './PIcon.vue';
const props = defineProps({ p: Object });
const cache = (globalThis.__sysLogos ||= new Map());
const logo = ref(cache.get(props.p.slug) || ''), fail = ref(false);
watch(() => props.p.slug, () => {
  const k = props.p.slug;
  if (cache.has(k)) { logo.value = cache.get(k); return; }
  call('syslogo:get', { slug: props.p.slug, fs_slug: props.p.fs_slug }).then((u) => { cache.set(k, u || ''); logo.value = u || ''; }).catch(() => cache.set(k, ''));
}, { immediate: true });
const short = computed(() => String(props.p.display_name || '').replace(/^(Sony|Nintendo|Sega|Microsoft)\s+/i, ''));
const tint = computed(() => {
  const c = consoleColors(props.p);
  if (c) return { '--ca': c[0], '--cb': c[1] };
  let h = 0; for (const ch of props.p.slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const hue = 200 + (h % 140);
  return { '--ca': `hsl(${hue} 45% 42%)`, '--cb': `hsl(${(hue + 30) % 360} 40% 22%)` };
});
</script>
<style>
.cchip { position: relative; display: flex; align-items: center; justify-content: center; min-width: 0; border-radius: var(--r-md); background: linear-gradient(150deg, var(--ca), var(--cb)); overflow: hidden; padding: 10px 12px; }
.cchip-logo { max-width: 86%; max-height: 46%; min-height: 18px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4)); }
.cchip-ico { display: flex; align-items: center; gap: 8px; min-width: 0; color: #fff; font-family: var(--display); font-weight: 700; font-size: var(--t-sm); }
.cchip-ico b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
