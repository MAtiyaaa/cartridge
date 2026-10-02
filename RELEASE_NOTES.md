## Cartridge 0.9.17 · Set Up In One Place

### New
- **Add-on downloads.** A game's More → Emulator → Add-ons, and the new Add-ons page in Settings → Emulators, show what can be downloaded for it:
  - **PS2 texture packs** from the EmuCoreX texture catalog (the one ARMSX2 uses, in the PC format), installed into PCSX2's textures folder for that game. Each pack is checked against the catalog's checksum before anything is installed.
  - **Mods for other consoles** (Switch, Wii U, GameCube, Wii, 3DS, PSP) from GameBanana, installed into the emulator's folder for that game.
  - An add-on never replaces a file that's already there, and Remove deletes only the files Cartridge put in.
- **Frame Generation** (Settings → Steam): lsfg-vk or MAKO, whichever is installed, for every game, a console or one game. It goes at the start of Launch options, after settings like vblank_mode=0, before the one %command%.
- **shadPS4 version per game:** on a PS4 game's Steam settings, start it with one of the versions in shadPS4's launcher.
- **Pick your own emulators:** a third choice in the welcome, next to EmuDeck and RetroDECK, and Settings → Emulators → Get Emulators. Each console's emulators, a green check for the ones you have, and Download for the rest. Downloads come from the emulator's own GitHub releases (an AppImage into ~/Applications), or as a Flatpak from Flathub when there's no AppImage.
- **Set up your emulators from Cartridge** (Emulator setup):
  - Get every console's BIOS and firmware from RomM in one go. Files are copied into each emulator that reads them, without replacing anything. PS3 and Vita firmware is installed, and Switch keys and firmware are put in place for Eden and the other yuzu-family emulators.
  - Add your console folders to the PCSX2, DuckStation and Dolphin game lists.
- **RomM on this device sets up Podman itself.** It downloads Podman when there's none, and asks for your device password once to let Podman run as you. The password is never saved.
- **Multi-disc games** get a playlist (.m3u) in their folder, so Steam starts disc 1 and the emulator can change discs.

### Changed
- **More disc images are read:** CHD (PS1 and PS2), CSO, ZSO, GCZ and PBP, for serials, patches and add-on folders.
- **Nintendo's logo** on console cards, at the size of the text.
- **Texture Packs in Settings → Emulators is now Add-ons,** with your games by console, what Cartridge installed, and each emulator's folders.
