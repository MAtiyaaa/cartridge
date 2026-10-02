## Cartridge 0.9.16 · Your Emulators

### New
- **Emulators has its own pages** (Settings → Emulators, LB/RB): Overview, Updates, Game Updates, Patches, Texture Packs and Console Folders. Each emulator shows its own icon, taken from your installed copy.
- **Update your emulators from Cartridge.** Updates checks the emulators you have against their own releases: Flatpaks through Flatpak, AppImages from the emulator's own GitHub releases, swapped in place so your Steam shortcuts keep working. Nothing is updated until you press Update. EmuDeck's launchers still update through EmuDeck.
- **PS3 game updates.** Cartridge reads Sony's own update list for each PS3 game (the same list ps3.aldostools.org uses), shows what's newer than your copy, and installs the updates into RPCS3 in order. Also on the game page when one is waiting.
- **Patches and cheats for more consoles.** GameCube and Wii through Dolphin (its patches, Action Replay and Gecko codes) and PSP through PPSSPP (its cheat list), in the same sheet as the PlayStation patches. When PPSSPP has no cheat list yet, Cartridge fetches it from PPSSPP's own source. Turning on a cheat also turns on the emulator's cheats setting, and only what Cartridge turned on is turned off again.
- **RPCS3's patch list** is fetched the way RPCS3 does it when it's missing or a week old, so games like Uncharted 2 show their patches without opening RPCS3 first. Patches for another version of the game are listed too, with a note.
- **Turn custom textures on from Cartridge** for PCSX2, DuckStation, Dolphin, PPSSPP and Azahar, written the way each emulator writes it. Close the emulator first. Cartridge only turns off what it turned on.
- **Mods for Switch and Wii U:** the mod folder for each game in Eden, Citron, Yuzu and Ryujinx, and Cemu's graphic packs folder.
- **More games recognised for texture packs:** PS1 discs (from the disc itself), GameCube and Wii in RVZ, WIA, WBFS and CISO, 3DS .cia and Switch .nsp.
- **PS3 and Vita firmware from RomM** now installs into RPCS3 and Vita3K.
- **Add to a Steam collection** from a game's More menu.
- **Backgrounds follow your library:** your five most played consoles come first in the picker, each with its scene, or its own games panning when it has no scene.

### Changed
- **Downloads run in their own thread,** so nothing else in Cartridge can slow them down. Game Mode's process check no longer holds anything up.
- **Controller movement:** up and down always go to the very next row and start at its first item (grids keep their column), and left and right stay in the row.
- **Game page:** the header has Ready to play and More only, and going up to it shows the whole header. More is split into Game, Steam, Emulator, Details and Artwork (Manual is here now) and Options (Hide, Re-download, Delete).
- **Steam artwork for games** uses the same sharp background Cartridge shows for the hero and banner.
- **Console backgrounds** for PS2, GameCube, Wii, Xbox 360 and Switch rebuilt from fine lines of light, the way Ribbons is made.
- **Welcome:** each step sits in a card over the background, it opens and closes with a short animation, picks up where you left it, and its system scan shows your console folders (fix a match), games already in Steam and anything that needs you.
- **Consoles page and Achievements** show console makers and consoles as logos at text size.
- **Continue playing** shows the console as a logo and the device in a quieter label.
- **RomM on this device** asks for metadata keys (IGDB, ScreenScraper) as a step after setup, keeps them for updates, and uses the name you gave it. The "on another computer" QR code opens RomM's setup guide.
- **Recommended for you** drops the "Same series" line.

### Fixed
- **RetroAchievements sign-in** works again and shows RetroAchievements' own error when it fails.
- **Vita games installed in Vita3K before Cartridge** no longer ask to be installed again.
- **PS4 trophies** of games not on this device show the game's name instead of an NPWR code, or say they're unnamed and can be linked.
- **Developer names:** games with two developers show both (Tokyo Jungle shows Crispy's! and Japan Studio).
- **Home shelf titles** no longer shrink and clip as you scroll, and are a bit bigger.
- **The welcome's "Your system" step** scrolls.
- **The latest unlocks** on the RetroAchievements and Trophies tabs are as big as on All.
- **Patches sheet** focus box is no longer cut by a dark line.
