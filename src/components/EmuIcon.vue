<template>
  <img v-if="src" class="emu-icon" :src="src" :style="{ width: size + 'px', height: size + 'px' }" alt="" @error="failed" />
  <Icon v-else :name="fallback" :size="size" />
</template>
<script setup>
// The emulator's own icon, read from where it's installed (0.9.16); the symbol until it's found.
import { ref, watch } from 'vue';
import { call } from '../store.js';
import Icon from './Icon.vue';
const props = defineProps({ id: String, size: { type: Number, default: 24 }, fallback: { type: String, default: 'mdiGamepadVariantOutline' } });
const cache = (globalThis.__emuIcons ||= new Map());
// 0.9.24 (owner: icons flickered while an emulator updated): a found icon is kept by id and shown at once
// when the list redraws, instead of the symbol for a frame until the lookup answers again; a failed load
// while the program is being replaced keeps the last good one
const known = (globalThis.__emuIconUrls ||= new Map());
const src = ref(known.get(props.id) || '');
watch(() => props.id, (id) => {
  if (!id) return;
  if (known.has(id)) src.value = known.get(id);
  if (!cache.has(id)) cache.set(id, call('emu:icon', { id }).catch(() => ''));
  cache.get(id).then((u) => { if (u) known.set(id, u); if (props.id === id && (u || !known.has(id))) src.value = u || known.get(id) || ''; });
}, { immediate: true });
function failed() { if (known.get(props.id) && src.value !== known.get(props.id)) src.value = known.get(props.id); else src.value = ''; }
</script>
<style>
.emu-icon { object-fit: contain; flex: none; border-radius: 4px; }
</style>
