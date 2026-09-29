## Cartridge 0.9.2 · The Android Expansion

Includes everything from abdu2304's 0.9.1 (launch options checked against EmuDeck and Steam ROM Manager, your own launch options, Flatpak access, Emulator setup notice).

### New
- **A real Play button on Android.** Press Play and the game opens in the right emulator: PPSSPP, Dolphin, Azahar and other 3DS emulators, melonDS, DuckStation, NetherSX2 and ARMSX2, Eden, Flycast, Cemu, aPS3e and more, plus RetroArch with the right core for everything else. Cartridge finds what is installed, and only asks an emulator to open a game the way a frontend does. It never installs or changes an emulator.
- **Ready to play, on every game.** A section on the game page that says what stands between you and the game: ROM, Emulator, BIOS, Core, Update and Storage. Ready shows **Ready to play** with every check green. If not, it says how many things are needed and what they are, and **Fix everything** does what Cartridge can (allow file access, download the game, open the emulator's download page). BIOS files are never downloaded or copied: it tells you what is missing. Android hides other apps' folders, so where a BIOS or RetroArch core can't be checked you confirm it once with **I have it**.
- **Pick the emulator per game or per console.** More → Emulator for this game, or **Change emulator**. Settings → Android → Emulators lists what was found.
- **Game bundles.** A game with an update and DLC shows as one: base game, the newest update (for example Update 3.0.4), DLC counted and expandable, each with a check for what is on this device, and "Installed on AYN Thor". The base game is what gets opened, never the update or DLC file.

### Fixed
- **D-pad right on a shelf is steady.** Pressing right quickly no longer overshoots the row, and the end of a shelf no longer jumps to the shelf above or below.
- **Smoother at 120 Hz.** The app asks Android for the screen's fastest mode, so scrolling and focus moves run at 120 on screens that support it.
