<template>
  <!-- A genre: its own colour, a big icon, the name on the tile and a tilted column of covers -->
  <button class="genre" data-focus :data-key="'col-' + g.id" :style="{ '--h': hue }" @click="$emit('open', g)" @focus="$emit('focused', g)">
    <Icon class="mark" :name="icon" :size="150" />
    <div class="strip"><img v-for="(a, i) in covers" :key="i" :src="a" loading="lazy" /></div>
    <div class="txt">
      <span class="ic"><Icon :name="icon" :size="22" /></span>
      <b>{{ g.name }}</b>
      <small>{{ g.rom_ids.length }} game{{ g.rom_ids.length === 1 ? '' : 's' }}</small>
    </div>
  </button>
</template>
<script setup>
import { computed } from 'vue';
import { cover, romById } from '../store.js';
import Icon from './Icon.vue';
const props = defineProps({ g: Object });
defineEmits(['open', 'focused']);
// IGDB genre names -> an icon that reads at a glance
const ICONS = [
  [/racing|driving/i, 'mdiCarSports'], [/shoot/i, 'mdiPistol'], [/platform/i, 'mdiStairsUp'], [/role|rpg/i, 'mdiSword'], [/hack|slash|beat/i, 'mdiSwordCross'],
  [/puzzle/i, 'mdiPuzzle'], [/fight/i, 'mdiBoxingGlove'], [/sport/i, 'mdiSoccer'], [/adventure/i, 'mdiCompassOutline'], [/real time|rts/i, 'mdiChessRook'],
  [/strategy|tactic|turn/i, 'mdiChessKnight'], [/simulat/i, 'mdiAirplane'], [/music|rhythm/i, 'mdiMusic'], [/arcade/i, 'mdiGamepadVariant'], [/point/i, 'mdiCursorDefaultClick'],
  [/visual novel/i, 'mdiBookOpenVariant'], [/card|board/i, 'mdiCardsPlaying'], [/quiz|trivia/i, 'mdiHelpCircleOutline'], [/indie/i, 'mdiLightbulbOnOutline'], [/moba/i, 'mdiAccountGroup'],
];
const icon = computed(() => ICONS.find(([re]) => re.test(props.g.name))?.[1] || 'mdiTagOutline');
// a steady colour per genre name
const hue = computed(() => { let h = 0; for (const ch of props.g.name) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; });
const covers = computed(() => props.g.rom_ids.slice(0, 16).map((id) => romById(id)).filter((r) => r && (r.path_cover_small || r.url_cover)).slice(0, 4).map((r) => cover(r)));
</script>
<style scoped>
.genre { position: relative; flex: none; width: 300px; height: 168px; border-radius: var(--r-lg); overflow: hidden; text-align: left; display: flex; align-items: flex-end; padding: 18px 20px;
  background: radial-gradient(120% 120% at 0% 0%, hsla(var(--h), 70%, 55%, 0.55), transparent 60%), linear-gradient(135deg, hsl(var(--h), 55%, 30%), hsl(calc(var(--h) + 40), 60%, 12%));
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.14); transition: transform 0.22s var(--ease), box-shadow 0.22s; }
.genre:focus { box-shadow: var(--ring) !important; transform: translateY(-5px) scale(1.04); }
.mark { position: absolute; left: -26px; bottom: -34px; opacity: 0.12; color: #fff; transform: rotate(-12deg); }
.strip { position: absolute; right: 18px; top: -30px; bottom: -30px; width: 92px; display: flex; flex-direction: column; gap: 8px; transform: rotate(12deg); }
.strip img { width: 92px; aspect-ratio: 2 / 3; object-fit: cover; border-radius: var(--r-sm); box-shadow: 0 8px 18px rgba(0, 0, 0, 0.55); }
.txt { position: relative; display: flex; flex-direction: column; gap: 4px; max-width: 58%; }
.ic { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.16); color: #fff; margin-bottom: 6px; }
.txt b { font-family: var(--display); font-size: var(--t-lg); font-weight: 700; line-height: 1.1; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5); overflow-wrap: anywhere; }
.txt small { color: rgba(255, 255, 255, 0.75); font-size: var(--t-xs); }
body.motion-reduce .genre:focus { transform: none; }
</style>
