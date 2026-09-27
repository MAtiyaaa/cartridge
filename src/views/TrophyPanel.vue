<template>
  <div class="tp" ref="el">
    <div v-if="!data" class="center" style="height: 300px"><div class="spinner" /></div>

    <!-- nothing found yet -->
    <section v-else-if="!data.anySource" class="tp-empty glass">
      <div class="tp-empty-head">
        <div class="tp-cup"><Grade g="P" :size="44" /></div>
        <div>
          <div class="eyebrow">Emulator trophies</div>
          <h1 class="big">No trophies found yet</h1>
          <p class="muted">Cartridge reads trophies from RPCS3 (PS3), shadPS4 (PS4), Xenia (Xbox 360) and Vita3K (PS Vita), wherever they are installed. Play a game with trophies, or point Cartridge at the emulator's folder.</p>
        </div>
      </div>
      <div class="tp-srcs">
        <div v-for="s in data.sources" :key="s.id" class="tp-src"><b>{{ s.name }}</b><span class="muted">{{ s.platform }}</span><span class="chip" :class="s.state">{{ stateLabel(s) }}</span></div>
      </div>
      <div class="row" style="gap: 12px">
        <button class="btn primary" data-focus :disabled="!!store.trophyScan" @click="scan"><Icon name="mdiRadar" />{{ store.trophyScan ? 'Scanning…' : 'Scan again' }}</button>
        <button class="btn" data-focus @click="openSettings"><Icon name="mdiFolderSearchOutline" />Choose folders</button>
      </div>
    </section>

    <template v-else>
      <header class="tp-head">
        <div class="tp-grades">
          <div v-for="g in ['P', 'G', 'S', 'B']" :key="g" class="tp-grade"><Grade :g="g" :size="30" /><b>{{ data.summary[g] }}</b><span>{{ GRADE[g] }}</span></div>
          <div v-if="data.summary.gamerscoreMax" class="tp-grade"><Grade :size="30" /><b>{{ fmt(data.summary.gamerscore) }}</b><span>Gamerscore</span></div>
        </div>
        <div class="spacer" />
        <div class="tp-meta">
          <span>{{ data.summary.trophies }} trophies · {{ data.summary.games }} games</span>
          <span class="muted small"><Icon :name="syncIcon" :size="14" :class="{ spin: store.trophySync.state === 'running' }" />{{ syncText }}</span>
        </div>
        <button class="btn small" data-focus @click="refresh"><Icon name="mdiRefresh" :size="18" />Refresh</button>
      </header>

      <div class="shelf-title"><Icon name="mdiStarShootingOutline" :size="20" />Latest unlocks</div>
      <div v-if="!data.recent.length" class="muted" style="margin: 0 0 24px">Nothing unlocked yet.</div>
      <div v-else class="shelf" data-hscroll>
        <button v-for="t in data.recent" :key="t.key + t.id" class="tp-unlock glass" data-focus @click="open(t.key)">
          <div class="tp-ticon"><img v-if="t.icon" :src="t.icon" loading="lazy" /><Grade v-else :g="t.grade" :size="36" /></div>
          <div class="tp-u-body">
            <div class="tp-u-title"><Grade :g="t.grade" :size="16" />{{ t.name }}</div>
            <div class="tp-u-desc">{{ t.desc }}</div>
            <div class="tp-u-meta"><span v-if="t.points" class="pts">{{ t.points }} G</span><span>{{ when(t.time) }}</span><span v-if="t.device && t.device !== data.device" class="dev"><Icon name="mdiDevices" :size="13" />{{ t.device }}</span></div>
            <div class="tp-u-game">{{ t.game }} · {{ t.short }}</div>
          </div>
        </button>
      </div>

      <div class="shelf-title" style="margin-top: 18px"><Icon name="mdiGamepadVariantOutline" :size="20" />Games<span class="count">{{ data.games.length }}</span></div>
      <div class="tp-games">
        <button v-for="g in data.games" :key="g.key" class="tp-game glass" data-focus :data-key="'tg-' + g.key" @click="open(g.key)" @focus="focusGame(g)">
          <div class="tp-gicon"><img v-if="g.icon" :src="g.icon" loading="lazy" /><img v-else-if="g.cover" :src="img(g.cover)" loading="lazy" class="cov" /><Grade v-else :g="g.kind === 'trophy' ? 'G' : null" :size="40" /></div>
          <div class="tp-g-body">
            <div class="tp-g-title">{{ g.title }}</div>
            <div class="tp-g-sub"><span class="plat">{{ g.short }}</span><template v-if="g.last">{{ when(g.last) }}</template><template v-if="g.romId"> · <span class="inlib">In your library</span></template><template v-if="g.remoteOnly"> · <span class="dev">from {{ g.devices[0] || 'another device' }}</span></template></div>
            <div class="bar tp-bar"><i :style="{ width: pct(g) + '%' }" /></div>
            <div class="tp-g-prog">
              <template v-if="g.kind === 'gamerscore'"><b>{{ g.score }}</b> / {{ g.possible }} G · {{ g.earned }} of {{ g.total }}</template>
              <template v-else><b>{{ g.earned }}</b> / {{ g.total }} · {{ pct(g) }}%<span class="tp-mini"><template v-for="k in ['P', 'G', 'S', 'B']" :key="k"><span v-if="g.grades[k]"><Grade :g="k" :size="13" />{{ g.grades[k] }}</span></template></span></template>
            </div>
          </div>
          <Grade v-if="g.grades.P" g="P" :size="26" class="tp-plat" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { store, call, img, go, toast, setBg, when, GRADE } from '../store.js';
