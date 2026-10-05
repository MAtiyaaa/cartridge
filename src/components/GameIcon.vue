<template>
  <div class="gicon" :style="{ width: size + 'px', height: size + 'px', borderRadius: Math.round(size * 0.22) + 'px' }">
    <img v-if="icon" class="gi-full" :src="img(icon)" loading="lazy" @error="icon = ''" />
    <template v-else-if="fallback">
      <img class="gi-blur" :src="fallback" aria-hidden="true" />
      <img class="gi-fit" :src="fallback" loading="lazy" />
    </template>
    <div v-else class="gi-none"><Grade :g="grade" :size="Math.round(size * 0.5)" /></div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { call, img, romById, store, iconKey } from '../store.js';
import Grade from './Grade.vue';
// A square game icon: SteamGridDB's icon when there is one (sharp, made for this), otherwise the
// emulator's own picture fitted inside the square over a soft blurred copy of itself.
const props = defineProps({ title: String, romId: Number, fallback: String, size: { type: Number, default: 72 }, grade: { type: String, default: 'G' } });
const cache = (globalThis.__gameIcons ||= new Map());
const icon = ref('');
function load() {
  const rom = props.romId ? romById(props.romId) : null;
  const name = rom?.name || props.title;
  const key = iconKey(rom?.id, props.title);
  if (!name || !store.config?.sgdbKey) { icon.value = ''; return; }
  if (cache.has(key)) { const v = cache.get(key); if (typeof v === 'string') icon.value = v; else v.then((u) => (icon.value = u || '')); return; }
  const p = call('icon:get', { key, name, year: rom?.year ? new Date(rom.year > 1e11 ? rom.year : rom.year * 1000).getFullYear() : null }).then((u) => { cache.set(key, u || ''); return u; }).catch(() => { cache.set(key, ''); return ''; });
  cache.set(key, p);
  p.then((u) => (icon.value = u || ''));
}
watch(() => [props.romId, props.title, store.config?.sgdbKey, store.iconVer], load, { immediate: true });
</script>
<style>
.gicon { position: relative; flex: none; overflow: hidden; background: var(--s2); box-shadow: var(--tile-shadow, 0 6px 18px rgba(0, 0, 0, 0.4)), inset 0 0 0 1px rgba(255, 255, 255, 0.08); }
.gicon img { position: absolute; }
.gi-full { inset: 0; width: 100%; height: 100%; object-fit: cover; }
.gi-blur { inset: -20%; width: 140%; height: 140%; object-fit: cover; filter: blur(14px) saturate(1.2) brightness(0.75); }
.gi-fit { inset: 8%; width: 84%; height: 84%; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45)); }
.gi-none { position: absolute; inset: 0; display: grid; place-items: center; background: var(--tile-bg, linear-gradient(145deg, rgba(var(--primary-rgb), 0.35), rgba(0, 0, 0, 0.4))); }
body.light-fx .gi-blur { filter: brightness(0.5); }
</style>
