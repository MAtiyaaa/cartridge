<template>
  <!-- Syncthing's mark, drawn simply: a ring with three devices joined in the middle (0.9.23) -->
  <svg class="st-logo" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="#0891d1" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="80 40" stroke-linecap="round" transform="rotate(-20 32 32)" />
    <g stroke="#fff" stroke-width="3.5" stroke-linecap="round"><line x1="35" y1="34" x2="49" y2="23" /><line x1="35" y1="34" x2="40" y2="50" /><line x1="35" y1="34" x2="15" y2="30" /></g>
    <g fill="#fff"><circle cx="49" cy="23" r="5" /><circle cx="40" cy="50" r="5" /><circle cx="15" cy="30" r="5" /><circle cx="35" cy="34" r="3.5" /></g>
  </svg>
</template>
<script setup>
defineProps({ size: { type: [Number, String], default: 24 } });
</script>
<style scoped>
.st-logo { flex: none; display: block; }
</style>
