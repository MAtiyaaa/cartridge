import { createApp } from 'vue';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource-variable/outfit';
import '@fontsource-variable/inter';
import '@fontsource-variable/nunito';
import '@fontsource-variable/rubik';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/lexend';
import '@fontsource-variable/archivo/wdth.css';
import './styles.css';
import App from './App.vue';
import { installSprings } from './motion.js';
installSprings(); // spring easings as CSS tokens (0.9.37), before the first paint
createApp(App).mount('#app');
