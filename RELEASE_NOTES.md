## Cartridge 0.9.19 · Straight In

Android fixes. Nothing changes on Linux.

### Fixed
- **No more emulator setup screen on Android.** Cartridge could open the Linux emulator setup (the one for Steam shortcuts) when it started. Its Done button did nothing on Android, and while it was open it searched your storage, so the top bar said Not connected and the other tabs had no games until you restarted. It now only opens on Android when Settings → Android → Steam & PC game apps is on, as intended.
- **Signing in to RomM works straight away.** After signing in for the first time, the connection and your library now load at once instead of after a restart.
