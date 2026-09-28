## Cartridge 0.7.9 · Every Setup

### Changed
- **Cartridge finds your emulators however you installed them.** Settings → Steam used to look only for EmuDeck launchers, AppImages and one Flatpak per emulator. It now also finds:
  - **Programs from your distro** (for example `dolphin-emu`, `pcsx2-qt`, `retroarch` on your PATH).
  - **More Flatpaks**: Ryujinx (Ryubing), Lime3DS and Citra, Eden, Citron, Sudachi, mGBA, Flycast, melonDS, Rosalie's Mupen GUI.
  - **RetroArch from anywhere**: EmuDeck, Flatpak, AppImage, your distro, or RetroArch on Steam, each with the cores it has.
- **Every copy is listed.** If you have an emulator twice (say the Flatpak and an AppImage), both show in the Emulator picker and you choose.
- **Standalone emulators for more consoles**: mGBA for Game Boy, GBC and GBA, Rosalie's Mupen GUI for N64, Flycast for Dreamcast, next to RetroArch.

### Fixed
- **Games on a symlinked home folder** (Bazzite and other image-based systems) are now given to emulators by their real path, which sandboxed emulators can always open.
