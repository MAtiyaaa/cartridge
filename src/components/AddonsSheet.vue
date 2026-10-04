<template>
  <div :class="embedded ? 'ad-host' : 'scrim'" ref="el" @click.self="!embedded && closeModal(null)">
    <div class="ad" :class="{ dialog: !embedded }">
      <div>
        <template v-if="!embedded">
          <div class="eyebrow">Add-ons{{ emu ? ' · ' + emu.name + (emu.flatpak ? ' (Flatpak)' : '') : '' }}</div>
          <h2>{{ name }}</h2>
        </template>
        <div v-if="emus.length > 1" class="seg" style="margin: 4px 0 8px"><button v-for="e in emus" :key="e.emuRoot" data-focus :class="{ on: emu?.emuRoot === e.emuRoot }" @click="pickEmu(e)">{{ e.name }}{{ e.flatpak ? ' (Flatpak)' : '' }}</button></div>
        <div v-if="emu" class="muted small mono">{{ emu.folder ? short(emu.folder) : `${short(emu.root)} (this game’s ID couldn’t be read)` }}</div>
        <div v-if="here && wants(here.mods ? 'mods' : 'tex')" class="ad-here"><Icon name="mdiCheckCircle" :size="18" /><span>{{ here.mods ? 'Mods are' : 'A texture pack is' }} in place for this game ({{ here.files.toLocaleString() }} files), {{ here.by === 'cartridge' ? 'installed by Cartridge' : here.by === 'both' ? 'partly installed by Cartridge' : 'added outside Cartridge' }}.</span></div>
        <div v-if="emu && !emu.mods && wants('tex')" class="muted small">{{ emu.on ? 'Custom textures are on.' : 'Custom textures are off. Cartridge turns them on when it installs a pack.' }}</div>
        <div v-if="d?.version && wants('mods')" class="ad-ver"><Icon name="mdiTagOutline" :size="16" /><span>Your copy: <b>{{ d.version.display ? 'version ' + d.version.display : d.version.update ? 'update ' + d.version.update : 'the base game' }}</b><template v-if="d.version.number != null"> · v{{ d.version.number }}</template>. Mods made for another version may not load.</span></div>
      </div>

      <div v-if="!d" class="muted"><Icon name="mdiSync" :size="16" class="spin" /> Looking for add-ons…</div>
      <div v-else class="ad-list" data-scroll>
        <div v-if="run" class="ad-run"><Icon name="mdiSync" :size="18" class="spin" /><span>{{ runText }}</span><button class="btn small" data-focus @click="cancel">Cancel</button></div>

        <template v-if="mine.length">
          <div class="ad-h">Installed by Cartridge</div>
          <button v-for="r in mine" :key="r.key" class="ad-row" data-focus data-expand @click="remove(r)">
            <Icon name="mdiCheckCircle" :size="22" />
            <span class="ad-mid"><b>{{ r.name }}</b><span class="ad-sub">{{ [r.emuName, bytes(r.bytes), r.count + ' files'].join(' · ') }}</span></span>
            <span class="ad-end">Remove</span>
          </button>
        </template>

        <template v-if="featured.length && wants('tex')">
          <div class="ad-h">Featured packs</div>
          <button v-for="f in featured" :key="f.id" class="ad-row" data-focus data-expand @click="openPage(f)">
            <Icon name="mdiStarFourPointsOutline" :size="22" />
            <span class="ad-mid"><b>{{ f.name }}</b><span class="ad-sub">by {{ f.authors[0] }} · download it from its page, then Install a Download below</span></span>
            <span class="ad-end">Open Page</span>
          </button>
        </template>
        <div class="ad-h">{{ kind === 'mods' ? 'Mods from GameBanana' : kind === 'tex' ? 'Texture packs' : d.source === 'ps2' ? (d.gbGame ? 'PS2 texture packs and GameBanana' : 'PS2 texture packs') : 'From GameBanana' }}</div>
        <div v-if="d.error && (kind !== 'tex' || d.source === 'ps2')" class="muted small">{{ d.error }}</div>
        <div v-else-if="!packs.length" class="muted small">{{ !d.emus?.length ? 'No emulator for this console is set up here.' : kind === 'tex' ? (d.source === 'ps2' ? 'No texture packs for this game in the catalog yet.' : 'There’s no texture pack catalog for this console yet. A pack you put in the folder above is used once custom textures are on.') : 'No mods for this game on GameBanana.' }}</div>
        <template v-for="p in packs" :key="p.source + p.id">
          <button class="ad-row" data-focus data-expand :disabled="!!run" @click="act(p)">
            <img v-if="p.preview || p.previews?.[0]" class="ad-img" :src="p.preview || p.previews[0]" loading="lazy" />
            <Icon v-else name="mdiPuzzleOutline" :size="22" />
            <span class="ad-mid"><b>{{ p.name }}</b><span class="ad-sub">{{ subOf(p) }}</span></span>
            <span class="ad-end">{{ has(p) ? 'Installed' : 'Details' }}</span>
          </button>
          <template v-if="open === p.id">
            <div v-if="!files" class="muted small ad-files"><Icon name="mdiSync" :size="14" class="spin" /> Loading files…</div>
            <div v-else-if="!files.length" class="muted small ad-files">No zip, 7z or rar files in this mod.</div>
            <button v-for="f in files" :key="f.id" class="ad-row ad-file" data-focus data-expand :disabled="!!run" @click="install(p, f)">
              <Icon name="mdiFileDownloadOutline" :size="20" />
              <span class="ad-mid"><b>{{ f.name }}</b><span class="ad-sub">{{ [bytes(f.size), f.description].filter(Boolean).join(' · ') }}</span></span>
              <span class="ad-end">Install</span>
            </button>
          </template>
        </template>
        <p v-if="packs.some((p) => p.source === 'ps2')" class="muted small">Packs from the EmuCoreX texture catalog, each credited to its creator. Checked against the catalog’s checksum before anything is installed.</p>
        <p v-if="packs.some((p) => p.source === 'gb')" class="muted small">Mods made by GameBanana’s community. Check a mod’s page for which version of the game it needs.</p>
      </div>

      <div class="row" style="justify-content: flex-end; flex-wrap: wrap">
        <button v-if="emu" class="btn" data-focus :disabled="!!run" @click="fromFile"><Icon name="mdiFolderZipOutline" />Install a Download</button>
        <button v-if="emu && !emu.mods && !emu.on && wants('tex')" class="btn" data-focus @click="texOn"><Icon name="mdiTextureBox" />Turn textures on</button>
        <button v-if="emu" class="btn" data-focus @click="copy"><Icon name="mdiContentCopy" />Copy folder path</button>
        <button v-if="!embedded" class="btn" data-focus @click="closeModal(null)">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// A game's add-ons (0.9.17): installed ones (Remove), and what can be downloaded for the emulator
