// Second-screen app (bottom screen of the AYN Thor and other dual-screen devices).
// Same store, theme, fonts and background as the main window, laid out for a small touch screen.
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
import '../styles.css';
import Companion from './Companion.vue';

// A fixed 600px canvas the WebView scales to the screen, so it looks the same on any bottom screen
const vp = document.createElement('meta');
vp.name = 'viewport';
vp.content = 'width=600, user-scalable=no';
document.head.appendChild(vp);

createApp(Companion).mount('#app');
