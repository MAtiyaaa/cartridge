## Cartridge 0.9.1 · Fixes

### Changed
- **Launch options checked against EmuDeck and Steam ROM Manager.** Cemu, Dolphin, Eden, Citron and yuzu now start with `vblank_mode=0` in front, as EmuDeck does. PPSSPP uses `--fullscreen` outside EmuDeck, and Azahar gets `-f` when it isn't the Flatpak. Games already added with these show **Update** on their console page in Settings → Steam.
- **Older PCSX2 versions get their own launch options.** Setup reads the version from inside the AppImage, and the old 1.6 builds get the flags they understand.

### New
- **Your own launch options from Emulator setup.** Pick a console, then **Type your own launch options** (`{ROM}` is where the game goes).
- **Allow access** for a Flatpak emulator that can't see your games folder. It asks first, and only changes that Flatpak's permissions.
- **Existing users are told about Emulator setup** once, with a way to open it.

### Fixed
- **Emulator setup no longer freezes the screen** while it reads what's inside the files it found. That now happens in the background.
- **Re-downloading a damaged game keeps your copy until the new one is good.** If the download fails or you stop it, your old copy comes back.
- **Emulator for this game only updates that game's shortcut,** not every game of its console.
- **Test with one game** picks a game that isn't in Steam yet, and tells you what to do next.
