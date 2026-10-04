## Cartridge 0.9.29 · The Syncthing Update

### New
- **Every save, found and named:** Cartridge finds the saves on this device for Eden, Citron and the yuzu family, Ryujinx, RPCS3, shadPS4, Vita3K, PPSSPP, PCSX2, DuckStation, Dolphin, Cemu, Azahar, Xenia, RetroArch and games that keep a save beside them. Each one is matched to its game by the save's own serial or title ID (a memory card lists every game on it). They show in Settings → Syncthing → Games and in a game's More → Emulator → Saves on This Device. Cartridge only reads them.
- **Make this your main Syncthing device:** on a Syncthing nobody has set up yet, Cartridge shares one folder per console's saves (Switch, PS3, PS4, Vita, PSP, PS2, PS1, GameCube, Wii, Wii U, 3DS, Xbox 360, RetroArch) at your emulators' own save folders. Nothing is moved or copied. Syncthing keeps 30 days of older versions, so a replaced save can be restored. A Syncthing you already use is never changed: Cartridge only reads it.
- **Join your main device:** on another device, enter the main device's ID (or show this one's ID and QR code). The save folders arrive at that device's own emulators' folders, receive only until you choose Make Two-Way. Eden on one device and Citron on another share Switch saves.
- **Older versions of a save:** a synced save's menu shows the versions Syncthing kept, and puts one back. Copies Syncthing kept when two devices changed the same save are counted on the game's saves.
- **Welcome:** Sync My Saves Between My Devices sets it all up, installing Syncthing if needed. I Already Use Syncthing only reads your setup.
- **GPU Always:** Look & Feel → Advanced → Rendering. Uses the GPU in Game Mode on handheld-size screens too, much smoother on handhelds with a strong GPU like the ROG Ally. After the restart Cartridge asks if it looks right, and goes back to Auto by itself if you can't answer.
- **Recently Launched on the PlayStation 4 page:** each PS4 game you start, with the shadPS4 version that ran it, while "shadPS4: show which version ran a game" is on.
- **Xbox 360 trophy codes named:** Xenia games known only by their title ID take their name from x360db.
- **Hold A to read it all:** a menu row, patch, add-on or game setting whose text trails off opens as a card with all of it. B folds it back.
- **Main server folders open too:** in Settings → Syncthing → Main Server, a folder opens like on This Device, each file with the game it belongs to.
- **Steam progress as a ring:** while games go into Steam, a ring fills round the Steam logo in the top bar. Nothing in the bar moves any more.
- **Every console in Steam collections:** Settings → Steam → Collections lists every console you have games for, with its collection, before any games are added, and the counts update while Steam changes.
- **shadPS4 numbers typed in:** number settings (resolution, volume, memory and the rest) take any number in range through Type a Number.
- **Trophies widget for every system:** the picker lists every console with achievements, by its full name ("PlayStation 3"), with "No trophies for this system yet" when there are none.

### Changed
- **Smoother without the GPU:** measured with the CPU slowed down and drawing in software. A focus move on Home costs about a third less, moving along Start's rows about a fifth less, and Start uses about a quarter of the CPU it did while idle. Same look and animations: the header's fade is drawn by the compositor and shortened without the GPU, games you only pass while holding a direction don't load their picture, and Start's covers and art move by transform.
- **Settings → Syncthing:** Games first, then Main Server, then This Device. When this device is the main one, the two are one tab.
- **The page overview shows your real pages:** a still copy of each page as it looks. A page you haven't opened since Cartridge started shows the simpler map until you visit it.
- **Switch title IDs read like Eden:** every part of an NSP or XCI is read, and prod.keys is found in more places (Eden's portable user folder, EmuDeck's and RetroDECK's BIOS folders). Switch saves are named from Eden's own game list too.
- **Language step removed** from the welcome.
- **Syncthing knows textures from saves:** a folder's own name and path count, so "GameCube Textures" files say Textures, not Save.
- **Start rows roll gently:** each row keeps its own timer, so they never change together, and the change is a crossfade. A row you stepped through waits 45 seconds.
- **Picture widget:** the picture drifts slowly (only with the GPU).
- **Menus on Start list consoles and games A to Z** (Recently Played keeps its order).
- **Emulator widget on a small tile:** just the emulator's icon and name, sized for the tile.
- **PS3 game updates are only in Add-ons:** the game's More → Emulator no longer has its own Game Updates row.
- **Cemu graphic packs:** Cartridge downloads Cemu's community graphic packs the way Cemu does (newest release, checked weekly), so Wii U games show their packs in Add-ons. Packs are also found by game name when the title ID can't be read.

### Fixed
- **Controls dead after a game closes:** Cartridge asks for focus again over a few seconds when it's back in front, until the page has it. The log says which try worked.
- **L1 and R1 pressed together** opened and closed the page overview at once.
- **Storage widget:** console icons were hidden with the names on narrow tiles.
- **Start's clock clouds** kept drifting without the GPU, which kept the CPU busy all the time.
- **Controls dead after a game on a desktop PC:** Cartridge watches the game it started and comes back to the front when it ends, with the controller working straight away.
- **Collections: Rename and Keep Mine:** A switches between them, and Apply no longer looks like it did nothing: a rename shows as done until Steam saves it.
- **Picture search on a 4K screen:** results were stacked on top of each other.
- **Recommended for You and other rows:** counts like "1 / 15" were cut off.
- **Openverse picture search** answered "401": it allows 20 results per page without an account.
