<template>
  <!-- Cartridge's mark (0.9): one flat colour, readable from 16px up. The brand colour stays the same
       whatever theme is picked. -->
  <svg :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true">
    <path fill-rule="evenodd" :fill="color" d="M10 3h21.6L41 12.4V41a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM13 10.5a2 2 0 0 0-2 2V26a2 2 0 0 0 2 2h19a2 2 0 0 0 2-2V12.5a2 2 0 0 0-2-2zM13.5 34a1.75 1.75 0 0 0 0 3.5h20a1.75 1.75 0 0 0 0-3.5z" />
  </svg>
</template>
<script setup>
defineProps({ size: { type: Number, default: 30 }, color: { type: String, default: '#EF4B23' } });
</script>
