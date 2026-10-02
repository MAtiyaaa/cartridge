<template>
  <img v-if="logo && !fail" class="plat-logo" :src="logo" :alt="name" @error="fail = true" /><span v-else>{{ name }}</span>
</template>
<script setup>
// A console's wordmark at the height of the text it replaces (0.9.16; the same white logos the
// Consoles page uses, cached by the main process). Falls back to the name.
import { ref, watch } from 'vue';
import { call } from '../store.js';
const props = defineProps({ slug: String, fsSlug: String, name: String });
const cache = (globalThis.__sysLogos ||= new Map()); // strings only: the console tiles read it too
const pending = (globalThis.__sysLogoWait ||= new Map());
const logo = ref(''), fail = ref(false);
watch(() => props.slug, () => {
  const k = props.slug;
  fail.value = false;
  if (!k) { logo.value = ''; return; }
  if (cache.has(k)) { logo.value = cache.get(k); return; }
  if (!pending.has(k)) pending.set(k, call('syslogo:get', { slug: k, fs_slug: props.fsSlug }).then((u) => u || '', () => '').then((u) => { cache.set(k, u); pending.delete(k); return u; }));
  pending.get(k).then((u) => { if (props.slug === k) logo.value = u; });
}, { immediate: true });
</script>
<style>
.plat-logo { height: 0.95em; width: auto; max-width: 100%; vertical-align: -0.1em; object-fit: contain; object-position: left; opacity: 0.85; }
</style>
