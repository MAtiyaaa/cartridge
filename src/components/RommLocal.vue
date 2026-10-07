<template>
  <div class="rl">
    <template v-if="phase === 'intro'">
      <h1>Set up RomM on this device</h1>
      <!-- 0.9.49 (owner): already linked to a RomM, so say so first; Set Up Anyway goes on to the setup -->
      <template v-if="info?.linked && !anyway">
        <div class="rl-linked"><Icon name="mdiCheckCircle" :size="26" /><div><b>{{ info.mine ? 'RomM is set up on this device' : 'Cartridge is connected to RomM' }}</b><span class="muted small">{{ linkedTo }}{{ info.mine && info.running === false ? ' · not running right now' : '' }}</span></div></div>
        <p class="muted small">There's nothing to do here. Set it up anyway to make a new RomM on this device{{ info.mine ? ' (your account and games are kept, the folders can change)' : '; Cartridge then uses it instead' }}.</p>
        <div class="rl-act">
          <button class="btn" data-focus @click="emit('back')"><Icon name="mdiArrowLeft" />Back</button>
          <button class="btn" data-focus @click="anyway = true">Set Up Anyway</button>
          <button class="btn primary" data-focus @click="emit('done')">Continue<Icon name="mdiArrowRight" /></button>
        </div>
      </template>
      <template v-else>
        <div class="rl-note glass"><Icon name="mdiInformationOutline" :size="22" /><span>Your RomM server is only reachable while this device is on and online.</span></div>
        <p class="muted small">Cartridge runs RomM in the background with Podman, the way RomM's own setup does. It starts with the device and keeps running in Game Mode.</p>
        <div class="rl-act">
          <button class="btn" data-focus @click="info?.linked ? (anyway = false) : emit('back')"><Icon name="mdiArrowLeft" />Back</button>
          <button class="btn primary" data-focus :disabled="!info" @click="phase = needsPrep ? 'prep' : 'form'">Continue<Icon name="mdiArrowRight" /></button>
        </div>
      </template>
    </template>

    <!-- 0.9.17: Podman set up from here (downloaded when missing; user ID ranges with the device password) -->
    <template v-else-if="phase === 'prep'">
      <h1>Getting Podman ready</h1>
      <p class="muted small">RomM runs inside Podman. {{ info.ready?.podman ? 'Podman is on this device.' : 'Cartridge downloads Podman into its own folder (podman-launcher, the copy used on the Steam Deck), nothing on the system changes for it.' }}</p>
      <template v-if="!info.ready?.ids">
        <p class="muted small">Podman also needs permission to run containers as you, which is one system setting (your user's ID ranges). Cartridge sets it with your device password, the one Desktop Mode asks for. It's used once and never saved.</p>
        <TextField v-model="devPass" label="Device password" placeholder="Your password for this device" password icon="mdiLock" />
        <p class="muted small">Never set one? In Desktop Mode open Konsole, type <span class="mono">passwd</span> and choose one.</p>
      </template>
      <p v-if="prepErr" class="rl-bad"><Icon name="mdiAlertCircle" :size="18" />{{ prepErr }}</p>
      <div v-if="prepBusy" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> {{ prog.label || 'Working' }}…</div>
      <div class="rl-act">
        <button class="btn" data-focus :disabled="prepBusy" @click="phase = 'intro'"><Icon name="mdiArrowLeft" />Back</button>
        <button class="btn primary" data-focus :disabled="prepBusy || (!info.ready?.ids && !devPass)" @click="prep"><Icon name="mdiCogPlay" />Set up Podman</button>
      </div>
    </template>

    <template v-else-if="phase === 'form'">
      <h1>Your RomM account</h1>
      <p class="muted small">This is yours: use it to sign in to RomM from any browser or device. It becomes RomM's admin account.</p>
      <div class="grid2">
        <TextField v-model="f.username" label="Username" placeholder="At least 3 characters" icon="mdiAccount" />
        <TextField v-model="f.name" label="Server name" placeholder="Living room RomM" icon="mdiServer" />
        <TextField v-model="f.password" label="Password" placeholder="Choose a password" password icon="mdiLock" />
        <TextField v-model="f.confirm" label="Confirm password" placeholder="Type it again" password icon="mdiLockCheck" />
      </div>
      <p v-if="f.confirm && f.confirm !== f.password" class="rl-bad"><Icon name="mdiAlertCircle" :size="18" />The passwords don't match.</p>
      <div class="subh">Where RomM keeps your games</div>
      <p class="muted small">{{ folders.length ? 'Your games folders. Pick one or more: RomM shows the games already in them, and nothing in them is moved.' : 'No games folders were found on this device.' }}</p>
      <div class="stack">
        <button v-for="l in folders" :key="l.path" class="lrow" data-focus :aria-pressed="picked.includes(l.path)" @click="toggle(l.path)">
          <Icon name="mdiFolderOutline" :size="24" />
          <div class="l-mid"><b>{{ l.drive || l.from }}<span v-if="l.consoles" class="rl-count"> · {{ l.consoles }} consoles, {{ l.games }} games</span></b><span class="l-sub mono">{{ short(l.path) }}/&lt;console&gt;</span></div>
          <span v-if="picked.includes(l.path)" class="tick-ok" title="Chosen"><Icon name="mdiCheck" :size="14" /></span>
        </button>
        <button class="lrow" data-focus :aria-pressed="useNew" @click="pickNew">
          <Icon name="mdiFolderPlusOutline" :size="24" />
          <div class="l-mid"><b>A new folder</b><span class="l-sub mono">{{ short(info?.newFolder) }}/roms/&lt;console&gt;</span></div>
          <span v-if="useNew" class="tick-ok" title="Chosen"><Icon name="mdiCheck" :size="14" /></span>
        </button>
        <button class="lrow" data-focus @click="browse"><Icon name="mdiFolderOpen" :size="24" /><div class="l-mid"><b>Somewhere else…</b><span class="l-sub">Add another games folder to the list</span></div></button>
      </div>
      <p v-for="c in conflicts" :key="c.console" class="rl-warn small"><Icon name="mdiInformationOutline" :size="18" />{{ c.console }} is in more than one folder: RomM shows the one in {{ short(c.kept) }}.</p>
      <div class="rl-act">
        <button class="btn" data-focus @click="phase = 'intro'"><Icon name="mdiArrowLeft" />Back</button>
        <button class="btn primary" data-focus :disabled="!ready" @click="start"><Icon name="mdiServerPlus" />Set up RomM</button>
      </div>
    </template>

    <template v-else-if="phase === 'work'">
      <h1>Setting up RomM</h1>
      <div class="glass rl-prog">
        <b>{{ prog.label || 'Getting ready' }}</b>
        <div class="bar live"><i :style="{ width: Math.round(((prog.step || 0) / (prog.of || 7)) * 100) + '%' }" /></div>
        <span class="muted small">Step {{ prog.step || 0 }} of {{ prog.of || 7 }}. The first download is about 1 GB.</span>
      </div>
    </template>

    <template v-else-if="phase === 'done'">
      <div class="rl-good"><Icon name="mdiCheckCircle" :size="56" /></div>
      <h1>RomM is running</h1>
      <p class="muted">Signed in as <b>{{ f.username.trim().toLowerCase() }}</b>. {{ result.folders?.length ? 'Scan your library in RomM to see the games already in your folders.' : '' }} New games go in <span class="mono">{{ short(result.romsRoot) }}/&lt;console&gt;</span>.</p>
      <p v-if="result.lan.length" class="muted small">On other devices at home: <span class="mono">{{ result.lan.join('  ·  ') }}</span></p>
      <p v-if="!result.boot" class="muted small">Starting with the device couldn't be turned on. RomM keeps running until you restart.</p>
      <div class="rl-act">
        <button class="btn" data-focus @click="phase = 'keys'"><Icon name="mdiKeyVariant" />Covers and details</button>
        <button class="btn primary" data-focus @click="emit('done')">Continue<Icon name="mdiArrowRight" /></button>
      </div>
    </template>

    <!-- optional, after setup (0.9.16): metadata keys; RomM restarts with them, nothing else changes -->
    <template v-else-if="phase === 'keys'">
      <h1>Covers and details</h1>
      <p class="muted small">Optional. RomM already finds names and covers through Hasheous. Free accounts with these give it more: IGDB (dev.twitch.tv, Register Your Application) for details and screenshots, ScreenScraper (screenscraper.fr) for boxes and logos. Kept with RomM's other settings on this device.</p>
      <p v-if="keysOn.igdb || keysOn.ss" class="muted small">Already set: {{ [keysOn.igdb && 'IGDB', keysOn.ss && 'ScreenScraper'].filter(Boolean).join(', ') }}. Leave a field empty to keep it.</p>
      <div class="grid2">
        <TextField v-model="keys.igdbId" label="IGDB Client ID" placeholder="Optional" />
        <TextField v-model="keys.igdbSecret" label="IGDB Client Secret" placeholder="Optional" password />
        <TextField v-model="keys.ssUser" label="ScreenScraper username" placeholder="Optional" />
        <TextField v-model="keys.ssPass" label="ScreenScraper password" placeholder="Optional" password />
      </div>
      <div class="rl-act">
        <button class="btn" data-focus :disabled="keyBusy" @click="startAt === 'keys' ? emit('back') : (phase = 'done')">{{ startAt === 'keys' ? 'Close' : afterKeys ? 'Skip for now' : 'Skip' }}</button>
        <button class="btn primary" data-focus :disabled="keyBusy || !keysReady" @click="saveKeys"><Icon name="mdiCheck" />{{ keyBusy ? 'Restarting RomM…' : 'Save' }}</button>
      </div>
    </template>

    <template v-else-if="phase === 'error'">
      <h1>RomM couldn't be set up</h1>
      <p class="rl-bad"><Icon name="mdiAlertCircle" :size="18" />{{ error }}</p>
      <div class="rl-act">
        <button class="btn" data-focus @click="emit('back')"><Icon name="mdiArrowLeft" />Back</button>
        <button class="btn primary" data-focus @click="start"><Icon name="mdiRefresh" />Try again</button>
      </div>
    </template>
  </div>
</template>

<script setup>
// RomM on this device (0.9.15, plan section 1): asks only what a person would know, then runs.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { store, call, pickFolder, saveConfig, toast } from '../store.js';
import { focusFirst } from '../nav.js';
import { useView } from '../useView.js';
import Icon from './Icon.vue';
import TextField from './TextField.vue';

const props = defineProps({ startAt: { type: String, default: 'intro' } });
const emit = defineEmits(['done', 'back']);
const phase = ref(props.startAt);
const keysOn = ref({}), keyBusy = ref(false);
const keysReady = computed(() => (keys.igdbId && keys.igdbSecret) || (keys.ssUser && keys.ssPass));
async function saveKeys() {
  keyBusy.value = true;
  const only = Object.fromEntries(Object.entries(keys).filter(([, v]) => v.trim()));
  try { await call('romm:localUpdate', { keys: only }); toast('Saved. RomM is restarting with them.', 'ok', 3500, 'mdiKeyVariant'); keysOn.value = await call('romm:localKeys').catch(() => ({})); if (props.startAt === 'keys') emit('done'); else phase.value = 'done'; }
  catch (e) { toast(e.message, 'error', 6000); }
  keyBusy.value = false;
}
const info = ref(null);
const needsPrep = computed(() => !info.value?.ready?.podman || !info.value?.ready?.ids);
const devPass = ref(''), prepBusy = ref(false), prepErr = ref('');
async function prep() {
  prepBusy.value = true; prepErr.value = ''; prog.value = {};
  try {
    const r = await call('romm:localPrepare', { password: devPass.value });
    if (r?.needPassword) prepErr.value = 'Type your device password.';
    else { info.value = { ...info.value, ready: r.ready, podman: true }; phase.value = 'form'; }
  } catch (e) { prepErr.value = e.message; }
  devPass.value = ''; prepBusy.value = false;
}
const f = reactive({ username: '', password: '', confirm: '', name: '' });
const keys = reactive({ igdbId: '', igdbSecret: '', ssUser: '', ssPass: '' });
const prog = ref({}), result = ref(null), error = ref(''), afterKeys = ref(false);
const ready = computed(() => f.username.trim().length >= 3 && f.password && f.password === f.confirm && (picked.value.length || useNew.value));
const anyway = ref(false);
const linkedTo = computed(() => { const s = store.config.server || {}; try { return new URL(s.localUrl || s.remoteUrl).host; } catch { return ''; } });
// games folders: several can be picked; a new folder is the other way (empty, made for RomM)
const extra = ref([]), picked = ref([]), useNew = ref(false), conflicts = ref([]);
const folders = computed(() => [...(info.value?.folders || []), ...extra.value]);
function toggle(p) { useNew.value = false; picked.value = picked.value.includes(p) ? picked.value.filter((x) => x !== p) : [...picked.value, p]; }
function pickNew() { useNew.value = !useNew.value; if (useNew.value) picked.value = []; }
watch(picked, async (v) => { conflicts.value = v.length > 1 ? await call('romm:localPlan', { roms: v }).then((r) => r.conflicts || [], () => []) : []; });
const short = (p) => String(p || '').replace(store.info?.home || '\0', '~');

async function browse() {
  const p = await pickFolder({ title: 'Pick a games folder (the one holding a folder per console)', start: store.info?.home });
  if (!p) return;
  if (!folders.value.some((x) => x.path === p)) extra.value.push({ path: p, from: 'Picked folder', drive: '' });
  if (!picked.value.includes(p)) toggle(p);
}
let off = null;
async function start() {
  phase.value = 'work'; prog.value = {};
  try {
    result.value = await call('romm:localSetup', { username: f.username, password: f.password, roms: useNew.value ? [] : [...picked.value], library: useNew.value ? info.value.newFolder : null, name: f.name });
    store.config = await call('config:get');
    await saveConfig({ configured: true, localOnly: false });
    call('library:sync').catch(() => {});
    phase.value = 'keys'; afterKeys.value = true; // 0.9.19: metadata keys are a step of their own after setup (Skip goes on)
  } catch (e) { if (/Podman isn’t ready/.test(e.message)) { info.value = await call('romm:localInfo').catch(() => info.value); phase.value = 'prep'; return; } error.value = e.message; phase.value = 'error'; }
}
useView({ back: () => { if (phase.value === 'form' || phase.value === 'prep') phase.value = 'intro'; else if (phase.value !== 'work') emit('back'); } }, [{ b: 'A', label: 'Select' }, { b: 'B', label: 'Back' }]);
watch(phase, async () => { await nextTick(); focusFirst(document.querySelector('.rl'), '.rl-act .btn.primary:not([disabled]), [data-focus]'); });
onMounted(async () => {
  off = window.cart.on('romm-local', (p) => (prog.value = p));
  keysOn.value = await call('romm:localKeys').catch(() => ({}));
  info.value = await call('romm:localInfo').catch(() => ({ podman: false, libraries: [] }));
  // the folders RomM used before (Set Up Anyway), else your main games folder, else a new folder
  const had = (info.value.chosen || []).filter((p) => info.value.folders?.some((x) => x.path === p));
  picked.value = had.length ? had : info.value.folders?.find((x) => x.main)?.path ? [info.value.folders.find((x) => x.main).path] : info.value.folders?.[0] ? [info.value.folders[0].path] : [];
  useNew.value = !picked.value.length;
  f.username = (store.config.ui.name || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  await nextTick(); focusFirst(document.querySelector('.rl'), '.rl-act .btn.primary:not([disabled]), [data-focus]');
});
onBeforeUnmount(() => off?.());
</script>

<style scoped>
.rl { display: flex; flex-direction: column; gap: var(--s-3); text-align: left; width: 100%; }
.rl h1 { text-align: center; }
.rl-note { display: flex; align-items: center; gap: var(--s-2); padding: var(--s-3) var(--s-4); font-weight: 600; }
.rl-bad { display: flex; align-items: center; gap: 8px; color: #ffa39c; margin: 0; }
.rl-good { display: flex; justify-content: center; color: #7ee787; }
.rl-act { display: flex; justify-content: center; gap: var(--s-3); flex-wrap: wrap; margin-top: var(--s-3); }
.rl-prog { display: flex; flex-direction: column; gap: var(--s-2); padding: var(--s-4) var(--s-5); }
.grid2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
.stack { display: flex; flex-direction: column; gap: var(--s-2); }
.small { font-size: var(--t-sm); margin: 0; line-height: 1.5; }
.mono { font-family: ui-monospace, monospace; word-break: break-all; }
.rl-linked { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); border-radius: var(--r-md); background: rgba(126, 231, 135, 0.12); color: var(--green-l, #7ee787); }
.rl-linked > div { display: flex; flex-direction: column; gap: 2px; color: var(--text); }
.rl-warn { display: flex; align-items: center; gap: 8px; color: var(--muted); }
.rl-count { font-weight: 500; color: inherit; opacity: 0.75; }
.toggle-adv { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: var(--t-sm); padding: 6px; border-radius: var(--r-md); align-self: flex-start; }
.toggle-adv:focus { box-shadow: var(--ring); }
p { margin: 0; }
</style>
