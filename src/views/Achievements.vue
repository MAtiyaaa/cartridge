<template>
  <div class="view ach" data-scroll ref="el">
    <div class="ach-switch">
      <Btn b="LB" />
      <button class="ach-tab" :class="{ on: store.achTab === 'ra' }" data-focus data-key="ach-ra" @click="set('ra')">
        <img class="ra-mark" :src="raLogo" alt="" />RetroAchievements
      </button>
      <button class="ach-tab" :class="{ on: store.achTab === 'others' }" data-focus data-key="ach-others" @click="set('others')">
        <span class="tg-mark"><Grade g="P" :size="22" /><span class="tg-g">G</span></span><span class="tg-word"><span class="t1">Trophies</span> <span class="amp">&amp;</span> <span class="t2">Gamerscore</span></span>
      </button>
      <Btn b="RB" />
    </div>
    <RaPanel v-if="store.achTab === 'ra'" key="ra" />
    <TrophyPanel v-else key="others" />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { store } from '../store.js';
import Btn from '../components/Btn.vue';
import Grade from '../components/Grade.vue';
import RaPanel from './RaPanel.vue';
import TrophyPanel from './TrophyPanel.vue';
import raLogo from '../assets/ra-logo.png';
// Two kinds of achievements: RetroAchievements (online) and trophies kept by emulators (Others)
const el = ref(null);
function set(t) { store.achTab = t; }
</script>
<style scoped>
.ach { padding-top: 16px; }
.ach-switch { display: flex; align-items: center; gap: 10px; margin: 0 0 18px; }
.ach-tab { display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 18px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line); color: var(--muted); font-family: var(--display); font-weight: 600; font-size: 15px; }
.ach-tab.on { background: rgba(255, 255, 255, 0.14); color: var(--text); border-color: rgba(255, 255, 255, 0.28); }
.ra-mark { height: 20px; width: auto; }
.tg-mark { position: relative; width: 30px; height: 22px; display: inline-block; }
.tg-mark .grade { position: absolute; left: 0; top: 0; }
.tg-g { position: absolute; right: -2px; bottom: -3px; width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #9be38a, #2f8f2a); font: 800 9px var(--display); color: #0b2a08; display: grid; place-items: center; box-shadow: 0 0 0 2px rgba(20, 22, 40, 0.9); }
.tg-word { font-weight: 700; }
.tg-word .t1 { background: linear-gradient(90deg, #7fa8ff, #cfe0ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tg-word .t2 { background: linear-gradient(90deg, #ffe28a, #e0a32a); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tg-word .amp { color: var(--muted); font-weight: 500; }
.ach-tab:not(.on) .tg-word { opacity: 0.75; }
.ach-sub { font-family: var(--body); font-weight: 400; font-size: 12px; color: var(--muted); }
@media (max-width: 1100px) { .tg-mark { position: relative; width: 30px; height: 22px; display: inline-block; }
.tg-mark .grade { position: absolute; left: 0; top: 0; }
.tg-g { position: absolute; right: -2px; bottom: -3px; width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #9be38a, #2f8f2a); font: 800 9px var(--display); color: #0b2a08; display: grid; place-items: center; box-shadow: 0 0 0 2px rgba(20, 22, 40, 0.9); }
.tg-word { font-weight: 700; }
.tg-word .t1 { background: linear-gradient(90deg, #7fa8ff, #cfe0ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tg-word .t2 { background: linear-gradient(90deg, #ffe28a, #e0a32a); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tg-word .amp { color: var(--muted); font-weight: 500; }
.ach-tab:not(.on) .tg-word { opacity: 0.75; }
.ach-sub { display: none; } }
</style>
