<template>
  <button class="systile" data-focus :data-key="'sys-' + p.id" @click="$emit('open', p)" @focus="$emit('focused', p)" :style="tileStyle">
    <div class="glyph"><PIcon :p="p" :size="150" /></div>
    <div class="sys-top">
      <img v-if="logo && !logoFail" class="sys-logo" :src="logo" :alt="p.display_name" @error="logoFail = true" />
      <template v-else>
        <div class="ico"><PIcon :p="p" :size="40" /></div>
      </template>
    </div>
    <div>
      <div v-if="!logo || logoFail" class="nm">{{ p.display_name }}</div>
      <div v-if="meta" class="fam">{{ meta }}</div>
      <div class="ct">{{ p.rom_count }} games<template v-if="onDevice"> · <span class="ondev">{{ onDevice }} on device</span></template></div>
    </div>
  </button>
</template>
<script setup>
import { computed, ref, watch } from 'vue';
import { store, romsOf, call } from '../store.js';
import { consoleColors } from '../consoleColors.js';
import PIcon from './PIcon.vue';
const props = defineProps({ p: Object });
defineEmits(['open', 'focused']);
const meta = computed(() => [props.p.family_name, props.p.generation ? `Gen ${props.p.generation}` : '', props.p.category].filter(Boolean).slice(0, 2).join(' · '));
const onDevice = computed(() => romsOf(props.p.id).filter((r) => store.installed[r.id]).length);

// Console logo (white wordmark), cached by the main process; falls back to the name
const cache = (globalThis.__sysLogos ||= new Map());
const logo = ref(cache.get(props.p.slug) || '');
const logoFail = ref(false);
watch(() => props.p.slug, load, { immediate: true });
function load() {
  const k = props.p.slug;
  if (cache.has(k)) { logo.value = cache.get(k); return; }
  call('syslogo:get', { slug: props.p.slug, fs_slug: props.p.fs_slug }).then((u) => { cache.set(k, u || ''); logo.value = u || ''; }).catch(() => cache.set(k, ''));
}

// The console's own colours, as a tinted glass gradient that stays dark at the bottom right
const tileStyle = computed(() => {
  const c = consoleColors(props.p);
  if (!c) {
    let h = 0; for (const ch of props.p.slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
    const hue = 230 + (h % 90);
    return { background: `linear-gradient(145deg, hsla(${hue}, 45%, 30%, .92), rgba(14,16,24,.94) 70%)` };
  }
  const [a, b] = c;
  return {
    '--sys-a': a, '--sys-b': b,
    background: `radial-gradient(120% 90% at 0% 0%, ${a}e6 0%, ${a}8c 38%, transparent 70%), linear-gradient(150deg, ${a}66 0%, ${b}59 60%, rgba(12,13,20,.92) 100%), rgba(14,16,24,.9)`,
  };
});
</script>
<style>
.systile .sys-top { height: 44px; display: flex; align-items: center; }
.systile .sys-logo { max-height: 34px; max-width: 170px; object-fit: contain; object-position: left center; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45)); transition: transform 0.3s var(--ease); transform-origin: left center; }
.systile:focus .sys-logo { transform: scale(1.06); }
.systile .ondev { color: var(--green-l); }
.systile { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.05); }
.systile::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: linear-gradient(90deg, var(--sys-a, transparent), var(--sys-b, transparent)); opacity: 0.85; }
</style>
