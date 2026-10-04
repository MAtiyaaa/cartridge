## Cartridge 0.9.21 · Catching Up

Everything from abdu2304's 0.9.16 to 0.9.22, plus SD card installs and a smoother second screen on Android. On Linux, Cartridge now works exactly as abdu2304's 0.9.22 does, with this fork's phone remote and Fuse bridge on top.

### New
- **Start:** a new tab of tiles you arrange yourself: Continue playing, a clock that follows the time of day, storage, consoles, new games, recently played, trophies and more. Hold A on a tile to move or resize it. Home is still where Cartridge opens.
- **Install to an SD card (Android):** with an SD card or USB drive in, a download asks which drive it goes to. Pick that drive's ROMs folder once and Cartridge remembers it, making the console folders it needs. Downloading many games at once asks only once. Games already on the card show as on this device. Settings → Storage → Drives shows each drive's free space and folder, with a switch to stop asking.
- **New backgrounds:** Aurora, Contours, Drift and Tide join Ribbons and XMB Waves.
- **Use Cartridge without RomM:** play the games already in your console folders, from the welcome. RomM is still recommended.
- **What's new in this version** shows in Settings → Updates.
- **Linux (from abdu2304):** emulator updates and Get Emulators in one list, Game Add-ons (texture packs, mods, patches and PS3 game updates), Dolphin and PPSSPP cheats, Frame Generation for Steam games, Settings → Sync for Syncthing, Roll back to an earlier version, and Steam's keyboard opening by itself in Game Mode.

### Changed
- **Top bar redesigned:** icon tabs, the current one opens out with its name, search folds into a button.
- **Pages move with you:** a tab slides in from its side, a deeper page settles in, back eases out.
- **Moving with the controller:** up and down always go to the very next row, left and right stay in the row.
- **Game page:** Re-download and Delete are in More → Options. Headers use SteamGridDB's art, with the cover blurred when it has none.
- **Rumble when switching pages** with LB/RB and LT/RT.
- **Linux works as abdu2304's build:** this fork's Android changes no longer touch the Linux version (its Quick Menu, focus and scrolling tweaks, sync retries and the rest are Android only now). Roll back uses this fork's releases.

### Fixed
- **Second screen (Android):** moving between games and consoles no longer fades through black. The art goes straight from one picture to the next and only the details animate.
- **Home vanishing** after a couple of moves, and missing Home headers (abdu2304's 0.9.22 fix).
- **LT/RT at launch:** the first trigger pull now switches tabs.
