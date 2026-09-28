<template>
  <div class="ss">
    <div v-if="!ov" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Looking at Steam…</div>
    <template v-else>
      <div v-if="ov.steam.error" class="ss-warn glass"><Icon name="mdiAlertOutline" :size="20" />{{ ov.steam.error }}</div>
      <template v-else>
        <div class="card-s glass">
          <div class="kv"><span>Steam account</span><span>{{ ov.steam.account }}<span v-if="ov.steam.accounts.length > 1" class="muted small"> · the one that signed in last ({{ ov.steam.accounts.length }} on this device)</span></span></div>
          <div class="kv"><span>Steam</span><span>{{ ov.steam.running ? 'Running' : 'Closed' }}{{ ov.steam.flatpak ? ' · Flatpak' : '' }}</span></div>
          <div class="kv"><span>Your games</span><span>{{ inSteam }} of {{ ov.games.length }} downloaded games are in Steam · {{ ov.ours }} added by Cartridge</span></div>
        </div>

        <div v-if="steam.queue.total" class="ss-queue">
          <Icon name="mdiSteam" :size="22" />
          <div class="ss-q-t"><b>{{ steam.queue.total }} change{{ steam.queue.total === 1 ? '' : 's' }} waiting</b><small>{{ [steam.queue.add && `${steam.queue.add} to add`, steam.queue.remove && `${steam.queue.remove} to remove`].filter(Boolean).join(', ') }}. Steam restarts to take {{ steam.queue.total === 1 ? 'it' : 'them' }}.</small></div>
          <button class="btn primary" data-focus :disabled="steam.busy" @click="apply"><Icon name="mdiCheck" />Apply</button>
          <button class="btn" data-focus @click="clearQueue"><Icon name="mdiClose" />Clear</button>
        </div>

        <div class="row wrap">
          <button class="btn primary" data-focus :disabled="!missing.length" @click="addMissing"><Icon name="mdiPlaylistPlus" />{{ missing.length ? `Add ${missing.length} missing game${missing.length === 1 ? '' : 's'}` : 'Every game is in Steam' }}</button>
          <button class="btn" data-focus @click="restartSteam"><Icon name="mdiRestart" />Restart Steam</button>
        </div>

        <div class="subh"><Icon name="mdiGamepadVariantOutline" :size="20" />Emulators</div>
        <p class="muted small" style="margin-top: -8px">Cartridge copies Target, Start in and Launch options from shortcuts you already have (Steam ROM Manager, EmuDeck or your own), minus frame generation wrappers. Consoles with no shortcut yet use the emulator it finds: EmuDeck, then AppImages, then Flatpaks.</p>
        <div class="ss-emus">
          <button v-for="c in ov.consoles" :key="c.key" class="ss-emu" data-focus :data-key="'emu-' + c.key" @click="emuMenu(c)">
            <div class="ss-e-top">
              <b>{{ c.label }}</b>
              <span class="muted small">{{ c.games }} game{{ c.games === 1 ? '' : 's' }} · {{ c.inSteam }} in Steam</span>
              <div class="spacer" />
              <span v-if="c.mode === 'script'" class="chip">Script</span>
              <span class="chip" :class="c.template ? 'how-' + c.template.how : 'none'">{{ c.template ? HOW[c.template.how] : 'Not set' }}</span>
            </div>
            <div v-if="c.template" class="ss-e-p mono">{{ c.template.exe }}</div>
            <div v-if="c.template" class="ss-e-p mono dim">{{ c.template.lo }}</div>
            <div v-else class="ss-e-p muted small">No emulator found. Press to set one.</div>
          </button>
        </div>

        <div class="subh"><Icon name="mdiTuneVariant" :size="20" />Options</div>
        <Toggle :model-value="sc.preview !== false" label="Show what changes first" desc="See every Target, Start in and Launch options before Steam is touched" @update:model-value="(v) => setC({ preview: v })" />
        <Toggle :model-value="!!sc.autoAdd" label="Add games after they download" desc="Queues each finished download for Steam, using that console's last collections" @update:model-value="(v) => setC({ autoAdd: v })" />
        <Toggle :model-value="!!sc.autoRemove" label="Remove games from Steam when you delete them" desc="Only shortcuts Cartridge added" @update:model-value="(v) => setC({ autoRemove: v })" />
        <div class="row"><span class="lbl">Console in names</span><div class="seg"><button v-for="m in nameOpts" :key="m.v" data-focus :class="{ on: (sc.consoleInName || 'clash') === m.v }" @click="setC({ consoleInName: m.v })">{{ m.l }}</button></div></div>
        <p class="muted small" style="margin-top: -6px">"Only on clashes" adds the console, like "God of War (PS2)", when two games share a name.</p>

        <div class="subh"><Icon name="mdiHistory" :size="20" />Undo &amp; clean up</div>
        <div class="row wrap">
          <button class="btn" data-focus :disabled="!ov.backups" @click="undo"><Icon name="mdiUndo" />Undo last change</button>
          <button class="btn" data-focus :disabled="!ov.ours" @click="removeAll"><Icon name="mdiDeleteSweepOutline" />Remove everything Cartridge added</button>
          <button v-if="missingCols.length" class="btn" data-focus @click="fixCols"><Icon name="mdiFolderSyncOutline" />Put {{ missingCols.length }} back in collections</button>
        </div>
        <p class="muted small">Steam's shortcuts file is backed up before every change ({{ ov.backups }} kept). Undo puts the one from before the last change back.</p>
        <p v-if="ov.last?.state === 'error'" class="muted small ss-err">Last change failed: {{ ov.last.error }}</p>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { store, call, choose, confirm, toast, openModal } from '../store.js';
