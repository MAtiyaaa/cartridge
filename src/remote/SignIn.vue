<template>
  <form class="si" :class="{ page, shake }" @submit.prevent="submit" @animationend="shake = false">
    <div class="si-mark">
      <div class="si-halo"><Icon name="mdiShieldLockOutline" :size="page ? 40 : 30" /></div>
      <span class="si-dev"><Icon :name="kindIcon(device.kind)" :size="15" />{{ device.name }}</span>
    </div>
    <h2>Sign in</h2>
    <p class="si-sub">This Cartridge asks for a username and password before a phone can use it.</p>

    <label class="si-field" :class="{ filled: user }">
      <Icon name="mdiAccountOutline" :size="20" />
      <input ref="userEl" v-model="user" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Username" enterkeyhint="next" @keydown.enter.prevent="passEl?.focus()" />
    </label>
    <label class="si-field" :class="{ filled: pass }">
      <Icon name="mdiLockOutline" :size="20" />
      <input ref="passEl" v-model="pass" :type="reveal ? 'text' : 'password'" autocomplete="current-password" placeholder="Password" enterkeyhint="go" />
      <button type="button" class="si-eye" :aria-label="reveal ? 'Hide password' : 'Show password'" @click="reveal = !reveal"><Icon :name="reveal ? 'mdiEyeOffOutline' : 'mdiEyeOutline'" :size="20" /></button>
    </label>

    <Transition name="si-err"><p v-if="err" class="si-error"><Icon name="mdiAlertCircleOutline" :size="16" />{{ err }}</p></Transition>

    <button class="si-go" :disabled="!user || !pass || busy">
      <span v-if="busy" class="si-spin" />
      <template v-else><Icon name="mdiLoginVariant" :size="20" />Sign in</template>
    </button>
    <button v-if="!page" type="button" class="si-cancel" @click="$emit('cancel')">Cancel</button>
    <p class="si-foot">Set on the device in Settings → Phone remote → Sign-in for phones.</p>
  </form>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { pairLogin, kindIcon } from './hub.js';
import Icon from '../components/Icon.vue';

const props = defineProps({ device: { type: Object, required: true }, page: Boolean });
const emit = defineEmits(['done', 'cancel']);
const user = ref('');
const pass = ref('');
const reveal = ref(false);
const busy = ref(false);
const err = ref('');
const shake = ref(false);
const userEl = ref(null);
const passEl = ref(null);

async function submit() {
  if (!user.value || !pass.value || busy.value) return;
  busy.value = true; err.value = '';
  try { await pairLogin(props.device.id, user.value.trim(), pass.value); emit('done'); }
  catch (e) {
    err.value = /fetch|network/i.test(e.message) ? `Can't reach ${props.device.name}` : e.message;
    pass.value = ''; shake.value = true;
    await nextTick(); passEl.value?.focus();
  }
  busy.value = false;
}
onMounted(() => { if (!props.page) setTimeout(() => userEl.value?.focus(), 250); });
</script>

<style scoped>
.si { width: 100%; max-width: 380px; display: flex; flex-direction: column; align-items: stretch; gap: 12px; text-align: center; }
.si.page { margin: auto; padding: 28px 24px 34px; border-radius: 28px; background: rgba(14, 16, 26, 0.72); border: 1px solid var(--line-2); backdrop-filter: blur(24px) saturate(1.3); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); }
.si.shake { animation: si-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
@keyframes si-shake { 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
.si-mark { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 4px; }
.si-halo { width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; color: var(--primary-t); background: radial-gradient(circle at 50% 40%, rgba(var(--primary-rgb), 0.45), rgba(var(--primary-rgb), 0.1) 64%, transparent 74%); box-shadow: inset 0 0 0 1px rgba(var(--primary-l-rgb), 0.3); }
.si:not(.page) .si-halo { width: 64px; height: 64px; }
.si-dev { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.07); border: 1px solid var(--line); color: #dfe3ea; font: 600 12.5px var(--body); }
h2 { margin: 0; font: 800 26px var(--display); }
.si-sub { margin: -4px 0 6px; color: var(--muted); font-size: 14px; line-height: 1.5; }
.si-field { display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 8px 0 16px; border-radius: 16px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); color: var(--muted); text-align: left; transition: border-color 0.2s, box-shadow 0.2s, color 0.2s; }
.si-field:focus-within { border-color: rgba(var(--primary-l-rgb), 0.7); box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.18); color: var(--primary-t); }
.si-field.filled { color: #dfe3ea; }
.si-field input { flex: 1; min-width: 0; height: 100%; background: none; border: 0; outline: none; color: var(--text); font: 500 16px var(--body); }
.si-field input::placeholder { color: var(--dim); }
.si-eye { flex: none; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; color: var(--muted); }
.si-eye:active { background: rgba(255, 255, 255, 0.08); }
.si-error { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; color: #ffa39c; font-size: 13.5px; }
.si-err-enter-active, .si-err-leave-active { transition: opacity 0.2s, transform 0.2s; }
.si-err-enter-from, .si-err-leave-to { opacity: 0; transform: translateY(-4px); }
.si-go { display: flex; align-items: center; justify-content: center; gap: 8px; height: 54px; margin-top: 6px; border-radius: 999px; background: var(--grad); color: var(--on-primary); font: 700 16px var(--body); box-shadow: 0 12px 30px rgba(var(--primary-rgb), 0.38); transition: opacity 0.2s, transform 0.15s; }
.si-go:active { transform: scale(0.98); }
.si-go:disabled { opacity: 0.5; box-shadow: none; }
.si-spin { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(255, 255, 255, 0.35); border-top-color: var(--on-primary); animation: si-rot 0.8s linear infinite; }
@keyframes si-rot { to { transform: rotate(360deg); } }
.si-cancel { min-height: 44px; color: var(--muted); font: 600 14px var(--body); }
.si-foot { margin: 6px 0 0; color: var(--dim); font-size: 12px; line-height: 1.45; }
</style>
