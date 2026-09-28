import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// `vite build --mode android` builds the same UI for the Android app (see scripts/build-android.mjs).
// Everything Android-only sits behind import.meta.env.MODE === 'android' and is dropped from the desktop build.
const ANDROID_CSP = "default-src 'self' http://127.0.0.1:*; img-src 'self' http://127.0.0.1:* http://*.localhost:* data: blob:; connect-src 'self' http://127.0.0.1:* https://api.github.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:";

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    mode === 'android' && {
      name: 'cartridge-android-csp',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => html
          .replace(/(http-equiv="Content-Security-Policy" content=")[^"]*"/, `$1${ANDROID_CSP}"`)
          .replace('/src/main.js', '/src/main-android.js'),
      },
    },
  ],
  base: './',
  build: {
    outDir: mode === 'android' ? 'android-dist' : 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 4000,
    // One bundle on Android too: the lazy imports there only order startup, they are not for size
    ...(mode === 'android' && { rollupOptions: { output: { codeSplitting: false } } }),
  },
}));
