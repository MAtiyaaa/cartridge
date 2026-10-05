<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog ep">
      <div class="ep-head">
        <EmuIcon :id="id" :size="44" fallback="mdiFolderCogOutline" />
        <div style="min-width: 0">
          <div class="eyebrow">{{ d?.name || name }}</div>
          <h2>Folders</h2>
          <p class="muted small">Where {{ d?.name || name }} keeps games, installed content and saves, from its own settings. A change is written there, so {{ d?.name || name }} uses it too. Files already in the old folder stay where they are.</p>
        </div>
      </div>
      <div v-if="!d" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Reading its settings…</div>
      <div v-else-if="d.why" class="muted">{{ d.why }}</div>
      <div v-else class="ep-list" data-scroll>
        <button v-for="it in d.items" :key="it.id" class="lrow" data-focus :disabled="busy" @click="pick(it)">
          <Icon :name="it.list ? 'mdiFolderMultipleOutline' : 'mdiFolderOutline'" :size="22" />
          <span class="l-mid"><b>{{ it.label }}</b><span class="l-sub mono">{{ it.list ? (it.paths.length ? it.paths.map(short).join(' · ') : 'None yet') : short(it.path) || 'Its default' }}</span><span v-if="it.sub" class="l-sub">{{ it.sub }}</span></span>
          <span class="l-end"><span v-if="!it.list && !it.here" class="status warn">Not there yet</span><span v-else-if="it.dflt && !it.list" class="status">Default</span><span v-else-if="it.list" class="status">{{ it.paths.length }}</span></span>
        </button>
      </div>
      <div class="row" style="justify-content: flex-end"><button class="btn primary" data-focus @click="closeModal(null)">Done</button></div>
    </div>
  </div>
</template>
<script setup>
// Settings → Emulators → an emulator → Folders (0.9.24, owner: emulator-specific settings, like the paths
// games and DLC install to, open them and change them). electron/emuPaths.js reads and writes them.
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { store, call, closeModal, toast, choose, confirm, pickFolder } from '../store.js';
import Icon from './Icon.vue';
import EmuIcon from './EmuIcon.vue';
const props = defineProps({ id: String, name: String });
const el = ref(null), d = ref(null), busy = ref(false);
const short = (p) => String(p || '').replace(store.info?.home || '\0', '~');
let saved = null;
// pickers take the one modal slot: this one comes back after them
function reopen() { if (store.modal?.type !== 'emupaths') store.modal = { type: 'emupaths', props: { id: props.id, name: props.name }, resolve: saved || (() => {}) }; }
async function set(it, value) {
  busy.value = true;
  try { d.value = await call('emupaths:set', { id: props.id, rid: it.id, value }); toast('Saved in its settings', 'ok', 2500, 'mdiCheck'); }
  catch (e) { toast(e.message, 'error', 6000); }
  busy.value = false;
}
async function open(p) { try { await call('fs:openFolder', { path: p }); } catch (e) { toast(e.message, 'error', 4000); } }
async function pick(it) {
  if (it.list) {
    const v = await choose({ sheet: true, title: it.label, message: it.sub, options: [
      ...it.paths.map((p, i) => ({ label: short(p), value: 'i:' + i, icon: 'mdiFolderOutline', raw: true, sub: 'Open or remove' })),
      { label: 'Add a Folder', value: 'add', icon: 'mdiFolderPlusOutline' },
    ] });
    reopen();
    if (!v) return;
    if (v === 'add') {
      const dir = await pickFolder({ title: `Add a folder to ${it.label}`, start: it.paths[0] || store.info?.home });
      reopen(); if (dir) await set(it, [...it.value, dir]);
      return;
    }
    const i = Number(v.slice(2));
    const w = await choose({ title: short(it.paths[i]), options: [{ label: 'Open the Folder', value: 'open', icon: 'mdiFolderOpenOutline' }, { label: 'Remove From the List', sub: 'Its files stay', value: 'rm', icon: 'mdiFolderRemoveOutline', danger: true }] });
    reopen();
    if (w === 'open') await open(it.paths[i]);
    if (w === 'rm') await set(it, it.value.filter((_, j) => j !== i));
    return;
  }
  const v = await choose({ sheet: true, title: it.label, message: [short(it.path), it.sub].filter(Boolean).join('\n'), options: [
    { label: 'Open the Folder', value: 'open', icon: 'mdiFolderOpenOutline' },
    { label: 'Choose Another Folder', sub: 'The files there now stay where they are', value: 'change', icon: 'mdiFolderEditOutline' },
    ...(!it.dflt ? [{ label: 'Back to Its Default', value: 'default', icon: 'mdiRestore' }] : []),
  ] });
  reopen();
  if (v === 'open') return open(it.path);
  if (v === 'change') {
    const dir = await pickFolder({ title: `New folder for ${it.label}`, start: it.path || store.info?.home });
    reopen();
    if (!dir || dir === it.path) return;
    if (!(await confirm(`Move ${it.label} to this folder?`, `${short(dir)}\n\n${d.value.name} will use it from now on. What's in ${short(it.path)} stays there: copy it over yourself if you want it in the new place.`, 'Use It'))) return reopen();
    reopen(); await set(it, dir);
  }
  if (v === 'default') await set(it, null);
}
let layer;
onMounted(async () => {
  saved = store.modal?.resolve;
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  d.value = await call('emupaths:get', { id: props.id }).catch((e) => ({ why: e.message }));
  focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.ep { width: min(820px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-3); }
.ep-head { display: flex; gap: var(--s-4); align-items: flex-start; }
.ep-head h2 { margin: 2px 0 6px; font-size: var(--t-xl); }
.ep-head p { margin: 0; line-height: 1.45; }
.ep-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 4px; }
.ep-list > * { flex: none; }
.mono { font-family: ui-monospace, monospace; }
.l-sub.mono { overflow-wrap: anywhere; }
</style>
