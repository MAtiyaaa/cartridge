<template>
  <img v-if="src" class="emu-icon" :src="src" :style="{ width: size + 'px', height: size + 'px' }" alt="" @error="src = ''" />
  <Icon v-else :name="fallback" :size="size" />
</template>
<script setup>
// The emulator's own icon, read from where it's installed (0.9.16); the symbol until it's found.
import { ref, watch } from 'vue';
import { call } from '../store.js';
import Icon from './Icon.vue';
const props = defineProps({ id: String, size: { type: Number, default: 24 }, fallback: { type: String, default: 'mdiGamepadVariantOutline' } });
const cache = (globalThis.__emuIcons ||= new Map());
const src = ref('');
watch(() => props.id, (id) => {
  if (!id) return;
  if (!cache.has(id)) cache.set(id, call('emu:icon', { id }).catch(() => ''));
  cache.get(id).then((u) => { if (props.id === id) src.value = u || ''; });
}, { immediate: true });
</script>
<style>
.emu-icon { object-fit: contain; flex: none; border-radius: 4px; }
</style>
