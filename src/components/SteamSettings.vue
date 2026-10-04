<template>
  <div class="ss">
    <div v-if="!ov" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Looking at Steam…</div>
    <template v-else>
      <div v-if="ov.steam.error" class="ss-warn glass"><Icon name="mdiAlertOutline" :size="20" />{{ ov.steam.error }}</div>
      <template v-else>
        <div class="ss-pages"><Btn b="LB" /><div class="seg"><button v-for="pg in PAGES" :key="pg.v" data-focus :data-key="'ssp-' + pg.v" :class="{ on: page === pg.v }" @click="setPage(pg.v)">{{ pg.l }}</button></div><Btn b="RB" /></div>
        <template v-if="page === 'cols'">
          <p class="muted small" style="margin: 0">Cartridge reads the collections you already have in Steam and finds the ones made for a console. Rename them to Cartridge's names, or keep yours: either way new games go into the collection you already have, never a second one.</p>
          <div v-if="!review" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Reading your Steam collections…</div>
          <div v-else-if="review.error" class="ss-warn glass"><Icon name="mdiAlertOutline" :size="20" />{{ review.error }}</div>
          <template v-else>
            <div v-if="!consoleCols.length" class="muted small">None of your Steam collections look like they're for a console in your library.</div>
            <div v-for="c in consoleCols" :key="c.id" class="lrow" :class="{ on: c.pick === 'rename' }" data-focus tabindex="0" @click="flip(c)">
              <span class="l-mid"><b>{{ c.name }}</b><span class="l-sub">{{ subOf(c) }}</span></span>
              <span class="l-end"><span class="status">{{ c.action !== 'rename' ? (c.action === 'ok' ? 'Already Cartridge\'s name' : 'Kept') : c.pick === 'rename' ? 'Rename' : 'Keep mine' }}</span></span>
            </div>
            <div v-if="otherCols.length" class="muted small">Left as they are: {{ otherCols.map((c) => c.name).join(', ') }}.</div>
            <div class="row wrap">
              <button class="btn primary" data-focus :disabled="busyCols" @click="applyCols"><Icon name="mdiCheck" />{{ renameCount ? `Rename ${renameCount} in Steam` : 'Use These Collections' }}</button>
            </div>
            <div class="subh"><Icon name="mdiFolderOutline" :size="20" />New Games</div>
            <Toggle :model-value="!!sc.consoleCollections" :disabled="!colsReady" label="Add downloaded games to their console's collection" :desc="colsReady ? 'Games Cartridge adds also go into the Steam collection for their console, the one you kept or Cartridge\'s name. Your Cartridge collections are never copied into Steam.' : 'Review your collections above first (Use These Collections), so Cartridge puts games into the ones you already have instead of making new ones next to them.'" @update:model-value="setConsoleCols" />
          </template>
        </template>
        <template v-else>
        <div class="card-s glass">
          <div class="kv"><span>Steam account</span><span>{{ ov.steam.account }}<span v-if="ov.steam.accounts.length > 1" class="muted small"> · the one that signed in last ({{ ov.steam.accounts.length }} on this device)</span></span></div>
          <div class="kv"><span>Steam</span><span>{{ ov.steam.running ? 'Running' : 'Closed' }}{{ ov.steam.flatpak ? ' · Flatpak' : '' }}</span></div>
          <div class="kv"><span>Live changes</span><span>{{ liveTxt }}<button v-if="live && !live.flag" class="btn small" data-focus style="margin-left: 12px" @click="enableLive"><Icon name="mdiFlash" :size="16" />Turn on</button></span></div>
          <div class="kv"><span>Your games</span><span>{{ inSteam }} of {{ ov.games.length }} downloaded games are in Steam · {{ ov.ours }} added by Cartridge</span></div>
        </div>

        <div v-if="steam.queue.total" class="ss-queue">
          <Icon name="mdiSteam" :size="22" />
          <div class="ss-q-t"><b>{{ steam.queue.total }} change{{ steam.queue.total === 1 ? '' : 's' }} waiting</b><small>{{ [steam.queue.add && `${steam.queue.add} to add`, steam.queue.remove && `${steam.queue.remove} to remove`].filter(Boolean).join(', ') }}. Steam restarts to take {{ steam.queue.total === 1 ? 'it' : 'them' }}.</small></div>
          <button class="btn primary" data-focus :disabled="steam.busy" @click="apply"><Icon name="mdiCheck" />Apply</button>
          <button class="btn" data-focus @click="clearQueue"><Icon name="mdiClose" />Clear</button>
        </div>

        <div class="row wrap">
          <button class="btn primary" data-focus :disabled="!notIn" @click="go('steam-missing')"><Icon name="mdiFormatListChecks" />{{ notIn ? `${notIn} missing from Steam` : 'Every game is in Steam' }}</button>
          <button class="btn" data-focus :disabled="steam.busy || !ov.ours" @click="refreshArt"><Icon name="mdiImageRefreshOutline" />Refresh artwork</button>
          <button class="btn" data-focus @click="restartSteam"><Icon name="mdiRestart" />Restart Steam</button>
        </div>
        <!-- Emulator setup and Shortcut health live in Settings → Emulators (0.9.3) -->
        <div class="subh"><Icon name="mdiGamepadVariantOutline" :size="20" />Emulators</div>
        <p class="muted small" style="margin-top: -8px">Pick a console to see its games in Steam and how they start. Each console uses one emulator found on this device: EmuDeck's first, then RetroDECK (when there is no EmuDeck), then AppImages, Flatpaks and installed programs. The way your own Steam shortcuts start games is offered as another choice for each console.</p>
        <div class="ss-emus">
          <button v-for="c in ov.consoles" :key="c.key" class="ss-emu" data-focus :data-key="'emu-' + c.key" @click="go('steam-console', { ckey: c.key })">
            <div class="ss-e-logo"><PIcon :p="platOf(c)" :size="44" /></div>
            <div class="ss-e-mid">
              <b>{{ c.platform }}</b>
              <span class="muted small">{{ c.games }} game{{ c.games === 1 ? '' : 's' }} · {{ c.inSteam }} in Steam</span>
              <div class="row" style="gap: 6px; margin-top: 2px">
                <span class="chip" :class="c.template ? 'how-' + c.template.how : 'none'">{{ c.template ? HOW[c.template.how] : 'Not set' }}</span>
                <span v-if="c.mode === 'script'" class="chip">Script</span>
              </div>
            </div>
            <Icon name="mdiChevronRight" :size="22" class="muted" />
          </button>
        </div>

        <div class="subh"><Icon name="mdiAnimationPlay" :size="20" />Frame Generation</div>
        <div class="ss-emus">
          <button class="ss-emu" data-focus data-key="framegen" @click="go('frame-gen')">
            <div class="ss-e-logo"><Icon name="mdiAnimationPlay" :size="36" /></div>
            <div class="ss-e-mid"><b>Frame Generation</b><span class="muted small">lsfg-vk or MAKO, for all games, a console or one game</span></div>
            <Icon name="mdiChevronRight" :size="22" class="muted" />
          </button>
        </div>

        <div class="subh"><Icon name="mdiTuneVariant" :size="20" />Options</div>
        <Toggle :model-value="sc.preview !== false" label="Show what changes first" desc="See every Target, Start in and Launch options before Steam is touched" @update:model-value="(v) => setC({ preview: v })" />
        <Toggle :model-value="!!sc.autoAdd" label="Add games after they download" desc="Queues each finished download for Steam, using that console's last collections" @update:model-value="(v) => setC({ autoAdd: v })" />
        <Toggle :model-value="!!sc.autoRemove" label="Remove games from Steam when you delete them" desc="Only shortcuts Cartridge added" @update:model-value="(v) => setC({ autoRemove: v })" />
        <div class="row"><span class="lbl">Console in names</span><div class="seg"><button v-for="m in nameOpts" :key="m.v" data-focus :class="{ on: (sc.consoleInName || 'clash') === m.v }" @click="setC({ consoleInName: m.v })">{{ m.l }}</button></div></div>
        <p class="muted small" style="margin-top: -6px">"Only on clashes" adds the console, like "God of War (PS2)", when two games share a name.</p>

        <div class="subh"><Icon name="mdiHistory" :size="20" />Undo &amp; Clean Up</div>
        <div class="row wrap">
          <button class="btn" data-focus :disabled="!ov.backups" @click="undo"><Icon name="mdiUndo" />Undo last change</button>
          <button class="btn" data-focus :disabled="!ov.ours" @click="removeAll"><Icon name="mdiDeleteSweepOutline" />Remove everything Cartridge added</button>
          <button v-if="missingCols.length" class="btn" data-focus @click="fixCols"><Icon name="mdiFolderSyncOutline" />Put {{ missingCols.length }} back in collections</button>
        </div>
        <p class="muted small">Steam's shortcuts file is backed up before every change ({{ ov.backups }} kept). Undo puts the one from before the last change back.</p>
        <p v-if="ov.last?.state === 'error'" class="muted small ss-err">Last change failed: {{ ov.last.error }}</p>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { store, call, confirm, toast, go, romById, choose } from '../store.js';
