<template>
  <div class="scrim" ref="el">
    <form class="dialog prompt" @submit.prevent="done">
      <h2>{{ title }}</h2>
      <div class="prompt-field">
        <input ref="inp" v-model="text" class="prompt-input" data-focus :type="password && !reveal ? 'password' : 'text'" :inputmode="mode === 'url' ? 'url' : 'text'" :placeholder="placeholder" autocomplete="off" autocapitalize="off" spellcheck="false" />
        <button v-if="password" type="button" class="reveal" data-focus @click="reveal = !reveal"><Icon :name="reveal ? 'mdiEyeOff' : 'mdiEye'" :size="20" /></button>
      </div>
      <p class="prompt-tip"><Icon name="mdiKeyboardOutline" :size="16" />Type with any keyboard. In Game Mode, press <b>Steam + X</b> for the Steam keyboard.</p>
      <div class="prompt-actions">
        <button type="button" class="btn" data-focus @click="closeModal(null)"><Icon name="mdiClose" :size="18" />Cancel</button>
        <button type="submit" class="btn primary" data-focus><Icon name="mdiCheck" :size="18" />Done</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue';
import { pushLayer } from '../nav.js';
import { closeModal } from '../store.js';
import Icon from './Icon.vue';

// Plain text prompt. Typing comes from a real keyboard or the Steam keyboard (Steam + X).
const props = defineProps({
  title: { type: String, default: 'Enter text' },
  value: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  password: Boolean,
  mode: { type: String, default: 'text' },
});
const el = ref(null);
const inp = ref(null);
const text = ref(props.value || '');
const reveal = ref(false);
function done() { closeModal(text.value); }

let layer;
onMounted(async () => {
  layer = pushLayer(el.value, {
    back: () => closeModal(null),
    start: done,
    accept: (a) => (a === inp.value ? done() : false),
    lb: () => {}, rb: () => {}, lt: () => {}, rt: () => {}, select: () => {}, x: () => {}, y: () => {},
  });
  await nextTick();
  inp.value?.focus();
  inp.value?.select();
});
onBeforeUnmount(() => layer?.pop?.());
</script>

<style>
.dialog.prompt { width: min(620px, 92vw); display: flex; flex-direction: column; gap: 14px; }
.prompt-field { position: relative; display: flex; align-items: center; }
.prompt-input { width: 100%; font: inherit; font-size: 20px; color: var(--text); background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px; padding: 14px 16px; outline: none; }
.prompt-input:focus { border-color: var(--primary-l); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 45%, transparent); }
.prompt-field .reveal { position: absolute; right: 8px; background: none; border: 0; color: var(--muted); padding: 8px; border-radius: 6px; }
.prompt-tip { margin: 0; color: var(--muted); font-size: 13px; display: flex; align-items: center; gap: 8px; }
.prompt-actions { display: flex; justify-content: flex-end; gap: 10px; }
</style>
