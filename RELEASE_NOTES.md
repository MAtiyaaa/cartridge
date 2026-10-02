## Cartridge 0.9.17 · Fuse and Settings Fixes

### Fixed
- **Fuse sees Cartridge again.** Fuse reads Cartridge's status with a permission Android only gives it when Cartridge was installed first. After Cartridge was reinstalled, Fuse lost it and said "This Cartridge opens, but it can't be opened on a page or show its downloads here" with "Status unknown". Cartridge now gives Fuse read access itself every time it starts, so the order you install them in no longer matters.
- **Games uploaded from Fuse show up straight away.** Once RomM has added an uploaded game, it goes into your library at once instead of after the next sync (which, for most people, meant after restarting Cartridge).
- **Settings no longer freezes on Android.** Opening Settings → Emulators ran the desktop's Steam and emulator checks, which search through shared storage and kept Cartridge busy, so taps in Settings did nothing for a long time. On Android only Android's own checks run now.
- **Covers for games RomM has none for.** Games RomM couldn't match (or whose gamelist.xml cover it never copied) showed empty tiles, as the Xbox 360 games did, and their pages had no background. With a SteamGridDB key, Cartridge now fills in a SteamGridDB cover for those games and saves it, so it's fetched once.
- **Broken images no longer stick.** If a tunnel or proxy answered an image request with a web page, Cartridge saved that page as the image and the picture stayed blank for good. Only real images are kept now, and old saved pages are fetched again.
- **The screen no longer opens upside down on Android.** Cartridge turned with the device's motion sensor, so on an AYN Thor it could start flipped. It now always uses the normal landscape direction.
- **Xbox 360 console picture** also shows when the console's folder is named `x360`.
