## Cartridge 0.9.18 · Textures In Place

### New
- **GameBanana for PS2 games too:** PS2 texture packs and mods from GameBanana are listed after the EmuCoreX catalog's packs, and go in the same folder.

### Changed
- **Texture packs and mods go in the exact folder each emulator reads for that game,** whatever folders the pack was zipped in:
  - **PCSX2 and DuckStation:** `textures/<serial>/replacements`, plus DuckStation's per-game `config.yaml`. Packs with no replacements folder have their images put in one.
  - **PPSSPP:** the folder holding the pack's `textures.ini`, under `PSP/TEXTURES/<game ID>`.
  - **Dolphin:** `Load/Textures/<game ID>`, with packs in a 6 or 3 character ID folder unwrapped.
  - **Azahar and Citra:** `load/textures/<title ID>`.
  - **Cemu:** each graphic pack (a folder with `rules.txt`) in its own folder in `graphicPacks`.
  - **Switch emulators:** a mod's own folder name is kept, and Atmosphere-style mods (`contents/<title ID>/romfs`) get the mod's name.
- **PS3 serials are found in more places:** game folders nested one or two levels deeper, and RPCS3's own game list for games it has already booted.

### Fixed
- **Vita3K installs:** "no Qt platform plugin could be initialized". Vita3K builds without Qt's hidden display mode are run again on the normal display, and closed as soon as the game is installed. The same fix applies to Vita firmware installs.
