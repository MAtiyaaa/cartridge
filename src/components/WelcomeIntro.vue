<template>
  <!-- The opening (0.9.52, owner: "a really nice animation of welcome to Cartridge", on CAE, not jarring). Once, on a new
       install and when the welcome starts over. The mark draws itself, fills, the light behind it blooms, "Welcome to"
       and the name rise letter by letter, then everything lifts away to the first card. Any press skips it. -->
  <div class="wi" :class="{ out }" @pointerdown="$emit('done')">
    <div class="wi-bloom" />
    <div class="wi-lock">
      <svg class="wi-mark" :viewBox="MARK.viewBox" aria-hidden="true">
        <path class="wi-draw" pathLength="1" :d="MARK.d" />
        <path class="wi-fill" fill-rule="evenodd" :d="MARK.d" />
      </svg>
      <div class="wi-eyebrow">Welcome to</div>
      <div class="wi-name" aria-label="Cartridge"><span v-for="(c, i) in 'Cartridge'" :key="i" :style="{ '--i': i }">{{ c }}</span></div>
    </div>
  </div>
</template>
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { MARK } from '../brand.js';
const emit = defineEmits(['done']);
const out = ref(false);
let t1, t2;
onMounted(() => { t1 = setTimeout(() => { out.value = true; }, 2350); t2 = setTimeout(() => emit('done'), 2850); });
onBeforeUnmount(() => { clearTimeout(t1); clearTimeout(t2); });
</script>
<style scoped>
/* every timing is CAE's (docs/cae.md): the draw and the bloom on --move-slow, arrivals on the heavy spring, letters a
   stagger apart; only transform and opacity move (the outline's dash is the one drawn line) */
.wi { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; overflow: hidden; background: radial-gradient(70% 60% at 50% 46%, #15171c 0%, #08090c 70%); }
.wi-bloom { position: absolute; left: 50%; top: 44%; width: 720px; height: 720px; margin: -360px 0 0 -360px; border-radius: 50%; background: radial-gradient(closest-side, rgba(239, 75, 35, 0.42), rgba(239, 75, 35, 0.12) 45%, transparent 72%); opacity: 0; transform: scale(0.55); animation: wi-bloom var(--move-ambient) 0.35s forwards; }
.wi-lock { position: relative; display: flex; flex-direction: column; align-items: center; transition: transform var(--spring-soft-d) var(--spring-soft), opacity var(--fade-slow); }
.wi.out .wi-lock { transform: translateY(-24px) scale(0.97); opacity: 0; }
.wi.out .wi-bloom { opacity: 0; transition: opacity var(--fade-slow); }
.wi-mark { width: 128px; height: 128px; overflow: visible; transform: scale(0.92); animation: wi-settle var(--spring-soft-d) var(--spring-soft) 0.5s forwards; }
.wi-draw { fill: none; stroke: var(--brand, #EF4B23); stroke-width: 1.2; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: wi-draw var(--move-slow) forwards; }
.wi-fill { fill: var(--brand, #EF4B23); opacity: 0; animation: wi-fade var(--fade-slow) 0.62s forwards; }
.wi-eyebrow { margin-top: 30px; font: 600 var(--t-md, 18px) / 1 var(--body, Inter, sans-serif); letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); opacity: 0; transform: translateY(10px); animation: wi-rise var(--spring-soft-d) var(--spring-soft) 0.95s forwards; }
.wi-name { display: flex; margin-top: 10px; font: 800 clamp(48px, 8vw, 96px) / 1 var(--display, Archivo, sans-serif); font-stretch: 100%; letter-spacing: -0.03em; color: #f4f3ef; }
.wi-name span { display: inline-block; opacity: 0; transform: translateY(18px); animation: wi-rise var(--spring-soft-d) var(--spring-soft) forwards; animation-delay: calc(1.1s + var(--i) * var(--stagger)); }
@keyframes wi-draw { to { stroke-dashoffset: 0; } }
@keyframes wi-fade { to { opacity: 1; } }
@keyframes wi-settle { to { transform: scale(1); } }
@keyframes wi-rise { to { opacity: 1; transform: none; } }
@keyframes wi-bloom { 0% { opacity: 0; transform: scale(0.55); } 45% { opacity: 1; } 100% { opacity: 0.55; transform: scale(1); } }
</style>
