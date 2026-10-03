<template>
  <p class="muted small" style="margin-top: -6px">Syncthing keeps folders the same on all your devices. Cartridge only looks: it reads what your Syncthing shares and never opens, copies or changes a file. Folders that look like emulator saves come first.</p>
  <div v-if="!s" class="muted small"><Icon name="mdiSync" :size="14" class="spin" /> Looking for Syncthing…</div>
  <div v-else class="stack">
    <div class="lrow" data-focus>
      <Icon name="mdiSyncCircle" :size="24" />
      <div class="l-mid"><b>{{ s.running ? 'Syncthing is running' : s.installed ? 'Syncthing is installed' : 'No Syncthing on this device' }}</b><span class="l-sub">{{ s.running ? `This device ${s.me} · ${s.devices.filter((d) => d.online).length} of ${s.devices.length} other devices online` : s.why }}</span></div>
      <span v-if="s.running" class="status ok"><Icon name="mdiCheck" :size="14" />Running</span>
    </div>

    <template v-if="s.devices?.length">
      <div class="subh">Devices</div>
      <div class="devs">
        <div v-for="d in s.devices" :key="d.name" class="dev" data-focus tabindex="0">
          <Icon name="mdiDevices" :size="20" />
          <b>{{ d.name }}</b>
          <span :class="d.online ? 'on' : ''">{{ d.online ? 'Online' : d.seen ? 'Seen ' + ago(d.seen) : 'Not seen yet' }}</span>
        </div>
      </div>
    </template>

    <template v-if="s.folders?.length">
      <div class="subh">Folders</div>
      <template v-for="f in s.folders" :key="f.id">
        <button class="lrow" data-focus :data-key="'sf-' + f.id" @click="toggle(f)">
          <Icon :name="f.saves ? 'mdiContentSaveOutline' : 'mdiFolderOutline'" :size="22" />
          <div class="l-mid"><b>{{ f.label || f.id }}</b><span class="l-sub mono">{{ f.path.replace(store.info?.home || '\0', '~') }}{{ f.saves ? ` · looks like ${f.saves} saves` : '' }}</span></div>
          <span v-if="f.done != null" class="status" :class="f.done >= 100 ? 'ok' : 'warn'">{{ f.done >= 100 ? 'Up to date' : f.done + '%' }}</span>
          <Icon v-if="s.running" :name="open === f.id ? 'mdiChevronUp' : 'mdiChevronDown'" :size="22" />
        </button>
        <div v-if="open === f.id" class="files">
          <div v-if="!list" class="muted small"><Icon name="mdiSync" :size="14" class="spin" /> Reading Syncthing’s list…</div>
          <div v-else-if="list.error" class="muted small">{{ list.error }}</div>
          <template v-else>
            <div class="muted small files-head">{{ list.total }} files · {{ bytes(list.size) }}<template v-if="list.last"> · last change {{ ago(list.last.at) }}: {{ list.last.path }}</template></div>
            <div v-for="x in list.files" :key="x.path" class="file" data-focus tabindex="0">
              <span class="mono">{{ x.path }}</span><span class="muted">{{ bytes(x.size) }}</span><span class="muted">{{ ago(x.at) }}</span>
            </div>
            <div v-if="list.total > list.files.length" class="muted small">And {{ list.total - list.files.length }} more.</div>
          </template>
        </div>
      </template>
    </template>
  </div>
</template>
<script setup>
// Settings → Sync (0.9.19 as a card; its own tab in 0.9.21, owner: view only). Read only, see electron/syncthing.js
import { ref, onMounted } from 'vue';
import { store, call, ago, bytes } from '../store.js';
import Icon from './Icon.vue';
const s = ref(null), open = ref(''), list = ref(null);
onMounted(async () => { s.value = (await call('sync:status').catch(() => null)) || { installed: false, running: false, why: 'Couldn’t check.' }; });
async function toggle(f) {
  if (!s.value?.running) return;
  if (open.value === f.id) { open.value = ''; return; }
  open.value = f.id; list.value = null;
  list.value = await call('sync:browse', f.id).catch((e) => ({ error: e.message }));
}
</script>
<style scoped>
.small { font-size: var(--t-sm); }
.mono { font-family: ui-monospace, monospace; }
.devs { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--s-2); }
.dev { display: flex; flex-direction: column; gap: 4px; padding: var(--s-3) var(--s-4); border-radius: var(--r-md); background: var(--s1); }
.dev b { font-family: var(--display); font-size: var(--t-md); }
.dev span { font-size: var(--t-sm); color: var(--muted); }
.dev span.on { color: var(--green-l, #7ee2a8); }
.dev:focus-visible, .pad-mode .dev:focus { background: var(--focus); color: var(--on-focus); }
.dev:focus-visible span, .pad-mode .dev:focus span { color: var(--on-focus-dim); }
.files { display: flex; flex-direction: column; gap: 2px; padding: 0 0 var(--s-3) 46px; }
.files-head { padding: 4px 0 6px; }
.file { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: var(--s-4); padding: 6px 10px; border-radius: var(--r-sm); font-size: var(--t-sm); }
.file .mono { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file:focus-visible, .pad-mode .file:focus { background: var(--focus); color: var(--on-focus); }
.file:focus-visible .muted, .pad-mode .file:focus .muted { color: var(--on-focus-dim); }
</style>
