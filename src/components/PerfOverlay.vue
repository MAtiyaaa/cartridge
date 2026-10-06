<template>
  <!-- the performance overlay (0.9.48, Settings → About): a diagnostic, the same in Plain and Glass (solid, readable over
       anything); never takes focus or touches -->
  <div class="perf" aria-hidden="true">
    <span><b>{{ fps }}</b> fps</span>
    <span :class="{ warn: worst > 33 }"><b>{{ worst }}</b> ms worst</span>
    <span><b>{{ cpu == null ? '…' : cpu }}</b>% CPU</span>
    <span><b>{{ mem }}</b> MB</span>
    <span class="muted">{{ mode }}{{ lite ? ' · frost' : '' }}</span>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { call } from '../store.js';
import { frame, governor } from '../motion.js';

const fps = ref(0), worst = ref(0), cpu = ref(null), mem = ref(0), mode = ref('active'), lite = ref(false);
let n = 0, maxDt = 0, last = 0, stopF = null, t = null;
// frames are counted on CAE's own ticker, so the overlay adds one tiny job and no second frame loop; it stops with the overlay
function count(now, dt) { n++; maxDt = Math.max(maxDt, dt); return true; }
async function sample() {
  const now = performance.now(), secs = last ? (now - last) / 1000 : 1;
  fps.value = Math.round(n / secs); worst.value = Math.round(maxDt * 1000); n = 0; maxDt = 0; last = now;
  mode.value = governor.away ? 'away' : governor.mode; lite.value = document.body.classList.contains('lg-lite');
  try { const r = await call('perf:sample'); cpu.value = r.cpu == null ? null : Math.round(r.cpu); mem.value = r.memMB; } catch {}
}
onMounted(() => { stopF = frame(count); last = performance.now(); t = setInterval(sample, 1000); sample(); });
onBeforeUnmount(() => { stopF?.(); clearInterval(t); });
</script>

<style scoped>
.perf { position: fixed; top: 8px; right: 8px; z-index: 90; display: flex; gap: 10px; padding: 5px 10px; border-radius: 8px; background: rgba(10, 10, 12, 0.86); color: #f2f2f3; font: 500 12px/1.3 ui-monospace, 'DejaVu Sans Mono', monospace; pointer-events: none; font-variant-numeric: tabular-nums; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08); }
.perf b { font-weight: 700; }
.perf .warn b { color: #ffb347; }
.perf .muted { color: #a7a7ad; }
</style>