// picked above: PS2 texture packs from the EmuCoreX catalog, other consoles' mods from GameBanana.
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { store, call, closeModal, toast, bytes, confirm, pickFolder, openModal, tab } from '../store.js';
import Icon from './Icon.vue';

// embedded (0.9.21): one tab of Game Add-ons (GameAddons.vue); kind 'tex' is the texture pack catalog
// (EmuCoreX, PS2), kind 'mods' is GameBanana (owner: GameBanana is for mods, keep the two apart)
const props = defineProps({ romId: Number, name: String, embedded: Boolean, kind: { type: String, default: '' }, onReopen: Function });
const el = ref(null), d = ref(null), emu = ref(null), open = ref(null), files = ref(null), run = ref(null);
const emus = computed(() => d.value?.emus || []);
const isTex = (p) => p.source === 'ps2';
const wants = (k) => !props.kind || props.kind === k;
const ofKind = (p) => wants(isTex(p) ? 'tex' : 'mods');
const packs = computed(() => (d.value?.packs || []).filter(ofKind));
const featured = computed(() => d.value?.featured || []);
function openPage(f) { window.open(f.page); toast('Opened in your browser. When it’s downloaded, come back and pick Install a Download.', 'info', 5000); }
// 0.9.23 (owner: Cartridge installs packs itself): a pack downloaded from any site, put in the right folder
// for this emulator the same way as the catalog's
async function fromFile() {
  if (!emu.value) return;
  const f = await pickFolder({ title: 'Pick the download', subtitle: 'A .zip, .7z or .rar texture pack or mod', start: store.info?.home ? store.info.home + '/Downloads' : undefined, files: ['zip', '7z', 'rar'] });
  reopen();
  if (!f) return;
  const name = f.split('/').pop().replace(/\.(zip|7z|rar)$/i, '');
  await install({ source: 'local', id: name, name, file: f, kind: props.kind || 'tex', authors: [] }, null);
}
const mine = computed(() => (d.value?.installed || []).filter((r) => (!emu.value || r.emuRoot === emu.value.emuRoot) && ofKind(r)));
const short = (p) => String(p || '').replace(store.info?.home || '\0', '~');
const has = (p) => mine.value.some((r) => String(r.id) === String(p.id));
const subOf = (p) => [p.authors?.[0] ? 'by ' + p.authors.join(', ') : '', p.size ? bytes(p.size) : '', p.files ? p.files.toLocaleString() + ' textures' : '', p.version, p.category].filter(Boolean).join(' · ');
const runText = computed(() => { const r = run.value; if (!r) return ''; return r.state === 'download' ? `Downloading ${r.pct != null ? r.pct + '%' : ''}` : r.state === 'join' ? 'Joining the parts…' : r.state === 'install' ? `Installing ${r.pct || 0}%` : 'Starting…'; });

