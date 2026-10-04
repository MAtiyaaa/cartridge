<template>
  <button class="toggle" :class="{ on: modelValue, compact }" data-focus :title="compact ? (modelValue ? 'On' : 'Off') : undefined" @click="$emit('update:modelValue', !modelValue)">
    <div v-if="!compact"><div>{{ label }}</div><div v-if="desc" class="desc">{{ desc }}</div></div>
    <span class="sw" />
  </button>
</template>
<script setup>
defineProps({ modelValue: Boolean, label: String, desc: String, compact: Boolean });
defineEmits(['update:modelValue']);
</script>
<style>
.toggle.compact { width: auto; padding: 6px 8px; background: none; flex: none; }
.toggle[disabled] { cursor: default; }
.toggle[disabled] > div > div:first-child, .toggle[disabled] .sw { opacity: 0.45; }
</style>
