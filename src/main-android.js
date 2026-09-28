// Entry point of the Android build (index.html is pointed here by vite.config.mjs in android mode)
import { ready, isCompanion } from './android/bridge.js';

ready.then(async () => {
  if (isCompanion) {
    await import('./android/companion.js');
    return;
  }
  const android = await import('./android/app.js');
  await android.beforeMount().catch((e) => console.error(e));
  await import('./main.js');
  android.afterMount();
});
