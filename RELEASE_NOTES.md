## Cartridge 0.9.15 · Welcome Home

0.9.15 brings together everything planned for 0.9.3 M and 0.9.4. The 0.9.3 parts ended with L, and the version number now matches GitHub again.

### New
- **A new welcome.** New installs start with a short setup on the Ribbons background: your name, language, a controller check, instant Steam changes, getting emulators (EmuDeck or RetroDECK, or your own), RomM, a scan of your system, optional extras and adding Cartridge to Steam. Existing users are offered it once. It's always in Settings → About → Run the Welcome Again, starts from your current settings and resets nothing.
- **Get your emulators.** If you have neither EmuDeck nor RetroDECK, the welcome can download EmuDeck's official app and open it (Desktop Mode), or install RetroDECK from Flathub with a progress bar (works in Game Mode). EmuDeck or RetroDECK installs the emulators; Cartridge never does.
- **RomM on this device.** No server? Cartridge can run RomM here in the background with Podman (RomM's own setup: RomM and its database). You choose your own RomM username and password, which you can use from any browser or device. It starts with the device and keeps running in Game Mode. Offered in the welcome and in Settings → RomM, with Update RomM.
- **Sign In to Emulators** (Settings → Achievements): signs PCSX2, DuckStation, Dolphin, PPSSPP and RetroArch in to RetroAchievements, each the way it does it itself. It lists what it changes first; your password goes to RetroAchievements once and is never saved.
- **Console backgrounds, rebuilt.** New animated scenes for PlayStation 2, GameCube, Wii, Xbox 360 and Switch, and any console in your library can use its own game art as a slow, dark background (Look & Feel → Background → Your games). Wii U, DS, 3DS and Xbox now use their games' art.
- **Texture packs** (the first part of Add-ons): a game's More menu shows where its texture pack goes in each emulator that can run it (PCSX2, DuckStation, Dolphin, PPSSPP, Azahar), read from the emulator's own settings, and whether custom textures are on, with how to turn them on. Settings → Emulators lists each emulator's texture folder. Downloads of packs, cheats and mods come in a later update.
- **Per-game Steam settings** on a console's page: each game can have its own emulator, Target, Start in and Launch options, or be removed from Steam.
- **Media bar size** in Look & Feel: Compact, Spacious or Large.
- **A hello** with your name when Cartridge starts.

### Fixed
- **shadPS4 (top priority).** Cartridge sometimes picked one of the shadPS4 launcher's own core AppImages (from its versions folder) as the Target, which starts with a black screen. The Target is now always the Qt launcher, with "-d -g" and Start in written exactly as shadPS4's own shortcuts write it. Press Update on the PS4 console page once.
- **Launching a game from Steam in Game Mode** no longer brings Cartridge up first: it steps aside until the game is on screen, then waits behind it.
- **Patches follow the emulator the game uses:** a fork (such as a shadPS4 fork), a portable copy, or the Flatpak or AppImage of RPCS3 and PCSX2.
- **PS3 patches** find the serial in more places: ISO folders, more serial styles in names, and .pkg files.
- **Vita installs** run in the background like RPCS3's, without opening Vita3K's window.
- **Games installed in Vita3K or RPCS3 before Cartridge** are recognised, no reinstall needed to manage them.
- **Manual** is only in More (it showed twice).
- **Game page headers** fade into the page with no visible edge.
- **Moving between rows** with up and down glides smoothly instead of jumping.

### Changed
- **Fetch All Metadata** (was Fetch All Logos): logos, icons, sharp backgrounds, covers and screenshots in one go.
- **Forks** are grouped under one Forks entry in emulator lists.
