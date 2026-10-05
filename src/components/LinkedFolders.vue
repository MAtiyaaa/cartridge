<template>
  <div class="lf">
    <p class="muted small" style="margin: 0">Link a fork’s save folder to the emulator it comes from, and both play with the same saves. Nothing is deleted: a fork’s own saves are set aside and come back when you remove the link.</p>
    <div v-if="!d" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Looking for forks and their folders…</div>
    <template v-else>
      <div class="lf-head"><b>Suggested</b><span class="muted small">{{ d.suggestions.length ? 'Forks found on this device' : '' }}</span></div>
      <div v-if="!d.suggestions.length && d.links.some((l) => l.fork)" class="muted small">Every fork found is linked.</div>
      <div v-else-if="!d.suggestions.length" class="muted small">No forks found. Mark a copy as a fork in Emulator setup, or install one from a GitHub link, and it shows up here.</div>
      <button v-for="s in d.suggestions" :key="s.exe + s.rel" class="lf-card" data-focus @click="suggest(s)">
        <div class="lf-pair">
          <span class="lf-end"><span class="lf-name">{{ s.fork }}</span><span class="lf-path mono">{{ short(s.from) || 'Its folder wasn’t found' }}</span></span>
          <span class="lf-wire" :class="{ on: s.state === 'linked' || s.state === 'same' }"><Icon name="mdiLinkVariant" :size="18" /></span>
          <span class="lf-end"><span class="lf-name">{{ s.ofName }}</span><span class="lf-path mono">{{ short(s.to) || `${s.ofName} hasn’t made it yet` }}</span></span>
        </div>
        <div class="lf-foot"><span class="chip">{{ s.label }}</span><span class="lf-note">{{ noteOf(s) }}</span><span class="status" :class="toneOf(s)">{{ stateOf(s) }}</span></div>
      </button>
      <div class="lf-head"><b>Your Links</b><button class="btn" data-focus @click="newLink"><Icon name="mdiPlus" />New Link</button></div>
      <div v-if="!d.links.length" class="muted small">None yet. New Link joins any two folders: pick the one to replace, then the one it should use.</div>
      <button v-for="l in d.links" :key="l.id" class="lf-card" data-focus @click="manage(l)">
        <div class="lf-pair">
          <span class="lf-end"><span class="lf-name">{{ l.fork || base(l.from) }}</span><span class="lf-path mono">{{ short(l.from) }}</span></span>
          <span class="lf-wire" :class="{ on: l.state === 'linked', bad: l.state !== 'linked' }"><Icon :name="l.state === 'linked' ? 'mdiLinkVariant' : 'mdiLinkVariantOff'" :size="18" /></span>
          <span class="lf-end"><span class="lf-name">{{ l.of ? nameOf(l.of) : base(l.to) }}</span><span class="lf-path mono">{{ short(l.to) }}</span></span>
        </div>
        <div class="lf-foot"><span v-if="l.label" class="chip">{{ l.label }}</span><span class="lf-note">{{ l.kept ? `Its own saves are kept in ${base(l.kept)}` : 'It had no saves of its own' }} · {{ ago(l.at) }}</span><span class="status" :class="l.state === 'linked' ? 'ok' : 'warn'">{{ l.state === 'linked' ? 'Linked' : 'Changed outside Cartridge' }}</span></div>
      </button>
    </template>
  </div>
</template>

<script setup>
// Settings → Emulators → Linked Folders (0.9.33, owner): forks sharing the original emulator's saves through a
// link (electron/folderLinks.js). Suggestions for each fork found; New Link for any two folders.
import { onMounted, ref } from 'vue';
import { call, toast, confirm, choose, pickFolder, ago, store } from '../store.js';
import Icon from './Icon.vue';

