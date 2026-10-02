## Cartridge 0.9.17 · Fuse and Settings Fixes

### Fixed
- **Fuse sees Cartridge again.** Fuse reads Cartridge's status with a permission Android only gives it when Cartridge was installed first. After Cartridge was reinstalled, Fuse lost it and said "This Cartridge opens, but it can't be opened on a page or show its downloads here" with "Status unknown". Cartridge now gives Fuse read access itself every time it starts, so the order you install them in no longer matters.
- **Games uploaded from Fuse show up straight away.** Once RomM has added an uploaded game, it goes into your library at once instead of after the next sync (which, for most people, meant after restarting Cartridge).
- **Settings no longer freezes on Android.** Opening Settings → Emulators ran the desktop's Steam and emulator checks, which search through shared storage and kept Cartridge busy, so taps in Settings did nothing for a long time. On Android only Android's own checks run now.
