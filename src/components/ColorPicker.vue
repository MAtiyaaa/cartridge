<template>
  <div class="scrim" ref="el" @click.self="closeModal(null)">
    <div class="dialog cp">
      <h2>{{ title || 'Custom colour' }}</h2>
      <p class="muted" style="margin: 0; font-size: 13px">{{ note || 'Pick any colour. Cartridge builds the whole theme from it: highlights, buttons and the background.' }}</p>
      <div class="cp-grid">
        <button v-for="c in CUSTOM_SWATCHES" :key="c" class="cp-sw" data-focus :class="{ on: c === cur }" :style="{ background: c }" @click="cur = c" @dblclick="closeModal(c)" />
      </div>
      <div class="cp-row">
        <label class="cp-native"><input type="color" :value="cur" @input="(e) => (cur = e.target.value)" /><span>Any colour…</span></label>
        <div class="cp-prev" :style="{ background: `linear-gradient(135deg, ${t.grad[0]}, ${t.grad[2]} 60%, ${t.grad[4]})` }"><span class="chip" :style="{ background: t.accent[0], color: '#fff' }">{{ cur }}</span></div>
        <div class="spacer" />
        <button v-if="allowReset" class="btn" data-focus @click="closeModal('__theme')"><Icon name="mdiRestore" />Use theme</button>
        <button class="btn" data-focus @click="closeModal(null)">Cancel</button>
        <button class="btn primary" data-focus @click="closeModal(cur)"><Icon name="mdiCheck" />Use colour</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { pushLayer, focusFirst } from '../nav.js';
import { closeModal } from '../store.js';
import { CUSTOM_SWATCHES, themeFrom } from '../themes.js';
import Icon from './Icon.vue';
// Custom theme colour: swatches for the controller, a full colour picker for mouse and touch
const props = defineProps({ value: String, title: String, note: String, allowReset: Boolean });
const el = ref(null);
const cur = ref(/^#[0-9a-f]{6}$/i.test(props.value || '') ? props.value : '#8b74e8');
const t = computed(() => themeFrom(cur.value));
let layer;
onMounted(() => {
  layer = pushLayer(el.value, { back: () => closeModal(null), start: () => closeModal(cur.value), lb() {}, rb() {}, x() {}, y() {}, select() {}, lt() {}, rt() {} });
  focusFirst(el.value, '.cp-sw.on') || focusFirst(el.value);
});
onBeforeUnmount(() => layer?.pop());
</script>
<style scoped>
.cp { width: min(700px, 94vw); }
.cp-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 8px; }
.cp-sw { aspect-ratio: 1; border-radius: var(--r-md); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15); transition: transform 0.12s; }
.cp-sw:focus { transform: scale(1.15); box-shadow: var(--ring); z-index: 1; }
.cp-sw.on { box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(0, 0, 0, 0.6); }
.cp-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cp-native { display: inline-flex; align-items: center; gap: 8px; font-size: var(--t-sm); color: var(--muted); cursor: pointer; }
.cp-native input { width: 44px; height: 36px; border: 0; padding: 0; background: none; cursor: pointer; }
.cp-prev { width: 150px; height: 44px; border-radius: var(--r-md); display: grid; place-items: center; }
</style>
