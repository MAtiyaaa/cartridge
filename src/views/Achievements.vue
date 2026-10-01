<template>
  <div class="view ach" data-scroll ref="el">
    <div class="ach-switch">
      <Btn b="LB" />
      <button class="ach-tab" :class="{ on: store.achTab === 'ra' }" data-focus data-key="ach-ra" @click="set('ra')">
        <img class="ra-mark" :src="raLogo" alt="" />RetroAchievements
      </button>
      <button class="ach-tab" :class="{ on: store.achTab === 'others' }" data-focus data-key="ach-others" @click="set('others')">
        <span class="tg-mark"><Grade g="P" :size="20" /><span class="tg-g">G</span></span><span class="tg-word">Trophies &amp; Gamerscore</span>
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
.ach-tab { display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 18px; border-radius: 999px; background: var(--s2); color: var(--muted); font-family: var(--display); font-weight: 600; font-size: var(--t-md); }
.ach-tab.on { background: var(--sel); color: var(--text); }
/* both marks the same height (0.9.3 E3): the RetroAchievements logo and the trophy mark */
.ra-mark { height: 20px; width: auto; }
.tg-mark { position: relative; width: 26px; height: 20px; display: inline-block; }
.tg-mark .grade { position: absolute; left: 0; top: 0; }
.tg-g { position: absolute; right: -2px; bottom: -3px; width: 13px; height: 13px; border-radius: 50%; background: #3f9b37; font: 800 8px var(--display); color: #fff; display: grid; place-items: center; box-shadow: 0 0 0 2px var(--s2); }
.ach-tab.on .tg-g { box-shadow: 0 0 0 2px var(--sel); }
</style>
