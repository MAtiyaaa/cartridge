<template>
  <!-- the same card as the Consoles page (SysTile), drawn inside another control, so not a button -->
  <div class="systile static" :style="tileStyle">
    <div class="sys-clip"><div class="glyph"><PIcon :p="p" :size="150" /></div></div>
    <div class="sys-top">
      <img v-if="logo && !logoFail" class="sys-logo" :src="logo" :alt="p.display_name" :style="logoSize" @error="logoFail = true" />
      <div v-else class="nm">{{ p.display_name }}</div>
    </div>
    <div v-if="!compact" class="ct">{{ p.rom_count }} {{ p.rom_count === 1 ? 'game' : 'games' }}</div>
  </div>
</template>
<script setup>
// A console card for Start's Consoles tile (0.9.21, owner: the same boxes as the Consoles page, not chips)
import { computed, ref, watch } from 'vue';
import { call } from '../store.js';
import { consoleColors } from '../consoleColors.js';
import { opticalOf } from '../consoleOptical.js';
import PIcon from './PIcon.vue';
const props = defineProps({ p: Object, compact: Boolean });
const cache = (globalThis.__sysLogos ||= new Map());
const logo = ref(cache.get(props.p.slug) || ''), logoFail = ref(false);
watch(() => props.p.slug, () => {
  const k = props.p.slug;
  if (cache.has(k)) { logo.value = cache.get(k); return; }
  call('syslogo:get', { slug: props.p.slug, fs_slug: props.p.fs_slug }).then((u) => { cache.set(k, u || ''); logo.value = u || ''; }).catch(() => cache.set(k, ''));
}, { immediate: true });
const logoSize = computed(() => { const f = opticalOf(logo.value, props.p.slug); return f === 1 ? null : { maxHeight: `min(${Math.round(30 * f)}px, ${Math.round(30 * f)}cqh)` }; });
const tileStyle = computed(() => {
  const c = consoleColors(props.p);
  if (c) return { '--sys-a': c[0], '--sys-b': c[1] };
  let h = 0; for (const ch of props.p.slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const hue = 200 + (h % 140);
  return { '--sys-a': `hsl(${hue} 45% 42%)`, '--sys-b': `hsl(${(hue + 30) % 360} 40% 22%)` };
});
</script>
<style>
/* fills whatever space it's given; the picture and wordmark scale with it */
.systile.static { width: 100%; height: 100%; min-width: 0; min-height: 0; padding: clamp(10px, 9cqh, 18px) clamp(10px, 7cqw, 20px); container-type: size; }
.systile.static .sys-top { height: auto; max-width: 70%; }
.systile.static .sys-logo { max-height: min(30px, 26cqh); max-width: 100%; }
.systile.static .nm { font-size: clamp(12px, 15cqh, 20px); max-width: 100%; }
.systile.static .glyph { right: 7%; top: 10%; height: 80%; }
.systile.static .ct { align-self: flex-start; }
@container (max-height: 90px) { .systile.static .ct { display: none; } }
</style>
