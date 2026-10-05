<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog ga">
      <div class="ga-head">
        <img v-if="cover" :src="cover" class="ga-cover" />
        <div style="min-width: 0">
          <div class="eyebrow">About</div>
          <h2>{{ name }}</h2>
          <div class="muted">{{ d ? consoleName({ romId, slug: d.slug, fallback: d.console }) : '' }}</div>
        </div>
      </div>
      <div class="ga-list" data-scroll>
        <div v-if="!d" class="muted" style="padding: 12px 4px">{{ err || 'Reading the game…' }}</div>
        <template v-else>
          <div v-for="s in sections" :key="s.title" class="ga-sec">
            <div class="ga-title">{{ s.title }}</div>
            <div v-for="(x, i) in s.rows" :key="i" class="ga-row" data-focus tabindex="0" @click="copy(x)">
              <span class="ga-l">{{ x.l }}</span><span class="ga-v">{{ x.v }}</span>
            </div>
          </div>
        </template>
      </div>
      <div class="row" style="justify-content: space-between; align-items: center">
        <span class="muted ga-hint">A on a line copies it</span>
        <button class="btn" data-focus data-autofocus @click="closeModal(null)">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// A game's About (0.9.32, owner): console, file, IDs and version, and what is installed or turned on for
// it (add-ons, patches and cheats, its own emulator settings). Read only; from Game More → Options.
import { computed, onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { call, closeModal, toast, bytes, consoleName } from '../store.js';

const props = defineProps({ romId: Number, name: String, cover: String });
const d = ref(null), err = ref('');
const day = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const sections = computed(() => {
  const a = d.value, out = [];
  if (!a) return out;
  const game = [
    { l: 'Console', v: consoleName({ romId: props.romId, slug: a.slug, fallback: a.console }) },
    ...a.ids.map((x) => ({ l: x.label, v: x.value })),
    ...(a.version ? [{ l: 'Version', v: a.version }] : []),
    ...(a.regions?.length ? [{ l: 'Region', v: a.regions.join(', ') }] : []),
    ...(a.file ? [{ l: 'File', v: a.file }] : []),
    ...(a.size ? [{ l: 'Size', v: bytes(a.size) }] : []),
    ...(a.rommId ? [{ l: 'RomM ID', v: String(a.rommId) }] : []),
  ];
  out.push({ title: 'Game', rows: game });
  const dev = [];
  if (a.where) dev.push({ l: 'Location', v: a.where });
  else dev.push({ l: 'Status', v: a.marked ? 'Marked as installed' : 'Not downloaded' });
  if (a.install) dev.push({ l: 'Installed in', v: `${a.install.emu}${a.install.at ? ' · ' + day(a.install.at) : ''}` });
  if (a.steam) dev.push({ l: 'Steam', v: a.steam.inSteam ? 'In Steam' : a.steam.queued ? 'Waiting to be added' : 'Not in Steam' });
  out.push({ title: 'On This Device', rows: dev });
  const add = [
    ...a.addons.map((x) => ({ l: x.kind || 'Add-on', v: `${x.name} · ${x.emu} · ${x.files.toLocaleString()} files${x.at ? ' · ' + day(x.at) : ''}` })),
    ...a.other.map((x) => ({ l: 'Other files', v: `${x.files.toLocaleString()} files in ${x.emu}’s folder for this game, not put there by Cartridge` })),
  ];
  out.push({ title: 'Texture Packs and Mods', rows: add.length ? add : [{ l: 'None', v: 'Nothing installed for this game' }] });
  if (a.patchEmu) out.push({ title: `Patches and Cheats On · ${a.patchEmu}`, rows: a.patches.length ? a.patches.map((x) => ({ l: x.section || 'Patch', v: `${x.name}${x.by === 'you' ? ' · turned on in the emulator' : ''}` })) : [{ l: 'None', v: 'No patches are on' }] });
  if (a.settingsEmu) out.push({ title: `Its Own Settings · ${a.settingsEmu}`, rows: a.settings.length ? a.settings.map((x) => ({ l: x.label, v: x.value })) : [{ l: 'None', v: 'Same as your normal settings' }] });
  return out;
});
async function copy(x) { if (x.l === 'None') return; try { await call('clip:write', { text: x.v }); toast(`${x.l} copied`, 'ok', 2000, 'mdiContentCopy'); } catch (e) { toast(e.message, 'error'); } }
const el = ref(null);
let layer;
onMounted(async () => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value, '[data-autofocus]') || focusFirst(el.value);
  try { d.value = await call('game:about', { romId: props.romId }); await nextTick(); focusFirst(el.value, '.ga-row'); } catch (e) { err.value = e.message; }
});
onBeforeUnmount(() => layer?.pop());
</script>

<style scoped>
.ga { width: min(760px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-3); }
.ga-head { display: flex; gap: 18px; align-items: center; }
.ga-head h2 { margin: 2px 0 6px; font-size: var(--t-xl); line-height: 1.15; }
.ga-cover { width: 76px; aspect-ratio: 2 / 3; object-fit: cover; border-radius: var(--r-md); box-shadow: var(--weight); flex: none; }
.ga-list { overflow-y: auto; min-height: 0; flex: 1; display: flex; flex-direction: column; gap: var(--s-4); padding: 2px; }
.ga-sec { flex: none; display: flex; flex-direction: column; gap: 2px; }
.ga-title { font-size: var(--t-xs); font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; padding: 0 10px 4px; }
.ga-row { flex: none; display: grid; grid-template-columns: minmax(110px, 30%) 1fr; gap: var(--s-3); padding: 8px 10px; border-radius: var(--r-md); outline: none; cursor: pointer; }
.ga-row:focus { background: var(--focus); color: var(--on-focus); }
.ga-row:focus .ga-l { color: var(--on-focus-dim); }
.ga-l { color: var(--muted); font-size: var(--t-sm); font-weight: 600; }
.ga-v { font-size: var(--t-sm); overflow-wrap: anywhere; }
.ga-hint { font-size: var(--t-xs); }
</style>
