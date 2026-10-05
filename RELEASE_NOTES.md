## Cartridge 0.9.33 · Linked Folders

### New
- **Linked Folders** (Settings → Emulators): a fork can play with the saves of the emulator it comes from. Cartridge finds each fork (shadPS4 GR2 and others, portable or with its own folder) and suggests linking its save folder to the original's. A fork's own saves are never deleted: they're set aside as `<folder>.cartridge-kept` and come back when you remove the link. New Link joins any two folders you pick. A fork installed from a GitHub link also has Share Saves With the Original in its Manage sheet.
- **Download Latest Patches for RPCS3 and shadPS4:** next to Cemu's Download Latest Community Graphic Packs, in a game's Add-ons. RPCS3's comes from its own patch service, as RPCS3's Download latest patches does. shadPS4's comes from the shadPS4 and GoldHEN patch collections, as its patch manager does.

### Changed
- **No text cut off with "…" anywhere:** game names, titles, paths, trophy and add-on descriptions wrap onto a new line instead. Game card titles and trophy descriptions no longer stop at two lines.
- **Game Disc and Game Shelf react to you:** tap the disc or cartridge and the next game comes in; tap a spine on the shelf and it slides out, tap it again to open the game. A selected disc spins faster and lifts, and games on this device glow.

### Fixed
- **Console cards:** checked on all 40 consoles with their real logos, on the Consoles page and on Start at every tile size, at 1280x800 and 1920x1080: the console name, the maker's logo and the game count never overlap.
