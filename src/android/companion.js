// Second-screen app (bottom screen of the AYN Thor and other dual-screen devices)
import { createApp } from 'vue';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource-variable/outfit';
import '../styles.css';
import Companion from './Companion.vue';

createApp(Companion).mount('#app');