const d = ref(null);
const NAMES = { shadps4: 'shadPS4', rpcs3: 'RPCS3', eden: 'Eden', yuzu: 'yuzu', citron: 'Citron', dolphin: 'Dolphin', pcsx2: 'PCSX2', ppsspp: 'PPSSPP', vita3k: 'Vita3K', cemu: 'Cemu', duckstation: 'DuckStation', azahar: 'Azahar', ryujinx: 'Ryujinx', xenia: 'Xenia' };
const nameOf = (id) => NAMES[id] || id;
const short = (p) => (p ? p.replace(d.value?.home || store.info?.home || '\u0000', '~') : '');
const base = (p) => String(p || '').split('/').filter(Boolean).pop() || p;
async function load() { d.value = await call('links:list').catch((e) => { toast(e.message, 'error'); return { suggestions: [], links: [], home: '' }; }); }
const stateOf = (s) => ({ linked: 'Linked', same: 'Already Shared', folder: 'Ready', empty: 'Ready', missing: 'Ready', 'other-link': 'Linked Elsewhere', 'no-folder': 'Find Its Folder', 'no-donor': 'Not Yet' }[s.state] || 'Check');
const toneOf = (s) => (s.state === 'linked' || s.state === 'same' ? 'ok' : s.state === 'other-link' || s.state === 'no-folder' ? 'warn' : '');
function noteOf(s) {
  if (s.state === 'same') return `It already uses ${s.ofName}’s folder`;
  if (s.state === 'folder') return 'It has saves of its own: they’re set aside, not deleted';
  if (s.state === 'empty' || s.state === 'missing') return 'Its folder is empty: nothing to set aside';
  if (s.state === 'no-folder') return 'Start it once so it makes its folder, or choose it';
  if (s.state === 'no-donor') return `Start ${s.ofName} once first`;
  if (s.state === 'other-link') return 'Already a link to another folder';
  return '';
}
async function make(from, to, meta) {
  const st = await call('links:check', { from, to });
  if (st.why && st.state !== 'linked') return toast(st.why, 'error', 5000);
  const aside = st.state === 'folder' || st.state === 'empty';
  if (!(await confirm('Link these folders?', `${short(from)}\nwill use\n${short(to)}\n\n${aside ? `What’s there now is renamed to ${base(from)}.cartridge-kept and comes back if you remove the link.` : 'Nothing is there yet, so nothing is set aside.'} Close both emulators first.`, 'Link'))) return;
  try { const r = await call('links:make', { from, to, ...meta }); toast(r.already ? 'Already linked' : `Linked: ${meta.fork || base(from)} uses ${meta.of ? nameOf(meta.of) : base(to)}’s ${meta.label || 'folder'}`, 'ok', 4000, 'mdiLinkVariant'); }
  catch (e) { toast(e.message, 'error', 6000); }
  load();
}
async function suggest(s) {
  if (s.state === 'linked' || s.state === 'same') return toast(noteOf(s) || 'Already linked', 'info', 3000);
  if (s.state === 'no-donor') return toast(noteOf(s), 'info', 4000);
  if (s.state === 'other-link') return toast('It’s a link to another folder already. Remove that one first.', 'info', 4500);
  let from = s.from;
  if (!from) {
    const dir = await pickFolder({ title: `${s.fork}’s own folder`, subtitle: `The folder that holds its ${s.rel.split('/')[0]} folder`, start: s.exe.replace(/\/[^/]+$/, ''), hidden: true });
    if (!dir) return;
    from = dir.replace(/\/$/, '') + '/' + s.rel;
  }
  await make(from, s.to, { label: s.label, fork: s.fork, of: s.of });
}
async function newLink() {
  const from = await pickFolder({ title: 'The folder to replace', subtitle: 'Usually the fork’s save folder. It becomes a link; what’s in it is set aside.', hidden: true });
  if (!from) return;
  const to = await pickFolder({ title: 'The folder it should use', subtitle: 'Usually the original emulator’s save folder', hidden: true });
  if (!to) return;
  await make(from.replace(/\/$/, ''), to.replace(/\/$/, ''), {});
}
async function manage(l) {
  const v = await choose({ title: l.label || 'Linked Folder', message: `${short(l.from)} → ${short(l.to)}`, options: [
    { label: 'Remove Link', sub: l.kept ? 'Its own saves come back from where they were set aside' : 'It gets an empty folder of its own again', value: 'rm', icon: 'mdiLinkVariantOff', danger: true },
    { label: 'Copy the Fork’s Folder', value: 'cf', icon: 'mdiContentCopy' },
    { label: 'Copy the Shared Folder', value: 'ct', icon: 'mdiContentCopy' },
  ] });
  if (v === 'cf' || v === 'ct') { await call('clip:write', { text: v === 'cf' ? l.from : l.to }); return toast('Copied', 'ok', 1800, 'mdiContentCopy'); }
  if (v !== 'rm') return;
  if (!(await confirm('Remove this link?', `${short(l.from)} stops using ${short(l.to)}. Saves made while linked stay in ${short(l.to)}. Close both emulators first.`, 'Remove', true))) return;
  try { await call('links:remove', { id: l.id }); toast('Link removed', 'ok', 3000, 'mdiLinkVariantOff'); } catch (e) { toast(e.message, 'error', 6000); }
  load();
}
onMounted(load);
defineExpose({ load });
</script>

<style scoped>
.lf { display: flex; flex-direction: column; gap: var(--s-3); }
.lf-head { display: flex; align-items: center; justify-content: space-between; gap: var(--s-3); margin-top: var(--s-2); }
.lf-head b { font-family: var(--display); font-size: var(--t-lg); }
.lf-card { display: flex; flex-direction: column; gap: var(--s-2); padding: 14px 16px; border-radius: var(--r-md); background: var(--s2); text-align: left; width: 100%; }
.lf-card:focus { background: var(--focus); color: var(--on-focus); }
.lf-card:focus .lf-path, .lf-card:focus .lf-note { color: var(--on-focus-dim); }
.lf-pair { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: var(--s-3); }
.lf-end { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lf-end:last-child { text-align: right; }
.lf-name { font-family: var(--display); font-weight: 700; font-size: var(--t-md); }
.lf-path { font-size: var(--t-xs); color: var(--muted); overflow-wrap: anywhere; }
/* the link between them: a line with the chain in the middle, lit when linked */
.lf-wire { position: relative; display: grid; place-items: center; width: 92px; height: 34px; color: var(--muted); }
.lf-wire::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: 2px dashed currentColor; opacity: 0.5; }
.lf-wire :deep(svg) { position: relative; background: var(--s2); border-radius: 50%; padding: 6px; box-sizing: content-box; }
.lf-card:focus .lf-wire :deep(svg) { background: var(--focus); }
.lf-wire.on { color: #7fe0a0; }
.lf-wire.on::before { border-top-style: solid; opacity: 0.9; }
.lf-wire.bad { color: #ffd978; }
.lf-foot { display: flex; align-items: center; gap: var(--s-2); flex-wrap: wrap; }
.lf-note { flex: 1; min-width: 0; font-size: var(--t-xs); color: var(--muted); }
.status.warn { background: rgba(245, 197, 66, 0.18); color: #ffd978; }
</style>
