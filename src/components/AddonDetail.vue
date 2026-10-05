<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog adt">
      <div class="adt-head">
        <img v-if="pics[0]" class="adt-cover" :src="pics[0]" alt="" />
        <div style="min-width: 0">
          <div class="eyebrow">{{ kindLabel }}</div>
          <h2>{{ p.name }}</h2>
          <div class="adt-facts">
            <span v-if="author" class="chip"><Icon name="mdiAccountOutline" :size="14" />{{ author }}</span>
            <span v-if="size" class="chip"><Icon name="mdiHarddisk" :size="14" />{{ bytes(size) }}</span>
            <span v-if="p.files" class="chip"><Icon name="mdiImageMultipleOutline" :size="14" />{{ p.files.toLocaleString() }} textures</span>
            <span v-if="version" class="chip"><Icon name="mdiTagOutline" :size="14" />{{ version }}</span>
            <span v-if="p.category" class="chip">{{ p.category }}</span>
            <span v-if="more?.likes" class="chip"><Icon name="mdiHeartOutline" :size="14" />{{ more.likes }}</span>
          </div>
        </div>
      </div>
      <div class="adt-body" data-scroll>
        <div v-if="pics.length > 1" class="adt-pics"><img v-for="u in pics.slice(1)" :key="u" :src="u" loading="lazy" alt="" /></div>
        <p v-if="text" class="adt-text">{{ text }}</p>
        <div v-else-if="p.source === 'gb' && !more" class="muted small"><Icon name="mdiSync" :size="14" class="spin" /> Reading its page…</div>
        <template v-if="p.source === 'gb'">
          <div class="sec-title">Files</div>
          <div v-if="!more" class="muted small">…</div>
          <div v-else-if="!more.files.length" class="muted small">No zip, 7z or rar files in this mod.</div>
          <button v-for="f in more?.files || []" :key="f.id" class="lrow" data-focus @click="closeModal({ file: f })">
            <Icon name="mdiFileDownloadOutline" :size="22" />
            <span class="l-mid"><b>{{ f.name }}</b><span class="l-sub">{{ [bytes(f.size), f.description].filter(Boolean).join(' · ') }}</span></span>
            <span class="l-end"><span class="status">Install</span></span>
          </button>
        </template>
      </div>
      <div class="row" style="justify-content: flex-end">
        <button v-if="p.url" class="btn" data-focus @click="openPage"><Icon name="mdiOpenInNew" />Its Page</button>
        <button class="btn" data-focus @click="closeModal(null)">Back</button>
        <button v-if="p.source !== 'gb'" class="btn primary" data-focus data-autofocus :disabled="installed" @click="closeModal({ install: true })"><Icon name="mdiDownload" />{{ installed ? 'Installed' : 'Install' }}</button>
      </div>
    </div>
  </div>
</template>
<script setup>
// One add-on in full (0.9.24, owner: A on a mod, pack or patch shows all its text, its size and who made it,
// with Install at the bottom, instead of a line cut off with "…"). Returns { install } or { file } or null.
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { call, closeModal, bytes } from '../store.js';
import Icon from './Icon.vue';
const props = defineProps({ p: Object, installed: Boolean, kind: String });
const el = ref(null), more = ref(null);
const pics = computed(() => [...new Set([...(more.value?.images || []), ...(props.p.previews || []), props.p.preview].filter(Boolean))]);
const author = computed(() => (props.p.authors || []).join(', ') || more.value?.author || '');
const size = computed(() => props.p.size || (more.value?.files?.length === 1 ? more.value.files[0].size : 0));
const version = computed(() => props.p.version || more.value?.version || '');
const text = computed(() => more.value?.text || props.p.description || props.p.notes || '');
const kindLabel = computed(() => (props.kind === 'tex' || props.p.source === 'ps2' ? 'Texture Pack' : 'Mod'));
// 0.9.32: its page opens in Cartridge (AddonsSheet), where a download clicked there installs for this game
function openPage() { closeModal({ page: true }); }
let layer;
onMounted(async () => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(null), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value);
  if (props.p.source === 'gb') { more.value = await call('addons:gbMod', { modId: props.p.id }).catch(() => ({ files: [], images: [] })); focusFirst(el.value); }
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.adt { width: min(860px, 94vw); max-height: 90vh; display: flex; flex-direction: column; gap: var(--s-3); }
.adt-head { display: flex; gap: var(--s-4); align-items: flex-start; }
.adt-cover { width: 168px; aspect-ratio: 16 / 10; object-fit: cover; border-radius: var(--r-md); flex: none; box-shadow: var(--weight); }
.adt-head h2 { margin: 2px 0 8px; font-size: var(--t-xl); line-height: 1.15; }
.adt-facts { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: var(--s2); font-size: var(--t-xs); color: var(--muted); }
.adt-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 4px; }
.adt-body > * { flex: none; }
.adt-pics { display: flex; gap: 8px; overflow-x: auto; }
.adt-pics img { height: 120px; border-radius: var(--r-sm); }
.adt-text { margin: 0; white-space: pre-line; line-height: 1.5; color: var(--text); }
</style>
