<template>
  <!-- Cartridge Save Sync (0.9.51): this device's saves kept on your RomM and brought to your other devices -->
  <div class="ssc">
    <div class="ssc-head glass">
      <div class="ssc-mark" :class="{ on: st?.on }"><Icon :name="st?.on ? 'mdiCloudCheckOutline' : 'mdiCloudOffOutline'" :size="30" /></div>
      <div class="ssc-mid">
        <b>{{ st?.on ? 'Cartridge Save Sync is on' : st?.syncthing ? 'This device syncs saves with Syncthing' : 'Cartridge Save Sync is off' }}</b>
        <span class="muted small">{{ sub }}</span>
      </div>
      <button v-if="st?.on" class="btn" data-focus :disabled="busy" @click="run"><Icon name="mdiSync" :class="{ spin: busy }" />{{ busy ? (prog.of ? `Syncing ${prog.done} of ${prog.of}` : 'Syncing…') : 'Sync Now' }}</button>
      <button v-else-if="!st?.syncthing" class="btn primary" data-focus @click="turnOn"><Icon name="mdiCloudSyncOutline" />Turn On</button>
      <button v-else class="btn" data-focus @click="emit('advanced')"><Icon name="mdiTune" />Advanced</button>
    </div>

    <!-- 0.9.52: away from the server, saves stay here and go up the moment RomM answers again -->
    <template v-if="st?.on && st?.held">
      <div class="subh">Waiting for Your Server</div>
      <p class="muted small">RomM couldn’t be reached {{ ago(st.held.since) }}. Keep playing: your saves stay on this device{{ st.held.games?.length ? `, and ${st.held.games.length === 1 ? st.held.games[0] : st.held.games.length + ' games'} go up` : ' and go up' }} as soon as Cartridge can reach RomM again. If another device played the same game meanwhile, you choose which save to keep.</p>
    </template>

    <template v-if="st?.on && conflicts.length">
      <div class="subh">Choose Which Save to Keep</div>
      <p class="muted small">These changed on this device and on another one since they last synced. The one you don't pick stays in RomM as an older version.</p>
      <div class="stack">
        <button v-for="c in conflicts" :key="c.key" class="lrow" data-focus @click="resolve(c)">
          <Icon name="mdiCallSplit" :size="24" />
          <div class="l-mid"><b>{{ c.label || c.key }}</b><span class="l-sub">{{ c.emuName }}</span></div>
          <span class="status warn">Choose</span>
        </button>
      </div>
    </template>

    <template v-if="st?.on && st?.last">
      <div class="subh">Last Sync</div>
      <div class="ssc-counts">
        <div v-for="k in SHOWN" :key="k.v" class="ssc-count" :class="{ dim: !st.last.counts?.[k.v] }"><b>{{ st.last.counts?.[k.v] || 0 }}</b><span>{{ k.l }}</span></div>
      </div>
      <p class="muted small">{{ ago(st.last.at) }}</p>
    </template>

    <div class="subh">How It Works</div>
    <div class="ssc-how">
      <div><Icon name="mdiPlayCircleOutline" :size="22" /><span><b>Before a game starts</b> Cartridge checks its saves with RomM and brings the newest here, like Steam Cloud. Games started from Steam sync when you come back to Cartridge.</span></div>
      <div><Icon name="mdiCloudUploadOutline" :size="22" /><span><b>After you play</b> your saves go to RomM, and every 30 minutes anything that changed.</span></div>
      <div><Icon name="mdiShieldCheckOutline" :size="22" /><span><b>Safe</b> Cartridge never changes a save while its emulator is open, never guesses when two devices changed the same save, and keeps 10 older versions on this device and 10 in RomM.</span></div>
      <div><Icon name="mdiGamepadVariantOutline" :size="22" /><span><b>Emulators</b> Eden, RPCS3, shadPS4, PCSX2 (whole memory cards), DuckStation, PPSSPP, Vita3K, Dolphin, Cemu, Azahar, Xenia, and RetroArch saves and save states.</span></div>
    </div>
    <p v-if="st?.backups" class="muted small">Older versions on this device: <span class="mono">{{ short(st.backups) }}</span></p>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { store, call, toast, choose, ago } from '../store.js';
import Icon from './Icon.vue';

