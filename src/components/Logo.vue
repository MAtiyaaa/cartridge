<template>
  <!-- Cartridge's mark (0.9): one flat colour, readable from 16px up. The brand colour stays the same
       whatever theme is picked. The drawing lives in brand.js (0.9.52). -->
  <svg :width="size" :height="size" :viewBox="MARK.viewBox" aria-hidden="true">
    <path fill-rule="evenodd" :fill="color" :d="MARK.d" />
  </svg>
</template>
<script setup>
import { MARK, BRAND } from '../brand.js';
defineProps({ size: { type: Number, default: 30 }, color: { type: String, default: BRAND } });
</script>
