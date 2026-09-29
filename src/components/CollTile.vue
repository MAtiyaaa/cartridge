<template>
  <button class="coll" :class="{ wide }" data-focus :data-key="'col-' + c.id" @click="$emit('open', c)" @focus="$emit('focused', c)">
    <!-- wide: a game's artwork behind, covers fanned on the right, the icon or series logo on the left -->
    <div v-if="wide" class="art">
      <CoverImg v-if="bg" class="bg" :class="{ blur: bg.blur }" :src="bg.src" />
      <div class="shade" />
      <div class="lead">
        <GameLogo v-if="c.series && logo" :logo="logo" :name="c.name" cls="lead-t" :area="8000" :max-w="140" :max-h="64" />
        <div v-else class="badge"><Icon :name="c.favorite ? 'mdiStar' : c.smart ? 'mdiAutoFix' : c.icon || 'mdiBookmarkMultipleOutline'" :size="30" /></div>
      </div>
      <div class="fan"><CoverImg v-for="(a, i) in fan" :key="a + i" :src="a" :style="{ '--i': i, '--n': fan.length }" /></div>
    </div>
    <div v-else class="mosaic" :class="'n' + arts.length">
      <CoverImg v-for="(a, i) in arts" :key="a + i" :src="a" />
      <div v-if="!arts.length" class="ph"><Icon :name="c.favorite ? 'mdiStar' : c.icon || 'mdiBookmarkMultipleOutline'" :size="40" /></div>
    </div>
    <div class="cap">
      <Icon v-if="c.favorite" name="mdiStar" :size="15" style="color: var(--gold)" />
      <Icon v-else-if="c.smart" name="mdiAutoFix" :size="15" style="color: var(--primary-t)" />
      <Icon v-else-if="c.icon" :name="c.icon" :size="15" style="color: var(--primary-t)" />
      <span class="nm">{{ c.name }}</span><span class="muted">{{ new Set(c.rom_ids).size }}</span>
    </div>
  </button>
</template>
<script setup>
import { computed } from 'vue';
import { img, cover, romById, store, logoOf } from '../store.js';
import Icon from './Icon.vue';
import GameLogo from './GameLogo.vue';
import CoverImg from './CoverImg.vue';
const props = defineProps({ c: Object, wide: Boolean });
defineEmits(['open', 'focused']);
const roms = computed(() => props.c.rom_ids.slice(0, 24).map((id) => romById(id)).filter(Boolean));
const arts = computed(() => {
  if (props.c.covers?.length) return props.c.covers.slice(0, 4).map(img);
  const fromRoms = roms.value.filter((r) => r.path_cover_small || r.url_cover).slice(0, 4).map((r) => cover(r));
  if (fromRoms.length) return fromRoms;
  return props.c.cover ? [img(props.c.cover)] : [];
});
const fan = computed(() => arts.value.slice(0, 3));
// background: your chosen background for a game, else a screenshot, else a blurred cover
const bg = computed(() => {
  const list = props.c.series ? [...roms.value].reverse() : roms.value; // series: the newest game
  const withHero = list.find((r) => store.art?.[r.id]?.hero);
  if (withHero) return { src: img(store.art[withHero.id].hero) };
  const withShot = list.find((r) => r.shot);
  if (withShot) return { src: img(withShot.shot) };
  return arts.value[0] ? { src: arts.value[0], blur: true } : null;
});
// series: the first game's logo usually carries the series name
const logo = computed(() => (props.c.series && store.config.ui.logos !== false && roms.value[0] ? logoOf(roms.value[0]) : null));
</script>
<style scoped>
.coll { flex: none; width: 250px; display: flex; flex-direction: column; gap: 10px; border-radius: var(--r-md); }
.coll.wide { width: 330px; }
.coll:focus { box-shadow: none !important; }
.mosaic, .art { height: 150px; border-radius: var(--r-md); overflow: hidden; background: #151924; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45); transition: transform 0.22s var(--ease), box-shadow 0.22s; }
.art { position: relative; height: 180px; }
.mosaic { display: grid; gap: 2px; }
.mosaic.n1 { grid-template-columns: 1fr; } .mosaic.n2 { grid-template-columns: 1fr 1fr; } .mosaic.n3 { grid-template-columns: 1fr 1fr 1fr; } .mosaic.n4 { grid-template-columns: repeat(4, 1fr); }
.mosaic img { width: 100%; height: 100%; object-fit: cover; }
.mosaic .ph { display: grid; place-items: center; color: var(--primary-t); background: linear-gradient(145deg, #2a2346, #12141d); }
.art .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.art .bg.blur { filter: blur(18px) saturate(1.3) brightness(0.8); transform: scale(1.2); }
.art .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8, 8, 16, 0.82) 0%, rgba(8, 8, 16, 0.35) 55%, rgba(8, 8, 16, 0.55) 100%); }
.lead { position: absolute; z-index: 2; left: 18px; top: 0; bottom: 0; display: flex; align-items: center; max-width: calc(100% - 190px); } /* stays clear of the fan (150px + inset), and above it */
.badge { width: 58px; height: 58px; border-radius: var(--r-lg); display: grid; place-items: center; color: #fff; background: rgba(255, 255, 255, 0.14); backdrop-filter: blur(6px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35); }
.lead :deep(.lead-t) { font-family: var(--display); font-weight: 700; font-size: var(--t-lg); line-height: 1.1; text-shadow: 0 3px 14px rgba(0, 0, 0, 0.6); }
.fan { position: absolute; z-index: 1; right: 16px; bottom: 16px; top: 16px; width: 150px; }
.fan img { position: absolute; right: calc(var(--i) * 34px); bottom: 0; height: 148px; width: 99px; object-fit: cover; border-radius: var(--r-sm); box-shadow: 0 8px 22px rgba(0, 0, 0, 0.6); transform: rotate(calc((var(--i) - (var(--n) - 1) / 2) * -5deg)); z-index: calc(10 - var(--i)); }
body.light-fx .badge { backdrop-filter: none; }
.coll:focus .mosaic, .coll:focus .art { transform: translateY(-5px) scale(1.04); box-shadow: var(--ring); }
.cap { display: flex; align-items: center; gap: 8px; font-size: var(--t-sm); padding: 0 4px; }
.cap .nm { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
