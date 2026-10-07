<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog sv">
      <div class="sv-head">
        <EmuIcon id="shadps4" :size="44" fallback="mdiSonyPlaystation" />
        <div style="min-width: 0">
          <div class="eyebrow">shadPS4</div>
          <h2>Versions</h2>
          <p class="muted small">Some games run best on an older shadPS4. Add the versions you need here, then pick one per game from the game's More → Emulator.</p>
        </div>
      </div>
      <div class="sv-list" data-scroll>
        <div class="sec-title">On This Device</div>
        <div v-if="!data" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Reading shadPS4's versions…</div>
        <div v-else-if="!data.list.length" class="muted small">None yet. shadPS4's launcher keeps them in {{ short(data.folder) }}.</div>
        <button v-for="v in data?.list || []" :key="v.name" class="lrow sv-row" data-focus @click="pickInstalled(v)">
          <span class="sv-badge" :class="{ pre: v.type === 1 }">{{ v.type === 1 ? 'Nightly' : v.type === 2 ? 'Custom' : 'Release' }}</span>
          <span class="l-mid"><b>{{ v.name }}</b><span class="l-sub">{{ [v.codename, v.date].filter(Boolean).join(' · ') }}{{ v.here ? '' : ' · missing' }}</span></span>
          <span class="l-end">
            <span v-if="v.selected" class="status ok"><Icon name="mdiStar" :size="14" />Default · {{ data.defaultGames }} {{ data.defaultGames === 1 ? 'game' : 'games' }}</span>
            <span v-else-if="v.games.length" class="status">{{ v.games.length }} {{ v.games.length === 1 ? 'game' : 'games' }}</span>
          </span>
        </button>

        <div class="sec-title" style="margin-top: var(--s-5)">Add a Version</div>
        <div v-if="loadingOnline" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Asking shadPS4's GitHub…</div>
        <div v-else-if="data?.error" class="muted small">{{ data.error }}</div>
        <button v-for="r in addable" :key="r.tag" class="lrow sv-row" data-focus :disabled="!!busy" @click="add(r)">
          <span class="sv-badge" :class="{ pre: r.prerelease }">{{ r.prerelease ? 'Nightly' : 'Release' }}</span>
          <span class="l-mid"><b>{{ r.prerelease ? 'Pre-release (Nightly)' : r.tag }}</b><span class="l-sub">{{ cleanName(r) }}{{ r.date ? ' · ' + r.date.slice(0, 10) : '' }}</span></span>
          <span class="l-end">
            <span v-if="busy === r.tag" class="status"><Icon name="mdiArrowDownCircle" :size="14" />{{ pct != null ? pct + '%' : 'Starting' }}</span>
            <Icon v-else name="mdiDownload" :size="20" />
          </span>
          <i v-if="busy === r.tag" class="sv-fill" :style="{ width: (pct ?? 4) + '%' }" />
        </button>
      </div>
      <div class="row" style="justify-content: flex-end"><button class="btn" data-focus @click="closeModal(null)">Done</button></div>
    </div>
  </div>
</template>

<script setup>
// shadPS4 versions (0.9.23, owner: see which games run which version, add versions from Cartridge).
// Reads and writes shadPS4 launcher's own versions.json (electron/shadVersions.js); per-game picks are
// Cartridge's (config.steam.shadVersions), passed to the launcher as -e "<path>".
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { store, call, closeModal, toast, confirm, choose, bgJob } from '../store.js';
import Icon from './Icon.vue';
import EmuIcon from './EmuIcon.vue';

const el = ref(null), data = ref(null), loadingOnline = ref(true), busy = ref(''), pct = ref(null);
const short = (p) => String(p || '').replace(store.info?.home || '\0', '~');
const cleanName = (r) => String(r.name || '').replace(/^shadps4\s*/i, '').replace(/\s*-\s*codename\s+/i, ' · ');
const addable = computed(() => (data.value?.available || []).filter((r) => !(data.value.list || []).some((v) => (r.prerelease ? v.type === 1 && v.date === String(r.date).slice(0, 10) : v.name === r.tag))));
async function load(online = true) {
  const d = await call('shadv:list', { online }).catch((e) => ({ list: [], error: e.message }));
  if (!online && data.value) d.available = data.value.available;
  data.value = d; loadingOnline.value = false;
}
let adding = false;
// 0.9.32: a version still downloading from an earlier visit shows here again
watch(() => bgJob('shadv:'), (j) => { if (j) { busy.value = j.key.slice(6); pct.value = j.pct ?? null; } else if (busy.value && !adding) { busy.value = ''; load(false); } }, { immediate: true });
async function add(r) {
  if (busy.value) return;
  busy.value = r.tag; pct.value = null; adding = true;
  try { const v = await call('shadv:install', { tag: r.tag }); toast(`shadPS4 ${v.name} added`, 'ok', 3000, 'mdiCheck'); }
  catch (e) { toast(e.message, 'error', 6000); }
  adding = false; busy.value = ''; await load(false);
}
async function pickInstalled(v) {
  const games = v.games.map((g) => g.name);
  const opts = [
    ...(games.length ? [{ heading: 'Games On This Version', label: games.slice(0, 6).join(', ') + (games.length > 6 ? ` and ${games.length - 6} more` : ''), value: '', icon: 'mdiGamepadVariantOutline', raw: true }] : []),
    { label: 'Remove This Version', sub: v.selected ? 'It’s shadPS4’s default: pick another in shadPS4 first' : games.length ? 'Its games go back to the default' : '', value: 'remove', icon: 'mdiDeleteOutline', danger: true },
  ];
  const c = await choose({ title: v.name, message: [v.codename, v.date].filter(Boolean).join(' · '), options: opts, sheet: true });
  if (c !== 'remove') return;
  if (!(await confirm(`Remove ${v.name}?`, 'Its folder is deleted from shadPS4’s versions folder. Saves and settings stay.', 'Remove', true))) return;
  try { const r = await call('shadv:remove', { name: v.name }); toast(r.games ? `Removed. ${r.games} game${r.games === 1 ? '' : 's'} use the default again.` : 'Removed', 'ok', 3500); }
  catch (e) { toast(e.message, 'error', 6000); }
  await load(false);
}
let layer, off;
onMounted(async () => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  off = window.cart.on('shadv-progress', (m) => { if (m.tag === busy.value && m.pct != null) pct.value = m.pct; });
  await load(false); loadingOnline.value = true; focusFirst(el.value);
  await load(true); focusFirst(el.value);
});
onBeforeUnmount(() => { layer?.pop(); off?.(); });
</script>

<style scoped>
.sv { width: min(760px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-3); }
.sv-head { display: flex; gap: var(--s-4); align-items: flex-start; }
.sv-head h2 { margin: 2px 0 6px; font-size: var(--t-xl); line-height: 1.15; }
.sv-head p { margin: 0; line-height: 1.45; }
.sv-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 4px; }
.sv-list > * { flex: none; }
.sv-row { position: relative; overflow: hidden; }
.sv-badge { flex: none; min-width: 72px; text-align: center; font-size: var(--t-xs); font-weight: 700; letter-spacing: 0.02em; padding: 4px 8px; border-radius: var(--r-sm); background: var(--s3); color: var(--muted); }
.sv-badge.pre { color: #ffd978; background: rgba(245, 197, 66, 0.14); }
.sv-fill { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--bar, var(--primary)); transition: width var(--progress); }
</style>
