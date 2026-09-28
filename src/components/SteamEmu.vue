<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog se">
      <h2>{{ label }} in Steam</h2>
      <p class="muted" style="margin: 0; font-size: 13px">How new {{ label }} shortcuts start. Put <code>{ROM}</code> where the game's file goes{{ serialHint ? ', or {SERIAL} for its game ID' : '' }}. Only new shortcuts use changes; ones already in Steam stay as they are.</p>
      <button v-for="f in FIELDS" :key="f.k" class="se-f" data-focus @click="edit(f)">
        <span class="se-l">{{ f.l }}</span>
        <code>{{ t[f.k] || '(empty)' }}</code>
        <Icon name="mdiPencil" :size="17" class="se-i" />
      </button>
      <div v-if="result" class="se-test" :class="result.ok ? 'ok' : 'bad'"><Icon :name="result.ok ? 'mdiCheckCircle' : 'mdiAlertCircleOutline'" :size="17" />{{ result.ok ? result.note : result.error }}</div>
      <div class="row wrap" style="gap: 10px">
        <button class="btn" data-focus @click="browse"><Icon name="mdiFolderOpen" :size="18" />Pick Target</button>
        <button class="btn" data-focus @click="test"><Icon name="mdiPlayCircleOutline" :size="18" />Test</button>
        <button v-if="how === 'yours'" class="btn" data-focus @click="closeModal('reset')"><Icon name="mdiRestore" :size="18" />Automatic</button>
        <button class="btn" data-focus style="margin-left: auto" @click="closeModal(null)">Cancel</button>
        <button class="btn primary" data-focus @click="save"><Icon name="mdiCheck" />Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal, askText, pickFolder, store, call, toast } from '../store.js';
import Icon from './Icon.vue';

const props = defineProps({ ckey: String, label: String, how: String, exe: String, start: String, lo: String, focusKey: String });
const FIELDS = [{ k: 'exe', l: 'Target' }, { k: 'start', l: 'Start in' }, { k: 'lo', l: 'Launch options' }];
const t = reactive({ exe: props.exe || '', start: props.start || '', lo: props.lo || '' });
const serialHint = computed(() => ['ps3', 'ps4'].includes(props.ckey));
const result = ref(null);
const el = ref(null);
// Other dialogs (keyboard, file picker) replace this one for a moment: reopen it afterwards
function reopen(resolveOuter, focusKey) { store.modal = { type: 'steam-emu', props: { ...props, ...t, focusKey }, resolve: resolveOuter }; }
async function edit(f) {
  const resolveOuter = store.modal.resolve;
  const v = await askText({ title: f.l, value: t[f.k], placeholder: f.l });
  if (typeof v === 'string') t[f.k] = v.trim();
  reopen(resolveOuter, f.k);
}
async function browse() {
  const resolveOuter = store.modal.resolve;
  const d = t.exe ? t.exe.replace(/\/[^/]*$/, '') : store.info.home;
  const file = await pickFolder({ title: `Emulator for ${props.label}`, subtitle: 'An AppImage, an EmuDeck launcher (.sh) or a Windows .exe', start: d, hidden: true, files: ['appimage', 'sh', 'exe', 'x86_64', 'bin'] });
  if (file) { t.exe = file; if (!t.start) t.start = file.replace(/\/[^/]*$/, ''); }
  reopen(resolveOuter, 'exe');
}
async function test() {
  try {
    // test what's typed, not what's saved: save to a scratch slot first
    result.value = await call('steam:testTemplate', { key: props.ckey, template: { ...t } });
  } catch (e) { toast(e.message, 'error'); }
}
function save() {
  if (!t.exe) { toast('Target is empty', 'error', 2500); return; }
  if (!/\{ROM\}|\{SERIAL\}/.test(t.lo)) { toast('Launch options need {ROM} (or {SERIAL}) where the game goes', 'error', 4000); return; }
  closeModal({ ...t });
}
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: save, lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  const i = FIELDS.findIndex((f) => f.k === props.focusKey);
  (i >= 0 && focusFirst(el.value, `.se-f:nth-of-type(${i + 1})`)) || focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.se { width: min(860px, 95vw); }
.se-f { display: grid; grid-template-columns: 130px 1fr auto; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; background: rgba(255, 255, 255, 0.045); border: 1px solid var(--line); text-align: left; }
.se-f:focus { border-color: var(--primary-l); box-shadow: var(--ring); }
.se-l { color: var(--muted); font-size: 13px; }
.se-f code { font-size: 12.5px; word-break: break-all; }
.se-i { color: var(--muted); }
.se-test { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 8px 12px; border-radius: 8px; }
.se-test.ok { background: rgba(80, 200, 120, 0.14); color: #9be8b4; }
.se-test.bad { background: rgba(255, 90, 90, 0.14); color: #ffaaaa; }
</style>
