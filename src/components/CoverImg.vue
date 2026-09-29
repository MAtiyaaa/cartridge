<template>
  <img :src="tries ? src + (src.includes('?') ? '&' : '?') + 'r=' + tries : src" :alt="alt" decoding="async" @error="fail" />
</template>
<script setup>
import { ref, watch } from 'vue';
// A picture that asks again when it fails (the image server may not be ready on a cold start), twice,
// and is never lazy: the tiles that use it show a handful of images each, and on some Android WebViews
// a lazy image inside a clipped, transformed tile never started loading.
const props = defineProps({ src: { type: String, default: '' }, alt: { type: String, default: '' } });
const emit = defineEmits(['failed']);
const tries = ref(0);
watch(() => props.src, () => (tries.value = 0));
function fail() { if (tries.value < 2) setTimeout(() => tries.value++, 1200 * (tries.value + 1)); else emit('failed'); }
</script>
