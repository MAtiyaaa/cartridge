<template>
  <div class="rl">
    <template v-if="phase === 'intro'">
      <h1>Set up RomM on this device</h1>
      <div class="rl-note glass"><Icon name="mdiInformationOutline" :size="22" /><span>Your RomM server is only reachable while this device is on and online.</span></div>
      <p class="muted small">Cartridge runs RomM in the background with Podman, the way RomM's own setup does. It starts with the device and keeps running in Game Mode.</p>
      <p v-if="info && !info.podman" class="rl-bad"><Icon name="mdiAlertCircle" :size="18" />Podman isn't installed here. Bazzite and Fedora Atomic include it; on other systems install the podman package first.</p>
      <div class="rl-act">
        <button class="btn" data-focus @click="emit('back')"><Icon name="mdiArrowLeft" />Back</button>
        <button class="btn primary" data-focus :disabled="!info?.podman" @click="phase = 'form'">Continue<Icon name="mdiArrowRight" /></button>
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
      <div class="stack">
        <button v-for="l in libs" :key="l.path" class="lrow" data-focus :class="{ sel: f.library === l.path }" @click="f.library = l.path">
          <Icon name="mdiFolderOutline" :size="24" />
          <div class="l-mid"><b>{{ l.from === 'New folder' ? 'A new folder' : `Your ${l.from} folder` }}</b><span class="l-sub mono">{{ short(l.path) }}/roms/&lt;console&gt;</span></div>
          <Icon v-if="f.library === l.path" name="mdiCheck" :size="20" />
        </button>
        <button class="lrow" data-focus :class="{ sel: custom && f.library === custom }" @click="browse"><Icon name="mdiFolderOpen" :size="24" /><div class="l-mid"><b>Somewhere else…</b><span v-if="custom" class="l-sub mono">{{ short(custom) }}/roms/&lt;console&gt;</span></div><Icon v-if="custom && f.library === custom" name="mdiCheck" :size="20" /></button>
      </div>
      <button class="toggle-adv" data-focus @click="adv = !adv"><Icon :name="adv ? 'mdiChevronDown' : 'mdiChevronRight'" />Metadata keys (optional, for covers and details)</button>
      <div v-if="adv" class="grid2">
        <TextField v-model="keys.igdbId" label="IGDB Client ID" placeholder="Optional" />
        <TextField v-model="keys.igdbSecret" label="IGDB Client Secret" placeholder="Optional" password />
        <TextField v-model="keys.ssUser" label="ScreenScraper username" placeholder="Optional" />
        <TextField v-model="keys.ssPass" label="ScreenScraper password" placeholder="Optional" password />
      </div>
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
      <p class="muted">Signed in as <b>{{ f.username.trim().toLowerCase() }}</b>. Put games in <span class="mono">{{ short(result.romsRoot) }}/&lt;console&gt;</span> and scan them in RomM.</p>
      <p v-if="result.lan.length" class="muted small">On other devices at home: <span class="mono">{{ result.lan.join('  ·  ') }}</span></p>
      <p v-if="!result.boot" class="muted small">Starting with the device couldn't be turned on. RomM keeps running until you restart.</p>
      <div class="rl-act"><button class="btn primary" data-focus @click="emit('done')">Continue<Icon name="mdiArrowRight" /></button></div>
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
import { store, call, pickFolder, saveConfig } from '../store.js';
import { focusFirst } from '../nav.js';
import { useView } from '../useView.js';
import Icon from './Icon.vue';
import TextField from './TextField.vue';

const emit = defineEmits(['done', 'back']);
const phase = ref('intro');
const info = ref(null);
const f = reactive({ username: '', password: '', confirm: '', name: '', library: '' });
const keys = reactive({ igdbId: '', igdbSecret: '', ssUser: '', ssPass: '' });
const adv = ref(false), custom = ref('');
const prog = ref({}), result = ref(null), error = ref('');
const libs = computed(() => info.value?.libraries || []);
const ready = computed(() => f.username.trim().length >= 3 && f.password && f.password === f.confirm && f.library);
const short = (p) => String(p || '').replace(store.info?.home || '\0', '~');

async function browse() {
  const p = await pickFolder({ title: 'Where should RomM keep your games?', start: store.info?.home });
  if (p) { custom.value = p; f.library = p; }
}
let off = null;
async function start() {
  phase.value = 'work'; prog.value = {};
  try {
    result.value = await call('romm:localSetup', { username: f.username, password: f.password, library: f.library, name: f.name, keys: { ...keys } });
    store.config = await call('config:get');
    if (!store.config.configured) await saveConfig({ configured: true });
    call('library:sync').catch(() => {});
    phase.value = 'done';
  } catch (e) { error.value = e.message; phase.value = 'error'; }
}
useView({ back: () => { if (phase.value === 'form') phase.value = 'intro'; else if (phase.value !== 'work') emit('back'); } }, [{ b: 'A', label: 'Select' }, { b: 'B', label: 'Back' }]);
watch(phase, async () => { await nextTick(); focusFirst(document.querySelector('.rl'), '.rl-act .btn.primary:not([disabled]), [data-focus]'); });
onMounted(async () => {
  off = window.cart.on('romm-local', (p) => (prog.value = p));
  info.value = await call('romm:localInfo').catch(() => ({ podman: false, libraries: [] }));
  f.library = info.value.libraries?.[0]?.path || '';
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
.lrow.sel { background: var(--sel); }
.toggle-adv { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: var(--t-sm); padding: 6px; border-radius: var(--r-md); align-self: flex-start; }
.toggle-adv:focus { box-shadow: var(--ring); }
p { margin: 0; }
</style>
