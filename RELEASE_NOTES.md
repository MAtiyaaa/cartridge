## Cartridge 0.9.17 · Welcome Home

Everything from abdu2304's 0.9.15 (Welcome Home), working on Android too, plus fixes for Fuse, Settings, missing covers and the screen opening upside down.

### New
- **A new welcome** (from abdu2304's 0.9.15). New installs start with a short setup: your name, language, a controller check, RomM and optional extras. On Linux it also covers Steam, getting emulators (EmuDeck or RetroDECK) and a system scan; on Android those steps are left out, and emulators are still picked in Settings → Emulators. You can run it again any time from Settings → About.
- **RomM on this device** (Linux): no server? Cartridge can run RomM in the background with Podman. Offered in the welcome and in Settings → RomM. Not on Android.
- **Sign In to Emulators** (Linux, Settings → Achievements): signs PCSX2, DuckStation, Dolphin, PPSSPP and RetroArch in to RetroAchievements. Not on Android, where emulators keep their settings in their own storage.
- **Console backgrounds, rebuilt.** New animated scenes for PlayStation 2, GameCube, Wii, Xbox 360 and Switch, and any console in your library can use its own game art as a slow, dark background (Look & Feel → Background → Your games). On Android too.
- **Texture packs** (Linux): a game's More menu shows where its texture pack goes in each emulator, and Settings → Emulators lists each emulator's texture folder.
- **Per-game Steam settings** on a console's page (Linux, or Android with Steam & PC game apps on).
- **Media bar size** in Look & Feel: Compact, Spacious or Large.
- **A hello** with your name when Cartridge starts.

### Changed
- **Fetch All Metadata** (was Fetch All Logos): logos, icons, sharp backgrounds, covers and screenshots in one go.
- **Forks** are grouped under one Forks entry in emulator lists.

### Fixed
- **Fuse sees Cartridge again.** Fuse reads Cartridge's status with a permission Android only gives it when Cartridge was installed first. After Cartridge was reinstalled, Fuse lost it and said "This Cartridge opens, but it can't be opened on a page or show its downloads here" with "Status unknown". Cartridge now gives Fuse read access itself every time it starts, so the order you install them in no longer matters.
- **Games uploaded from Fuse show up straight away.** Once RomM has added an uploaded game, it goes into your library at once instead of after the next sync (which, for most people, meant after restarting Cartridge).
- **Settings no longer freezes on Android.** Opening Settings → Emulators ran the desktop's Steam and emulator checks, which search through shared storage and kept Cartridge busy, so taps in Settings did nothing for a long time. On Android only Android's own checks run now.
- **Covers for games RomM has none for.** Games RomM couldn't match (or whose gamelist.xml cover it never copied) showed empty tiles, as the Xbox 360 games did, and their pages had no background. With a SteamGridDB key, Cartridge now fills in a SteamGridDB cover for those games and saves it, so it's fetched once.
- **Broken images no longer stick.** If a tunnel or proxy answered an image request with a web page, Cartridge saved that page as the image and the picture stayed blank for good. Only real images are kept now, and old saved pages are fetched again.
- **The screen no longer opens upside down on Android.** Cartridge turned with the device's motion sensor, so on an AYN Thor it could start flipped. It now always uses the normal landscape direction.
- **Xbox 360 console picture** also shows when the console's folder is named `x360`.
- **From abdu2304's 0.9.15:** shadPS4 shortcuts always use the Qt launcher (no more black screen), games started from Steam in Game Mode no longer bring Cartridge up first, patches follow the emulator copy a game uses, PS3 patches find more serials, Vita installs run in the background, games installed in Vita3K or RPCS3 before Cartridge are recognised, the manual shows once, game page headers fade in with no visible edge, and moving between rows glides.