import { steam, applyChanges, restartSteam } from '../steam.js';
import Icon from './Icon.vue';
import Toggle from './Toggle.vue';
import PIcon from './PIcon.vue';
import Btn from './Btn.vue';

const ov = ref(null);
// Pages (0.9.24, owner: a Collections tab in the Steam section); LB/RB through Settings' step()
const PAGES = [{ v: 'games', l: 'Games' }, { v: 'cols', l: 'Collections' }];
const page = ref('games');
function setPage(v) { page.value = v; if (v === 'cols') loadReview(); }
function step(d) { const i = PAGES.findIndex((p) => p.v === page.value); setPage(PAGES[(i + d + PAGES.length) % PAGES.length].v); }
defineExpose({ step });
// Collections review: each of the user's collections matched to a console (steamCollections.js)
const review = ref(null), busyCols = ref(false);
const consoleCols = computed(() => (review.value?.list || []).filter((c) => c.action !== 'other'));
const otherCols = computed(() => (review.value?.list || []).filter((c) => c.action === 'other'));
const renameCount = computed(() => consoleCols.value.filter((c) => c.pick === 'rename').length);
const colsReady = computed(() => !!review.value?.integrated || !!sc.value.consoleCollections);
async function loadReview() {
  try { const r = await call('steam:colReview'); r.list.forEach((c) => { c.pick = c.action === 'rename' ? 'rename' : 'keep'; }); review.value = r; } catch (e) { review.value = { error: e.message }; }
}
const subOf = (c) => [`${c.count} game${c.count === 1 ? '' : 's'}`, c.action === 'rename' ? `${c.pick === 'rename' ? 'Becomes' : 'Cartridge would call it'} ${c.want}` : c.action === 'taken' ? `${c.want} is already a collection, so this one stays` : c.action === 'shared' ? `Another collection is also for ${c.want}` : 'For ' + c.want].join(' · ');
function flip(c) { if (c.action === 'rename') c.pick = c.pick === 'rename' ? 'keep' : 'rename'; }
async function applyCols() {
  const list = consoleCols.value;
  const renames = list.filter((c) => c.pick === 'rename').map((c) => ({ id: c.id, from: c.name, to: c.want, key: c.key }));
  // a kept collection is the one new games go into (the bigger one when two are for one console)
  const keep = list.filter((c) => c.pick !== 'rename' && c.action !== 'ok' && !list.some((o) => o.key === c.key && (o.pick === 'rename' || o.action === 'ok'))).sort((a, b) => b.count - a.count)
    .filter((c, i, a) => a.findIndex((o) => o.key === c.key) === i).map((c) => ({ key: c.key, name: c.name }));
  busyCols.value = true;
  try {
    const r = await call('steam:colApply', { renames, keep });
    toast(!r.count ? 'Cartridge will use these collections' : r.live ? `${r.count} collection${r.count === 1 ? '' : 's'} renamed in Steam` : `${r.count} collection${r.count === 1 ? '' : 's'} will be renamed when Steam restarts`, 'ok', 4000, 'mdiSteam');
  } catch (e) { toast(e.message, 'error'); }
  busyCols.value = false;
  store.config.steam = { ...sc.value, collectionsIntegrated: true };
  loadReview();
}
const missingCols = ref([]);
const sc = computed(() => store.config.steam || {});
const HOW = { learned: 'From your shortcuts', yours: 'Set by you', emudeck: 'EmuDeck', appimage: 'AppImage', flatpak: 'Flatpak', native: 'Installed program', retrodeck: 'RetroDECK', windows: 'Windows build (Proton)' };
const nameOpts = [{ v: 'clash', l: 'Only on clashes' }, { v: 'always', l: 'Always' }];
const inSteam = computed(() => ov.value?.games.filter((g) => g.inSteam).length || 0);
const notIn = computed(() => (ov.value?.games.length || 0) - inSteam.value);
async function load() {
  try { ov.value = await call('steam:overview'); steam.queue = ov.value.queue; } catch (e) { ov.value = { steam: { error: e.message }, games: [], consoles: [] }; }
  call('steam:verify').then((m) => (missingCols.value = m || [])).catch(() => {});
}
watch(() => steam.queue.total, () => { if (ov.value && !steam.busy) load(); });
watch(() => steam.busy, (b) => { if (!b && ov.value) load(); });
// Live changes: Steam's own interface is reachable (Decky Loader turns this on), so games are added
// while Steam runs. Without it Steam has to close, which Game Mode makes unreliable.
const live = ref(null);
const liveTxt = computed(() => !live.value ? '…' : live.value.on ? 'On. Games go straight into Steam, no restart.' : live.value.flag ? 'Turned on. Restart Steam once to use it.' : 'Off. Steam restarts for every change.');
async function loadLive() { live.value = await call('steam:liveInfo').catch(() => ({ on: false, flag: false })); }
async function enableLive() {
  if (!(await confirm('Turn on live Steam changes?', "Cartridge adds a small file to Steam's folder that opens Steam's interface to apps on this device only, the same thing Decky Loader does. Steam then takes new games without closing. Restart Steam once afterwards (Steam menu → Power → Restart Steam).", 'Turn on'))) return;
  try { await call('steam:liveEnable'); toast('Live changes turned on. Restart Steam once to use them.', 'ok', 5000, 'mdiSteam'); } catch (e) { toast(e.message, 'error'); }
  loadLive();
}
// New artwork for every game Cartridge put in Steam, in the style you pick
async function refreshArt() {
  const v = await choose({ title: 'Refresh artwork', message: `For the ${ov.value.ours} game${ov.value.ours === 1 ? '' : 's'} Cartridge added to Steam`, options: [
    { label: 'Your Cartridge artwork', sub: 'Covers and backgrounds you picked, else RomM\'s', value: 'mine', icon: 'mdiImageOutline' },
    { label: 'SteamGridDB · most popular', sub: 'The top rated art for each game', value: 'top', icon: 'mdiStarOutline' },
    { label: 'SteamGridDB · clean', sub: 'Covers without logos', value: 'no_logo', icon: 'mdiImageFilterCenterFocus' },
    { label: 'SteamGridDB · alternate', sub: 'Fan-made takes on the box art', value: 'alternate', icon: 'mdiPaletteOutline' },
    { label: 'SteamGridDB · blurred', sub: 'Soft, blurred art', value: 'blurred', icon: 'mdiBlur' },
    { label: 'SteamGridDB · material', sub: 'Flat, minimal art', value: 'material', icon: 'mdiShapeOutline' },
  ] });
  if (!v) return;
  steam.busy = true;
  try {
    const r = await call('steam:refreshArt', { style: v === 'mine' ? undefined : v });
    if (!r.count) toast('No games from Cartridge in Steam yet', 'info', 3000);
    else if (r.live) toast(`New artwork for ${r.count} game${r.count === 1 ? '' : 's'} is in Steam`, 'ok', 3500, 'mdiImageRefreshOutline');
    else if (await confirm('Artwork ready', `New artwork for ${r.count} game${r.count === 1 ? '' : 's'} is saved. Steam shows it after a restart.`, 'Restart Steam')) restartSteam();
  } catch (e) { toast(e.message, 'error', 6000); }
  steam.busy = false; steam.progress = null;
}
async function setC(patch) { store.config.steam = await call('steam:setConfig', patch); }
// turning console collections on: offer to sort the games already in Steam too
async function setConsoleCols(v) {
  await setC({ consoleCollections: v });
  if (!v || !ov.value?.ours) return;
  if (!(await confirm('Sort the games already in Steam?', `Puts the ${ov.value.ours} game${ov.value.ours === 1 ? '' : 's'} Cartridge added into their console's collection now.`, 'Sort them'))) return;
  try {
    const r = await call('steam:consoleCollections');
    toast(r.count ? (r.live ? `${r.count} games sorted into console collections` : `${r.count} games will be sorted when Steam restarts`) : 'They were already in their console collections', 'ok', 4000, 'mdiSteam');
  } catch (e) { toast(e.message, 'error'); }
}
async function apply() { if (await applyChanges()) load(); }
async function clearQueue() { steam.queue = await call('steam:queueClear'); load(); }
// console logo: RomM's icon for the platform of any of its games
const platOf = (c) => { const r = (ov.value?.games || []).filter((g) => g.console === c.key).map((g) => romById(g.romId)).find(Boolean); return r ? { slug: r.platform_slug, fs_slug: r.platform_fs_slug } : { slug: c.key }; };
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
onMounted(() => { load(); loadLive(); });
</script>
<style scoped>
.ss { display: flex; flex-direction: column; gap: 16px; }
.ss-pages { display: flex; align-items: center; gap: var(--s-2); }
.ss-pages > * { flex: none; }
.ss-warn { display: flex; align-items: center; gap: 12px; padding: 16px 18px; color: #ffd978; }
.ss-queue { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: var(--r-md); background: rgba(var(--primary-rgb), 0.2); border: 1px solid rgba(var(--primary-l-rgb), 0.5); }
.ss-q-t { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.ss-q-t small { color: var(--muted); font-size: var(--t-xs); }
.ss-emus { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; padding: 4px; margin: -4px; }
.ss-emu { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--r-md); background: var(--s2); text-align: left; min-width: 0; }
.ss-emu:focus { background: var(--focus); color: var(--on-focus); box-shadow: none; border-color: transparent; }
.ss-emu:focus .muted { color: var(--on-focus-dim); }
.ss-e-logo { width: 60px; height: 60px; border-radius: var(--r-md); display: grid; place-items: center; background: rgba(255, 255, 255, 0.06); flex: none; }
.ss-e-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.ss-e-mid b { font-size: var(--t-md); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chip.how-learned { background: rgba(80, 200, 120, 0.18); color: #9be8b4; }
.chip.how-yours { background: rgba(var(--primary-rgb), 0.25); }
.chip.none { background: rgba(245, 197, 66, 0.18); color: #ffd978; }
.ss-err { color: #ffaaaa; }
.card-s { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
.kv { display: flex; gap: 16px; font-size: var(--t-sm); min-width: 0; }
.kv > span:first-child { width: 130px; color: var(--muted); flex: none; }
.subh { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-size: var(--t-lg); font-weight: 700; margin-top: 4px; }
.lbl { width: 130px; color: var(--muted); font-size: var(--t-sm); flex: none; }
.small { font-size: var(--t-xs); }
.wrap { flex-wrap: wrap; }
</style>
