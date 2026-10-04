<template>
  <div class="ss">
    <div v-if="!st" class="muted small"><Icon name="mdiSync" :size="14" class="spin" /> Checking Syncthing…</div>
    <div v-else-if="st.error && !st.me" class="muted small">{{ st.error }}</div>

    <!-- not set up by Cartridge yet -->
    <template v-else-if="!st.role">
      <template v-if="st.blank">
        <p class="muted small ss-note">This Syncthing has no devices or folders yet, so Cartridge can set it up to keep your saves the same on all your devices. Only do this on a Syncthing you haven't set up yourself: an existing setup is never changed.</p>
        <button class="lrow" data-focus :disabled="busy" @click="makeMain">
          <Icon name="mdiServerNetwork" :size="26" />
          <span class="l-mid"><b>Make This Device Your Main Syncthing Device</b><span class="l-sub">Shares your emulators' save folders ({{ roots.map((r) => r.label).join(', ') || 'none found yet' }}), with 30 days of older versions kept</span></span>
        </button>
        <button class="lrow" data-focus :disabled="busy" @click="joining = !joining">
          <Icon name="mdiCellphoneLink" :size="26" />
          <span class="l-mid"><b>Join Your Main Device</b><span class="l-sub">Another device of yours is the main one: its saves come here, to this device's emulators</span></span>
        </button>
        <div v-if="joining" class="ss-join">
          <TextField v-model="mainId" label="The main device's ID" placeholder="On the main device: Settings → Syncthing → This Device" icon="mdiIdentifier" fkey="ss-main" />
          <p class="muted small">Then add this device on the main one with this ID:</p>
          <MyId :id="st.me" />
          <div class="row"><button class="btn primary" data-focus :disabled="busy || !mainId" @click="join"><Icon name="mdiLinkVariant" />Join</button></div>
        </div>
      </template>
      <p v-else class="muted small ss-note">Your Syncthing is already set up with other devices or folders, so Cartridge only reads it and changes nothing. The Games tab shows which saves it keeps in step.</p>
    </template>

    <!-- the main device -->
    <template v-else-if="st.role === 'main'">
      <div class="ss-head"><Icon name="mdiServerNetwork" :size="22" /><b>This Is Your Main Syncthing Device</b></div>
      <MyId :id="st.me" />
      <template v-if="st.pendingDevices?.length">
        <div class="sec-title">Want to Join</div>
        <div v-for="d in st.pendingDevices" :key="d.id" class="lrow">
          <Icon name="mdiCellphoneLink" :size="22" />
          <span class="l-mid"><b>{{ d.name }}</b><span class="l-sub mono">{{ d.id.slice(0, 15) }}…{{ d.address ? ' · ' + d.address : '' }}</span></span>
          <button class="btn small primary" data-focus :disabled="busy" @click="addDevice(d.id, d.name)">Add</button>
        </div>
      </template>
      <div class="sec-title">Your Devices</div>
      <div v-if="!st.devices?.length" class="muted small">No other devices yet. On another device, open Cartridge → Settings → Syncthing → Join Your Main Device, or add its ID here.</div>
      <div v-for="d in st.devices" :key="d.id" class="lrow" data-focus tabindex="0"><Icon name="mdiDevices" :size="22" /><span class="l-mid"><b>{{ d.name }}</b><span class="l-sub mono">{{ d.id.slice(0, 15) }}…</span></span></div>
      <div class="ss-add"><TextField v-model="newId" placeholder="Another device's ID" icon="mdiIdentifier" fkey="ss-add" /><button class="btn" data-focus :disabled="busy || !newId" @click="addDevice(newId)">Add</button></div>
      <Folders :list="st.folders" @two-way="twoWay" />
      <div class="row"><button class="btn" data-focus :disabled="busy" @click="makeMain"><Icon name="mdiRefresh" />Add New Emulators' Saves</button></div>
    </template>

    <!-- a device that joined the main one -->
    <template v-else>
      <div class="ss-head"><Icon name="mdiCellphoneLink" :size="22" /><b>Joined Your Main Device</b></div>
      <p class="muted small ss-note">Main device <span class="mono">{{ st.mainId.slice(0, 15) }}…</span>. Its save folders arrive here at your own emulators' folders. Each starts receive only: this device takes the main device's saves and sends nothing until you choose Make Two-Way.</p>
      <MyId :id="st.me" />
      <div v-if="!st.folders?.length" class="muted small">Waiting for the main device to add this one. On the main device: Settings → Syncthing → This Device · Main Server → Want to Join → Add.</div>
      <Folders :list="st.folders" @two-way="twoWay" />
      <div v-if="missing.length" class="muted small">Not on this device: {{ missing.join(', ') }}. Install those emulators and their saves follow.</div>
    </template>
  </div>
</template>
<script setup>
// The Syncthing Update (0.9.29): this device as the main Syncthing device, or joined to one. Only on a
// Syncthing nobody set up yet (electron/syncthing.js makeMain/addDevice/acceptFolders); an existing setup
// is only read. Used in Settings → Syncthing and in the welcome.
import { ref, computed, onMounted, onBeforeUnmount, h, defineComponent } from 'vue';
import { store, call, toast, confirm } from '../store.js';
import Icon from './Icon.vue';
import TextField from './TextField.vue';
const emit = defineEmits(['changed']);
const st = ref(null), busy = ref(false), joining = ref(false), mainId = ref(''), newId = ref('');
const roots = computed(() => st.value?.roots || []);
const missing = computed(() => (st.value?.pendingFolders || []).map((f) => f.label || f.id));

