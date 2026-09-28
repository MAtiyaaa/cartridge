<template>
  <svg class="qr" :viewBox="`0 0 ${size} ${size}`" shape-rendering="crispEdges" role="img" aria-label="QR code">
    <rect :width="size" :height="size" rx="3" fill="#fff" />
    <path :d="d" fill="#0b0d12" />
  </svg>
</template>
<script setup>
import { computed } from 'vue';
import QRCode from 'qrcode'; // the same library Setup uses for RomM's QR sign-in
const props = defineProps({ text: { type: String, default: '' } });
const QUIET = 2;
const qr = computed(() => QRCode.create(props.text || ' ', { errorCorrectionLevel: 'M' }).modules);
const size = computed(() => qr.value.size + QUIET * 2);
const d = computed(() => {
  const q = qr.value, n = q.size;
  let s = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.get(y, x)) s += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
  return s;
});
</script>
<style scoped>
.qr { display: block; width: 100%; height: auto; border-radius: 12px; }
</style>
