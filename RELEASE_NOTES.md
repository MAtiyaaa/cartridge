## Cartridge 0.7.10 · Emulator List

### Changed
- **The Emulator picker only lists what you have, once.** EmuDeck's launchers are often a wrapper: `dolphin-emu.sh` runs the Dolphin Flatpak, `pcsx2-qt.sh` runs the AppImage in ~/Applications. Cartridge now reads the launcher and doesn't list that same copy again. A copy that really is separate (an AppImage in another folder) is still listed.
- **Cartridge knows many more emulators**, taken from EmuDeck's and Steam ROM Manager's setups: MAME (arcade), ares (NES, SNES, N64, Game Boy, Mega Drive and more), simple64 and Parallel Launcher (N64), bsnes (SNES), Nestopia (NES), Stella (Atari 2600), Ymir (Saturn), ScummVM and BigPEmu, plus Flycast for NAOMI and Atomiswave. They're only offered when installed.
- **Many more RetroArch cores and consoles**, including Atari, Amiga, MSX, PC Engine CD, Neo Geo, WonderSwan, 3DO and DOS.
- Flycast gets its fullscreen option when it isn't started through EmuDeck.
