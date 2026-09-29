<template>
  <div class="lc">
    <div class="subh"><Icon name="mdiShieldCheckOutline" :size="20" />Check downloaded games</div>
    <p class="muted small" style="margin: -6px 0 0">Compares every game on this device with RomM's record of it (size, and checksum where RomM has one). Nothing is changed unless you choose to re-download.</p>
    <div v-if="prog" class="lc-run glass">
      <div class="lc-top"><b>Checking {{ prog.done + 1 }} of {{ prog.total }}</b><span class="muted">{{ prog.name }}</span><div class="spacer" /><button class="btn small" data-focus @click="call('library:verifyCancel')"><Icon name="mdiClose" :size="18" />Stop</button></div>
      <div class="bar live"><i :style="{ width: (prog.done / Math.max(1, prog.total)) * 100 + '%' }" /></div>
    </div>
    <template v-else>
      <div class="row wrap">
        <button class="btn" data-focus :disabled="running" @click="run"><Icon name="mdiShieldSearch" />{{ res ? 'Check again' : 'Check now' }}</button>
        <button v-if="res?.damaged.length" class="btn primary" data-focus @click="fixAll"><Icon name="mdiDownload" />Re-download {{ res.damaged.length }}</button>
      </div>
      <div v-if="res" class="muted small">{{ res.cancelled ? 'Stopped. ' : '' }}{{ res.checked }} checked{{ res.skipped ? `, ${res.skipped} skipped (unpacked PS4/PS5 games, or RomM didn't answer)` : '' }}. {{ res.damaged.length ? `${res.damaged.length} need${res.damaged.length === 1 ? 's' : ''} attention.` : 'All good.' }}</div>
      <div v-if="res?.damaged.length" class="stack">
        <button v-for="d in res.damaged" :key="d.romId" class="lrow" data-focus @click="fix(d)">
          <Icon name="mdiFileAlertOutline" :size="22" style="color: #ffd978" />
          <div class="l-mid"><b>{{ d.name }}</b><span class="l-sub">{{ d.why }}{{ d.files > 1 ? ` (and ${d.files - 1} more file${d.files > 2 ? 's' : ''})` : '' }}</span></div>
          <span class="l-end">Re-download</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { call, toast, confirm } from '../store.js';
import Icon from './Icon.vue';

// Settings → Storage: check every downloaded game against RomM, and re-download the damaged ones
const res = ref(null);
const prog = ref(null);
const running = ref(false);
const off = window.cart.on('verify-progress', (p) => { prog.value = p; });
onBeforeUnmount(() => { try { off?.(); } catch {} });
async function run() {
  running.value = true;
  try { res.value = await call('library:verify'); } catch (e) { toast(e.message, 'error'); }
  running.value = false; prog.value = null;
}
// the old copy is kept aside until the new one has passed its checks (and put back if it fails)
async function redo(d) {
  try { await call('library:redownload', { romId: d.romId }); return true; } catch (e) { toast(e.message, 'error'); return false; }
}
async function fix(d) {
  if (!(await confirm(`Re-download ${d.name}?`, 'A fresh copy comes from RomM. The one on this device is kept until the new one has passed its check.', 'Re-download'))) return;
  if (await redo(d)) { res.value.damaged = res.value.damaged.filter((x) => x !== d); toast('Downloading again', 'ok', 2400, 'mdiDownload'); }
}
async function fixAll() {
  const list = res.value.damaged.slice();
  if (!(await confirm(`Re-download ${list.length} game${list.length === 1 ? '' : 's'}?`, 'Their copies on this device are replaced with fresh ones from RomM.', 'Re-download'))) return;
  for (const d of list) await redo(d);
  res.value.damaged = [];
  toast(`${list.length} queued in Downloads`, 'ok', 3000, 'mdiDownload');
}
</script>

<style scoped>
.lc { display: flex; flex-direction: column; gap: var(--s-3); margin-top: var(--s-5); }
.subh { display: flex; align-items: center; gap: 10px; font-family: var(--display); font-size: var(--t-lg); font-weight: 700; }
.small { font-size: var(--t-sm); }
.wrap { flex-wrap: wrap; }
.spacer { flex: 1; }
.lc-run { display: flex; flex-direction: column; gap: var(--s-3); padding: var(--s-4); }
.lc-top { display: flex; align-items: center; gap: var(--s-3); min-width: 0; }
.lc-top .muted { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
</style>