import { steam, applyChanges, restartSteam, pickCollections } from '../steam.js';
import Icon from './Icon.vue';
import Toggle from './Toggle.vue';

const ov = ref(null);
const missingCols = ref([]);
const sc = computed(() => store.config.steam || {});
const HOW = { learned: 'From your shortcuts', yours: 'Set by you', emudeck: 'EmuDeck', appimage: 'AppImage', flatpak: 'Flatpak' };
const nameOpts = [{ v: 'clash', l: 'Only on clashes' }, { v: 'always', l: 'Always' }];
const inSteam = computed(() => ov.value?.games.filter((g) => g.inSteam).length || 0);
// only games Cartridge knows how to start (consoles without an emulator are shown below)
const missing = computed(() => (ov.value?.games || []).filter((g) => !g.inSteam && g.queued !== 'add' && ov.value.consoles.find((c) => c.key === g.console)?.template));
async function load() {
  try { ov.value = await call('steam:overview'); steam.queue = ov.value.queue; } catch (e) { ov.value = { steam: { error: e.message }, games: [], consoles: [] }; }
  call('steam:verify').then((m) => (missingCols.value = m || [])).catch(() => {});
}
watch(() => steam.queue.total, () => { if (ov.value && !steam.busy) load(); });
watch(() => steam.busy, (b) => { if (!b && ov.value) load(); });
async function setC(patch) { store.config.steam = await call('steam:setConfig', patch); }
async function apply() { if (await applyChanges()) load(); }
async function clearQueue() { steam.queue = await call('steam:queueClear'); load(); }
async function addMissing() {
  const list = missing.value;
  const keys = [...new Set(list.map((g) => g.console))];
  const cols = await pickCollections(keys.length === 1 ? keys[0] : null, keys.length === 1 ? null : [], keys.length > 1);
  if (cols == null) return;
  steam.queue = await call('steam:queueAdd', list.map((g) => ({ romId: g.romId, collections: cols })));
  await apply();
}
async function emuMenu(c) {
  const v = await choose({
    title: c.label, message: c.template ? `${HOW[c.template.how]}${c.template.from ? ' · ' + c.template.from : ''}` : 'No emulator set',
    options: [
      { label: 'Edit Target, Start in and Launch options', value: 'edit', icon: 'mdiPencil' },
      { label: 'Test', sub: 'Checks the Target exists and can run', value: 'test', icon: 'mdiPlayCircleOutline' },
      { label: 'Start games directly', sub: 'Steam runs the emulator itself (recommended)', value: 'direct', icon: 'mdiRocketLaunchOutline', selected: c.mode !== 'script' },
      { label: 'Start games through Cartridge', sub: 'A small script: if the game is gone, Cartridge opens on it', value: 'script', icon: 'mdiScriptTextOutline', selected: c.mode === 'script' },
    ],
  });
  if (v === 'test') { const r = await call('steam:test', { key: c.key }); toast(r.ok ? r.note : r.error, r.ok ? 'ok' : 'error', 4500); return; }
  if (v === 'direct' || v === 'script') { await call('steam:setMode', { key: c.key, mode: v }); toast(v === 'script' ? 'New shortcuts start through Cartridge' : 'New shortcuts start the emulator directly', 'ok', 3000); load(); return; }
  if (v !== 'edit') return;
  const t = c.template || { exe: '', start: '', lo: '%command% "{ROM}"' };
  const r = await openModal('steam-emu', { ckey: c.key, label: c.label, how: t.how, exe: t.exe, start: t.start, lo: t.lo });
  if (r === 'reset') { await call('steam:setTemplate', { key: c.key, template: null }); toast(`${c.label} back to automatic`, 'ok', 2500); }
  else if (r) { await call('steam:setTemplate', { key: c.key, template: r }); toast(`${c.label} saved`, 'ok', 2500); }
  load();
}
async function undo() {
  if (!(await confirm('Undo the last Steam change?', 'Steam closes for a moment and its shortcuts go back to how they were before the last change.', 'Undo'))) return;
  try { await call('steam:undo'); toast('Steam is closing to undo the change.', 'info', 5000, 'mdiSteam'); } catch (e) { toast(e.message, 'error'); }
}
async function removeAll() {
  if (!(await confirm(`Remove ${ov.value.ours} games from Steam?`, 'Only shortcuts Cartridge added. Your other shortcuts and your game files stay as they are.', 'Remove', true))) return;
  steam.queue = await call('steam:removeAll');
  await apply();
}
async function fixCols() {
  try { await call('steam:fixCollections'); toast('Steam is closing to fix the collections.', 'info', 5000, 'mdiSteam'); } catch (e) { toast(e.message, 'error'); }
}
onMounted(load);
</script>
<style scoped>
.ss { display: flex; flex-direction: column; gap: 16px; }
.ss-warn { display: flex; align-items: center; gap: 12px; padding: 16px 18px; color: #ffd978; }
.ss-queue { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 12px; background: rgba(var(--primary-rgb), 0.2); border: 1px solid rgba(var(--primary-l-rgb), 0.5); }
.ss-q-t { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.ss-q-t small { color: var(--muted); font-size: 12.5px; }
.ss-emus { display: flex; flex-direction: column; gap: 6px; }
.ss-emu { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-radius: 10px; background: rgba(255, 255, 255, 0.045); border: 1px solid var(--line); text-align: left; min-width: 0; }
.ss-emu:focus { border-color: var(--primary-l); box-shadow: var(--ring); }
.ss-e-top { display: flex; align-items: center; gap: 10px; }
.ss-e-top b { font-size: 15px; }
.ss-e-p { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.ss-e-p.dim { color: var(--muted); }
.chip.how-learned { background: rgba(80, 200, 120, 0.18); color: #9be8b4; }
.chip.how-yours { background: rgba(var(--primary-rgb), 0.25); }
.chip.none { background: rgba(245, 197, 66, 0.18); color: #ffd978; }
.ss-err { color: #ffaaaa; }
.card-s { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
.kv { display: flex; gap: 16px; font-size: 14px; min-width: 0; }
.kv > span:first-child { width: 130px; color: var(--muted); flex: none; }
.subh { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-size: 19px; font-weight: 700; margin-top: 4px; }
.lbl { width: 130px; color: var(--muted); font-size: 13.5px; flex: none; }
.small { font-size: 12.5px; }
.wrap { flex-wrap: wrap; }
</style>