// this device's ID, to copy or to scan
const MyId = defineComponent({
  props: { id: String },
  setup(p) {
    const svg = ref('');
    import('qrcode').then(({ default: Q }) => Q.toString(p.id || '', { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })).then((s) => (svg.value = s)).catch(() => {});
    const copy = async () => { try { await call('clip:write', { text: p.id }); toast('Device ID copied', 'ok', 2200, 'mdiContentCopy'); } catch (e) { toast(e.message, 'error'); } };
    return () => h('div', { class: 'ss-id' }, [
      h('span', { class: 'ss-qr', innerHTML: svg.value }),
      h('button', { class: 'lrow', 'data-focus': '', onClick: copy }, [h(Icon, { name: 'mdiIdentifier', size: 22 }), h('span', { class: 'l-mid' }, [h('b', 'This Device’s ID'), h('span', { class: 'l-sub mono' }, p.id)])]),
    ]);
  },
});
// Cartridge's save folders with how far along each is
const Folders = defineComponent({
  props: { list: Array }, emits: ['two-way'],
  setup(p, { emit: e }) {
    return () => (p.list || []).length ? h('div', { class: 'ss-folders' }, [h('div', { class: 'sec-title' }, 'Save Folders'), ...p.list.map((f) => h('div', { class: 'lrow', 'data-focus': '', tabindex: 0, key: f.id }, [
      h(Icon, { name: 'mdiContentSaveOutline', size: 22 }),
      h('span', { class: 'l-mid' }, [h('b', f.label), h('span', { class: 'l-sub' }, `${f.devices.length ? 'With ' + f.devices.join(', ') : 'No other device yet'}${f.type === 'receiveonly' ? ' · receive only' : ''} · ${f.path.replace(store.info?.home || '\0', '~')}`)]),
      f.type === 'receiveonly' ? h('button', { class: 'btn small', 'data-focus': '', onClick: () => e('two-way', f) }, 'Make Two-Way') : null,
      h('span', { class: ['status', f.done >= 100 ? 'ok' : 'warn'] }, f.paused ? 'Paused' : f.done == null ? '' : f.done >= 100 ? 'Up to Date' : f.done + '%'),
    ]))]) : null;
  },
});

async function load() { st.value = await call('syncsaves:state').catch((e) => ({ error: e.message })); }
async function run(fn, ok) { busy.value = true; try { await fn(); if (ok) toast(ok, 'ok', 3000, 'mdiCheck'); await load(); emit('changed'); } catch (e) { toast(e.message, 'error', 6000); } busy.value = false; }
async function makeMain() {
  const n = roots.value.length;
  if (st.value.role !== 'main' && !(await confirm('Make this your main Syncthing device?', `Cartridge shares ${n} save ${n === 1 ? 'folder' : 'folders'} in this device's Syncthing, at your emulators' own save folders. Nothing is moved or copied. Syncthing keeps 30 days of older versions, so a replaced save can be restored.`, 'Make It the Main Device'))) return;
  await run(async () => { await call('syncsaves:makeMain'); store.config.syncthing = { ...(store.config.syncthing || {}), role: 'main' }; }, 'This is now your main Syncthing device');
}
const join = () => run(async () => { await call('syncsaves:join', { id: mainId.value }); store.config.syncthing = { ...(store.config.syncthing || {}), role: 'member', mainId: mainId.value.trim().toUpperCase() }; joining.value = false; }, 'Joined. Add this device on the main one to finish.');
const addDevice = (id, name) => run(async () => { await call('syncsaves:addDevice', { id, name }); newId.value = ''; }, 'Added. Its saves follow once it accepts.');
async function twoWay(f) {
  if (!(await confirm('Make it two-way?', `${f.label} on this device will also send its changes to your other devices. Where both changed the same save, Syncthing keeps both copies and older versions stay for 30 days.`, 'Make Two-Way'))) return;
  await run(() => call('syncsaves:twoWay', { id: f.id }), 'Two-way now');
}
let off = null, t = null;
onMounted(() => { load(); off = window.cart.on('syncsaves', load); t = setInterval(load, 20000); });
onBeforeUnmount(() => { off?.(); clearInterval(t); });
</script>
<style scoped>
.ss { display: flex; flex-direction: column; gap: var(--s-3); }
.small { font-size: var(--t-sm); }
.mono { font-family: ui-monospace, monospace; }
.ss-note { margin: 0; line-height: 1.45; max-width: 70ch; }
.ss-head { display: flex; align-items: center; gap: var(--s-2); font-size: var(--t-md); }
.ss-join { display: flex; flex-direction: column; gap: var(--s-2); }
.ss-add { display: flex; gap: var(--s-2); align-items: center; }
.ss-add > :first-child { flex: 1; min-width: 0; }
</style>
<style>
/* MyId and Folders are render functions in this file: scoped styles don't reach them */
.ss-folders { display: flex; flex-direction: column; gap: var(--s-2); }
.ss-id { display: flex; gap: var(--s-3); align-items: center; }
.ss-id .lrow { flex: 1; min-width: 0; }
.ss-id .l-sub { white-space: normal; word-break: break-all; font-family: ui-monospace, monospace; }
.ss-qr { flex: none; width: 92px; height: 92px; border-radius: var(--r-sm); overflow: hidden; background: #fff; }
.ss-qr svg { width: 100%; height: 100%; display: block; }
</style>
