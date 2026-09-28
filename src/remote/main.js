// Phone remote: the page a phone opens from a Cartridge device (http://<device>:47280/remote/)
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
import { cart } from './hub.js';

window.cart = cart; // before the store loads: it talks to the selected device

Promise.all([import('vue'), import('./RemoteApp.vue')]).then(([{ createApp }, { default: RemoteApp }]) => createApp(RemoteApp).mount('#app'));
