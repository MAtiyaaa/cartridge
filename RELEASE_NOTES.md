## Cartridge 0.9.21 · Start, Your Way

### New
- **Start, resize and move freely:**
  - **Any size:** a tile can be any size from a 1 by 1 square to the full width and four rows tall, and it rearranges what it shows to fit.
  - **Drag to resize:** with touch or the mouse, hold a tile to arrange, then drag any edge or corner. Drag the tile itself to move it anywhere on the grid; the other tiles make room.
  - **Controller:** hold A to arrange. A picks a tile up and the D-pad moves it. X resizes: the D-pad moves the lit corner, and LB and RB pick another corner. Y removes, B is done.
  - **Motion:** tiles glide to their new place and size instead of jumping, a lifted tile follows your finger, and the grid shows while you arrange.
- **Start's clock is a scene:** sunrise, morning, afternoon, evening and night, each with its own sky and hills. The sun (or moon with stars) moves across it during the day.
- **Settings → Sync:** Syncthing has its own tab. It shows your devices, the folders it syncs (saves first) and, for each folder, its newest files. View only: Cartridge never opens, copies or changes a file.

- **Ready to play starts the game:** on a game's page it now starts the game's Steam shortcut, the same as playing it from Steam (through Steam itself when its live connection is on). A game not in Steam yet offers to add it.
- **Dolphin patches in tabs:** Patches, AR Codes, Gecko Codes and Graphics Mods, LB and RB between them, each with how many are on. Graphics mods are new: Dolphin's own and yours (Load/GraphicMods) for that game, switched on the way Dolphin does it.
- **Sign In to Emulators** (Settings → Achievements) says whether they're all signed in ("All signed in", or "2 of 5"). It opens a list of your emulators showing who each is signed in as, with Sign In to All at the top or one at a time.

### Changed
- **Game heroes:** only SteamGridDB's heroes are used (with a SteamGridDB key). RomM's picture no longer shows first and then swaps; the hero fades in once SteamGridDB's is there. A game SteamGridDB has nothing for shows its cover, blurred.
- **Search** in the top bar, when closed, is a plain magnifier like the tab icons, with the Y hint like LT and RT. It opens as before.
- **Get Emulators:** icons for ares, RetroArch, ScummVM, PPSSPP, MAME, Vita3K, Rosalie's Mupen GUI, Supermodel, PrimeHack, Xenia Edge, Eden and Ryujinx. Xbox 360 lists Xenia Canary first (yours shows as installed), Xenia Edge second.
- **Xenia's Linux build** (from Get Emulators) starts games with a plain path instead of the Windows-style Z: path.
- **Start's Consoles tile** uses the same console cards as the Consoles page.
- **Start's Latest trophies** shows as many as fit, smaller, instead of one.
- **Look & Feel:** Theme and Background are one page.
- **Console logos:**
  - **Wordmarks:** Sega and Microsoft now show their full wordmarks, and Nintendo's is as big as Sony's.
  - **Console names:** Switch, GameCube, Wii, Dreamcast, Genesis and the other Nintendo and Sega logos are sized to read as large as the PlayStation and Xbox ones, on the Consoles page, game cards and Achievements.
- **PS3 patches:** only the patches for your copy's game version are listed (Uncharted 3 at 1.19 shows the 1.19 patches, not every version's). A patch for another version that is already on stays listed so you can turn it off. When the version can't be read, every version's patches show, each saying which version it's for. shadPS4 patches already follow the game's version, and PCSX2's are tied to the exact disc.
- **Emulator updates:**
  - **Eden** is checked on its own server (git.eden-emu.dev) first, and the update keeps your build (Steam Deck or amd64). If its AppImage has no readable icon, Eden's logo is fetched from its own server.
  - **Xenia** can be updated from Cartridge: the Linux build from Xenia Canary's releases, and the Windows build that runs through Proton (xenia_canary.exe is replaced in place).
  - **Contrast:** on a selected row, the progress bar and the status (Up to date, the new version, Couldn't check) now stand out, here and on every list with status labels.
- **PS3 game updates on the game page:** More → Emulator always has Game updates for an installed PS3 game. It checks Sony's list when picked and offers to install what's new.
- **A console's page** no longer shows its folder path under the title. It only says when no folder is set.

### Fixed
- **Updating Vita3K broke its Steam shortcuts:** EmuDeck's Vita3K is the zip build (the program with its data and lang folders), and the update wrote the AppImage over it. Updates now keep the kind of build you have: the zip build updates from Vita3K's zip, unpacked over its folder, and a copy that was already overwritten is put back the same way by Update. A plain program Cartridge can't update in kind is never overwritten.
- **Dolphin codes on in Dolphin showing as off:** Cartridge now reads the Dolphin user folder that holds the game's settings (EmuDeck's launcher hid whether it's the Flatpak), and Dolphin's per-revision files (ID6r1.ini) too.
- **LT/RT at launch:** the first trigger pull after starting Cartridge now switches tabs. It used to be ignored until another button was pressed.
- **Lag in Game Mode:** with a game or Steam in front, Cartridge now stops its animated background and every animation, so it no longer slows the device down in the background.
- **Vita3K installs:** Cartridge now works out Vita3K's storage folder exactly as Vita3K does (a portable folder, the pref-path in its settings, then its default), puts games there, and also finds them wherever Vita3K's own log says it put them. If Vita3K still refuses a game, the message shows Vita3K's own reason (from its output or vita3k.log) instead of a general one, and the full output goes to Cartridge's log.
- **Consoles page:** the controller pictures are no longer cut off at the card corners.
- **Settings → Emulators:** LB, the pages and RB stay on one row. On Game Updates, the PlayStation 3 card's title and description no longer run together on one line.
