<template>
  <img v-if="url && !bad" class="cmark" :src="url" :alt="label" :title="label" :style="optical" @error="bad = true" />
  <span v-else class="cmark-t">{{ label }}</span>
</template>
<script setup>
import { ref, watch, computed } from 'vue';
import { call } from '../store.js';
import { opticalOf } from '../consoleOptical.js';
// A console's white wordmark, sized to the text around it (cap height), or its short name
const props = defineProps({ slug: String, label: String });
const cache = (globalThis.__sysLogos ||= new Map());
const url = ref('');
const optical = computed(() => {
  const f = opticalOf(url.value, props.slug);
  return f === 1 ? null : { height: `${(0.8 * f).toFixed(2)}em`, marginBlock: `${(-0.4 * (f - 1)).toFixed(2)}em` };
});
const bad = ref(false);
watch(() => props.slug, (k) => {
  bad.value = false;
  if (!k) { url.value = ''; return; }
  if (cache.has(k)) { url.value = cache.get(k); return; }
  call('syslogo:get', { slug: k, fs_slug: k }).then((u) => { cache.set(k, u || ''); url.value = u || ''; }).catch(() => cache.set(k, ''));
}, { immediate: true });
</script>
<style>
.cmark { display: inline-block; height: 0.8em; width: auto; vertical-align: middle; filter: brightness(0) invert(1); opacity: 0.92; }
.cmark-t { font-weight: 700; }
</style>
