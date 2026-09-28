<template>
  <img v-if="icon" class="padbtn glyph" :src="icon" :alt="b" draggable="false" />
  <span v-else class="padbtn" :class="'b-' + b.toLowerCase()">{{ b }}</span>
</template>
<script setup>
import { computed } from 'vue';
import { promptIcon } from '../prompts.js';
const props = defineProps({ b: String });
const icon = computed(() => promptIcon(props.b));
</script>
