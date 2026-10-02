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
- **A new welcome.** An opening animation (any press skips it), a Your controls step that shows the controller Linux sees (or keyboard, touch or mouse) with a choice of button labels, Cartridge's own keyboard while setting up (back to Auto after), a back arrow for touch and A/B hints for controllers.
- **Download emulators in the welcome and Settings → Emulators → Get Emulators:** pick a drive, Cartridge makes an ES-DE style Emulation folder there (a ROMs folder per console, bios, emulators), then shows every console's emulators with progress bars, Download all, Continue and Later. Downloads keep going in the background.
- **RetroDECK without Flatpak:** the welcome offers to install Flatpak with your system's package manager (device password, used once), then RetroDECK.
- **Use Cartridge without RomM:** a library built from the console folders already on your device. RomM is still strongly recommended, and the welcome lists what you miss without it. Connect to RomM later in Settings → RomM.
- **Roll back** to an earlier release in Settings → Updates (automatic updates pause until Check for updates), with this version's changes shown in a card.
- **GameCube and Wii cheat codes** downloaded the way Dolphin's Download Codes does, for many more games.
- **Steam's keyboard opens by itself** when you type in Game Mode.

### Changed
- **More disc images are read:** CHD (PS1 and PS2), CSO, ZSO, GCZ and PBP, for serials, patches and add-on folders.
- **Nintendo's logo** on console cards, at the size of the text.
- **Texture Packs in Settings → Emulators is now Add-ons,** with your games by console, what Cartridge installed, and each emulator's folders.
- **Top bar redesigned:** words-only tabs with a sliding underline, LT/RT shown only when you use a controller, a quieter search field.
- **Feels smoother:** covers fade in instead of popping, and buttons, rows and cards give a small squeeze when pressed (mouse, touch and A).
- **Emulator updates:** shadPS4's launcher, Eden, Ryujinx, Flycast and mGBA update from Cartridge too. Forks, old copies and shadPS4's own versions are hidden. The page stays usable during an update, with a progress bar along the row, and every emulator has an icon.
- **Patches and Add-ons pages are split by console,** with the console's icon and the game covers.
- **Game Updates** look clearly PS3 and every row can be selected.
- **Console logos:** Nintendo's pictures are as big as the rest, and Sega and Microsoft have their wordmarks.
- **Windows smaller than 1280x800** zoom out to fit instead of clipping.

### Fixed
- **403 errors** from GitHub, RetroAchievements, SteamGridDB and Sony's PS3 update list. Cartridge now reaches them the way a browser does, and reads GitHub's release pages when its API limit is hit.
- **RPCS3 patches showed none:** the patch list is downloaded the way RPCS3 does, and an error says why when it can't be.
- **Emulator updates didn't stick** (RPCS3): the new version is remembered.
- **Skipping the welcome** no longer leaves an empty app when you have a games folder.
- **Dark text on a dark row** with mouse and touch focus.
- **EmuDeck's description** in the welcome is easier to read.
