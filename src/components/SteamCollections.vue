<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog sc">
      <h2>Add to a Steam collection?</h2>
      <p class="muted" style="margin: 0; font-size: 13px">Pick any number, or none. {{ many ? 'Used for every game in this batch.' : 'Cartridge remembers your choice for this console.' }}</p>
      <div class="sc-list">
        <button class="menu-item" data-focus :class="{ selected: !picked.length }" @click="picked = []">
          <Icon name="mdiCancel" /><span>None</span><Icon v-if="!picked.length" name="mdiCheck" class="tick" />
        </button>
        <button v-for="c in all" :key="c" class="menu-item" data-focus :class="{ selected: picked.includes(c) }" @click="toggle(c)">
          <Icon :name="picked.includes(c) ? 'mdiCheckboxMarked' : 'mdiCheckboxBlankOutline'" /><span>{{ c }}</span><span v-if="!collections.includes(c)" class="sub">New</span>
        </button>
        <button class="menu-item" data-focus @click="addNew"><Icon name="mdiPlus" /><span>New collection…</span></button>
      </div>
      <div class="row" style="justify-content: flex-end; gap: 10px">
        <button class="btn" data-focus @click="closeModal(null)">Cancel</button>
        <button class="btn primary" data-focus @click="closeModal([...picked])"><Icon name="mdiCheck" />{{ picked.length ? `Use ${picked.length === 1 ? picked[0] : picked.length + ' collections'}` : 'No collection' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal, askText, store } from '../store.js';
import Icon from './Icon.vue';

const props = defineProps({ collections: { type: Array, default: () => [] }, selected: { type: Array, default: () => [] }, extra: { type: Array, default: () => [] }, many: Boolean });
const picked = ref([...props.selected]);
const extra = ref([...new Set([...props.extra, ...props.selected.filter((c) => !props.collections.includes(c))])]);
const all = computed(() => [...props.collections, ...extra.value]);
const el = ref(null);
function toggle(c) { picked.value = picked.value.includes(c) ? picked.value.filter((x) => x !== c) : [...picked.value, c]; }
let layer;
// The keyboard replaces this dialog for a moment; reopen it afterwards with the new name ticked
async function addNew() {
  const resolveOuter = store.modal.resolve;
  const name = await askText({ title: 'New Steam collection', placeholder: 'Collection name' });
  const n = typeof name === 'string' ? name.trim() : '';
  const sel = n && !picked.value.includes(n) ? [...picked.value, n] : [...picked.value];
  store.modal = { type: 'steam-collections', props: { collections: props.collections, many: props.many, selected: sel, extra: [...new Set([...extra.value, ...(n && !props.collections.includes(n) ? [n] : [])])] }, resolve: resolveOuter };
}
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal([...picked.value]), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value, '.menu-item.selected') || focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.sc { width: min(560px, 94vw); }
.sc-list { display: flex; flex-direction: column; gap: 4px; max-height: 50vh; overflow-y: auto; }
.tick { margin-left: auto; color: var(--primary-l); }
</style>