// what is already in the game's folder (0.9.19), Cartridge's or not
const present = ref([]);
const here = computed(() => present.value.find((x) => x.emu === emu.value?.id) || null);
async function load() {
  call('addons:present', { romIds: [props.romId] }).then((m) => { present.value = m?.[props.romId] || []; }).catch(() => {});
  try { d.value = await call('addons:available', { romId: props.romId }); } catch (e) { d.value = { emus: [], packs: [], installed: [], error: e.message }; }
  if (!emu.value) emu.value = (d.value.source === 'ps2' ? emus.value.find((e) => e.id === 'pcsx2') : null) || emus.value[0] || null;
  else emu.value = emus.value.find((e) => e.emuRoot === emu.value.emuRoot) || emus.value[0] || null;
}
function pickEmu(e) { emu.value = e; }
// A opens the add-on in full (0.9.24): its text, pictures, size and maker, and Install at the bottom
async function act(p) {
  const r = await openModal('addondetail', { p: JSON.parse(JSON.stringify(p)), installed: has(p), kind: props.kind });
  reopen();
  if (!r) return;
  if (has(p)) return toast('Already installed. Remove it from the list above.', 'info', 3000);
  if (r.file) return install(p, r.file);
  if (r.install && p.source === 'ps2') return install(p, null);
}
async function install(p, f) {
  if (!emu.value) return toast('No emulator for this game is set up here.', 'info');
  run.value = { state: 'start' };
  // 0.9.28 (owner): Install goes to Downloads, where the pack shows with its game, downloading then unpacking
  const job = call('addons:install', { romId: props.romId, emuRoot: emu.value.emuRoot, pack: JSON.parse(JSON.stringify(p)), file: f ? JSON.parse(JSON.stringify(f)) : null });
  closeModal(null); tab('downloads');
  try {
    const r = await job;
    toast(`Installed in ${emu.value.name}: ${r.files.toLocaleString()} files${r.patches ? ', in its patches (turn it on in the game’s Patches)' : r.graphicMods ? ', in its Graphics Mods (turn it on in the game’s Graphics Mods)' : r.autoOn ? '. Custom textures are on now.' : r.textures ? '. Turn custom textures on to see them.' : ''}`, 'ok', 5000, 'mdiPuzzleOutline');
    open.value = null;
  } catch (e) { if (!/abort/i.test(e.message)) toast(e.message, 'error', 6000); }
  finally { run.value = null; load(); }
}
async function remove(r) {
  if (!(await confirm('Remove this add-on?', `${r.name}\n\nOnly the ${r.count} files Cartridge put in ${r.emuName}’s folder are deleted.`, 'Remove', true))) return reopen();
  try { await call('addons:remove', { key: r.key }); toast('Add-on removed', 'ok', 2500); } catch (e) { toast(e.message, 'error', 5000); }
  reopen();
}
// confirm() uses the one modal slot: come back to this sheet afterwards
const resolveSaved = () => store.modal?.resolve;
let saved = null;
function reopen() { if (props.embedded) return props.onReopen?.(); if (store.modal?.type !== 'addons') store.modal = { type: 'addons', props: { romId: props.romId, name: props.name }, resolve: saved || (() => {}) }; }
async function texOn() {
  try { await call('addons:setTextures', { root: emu.value.emuRoot, on: true }); toast(`Custom textures on in ${emu.value.name}`, 'ok', 3000, 'mdiTextureBox'); load(); }
  catch (e) { toast(e.message, 'error', 5000); }
}
async function copy() { try { await call('clip:write', { text: emu.value.folder || emu.value.root }); toast('Folder path copied', 'ok', 2000, 'mdiContentCopy'); } catch (e) { toast(e.message, 'error'); } }
const cancel = () => call('addons:cancel').catch(() => {});
let off = null, layer;
onMounted(async () => {
  saved = resolveSaved();
  off = window.cart.on('addon-progress', (m) => { if (m.romId === props.romId && run.value && m.state !== 'done' && m.state !== 'error') run.value = m; });
  if (!props.embedded) layer = pushLayer(el.value, { back: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  await load();
  if (!props.embedded) focusFirst(el.value);
});
onBeforeUnmount(() => { layer?.pop(); off?.(); });
</script>

<style scoped>
.ad-ver { display: flex; align-items: center; gap: 8px; font-size: var(--t-sm); color: var(--muted); }
.ad-ver b { color: var(--text); }
.ad { width: min(820px, 94vw); max-height: 88vh; display: flex; flex-direction: column; gap: var(--s-4); }
.ad-host { display: flex; flex-direction: column; min-height: 0; flex: 1; }
.ad-host > .ad { width: auto; max-height: none; min-height: 0; flex: 1; }
.ad h2 { margin: 2px 0 6px; font-size: var(--t-xl); line-height: 1.15; }
.small { font-size: var(--t-sm); }
.mono { font-family: ui-monospace, monospace; word-break: break-all; }
.ad-list { overflow-y: auto; min-height: 0; flex: 1; display: flex; flex-direction: column; gap: var(--s-2); padding: 2px; }
.ad-h { font-weight: 600; margin-top: var(--s-2); }
.ad-here { display: flex; align-items: center; gap: 8px; color: #8be0a4; font-size: var(--t-sm); font-weight: 500; margin-top: 4px; }
.ad-row { flex: none; display: flex; align-items: center; gap: var(--s-3); text-align: left; padding: var(--s-3) var(--s-4); border-radius: var(--r-md); background: var(--s1); color: inherit; border: 0; font: inherit; }
.ad-row:focus { background: var(--focus); color: var(--on-focus); outline: none; box-shadow: none; }
.ad-file { margin-left: var(--s-5); }
.ad-files { margin-left: var(--s-5); }
.ad-img { width: 64px; height: 36px; object-fit: cover; border-radius: var(--r-sm); flex: none; }
.ad-mid { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.ad-sub { font-size: var(--t-sm); opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-end { flex: none; font-size: var(--t-sm); opacity: 0.85; }
.ad-run { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) var(--s-3); border-radius: var(--r-md); background: var(--s2); }
.ad-run span { flex: 1; }
</style>
