## Cartridge 0.9.38 · More Drives, Clearer Glass

### New
- **Games on more than one drive:** Settings → Storage → Games on Other Drives. Add a drive (an SD card or a second disk) and Cartridge makes an Emulation/roms folder on it with a folder for each console you have games for, finds games on every drive, and tells your emulators about the new folders (Flatpak emulators are allowed to read it too). Choose where new games go: the drive with the most free space, this device, or one drive. A drive that isn't plugged in says so and nothing is lost.
- **Mods for PS4 games in shadPS4:** Game Add-ons now has a Mods tab for PS4 games. A mod goes in the folder shadPS4 lays over the game (`<game folder>-mods`), in the game's own layout, so the game's files are never changed and removing the mod puts everything back.
- **BIOS from RomM by itself:** when a game is downloaded for a console whose BIOS or firmware isn't set up, Cartridge fetches it from your RomM server once and puts it in place.
- **The tour shows every page:** Home, Library, Consoles, Achievements and Settings each get a step, and button names are shown as the real buttons for your controller (or keys when you use a keyboard and mouse).
- **Syncing ring:** Syncthing progress in the top bar is a ring like the Steam one, with a tick when it finishes.

### Changed
- **Elements are Plain and Glass:** OLED Black stays under Background only. Glass is now clear glass with a bright edge and a soft shine, tinted by the colour you picked (white by default) instead of grey. Plain is your colour solid. Text on both picks dark or light to stay readable.
- **Installing Flatpak** asks for your device password inside Cartridge, used once and never saved, instead of waiting for a desktop password window that never appears in Game Mode.

### Fixed
- **Cartridge hanging when you picked a Flatpak emulator without Flatpak installed:** a step ran in a way that froze the app, and the password window it waited for didn't exist in Game Mode. Both are gone, and every step has a time limit.
- **shadPS4, SharpEmu and KytyPS5 saying "already on this device"** instead of opening their sheet in Settings → Emulators. shadPS4's launcher was being hidden from the update list, and a fresh install didn't refresh it.
- **SharpEmu, KytyPS5 and Ryujinx icons missing:** they come from working addresses now.
- **LT/RT at launch:** Cartridge listens for the controller before anything else loads. If the triggers still don't work right after start, the log now records what the controller sent in its first 20 seconds.
