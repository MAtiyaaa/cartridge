<template>
  <div class="bg-stage" :class="{ xmb: mode === 'waves' }">
    <template v-if="mode === 'waves'">
      <div class="xmb-grad" />
      <canvas ref="cv" class="xmb-waves" />
      <div class="xmb-vignette" />
    </template>
    <template v-else>
      <div v-for="(l, i) in layers" :key="i" class="layer" :class="{ on: l.on, blur: l.blur }" :style="l.src ? { backgroundImage: `url('${l.src}')` } : {}" />
      <div class="shade" />
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount, nextTick } from 'vue';
import { store } from '../store.js';

const mode = computed(() => store.config?.ui?.bgStyle || 'waves');

// ---------- PSP XMB style ribbons.
// Drawn on a small canvas (scaled up by the compositor) with additive blending inside the
// canvas itself, so there are no CSS filters or blend modes to recompute every frame.
const cv = ref(null);
let raf = 0, last = 0, ctx = null;
const WAVES = [
  { a: 0.09, k: 1.6, s: 0.10, y: 0.58, h: 0.16, al: 0.10 },
  { a: 0.07, k: 2.3, s: -0.07, y: 0.62, h: 0.10, al: 0.08 },
  { a: 0.11, k: 1.1, s: 0.05, y: 0.55, h: 0.22, al: 0.06 },
  { a: 0.05, k: 3.1, s: 0.13, y: 0.64, h: 0.05, al: 0.12 },
];
const SCALE = 0.4;
const STEP = 12;
let grads = [];
function draw(t) {
  raf = requestAnimationFrame(draw);
  if (t - last < 40) return; // ~25fps is plenty for a slow ambient drift
  last = t;
  const c = cv.value;
  if (!c) return;
  const w = Math.floor(innerWidth * SCALE), h = Math.floor(innerHeight * SCALE);
  if (c.width !== w || c.height !== h || !ctx) {
    c.width = w; c.height = h;
    ctx = c.getContext('2d', { alpha: true, desynchronized: true });
    grads = WAVES.map((wv) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.3, `rgba(255,255,255,${wv.al})`);
      g.addColorStop(0.7, `rgba(255,255,255,${wv.al * 1.3})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      return g;
    });
  }
  const g = ctx;
  g.clearRect(0, 0, w, h);
  g.globalCompositeOperation = 'lighter';
  const time = t / 1000;
  WAVES.forEach((wv, wi) => {
    const top = [], bot = [];
    for (let x = 0; x <= w + STEP; x += STEP) {
      const u = x / w;
      const base = wv.y * h + Math.sin(u * Math.PI * wv.k + time * wv.s * 6) * wv.a * h + Math.sin(u * Math.PI * wv.k * 0.5 - time * wv.s * 3) * wv.a * 0.5 * h;
      const thick = wv.h * h * (0.55 + 0.45 * Math.sin(u * Math.PI * 1.3 + time * wv.s * 4));
      top.push(x, base - thick / 2);
      bot.push(x, base + thick / 2);
    }
    g.beginPath();
    for (let i = 0; i < top.length; i += 2) (i ? g.lineTo(top[i], top[i + 1]) : g.moveTo(top[i], top[i + 1]));
    for (let i = bot.length - 2; i >= 0; i -= 2) g.lineTo(bot[i], bot[i + 1]);
    g.closePath();
    g.fillStyle = grads[wi];
    g.fill();
    g.beginPath();
    for (let i = 0; i < top.length; i += 2) (i ? g.lineTo(top[i], top[i + 1]) : g.moveTo(top[i], top[i + 1]));
    g.strokeStyle = `rgba(255,255,255,${wv.al * 1.6})`;
    g.lineWidth = 0.8;
    g.stroke();
  });
}
function start() { cancelAnimationFrame(raf); last = 0; ctx = null; raf = requestAnimationFrame(draw); }
watch(mode, async (m) => { cancelAnimationFrame(raf); if (m === 'waves') { await nextTick(); start(); } }, { immediate: true });
const vis = () => (document.hidden ? cancelAnimationFrame(raf) : mode.value === 'waves' && start());
document.addEventListener('visibilitychange', vis);
onBeforeUnmount(() => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); });

// ---------- Game art mode: two layers crossfade on focus
const layers = reactive([{ src: '', on: false, blur: false }, { src: '', on: false, blur: false }]);
let cur = 0;
watch(() => [store.bg?.src, mode.value], () => {
  if (mode.value !== 'art') return;
  const b = store.bg;
  const src = b?.src || '';
  if (src === layers[cur].src && layers[cur].on) return;
  const next = 1 - cur;
  if (!src) { layers[cur].on = false; return; }
  const im = new Image();
  im.onload = () => { layers[next].src = src; layers[next].blur = !!b.blur; layers[next].on = true; layers[cur].on = false; cur = next; };
  im.src = src;
});
</script>

<style>
.bg-stage.xmb { background: var(--xmb-base, #170838); }
.xmb-grad { position: absolute; inset: 0; background: var(--xmb); }
.xmb-waves { position: absolute; inset: 0; width: 100%; height: 100%; }
.xmb-vignette { position: absolute; inset: 0; background: radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(8, 3, 20, 0.5) 100%), linear-gradient(0deg, rgba(10, 4, 24, 0.5), transparent 35%); }
</style>
