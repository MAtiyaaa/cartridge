<template>
  <div class="cs">
    <header class="cs-top">
      <div class="cs-title"><Icon name="mdiCogOutline" :size="20" />Settings</div>
      <button class="cs-off" :class="{ armed: offArmed }" @click="turnOff">
        <Icon name="mdiMonitorOff" :size="17" />{{ offArmed ? 'Tap again to turn off' : 'Turn off this screen' }}
      </button>
      <button class="cs-close" aria-label="Close settings" @click="$emit('close')"><Icon name="mdiClose" :size="22" /></button>
    </header>
    <div class="cs-body"><Settings /></div>

    <!-- The same pop-ups the top screen uses -->
    <Keyboard v-if="store.modal?.type === 'keyboard' && builtinKb()" v-bind="store.modal.props" />
    <TextPrompt v-else-if="store.modal?.type === 'keyboard'" v-bind="store.modal.props" />
    <FolderPicker v-if="store.modal?.type === 'folder'" v-bind="store.modal.props" />
    <Menu v-if="store.modal?.type === 'menu'" v-bind="store.modal.props" />
    <ColorPicker v-if="store.modal?.type === 'color'" v-bind="store.modal.props" />
    <div class="toasts cs-toasts">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind"><span class="ti"><Icon :name="t.icon" :size="18" /></span>{{ t.msg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { store, builtinKb } from '../store.js';
import { setPointerPref } from '../nav.js';
import Settings from '../views/Settings.vue';
import Keyboard from '../components/Keyboard.vue';
import TextPrompt from '../components/TextPrompt.vue';
import FolderPicker from '../components/FolderPicker.vue';
import Menu from '../components/Menu.vue';
import ColorPicker from '../components/ColorPicker.vue';
import Icon from '../components/Icon.vue';

const emit = defineEmits(['close', 'off']);
setPointerPref('touch'); // the second screen is touch only

const offArmed = ref(false);
let offT = null;
function turnOff() {
  if (!offArmed.value) { offArmed.value = true; clearTimeout(offT); offT = setTimeout(() => (offArmed.value = false), 2500); return; }
  emit('off');
}
</script>

<style scoped>
.cs { position: fixed; inset: 0; z-index: 30; display: flex; flex-direction: column; background: linear-gradient(180deg, rgba(var(--tint-rgb), 0.55), rgba(6, 7, 11, 0.94) 40%); backdrop-filter: blur(24px) saturate(1.2); animation: csIn 0.26s var(--ease); }
@keyframes csIn { from { opacity: 0; transform: translateY(18px); } }
.cs-top { display: flex; align-items: center; gap: 10px; padding: 14px 14px 6px 18px; }
.cs-title { flex: 1; display: flex; align-items: center; gap: 8px; font-family: var(--display); font-weight: 700; font-size: 19px; }
.cs-off { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255, 255, 255, 0.04); color: var(--muted); font: 500 12.5px var(--body); transition: all 0.15s; }
.cs-off.armed { color: #ffa39c; border-color: rgba(255, 107, 97, 0.5); background: rgba(255, 107, 97, 0.14); }
.cs-close { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.08); border: 1px solid var(--line-2); color: var(--text); }
.cs-close:active, .cs-off:active { transform: scale(0.95); }
.cs-body { position: relative; flex: 1; min-height: 0; }

/* The top screen's Settings, laid out for the small screen: sections become a chip row */
.cs-body :deep(.set-view) { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 6px; padding: 0; animation: none; }
.cs-body :deep(.rail) { flex: none; flex-direction: row; gap: 6px; padding: 4px 14px 8px; overflow-x: auto; scrollbar-width: none; }
.cs-body :deep(.rail::-webkit-scrollbar) { display: none; }
.cs-body :deep(.rail .eyebrow) { display: none; }
.cs-body :deep(.rail-item) { flex: none; min-height: 40px; padding: 0 14px; border-radius: 999px; font-size: 13.5px; white-space: nowrap; }
.cs-body :deep(.pane) { flex: 1; min-height: 0; padding: 6px 16px 40px; }
.cs-body :deep(.pane h1) { font-size: 24px; }
.cs-body :deep(.lbl) { width: 110px; }
.cs-body :deep(.row) { flex-wrap: wrap; }
.cs-toasts { top: auto; bottom: 16px; right: 16px; left: 16px; align-items: center; }
</style>