const emit = defineEmits(['advanced']);
const st = ref(null), busy = ref(false), prog = ref({});
const SHOWN = [{ v: 'up', l: 'Sent to RomM' }, { v: 'down', l: 'Brought Here' }, { v: 'same', l: 'Up to Date' }, { v: 'unmatched', l: 'Not Matched' }];
const conflicts = computed(() => st.value?.last?.conflicts || []);
const short = (p) => String(p || '').replace(store.info?.home || '\0', '~');
const sub = computed(() => {
  const s = st.value; if (!s) return '';
  if (s.on && s.held) return 'Away from your server · saves are kept here until it can be reached';
  if (s.on) return s.last ? `Last synced ${ago(s.last.at)} · ${s.saved} saves kept in step` : 'The first sync starts in a moment';
  if (s.syncthing) return 'A device uses Cartridge Save Sync or Syncthing for saves, never both. Change it in Advanced.';
  return 'Keep your saves on your own RomM server and bring them to every device you play on.';
});
async function load() { st.value = await call('savesync:status').catch(() => null); }
async function turnOn() {
  try { st.value = await call('savesync:set', { on: true }); store.config = await call('config:get'); toast('Cartridge Save Sync is on', 'ok', 2500, 'mdiCloudCheckOutline'); } catch (e) { toast(e.message, 'error', 6000); }
}
async function run() {
  busy.value = true;
  try {
    const r = await call('savesync:run', {});
    if (r?.offline) toast('RomM couldn’t be reached. Try again when you’re online.', 'error', 5000);
    else if (r?.results?.some((x) => x.result === 'auth')) toast(r.results.find((x) => x.result === 'auth').error, 'error', 8000);
  } catch (e) { toast(e.message, 'error', 6000); }
  busy.value = false; await load();
}
async function resolve(c) {
  const v = await choose({ title: 'Which Save?', message: `${c.label || 'This save'} (${c.emuName}) changed on this device and on another one.`, options: [{ label: 'Use the One From RomM', sub: 'The save from your other device', value: 'theirs', icon: 'mdiCloudDownloadOutline' }, { label: 'Keep This Device’s', sub: 'It goes to RomM as the newest', value: 'mine', icon: 'mdiCellphoneArrowDown' }] });
  if (!v) return;
  try {
    const r = await call('savesync:resolve', { key: c.key, choice: v, romId: c.romId });
    const res = r?.results?.[0]?.result;
    if (res === 'busy') toast(`Close ${c.emuName} first: saves never change while it's open.`, 'error', 5000);
    else toast(v === 'mine' ? 'This device’s save is the newest in RomM' : 'The save from RomM is here', 'ok', 3000, 'mdiCheck');
    // the conflict is settled: take it off the list
    if (st.value?.last) st.value.last.conflicts = conflicts.value.filter((x) => x.key !== c.key);
  } catch (e) { toast(e.message, 'error', 6000); }
}
let off = null;
onMounted(() => { load(); off = window.cart.on('savesync', (p) => { if (p.state === 'run') { busy.value = true; prog.value = p; } else { busy.value = false; prog.value = {}; load(); } }); });
onBeforeUnmount(() => off?.());
defineExpose({ load });

</script>
<style scoped>
.ssc { display: flex; flex-direction: column; gap: var(--s-3); }
.ssc-head { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-4); border-radius: var(--r-lg); flex-wrap: wrap; }
.ssc-mark { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--muted); flex: none; }
.ssc-mark.on { color: var(--green-l, #7ee787); background: rgba(126, 231, 135, 0.12); }
.ssc-mid { flex: 1; min-width: 12em; display: flex; flex-direction: column; gap: 3px; }
.ssc-mid b { font-size: var(--t-md); }
.small { font-size: var(--t-sm); margin: 0; line-height: 1.45; }
.stack { display: flex; flex-direction: column; gap: var(--s-2); }
.ssc-counts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s-2); }
.ssc-count { display: flex; flex-direction: column; gap: 2px; padding: var(--s-3); border-radius: var(--r-md); background: var(--s1); }
.ssc-count b { font-family: var(--display); font-size: var(--t-xl); font-variant-numeric: tabular-nums; }
.ssc-count span { font-size: var(--t-xs); color: var(--muted); }
.ssc-count.dim b { color: var(--muted); }
.ssc-how { display: flex; flex-direction: column; gap: var(--s-2); }
.ssc-how > div { display: flex; gap: var(--s-3); align-items: flex-start; font-size: var(--t-sm); line-height: 1.45; color: var(--muted); }
.ssc-how b { color: var(--text); margin-right: 4px; }
.ssc-how .icon { flex: none; margin-top: 1px; color: var(--text); }
.mono { font-family: ui-monospace, monospace; overflow-wrap: anywhere; }
@media (max-width: 900px) { .ssc-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
