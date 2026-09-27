<template>
  <div class="view ach" data-scroll ref="el">
    <div class="ach-switch">
      <Btn b="LB" />
      <button class="ach-tab" :class="{ on: store.achTab === 'ra' }" data-focus data-key="ach-ra" @click="set('ra')">
        <img class="ra-mark" :src="raLogo" alt="" />RetroAchievements
      </button>
      <button class="ach-tab" :class="{ on: store.achTab === 'others' }" data-focus data-key="ach-others" @click="set('others')">
        <Grade g="G" :size="20" />Others<span class="ach-sub">PS3 · PS4 · Xbox 360 · Vita</span>
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
.ach-sub { font-family: Roboto, sans-serif; font-weight: 400; font-size: 12px; color: var(--muted); }
@media (max-width: 1100px) { .ach-sub { display: none; } }
</style>