import { useView } from '../useView.js';
import { focusFirst } from '../nav.js';
import Icon from '../components/Icon.vue';
import Grade from '../components/Grade.vue';

// Trophies and achievements that emulators keep on this device (plus other devices, via RomM)
const el = ref(null);
const data = ref(null);
const fmt = (n) => (n || 0).toLocaleString();
const pct = (g) => (g.total ? Math.round((g.earned / g.total) * 100) : 0);
const stateLabel = (s) => ({ found: 'Found', missing: 'Not found', off: 'Off' }[s.state]);
const syncIcon = computed(() => ({ running: 'mdiSync', ok: 'mdiCloudCheckOutline', error: 'mdiCloudAlertOutline', off: 'mdiCloudOffOutline' }[store.trophySync.state] || 'mdiCloudOutline'));
const syncText = computed(() => {
  const s = store.trophySync;
  if (s.state === 'running') return 'Syncing with RomM…';
  if (s.state === 'ok') return 'Synced with RomM ' + when(s.at);
  if (s.state === 'error') return s.error;
  if (s.state === 'off') return 'Sync is off';
  return 'On this device';
});

async function load() {
  try { data.value = await call('trophies:overview'); if (data.value.sync) store.trophySync = data.value.sync; } catch (e) { toast(e.message, 'error'); }
}
async function refresh() { await call('trophies:sync').catch(() => {}); await load(); }
async function scan() {
  const r = await call('trophies:scan').catch((e) => (toast(e.message, 'error'), null));
  if (r) toast(r.some((s) => s.state === 'found') ? 'Found trophy data' : 'Still nothing found. Try Choose folders.', r.some((s) => s.state === 'found') ? 'ok' : 'info', 3500, 'mdiRadar');
  await load();
}
function openSettings() { store.settingsSection = 'ra'; go('settings'); }
function open(key) { go('trophy-game', { tkey: key }); }
function focusGame(g) { if (g.cover) setBg({ src: img(g.cover), blur: true }); }

watch(() => store.trophyVer, load);
useView({ x: refresh, lb: () => (store.achTab = 'ra'), rb: () => (store.achTab = 'others') }, [{ b: 'A', label: 'Open' }, { b: 'X', label: 'Refresh' }, { b: 'LB', label: 'RetroAchievements' }]);
onMounted(async () => { await load(); focusFirst(el.value); });
</script>

