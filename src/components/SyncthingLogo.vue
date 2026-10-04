<template>
  <!-- Syncthing's mark, drawn simply: a ring with three devices on it, joined in the middle (0.9.23) -->
  <svg class="st-logo" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="#0891d1" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#fff" stroke-width="3.5" />
    <g stroke="#fff" stroke-width="3.5" stroke-linecap="round"><line x1="34" y1="33" x2="46.6" y2="19.8" /><line x1="34" y1="33" x2="14.1" y2="38.5" /><line x1="34" y1="33" x2="28.7" y2="50.7" /></g>
    <g fill="#fff"><circle cx="46.6" cy="19.8" r="5.5" /><circle cx="14.1" cy="38.5" r="5.5" /><circle cx="28.7" cy="50.7" r="5.5" /></g>
  </svg>
</template>
<script setup>
defineProps({ size: { type: [Number, String], default: 24 } });
</script>
<style scoped>
.st-logo { flex: none; display: block; }
</style>
