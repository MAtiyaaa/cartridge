<template>
  <button class="card" :class="{ picked: selected }" data-focus :data-key="'rom-' + rom.id" @click="$emit('open', rom)" @focus="onFocus">
    <div class="art">
      <img v-if="src && !failed" :src="tries ? src + (src.includes('?') ? '&' : '?') + 'r=' + tries : src" :loading="eager ? 'eager' : 'lazy'" decoding="async" @error="onErr" />
      <div v-else class="ph">{{ rom.name }}<small>{{ rom.platform_display_name }}</small></div>
      <div class="shine" />
      <span v-if="fresh && !installed" class="chip new badge-new">NEW</span>
      <div v-if="installed" class="badge-dl"><Icon name="mdiCheckBold" :size="15" /></div>
      <div v-else-if="dl && dl.status === 'queued'" class="queued">Queued</div>
      <div v-if="selected !== null" class="pick"><Icon :name="selected ? 'mdiCheckboxMarked' : 'mdiCheckboxBlankOutline'" :size="24" /></div>
      <div v-if="dl && dl.status === 'downloading'" class="prog"><i :style="{ width: pct + '%' }" /></div>
      <div v-if="del != null" class="deleting"><Ring :pct="del" /><span>Deleting</span></div>
    </div>
    <div v-if="!hideTitle" class="title">{{ rom.name }}</div>
    <div v-if="showPlatform" class="sub">{{ rom.platform_display_name }}</div>
    <!-- its own line, wrapping inside the card's width, never cut short (0.9.3 F7: device names) -->
    <div v-if="extra" class="sub extra">{{ extra }}</div>
  </button>
</template>
<script setup>
import { computed, ref } from 'vue';
import { store, cover, downloadFor, isNew } from '../store.js';
import Icon from './Icon.vue';
import Ring from './Ring.vue';
const props = defineProps({ rom: Object, showPlatform: Boolean, extra: String, hideTitle: Boolean, selected: { type: Boolean, default: null }, eager: Boolean });
const emit = defineEmits(['open', 'focused']);
const failed = ref(false);
// On a cold start the image server can answer before it's ready: try twice more before showing the name
const tries = ref(0);
function onErr() { if (tries.value < 2) setTimeout(() => tries.value++, 1200 * (tries.value + 1)); else failed.value = true; }
const src = computed(() => cover(props.rom));
const installed = computed(() => !!store.installed[props.rom.id]);
const fresh = computed(() => isNew(props.rom));
const dl = computed(() => { const d = downloadFor(props.rom.id); return d && ['queued', 'downloading'].includes(d.status) ? d : null; });
const pct = computed(() => (dl.value?.total ? Math.floor((dl.value.received / dl.value.total) * 100) : 0));
const del = computed(() => store.deleting[props.rom.id] ?? null);
function onFocus() { emit('focused', props.rom); }
</script>
<style scoped>
/* deleting: the cover dims and a ring fills as the files go (0.9.3) */
.deleting { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--s-2); background: rgba(6, 7, 11, 0.72); color: #fff; font-size: var(--t-xs); font-weight: 600; animation: fade var(--d-med); }
</style>