<style scoped>
.big { font-size: 30px; }
.small { font-size: 12.5px; display: inline-flex; gap: 5px; align-items: center; }
.tp-empty { max-width: 820px; margin: 20px auto; padding: 28px 30px; display: flex; flex-direction: column; gap: 18px; border-radius: 14px; }
.tp-empty-head { display: flex; gap: 20px; align-items: center; }
.tp-cup { width: 76px; height: 76px; border-radius: 16px; display: grid; place-items: center; flex: none; background: linear-gradient(145deg, #3a4a7a, #1b2340); }
.tp-srcs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tp-src { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; background: rgba(255, 255, 255, 0.05); font-size: 14px; }
.tp-src .chip { margin-left: auto; }
.chip.found { background: rgba(80, 200, 120, 0.18); color: #9be8b4; }
.chip.missing { background: rgba(255, 255, 255, 0.08); color: var(--muted); }
.chip.off { background: rgba(255, 90, 90, 0.14); color: #ffaaaa; }
.tp-head { display: flex; align-items: center; gap: 20px; margin: 4px 0 24px; flex-wrap: wrap; }
.tp-grades { display: flex; gap: 12px; flex-wrap: wrap; }
.tp-grade { display: flex; align-items: center; gap: 10px; padding: 10px 16px 10px 12px; border-radius: 12px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line); }
.tp-grade b { font-family: var(--display); font-size: 24px; }
.tp-grade span { font-size: 12px; color: var(--muted); }
.tp-meta { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; font-size: 14px; }
.tp-unlock { flex: none; width: 360px; display: flex; gap: 14px; padding: 14px; border-radius: 12px; text-align: left; transition: transform 0.14s ease-out; }
.tp-unlock:focus { transform: scale(1.03); }
.tp-ticon { width: 64px; height: 64px; border-radius: 8px; flex: none; display: grid; place-items: center; overflow: hidden; background: rgba(0, 0, 0, 0.25); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4); }
.tp-ticon img { width: 100%; height: 100%; object-fit: cover; }
.tp-u-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.tp-u-title { font-family: var(--display); font-weight: 600; font-size: 15.5px; display: flex; gap: 6px; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-u-desc { font-size: 12.5px; color: #c3c9d4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tp-u-meta { display: flex; gap: 10px; align-items: center; font-size: 11.5px; color: var(--muted); }
.tp-u-meta .pts { color: #9be38a; font-weight: 600; }
.dev { display: inline-flex; gap: 4px; align-items: center; color: #9cc3ff; }
.tp-u-game { font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-games { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 14px; padding-bottom: 30px; }
.tp-game { display: flex; gap: 14px; align-items: center; padding: 12px 14px; border-radius: 12px; text-align: left; transition: transform 0.14s ease-out; position: relative; }
.tp-game:focus { transform: scale(1.02); }
.tp-gicon { width: 128px; aspect-ratio: 16 / 9; border-radius: 8px; flex: none; overflow: hidden; display: grid; place-items: center; background: rgba(0, 0, 0, 0.3); }
.tp-gicon img { width: 100%; height: 100%; object-fit: contain; }
.tp-gicon img.cov { object-fit: cover; }
.tp-g-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.tp-g-title { font-family: var(--display); font-weight: 600; font-size: 15.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-g-sub { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.plat { font-weight: 700; color: #cfd6e4; margin-right: 8px; }
.inlib { color: var(--green-l); }
.tp-bar { height: 6px; }
.tp-bar i { background: linear-gradient(90deg, #7fa8ff, #cfe0ff); }
.tp-g-prog { font-size: 12px; color: #c3c9d4; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tp-mini { display: inline-flex; gap: 8px; margin-left: 6px; }
.tp-mini span { display: inline-flex; gap: 3px; align-items: center; }
.tp-plat { flex: none; }
@media (max-width: 1100px) { .tp-srcs { grid-template-columns: 1fr; } .tp-meta { align-items: flex-start; } }
</style>
