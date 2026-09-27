<template>
  <span class="grade" :class="'g-' + (g || 'X')" :style="{ width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.6) + 'px' }" :title="label">
    <svg v-if="g" viewBox="0 0 24 24" :width="size" :height="size" aria-hidden="true">
      <defs><linearGradient :id="gid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" :stop-color="c[0]" /><stop offset="1" :stop-color="c[1]" /></linearGradient></defs>
      <path :d="cup" :fill="`url(#${gid})`" stroke="rgba(0,0,0,.35)" stroke-width=".6" />
    </svg>
    <b v-else>G</b>
  </span>
</template>
<script setup>
import { computed } from 'vue';
// A trophy cup coloured by grade (P/G/S/B). No grade = Xbox-style gamerscore badge.
const props = defineProps({ g: String, size: { type: Number, default: 18 } });
const COLORS = { P: ['#eef4ff', '#8fb4e8'], G: ['#ffe28a', '#c98b12'], S: ['#f4f6fa', '#9aa4b2'], B: ['#f0b27a', '#9a5a2a'] };
const c = computed(() => COLORS[props.g] || COLORS.B);
const gid = 'gr' + Math.random().toString(36).slice(2, 8);
const label = computed(() => ({ P: 'Platinum', G: 'Gold', S: 'Silver', B: 'Bronze' }[props.g] || 'Gamerscore'));
const cup = 'M18 2c-.9 0-2 1-2 2H8c0-1-1.1-2-2-2H2v9c0 1 1 2 2 2h2.2c.4 2 1.7 3.7 4.8 4v2.08C8 19.54 8 22 8 22h8s0-2.46-3-2.92V17c3.1-.3 4.4-2 4.8-4H20c1 0 2-1 2-2V2h-4M6 11H4V4h2v7m14 0h-2V4h2v7Z';
</script>
<style>
.grade { display: inline-grid; place-items: center; flex: none; vertical-align: middle; }
.grade.g-X { border-radius: 50%; background: radial-gradient(circle at 35% 30%, #9be38a, #2f8f2a); color: #0b2a08; font-size: 0.62em; }
.grade.g-X b { font-weight: 800; line-height: 1; }
</style>
