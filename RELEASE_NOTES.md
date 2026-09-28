## Cartridge 0.7.8 · Launch Fixes

### Fixed
- **RetroArch games didn't start** (NES, SNES, Game Boy, N64, Dreamcast and the rest). Cartridge gave RetroArch the full path to its core, which the Flatpak RetroArch can't see on systems like Bazzite, where home is under /var/home. Cores now go by name, the way EmuDeck's Steam ROM Manager setup does it, and RetroArch finds them itself.
- **Xbox games didn't start.** Cartridge looked for the wrong EmuDeck launcher and left out xemu's options. It now uses `xemu-emu.sh -full-screen -dvd_path "<game>"`, like EmuDeck.
- **Xbox 360 games didn't start.** Xenia runs under Proton, so the game now gets a Windows path (`"Z:<game>"`), like EmuDeck.
- **Shortcuts made by Steam ROM Manager weren't recognised.** ROM Manager puts the arguments in Target and leaves Launch options empty. Cartridge now reads them, so those games show as In Steam and their setup is copied for new games.
- **The same game could show twice in a series**, and near-identical series ("Mario" and "Mario Bros.") showed separately. They are now one series.
- Launch options for PS1, PSP, DS and Switch (Ryujinx) now match EmuDeck's.

### New
- **Pick the emulator for each console (Settings → Steam → a console → Emulator).** Lists the emulators installed for that console, including RetroArch with each core you have, for example DuckStation or RetroArch · SwanStation for PS1. New shortcuts use your pick.
- **Update games already in Steam.** When a console's setup changes, its page says how many games use the older setup, and **Update** replaces those shortcuts.
- **Game icons in Steam.** Added games get an icon: SteamGridDB's square icon, or the cover cut square.
- **New genre tiles**, each in its own colour with a genre icon and a column of covers.
- **Collections, series and genres are split by console**, with the console's logo on each section, when they span more than one.
- **New Downloads screen when nothing is downloading.**
