<template>
  <svg class="qr" :viewBox="`0 0 ${size} ${size}`" shape-rendering="crispEdges" role="img" aria-label="QR code">
    <rect :width="size" :height="size" rx="3" fill="#fff" />
    <path :d="d" fill="#0b0d12" />
  </svg>
</template>
<script setup>
import { computed } from 'vue';
import qrcode from 'qrcode-generator';
const props = defineProps({ text: { type: String, default: '' } });
const QUIET = 2;
const qr = computed(() => { const q = qrcode(0, 'M'); q.addData(props.text || ' '); q.make(); return q; });
const size = computed(() => qr.value.getModuleCount() + QUIET * 2);
const d = computed(() => {
  const q = qr.value, n = q.getModuleCount();
  let s = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) s += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
  return s;
});
</script>
<style scoped>
.qr { display: block; width: 100%; height: auto; border-radius: 12px; }
</style>
