<template>
  <svg class="ring-p" :width="size" :height="size" viewBox="0 0 36 36" aria-hidden="true">
    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3.5" />
    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" :stroke-dasharray="`${Math.max(2, pct) * 0.943} 100`" transform="rotate(-90 18 18)" style="transition: stroke-dasharray 0.15s linear" />
  </svg>
</template>
<script setup>
// Circular progress, 0 to 100 (deleting a game: 0.9.3)
defineProps({ pct: { type: Number, default: 0 }, size: { type: Number, default: 44 } });
</script>
