<template>
  <div class="view ach" data-scroll ref="el">
    <AchAll />
  </div>
</template>
<script setup>
import { ref } from 'vue';
import AchAll from './AchAll.vue';
// One page (0.9.49, owner: "keep them all in All"): RetroAchievements and emulator trophies together. Sign-in, hidden
// games and trophy folders are in Settings → Achievements.
const el = ref(null);
</script>
<style scoped>
.ach { padding-top: 16px; }
</style>
