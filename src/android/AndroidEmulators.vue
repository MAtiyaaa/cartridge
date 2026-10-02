<template>
  <!-- Settings → Emulators on Android: the same Issues list as on desktop, then each console's emulator -->
  <div class="subh">Issues</div>
  <div v-if="!issues" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Checking…</div>
  <div v-else-if="!issues.length" class="status ok" style="align-self: flex-start"><Icon name="mdiCheck" :size="14" />Nothing needs your attention</div>
  <div v-else class="stack">
    <template v-for="(i, n) in issues" :key="n">
      <button class="lrow" data-focus @click="fix(i)">
        <Icon :name="ICON[i.kind]" :size="24" style="color: #ffd978" />
        <div class="l-mid"><b>{{ i.text }}</b><span v-if="i.sub" class="l-sub">{{ i.sub }}</span></div>
        <span v-if="i.fix" class="l-end"><Btn b="A" />{{ i.fix.label }}</span>
      </button>
      <button v-if="i.fix?.done" class="lrow ae-done" data-focus @click="done(i)"><Icon name="mdiCheck" :size="20" /><div class="l-mid"><b>Installed, mark as done</b></div></button>
    </template>
  </div>

  <div class="subh">Emulators</div>
  <p class="muted small" style="margin: 0">Which installed emulator opens each console's games. Play uses it unless a game has its own pick.</p>
  <div v-if="!cons" class="muted small"><Icon name="mdiSync" :size="16" class="spin" /> Looking for emulators…</div>
  <div v-else class="stack">
    <button v-for="c in cons" :key="c.p.id" class="lrow" data-focus :data-key="'ae-' + c.p.slug" :disabled="!c.con" @click="pick(c)">
      <PIcon :p="c.p" :size="30" />
      <div class="l-mid">
        <b>{{ c.p.display_name || c.p.name }}</b>
        <span class="l-sub">{{ c.onDevice.length ? `${c.onDevice.length} on this device` : `${c.roms.length} on your server` }}</span>
      </div>
      <span class="l-end">
        <span class="status" :class="!c.con ? 'none' : c.cands.length ? 'ok' : c.onDevice.length ? 'bad' : 'none'">{{ label(c) }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { store, choose, saveConfig, toast } from '../store.js';
import { emus } from './play.js';
import { EMUS, emuName } from './emulators.js';
import { androidConsoles, androidIssues } from './issues.js';
import Icon from '../components/Icon.vue';
import Btn from '../components/Btn.vue';
import PIcon from '../components/PIcon.vue';

const ICON = { emu: 'mdiGamepadVariantOutline', bios: 'mdiChip', pkg: 'mdiPackageDown' };
const issues = ref(null), cons = ref(null);
async function load() {
  cons.value = await androidConsoles().catch(() => []);
  issues.value = await androidIssues().catch(() => []);
}
function label(c) {
  if (!c.con) return 'Not supported yet';
  if (!c.cands.length) return 'None installed';
  return emuName(c.pick || c.cands[0], emus.found) + (c.pick ? '' : c.cands.length > 1 ? ' · automatic' : '');
}
async function fix(i) { if (!i.fix) return; await i.fix.run(); load(); }
async function done(i) { await i.fix.done(); toast('Marked as installed', 'ok', 2200, 'mdiCheck'); load(); }
async function pick(c) {
  if (!c.cands.length) {
    const get = c.con.emus.map((id) => EMUS[id]).filter((e) => e?.get);
    toast(`Install ${c.con.emus.slice(0, 3).map((id) => EMUS[id]?.name).filter(Boolean).join(', ')} to play ${c.p.display_name || c.p.name} games`, 'info', 6000, 'mdiGamepadVariantOutline');
    if (get.length) { const v = await choose({ title: `Get an emulator for ${c.p.display_name || c.p.name}`, options: get.map((e) => ({ label: e.name, sub: e.get.includes('play.google') ? 'Google Play' : 'Website', value: e.get, icon: 'mdiDownload' })) }); if (v) (await import('./native.js')).Native.openUrl({ url: v }); }
    return;
  }
  const v = await choose({ title: c.p.display_name || c.p.name, message: 'Which emulator opens these games', options: [
    { label: 'Automatic', sub: `The first one found: ${emuName(c.cands[0], emus.found)}`, value: '__auto', selected: !c.pick, icon: 'mdiAutoFix' },
    ...c.cands.map((id) => ({ label: emuName(id, emus.found), sub: emus.found[id]?.version ? 'Version ' + emus.found[id].version : '', value: id, selected: c.pick === id, icon: 'mdiGamepadVariantOutline' })),
  ] });
  if (!v) return;
  await saveConfig({ android: { emus: { [c.key]: v === '__auto' ? null : v } } });
  load();
}
onMounted(load);
</script>

<style scoped>
.lrow > .icon { flex: none; }
.lrow[disabled] { opacity: 0.55; }
.ae-done { margin-top: calc(-1 * var(--s-1)); padding-left: 56px; background: transparent; }
.ae-done > .icon { color: var(--green-l); }
.ae-done:focus > .icon { color: var(--on-focus); }
</style>
