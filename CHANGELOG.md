# Changelog

Every Cartridge release, newest first. Each GitHub release only lists its own changes.

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

### Changed
- **Smoother without the GPU:** measured with the CPU slowed down and drawing in software. A focus move on Home costs about a third less, moving along Start's rows about a fifth less, and Start uses about a quarter of the CPU it did while idle. Same look and animations: the header's fade is drawn by the compositor and shortened without the GPU, games you only pass while holding a direction don't load their picture, and Start's covers and art move by transform.
- **Settings → Syncthing:** Games first, then Main Server, then This Device. When this device is the main one, the two are one tab.
- **The page overview shows your real pages:** a still copy of each page as it looks. A page you haven't opened since Cartridge started shows the simpler map until you visit it.
- **Switch title IDs read like Eden:** every part of an NSP or XCI is read, and prod.keys is found in more places (Eden's portable user folder, EmuDeck's and RetroDECK's BIOS folders). Switch saves are named from Eden's own game list too.
- **Language step removed** from the welcome.

### Fixed
- **Controls dead after a game closes:** Cartridge asks for focus again over a few seconds when it's back in front, until the page has it. The log says which try worked.
- **L1 and R1 pressed together** opened and closed the page overview at once.
- **Storage widget:** console icons were hidden with the names on narrow tiles.
- **Start's clock clouds** kept drifting without the GPU, which kept the CPU busy all the time.

## Cartridge 0.9.28 · The Dock

### New
- **Rows of games move along by themselves:** Recently Played, New in Your Library, Favourites, Recommended and a console's games on Start show their next game every 20 seconds or so, one row at a time, with the art fading across and the covers gliding along. A row you step through with L1/R1 waits a while before moving again, and nothing moves while you arrange, in a pop-up or with reduced motion.
- **Go to Game Page** is the first option in More on a game's achievements or trophies (RetroAchievements, trophies and gamerscore). A trophy list not linked to a library game asks which game it is first; an achievements list not found in your library searches for it.
- **The Dock:** the bar of tabs now sits at the bottom, centred, as a floating pill, with its own strip so pages are never cut off under it. Move it to the top or left, align it, and pick Glass, White, Black or Accent in Look & Feel → Text and Cards → Dock.
- **Button hints are hidden** unless you turn them on (Look & Feel → Text and Cards → Button hints). They still show while you arrange Start.
- **Start's page overview shows your real pages:** each tile's cover, the clock, your pictures and widget names. The page you pick up lifts with a "Moving" badge and the others slide out of its way. Open it with L1/R1 while arranging.
- **Start tips:** a short tour of Start the first time you open it.
- **New widgets:** Console Spotlight (one console's games taking turns with their art) and An Emulator (its version and update status; A opens it).
- **Picture widget searches:** find a 4K wallpaper (Wallhaven, safe for work) or a GIF (Openverse, openly licensed) right in Cartridge.
- **Add a Widget in tabs:** Games, Consoles, At a Glance, Pictures and Fun.
- **Frame generation from a game's menu:** More → Steam → Frame Generation, and always in its Game Settings, saying why when it can't apply.
- **Cemu packs with choices:** packs like a resolution pack show their options under them, and the one you pick is saved in Cemu.
- **Emulators from a GitHub link update** from their own project's releases.
- **Syncthing in Game Mode:** keep it running in both modes (Settings → Syncthing → Keep Running in Game Mode, and turned on after installing it in the welcome).

### Changed
- **Big widgets fill their space:** the trophies widget leads with the newest unlock as a card, tall library and console tiles show a row of covers, and the storage widget shows each console's small icon, with names only where they fit.
- **Add-ons on the Downloads page:** Install takes you there, and the pack shows with its game's cover and logo while it downloads and unpacks.
- **Emulators settings reordered:** Emulators, Game Add-ons, Setup and Health, Console Folders. It opens on Setup and Health when something needs attention.
- **Smoother on handhelds:** without the GPU the animated background holds still, the blur behind game art is lighter, and Home's lower rows aren't drawn until you get near them.
- **Title Case** for every widget name and heading on Start.

### Fixed
- **PS3 and PS4 games had no Add-ons on their page** after patches moved into Add-ons in 0.9.24. Game More → Emulator → Add-ons is back for them and shows only what the console has: shadPS4 Patches and GoldHEN for PS4, Patches and Game Updates for PS3.
- **The PlayStation 4 Steam page** ran its shadPS4 option into the games list on handhelds; it sits inside the emulator panel now.
- **Unnamed PS4 games:** a PS4 game that isn't installed on this device (only its trophy code, like NPWR06616_00) now takes its name and library game from the device that has it installed, through the trophy notes it already writes to RomM. The name is remembered on this device afterwards.
- **Touch:** swipes now scroll even on systems that send no movement between the finger going down and up, or send it under another pointer. Before, only Start's page swipe worked there.
- **Pages slid sideways** when a card near the edge was highlighted, which cut off Home and clipped rows on game pages and in achievements.
- **Home's header ran off the top** of the screen with the Dock at the bottom.
- **Dreamcast's logo** was cut off under game cards.
- **Console chips in Game Add-ons** were clipped when selected; they use the normal highlight now.
- **Recently Played** sat its name right on the game's logo.
- **Cartridge opened on Home** for a moment before Start.
- **Onboarding:** Back from the Cartridge Installer trapped you in it; each step now starts on its main button instead of Back.
- **Syncthing Games** only found a few games: the main server's folders are read too, each folder gets its own limit, and texture folders named by game ID (GameCube, Wii, 3DS) are matched.
- **Game Settings** showed nothing for some games; it now says why.

## Cartridge 0.9.27 · Collection Names

### Changed
- **Steam console collections are named maker then console:** Sony PlayStation 3, Sony PlayStation 4, Nintendo Wii, Sega Dreamcast, Microsoft Xbox and so on. Names that already include their maker stay as they are. Settings → Steam → Collections offers to rename your existing ones to these names. A collection you already have under the old name keeps getting new games until you rename it there, so no second collection appears.
- **"shadPS4: show which version ran a game"** moved from Steam's main page to the PlayStation 4 page (Settings → Steam → PlayStation 4). It's still off by default.

## Cartridge 0.9.26 · The Touch Update

### Changed
- **Touch scrolling rebuilt:** swipe anywhere to scroll, in Game Mode and on the desktop. Lists, rows, Settings, menus and pop-ups follow your finger and glide on when you let go. Cartridge now does the scrolling itself, so it works however your system sends touches: as real touches, as touches the browser ignored (which is why only tapping worked before), or as a mouse, as Game Mode can. A swipe never opens the game under your finger.
- **The browser's touch scrolling** is still there for systems where it already worked well: Look & Feel → Controls → Touch scrolling → The Browser's.

### New
- **Swipe in from the left edge** to go back.
- **Swipe along the top bar** to change tabs.
- **Touch check** in Settings → About, under the controller test: it shows how your screen's touches arrive and what scrolled them. If touch still misbehaves, that line says where.

### Fixed
- **Pictures could steal a swipe:** dragging on a cover could start dragging the picture itself. Pictures and links can't be dragged now.
- **0.9.24's notes said scrolling was smooth.** That update only stopped the cursor showing in Game Mode. Scrolling is fixed here.

## Cartridge 0.9.25 · Open Emulators

### New
- **Open an emulator from Cartridge:** Settings → Emulators → Emulators, pick an emulator, then Open. It starts on its own so you can change its settings. AppImages, folder builds, installed programs, EmuDeck's launchers and Flatpaks all open this way. In Game Mode, Cartridge ignores the controller while the emulator is open and takes it back when you close it. Windows builds still open from their Steam shortcut, since they need Proton.

## Cartridge 0.9.24 · Set Up Your Way

### New
- **Cartridge Installer:** Settings → Emulators → Cartridge Installer, and in the welcome. Pick a drive, tick the emulators you want (the first for each console is ticked for you), then watch each install with its own bar. Cartridge makes an Emulation folder laid out like ES-DE and EmuDeck (roms, bios, saves, storage), puts AppImages in ~/Applications where EmuDeck keeps them, and links each emulator's saves and textures into the Emulation folder. Links only: nothing is moved, and nothing already there is replaced. The folder layout and links are only made on a fresh setup: with EmuDeck, RetroDECK or any emulator already on the device, Cartridge only adds the emulators you tick and leaves everything else as it is.
- **Steam collections:** Settings → Steam → Collections (LB/RB). Cartridge reads the collections you already have and finds the ones for a console by their words (PS2, PlayStation 2, GameCube, Mega Drive and more). Rename each to Cartridge's name ("Sony PlayStation 2") or keep yours. Either way, new games go into the collection you already have. "Add downloaded games to their console's collection" waits until you've reviewed them once.
- **Sync Your Saves in the welcome:** connect to your main Syncthing server, or check this device and install Syncthing (SyncThingy from Flathub, for your user, no password), then pick the folder it shares: your Emulation saves, ~/Sync, or any folder.
- **Emulators from a GitHub link:** the last card on Settings → Emulators → Emulators. Paste a GitHub link, say what it's a fork of or which console it's for, and Cartridge installs the newest Linux AppImage from its releases where your other emulators live and sets it up. A file already there with that name is left alone.
- **Emulator folders:** each emulator's menu has Folders. See, open and change where it keeps games, installed content (DLC, updates), saves and textures, written to the emulator's own settings. Works for PCSX2, DuckStation, Dolphin, Eden and the yuzu family, Azahar, Ryujinx, Cemu, RPCS3, shadPS4 and Vita3K.
- **Cemu graphic packs:** Wii U games have Graphics, Enhancements, Mods and Workarounds tabs in Game Add-ons, switched in Cemu's own settings.
- **Add-on details:** A on any mod, texture pack or patch shows all its text, pictures, size, maker and files, with Install at the bottom. Size and maker also show in the list.
- **HenrikoMagnifico's texture packs** for GameCube, Wii and 3DS show on the games they're made for, read live from his site.
- **Add-on downloads** and their unpacking show on the Downloads page.
- **shadPS4: which version ran a game.** Turn on Settings → Steam → "shadPS4: show which version ran a game" and the game page shows the version that actually started it, read from shadPS4's own log. Off by default.
- **More shadPS4 game settings**, from shadPS4's own code, in Graphics, Advanced and System tabs. Every Game Settings page has tabs (L1/R1).
- **Frame generation per game** in Game Settings. Changing frame generation updates the Steam shortcuts at once.
- **Start:** L1/R1 step through the games on Recently Played and other game rows, and through trophies. New console widgets (a console's games, a console's numbers). Pin a Game opens on Recently Played, then consoles, each listing its games A to Z. In Arrange, LT/RT opens an overview of your pages to reorder them, and the top bar stays put. Turning a page gives a small rumble.
- **Top bar placement:** Look & Feel → Text and Cards. Put the bar at the top, bottom or left, aligned or centred, plain, a floating glass pill or round buttons. Pages slide in from the bar's side.
- **Look & Feel → Metadata:** SteamGridDB key, and Fetch All, or only logos, backgrounds, or covers and screenshots.
- **What's New** in Settings → Updates opens every version's notes.
- **Licences and Acknowledgements** in About: the libraries Cartridge uses, the projects and emulators it works with, and the data it reads, each credited.
- **Onboarding ends on Start** with a short tour of it, and uses EmuDeck's folders when EmuDeck is there.

### Changed
- **Start looks right at any size:** console pictures are never cut off, console cards are close to square with the console's logo, the PS3 trophies and storage widgets fill big tiles, the week's play time is a proper chart, and the page dots sit in their own row below the tiles without an RS button. Cards have a little weight under them, the shine varies from card to card, and the Add a Tile slot is quieter.
- **All cards** sit on the page with a soft shadow instead of floating.
- **Smoother on weaker devices:** when Cartridge draws without the GPU, animations only fade and do less work.
- **Game Add-ons** shows one console at a time, with console chips at the top. The game page's Emulator tab no longer has a separate Patches row: patches are in Add-ons.
- **Auto add to Steam** now applies by itself after a download when Steam can be changed live.
- **Search:** the keyboard grows out of the search box.
- **Idle screen:** bigger game and console logos.
- **Syncthing:** files are labelled with the game and kind (saves or textures), L1/R1 moves between its tabs, and its logo is white in Settings and readable when selected.
- **No internet:** a plain "No internet connection" message instead of raw errors.
- **On-screen keyboard:** press LT twice for Caps.
- **Long pop-up menus:** right on the D-pad jumps to the buttons at the bottom.
- The Nintendo Switch picture is bigger.
- **Right stick hint** on Start is round, like a thumbstick, instead of a square key.

### Fixed
- **Controls stopped working after returning from a game** in Game Mode. Cartridge now takes focus back when it's in front again.
- **Touch:** in Game Mode, Auto now treats the screen as touch, so the cursor no longer shows over buttons and scrolling is smooth.
- **Syncthing "refused the key":** Cartridge tries every Syncthing settings file on the device, and a key you paste, until Syncthing accepts one.
- **Emulator icons flickered** while updating.
- **An emulator deleted and installed again** now says where it went and points your Steam shortcuts at the new copy.
- **Downloads of emulators are checked** before they replace anything, so a broken download can't break a working emulator.
- **Switch title IDs** are found from Eden's rules: from the game file, its update or DLC IDs, or the file name.
- **A and B hints in the welcome** sit in the middle of their buttons.

## Cartridge 0.9.23 · Make It Yours

### New
- **Start pages:** add more pages to Start and flick the right stick left or right to switch (swipe on touch). Each page has its own widgets. Add Page and Remove Page are in Arrange.
- **New Start widgets:** Your Library (games, hours played, on this device, consoles), Game of the Day (a new game from your library every day), A Picture (any PNG, JPG, WebP, AVIF or GIF from your device) and Your Own Widget (paste HTML, or start from a note or a countdown). Your own widgets run on their own and can't reach your library or settings.
- **Trophies per console:** the trophies widget can show one console's unlocks, and you can add it more than once.
- **Per-game emulator settings:** game page → More → Emulator → Game Settings. Change the settings that matter most for one game (resolution, frame limit, renderer and more) for RPCS3, PCSX2, DuckStation, Dolphin, PPSSPP and shadPS4. They are written to the emulator's own per-game settings, so the emulator uses them too.
- **shadPS4 versions:** Settings → Emulators → shadPS4 → Versions. See which games use which version, add releases and the nightly from shadPS4's GitHub, remove ones you don't need. Pick a version per game from the game page.
- **Emulators page:** each emulator has a menu with Update, Download Again, Delete, Open Its Releases Page and the update channel: stable or pre-release (nightly). Updates follow the kind you first had until you switch.
- **Syncthing:** the Sync tab is now Syncthing, with its logo. This Device shows its ID, version, devices and folders (with Rescan). Main Server connects to the Syncthing your devices sync with and shows which devices are connected to it. Games lists which of your games have saves or textures in your synced folders, found by serial, title ID or name, with search.
- **Add-ons install themselves the right way:** PCSX2 patch mods go to PCSX2's patches folder, Dolphin graphics mods to GraphicMods, and textures are turned on for you after a texture pack is installed. Install a Download installs a pack you downloaded yourself.
- **More texture packs for GameCube:** HenrikoMagnifico's packs and others show as Featured on the games they're made for.
- **PS4 patches from two lists:** shadPS4's and GoldHEN's, each in its own tab (LB/RB).
- **Switch game version:** Add-ons show the installed version of a Switch game.

### Changed
- **Start redesigned:** game rows (New, Recently Played, Favourites, Recommended) show the first game's art and logo with the rest fanned beside it; Surprise Me deals three games and opens the one in front; the trophies widget shows the newest unlock large with the ones before it as badges; pinned games show their logo; console cards show the maker and game counts like the Consoles page; Played This Week keeps its bars at 1x1; widgets have a softer look; a new Add a Widget button and a grouped widget list.
- **Cartridge opens on Start** unless you picked another tab in Look & Feel.
- **Pages settle in** the way Start does, and animations are calmer overall.
- **Home's header** shows at once for games whose header was already downloaded, and the header picked is the one that fits the space best, so less is cut off at the edges.
- **Settings:** right goes to the first item on the right, and left at the edge goes back to that section in the list.
- **Onboarding:** headings in Title Case, and Optional Extras says Next once a key or sign-in is filled in.
- **Flatpak emulator updates** are faster (Cartridge no longer updates the runtimes with them) and show progress.
- The Nintendo Switch picture is bigger on console cards.

### Fixed
- **Vita3K wouldn't open after an update:** the update put a build in place that needs Qt 6, which SteamOS doesn't have. Vita3K now updates only to its AppImage, every download is checked before it replaces anything, and a broken Vita3K shows Repair on the Emulators page.
- **Vita3K installs failed on a fresh setup:** Vita3K stops before installing when its ux0/app folder doesn't exist. Cartridge creates it first.
- **Cartridge closed in Game Mode** when another game or app you opened from Steam was closed.
- **Start:** moving a tile past another and back pushed tiles away and spoiled the layout. Tiles now go back where they were.
- **On-screen keyboard:** moving up or down jumped to the start of the row instead of the key above or below.
- **Touch in Game Mode** showed a mouse cursor and behaved like a mouse. Taps count as touch now.
- **Switch game IDs** couldn't be read when the keys were in another emulator's folder, and NSZ/XCZ games were skipped.
- **Media bar:** pictures didn't crossfade, a picture that failed to load left the previous game's picture up, and the blurred cover stand-in showed sharp.
- **Controller button letters** (A, B) weren't centred in their circles.

## Cartridge 0.9.22 · Home Fix

### Fixed
- **Home disappeared** after moving a couple of times (down twice, or right once): the header and every row vanished. Home called the wrong thing to find a game's header picture, which failed the moment a game was highlighted and took the whole page down with it. It came in with 0.9.21's change to SteamGridDB headers.
- **No header pictures on Home:** the same fault stopped Home's header from showing. Headers are SteamGridDB's, as asked in 0.9.21. When SteamGridDB can't be reached, the game's cover shows blurred instead of nothing.

## Cartridge 0.9.21 · Start, Your Way

### New
- **Start, resize and move freely:**
  - **Any size:** a tile can be any size from a 1 by 1 square to the full width and four rows tall, and it rearranges what it shows to fit.
  - **Drag to resize:** with touch or the mouse, hold a tile to arrange, then drag any edge or corner. Drag the tile itself to move it anywhere on the grid; the other tiles make room.
  - **Controller:** hold A to arrange. A picks a tile up and the D-pad moves it. X resizes: the D-pad moves the lit corner, and LB and RB pick another corner. Y removes, B is done.
  - **Motion:** tiles glide to their new place and size instead of jumping, a lifted tile follows your finger, and the grid shows while you arrange.
- **Start's clock is a scene:** sunrise, morning, afternoon, evening and night, each with its own sky and hills. The sun (or moon with stars) moves across it during the day.
- **Settings → Sync:** Syncthing has its own tab. It shows your devices, the folders it syncs (saves first) and, for each folder, its newest files. View only: Cartridge never opens, copies or changes a file.
- **Game Add-ons:** Game Updates, Patches and Add-ons are one page in Settings → Emulators, listed by console with the emulator each uses, and a search box to find a game quickly. A game opens one sheet with a tab for each thing it can have: Mods, Texture Packs, Patches (for Dolphin: Patches, AR Codes, Gecko Codes and Graphics Mods) and Game Updates (PS3), LB and RB between them. Mods are GameBanana's; Texture Packs are the PS2 texture pack catalog (EmuCoreX), kept apart so the two aren't mixed up. Switch and Wii U games have no Texture Packs tab, since their emulators take mods only. Whether a texture pack or mods are already in place, and whether custom textures are on, shows on the tab it belongs to. Patches and Add-ons in a game's More menu open the same sheet.
- **Emulators page:** Get Emulators and emulator updates are one list. An emulator you have says Up to date, or shows its update (pick it to install), instead of just Installed. Emulators you have that the list doesn't offer are under Also on this device, with their updates too.
- **Ready to play starts the game:** on a game's page it now starts the game's Steam shortcut, the same as playing it from Steam (through Steam itself when its live connection is on). A game not in Steam yet offers to add it.
- **Dolphin patches in tabs:** Patches, AR Codes, Gecko Codes and Graphics Mods, LB and RB between them, each with how many are on. Graphics mods are new: Dolphin's own and yours (Load/GraphicMods) for that game, switched on the way Dolphin does it.
- **Sign In to Emulators** (Settings → Achievements) says whether they're all signed in ("All signed in", or "2 of 5"). It opens a list of your emulators showing who each is signed in as, with Sign In to All at the top or one at a time.

### Changed
- **Game heroes:** only SteamGridDB's heroes are used (with a SteamGridDB key). RomM's picture no longer shows first and then swaps; the hero fades in once SteamGridDB's is there. A game SteamGridDB has nothing for shows its cover, blurred.
- **Search** in the top bar, when closed, is a plain magnifier like the tab icons, with the Y hint like LT and RT. It opens as before.
- **Get Emulators:** icons for ares, RetroArch, ScummVM, PPSSPP, MAME, Vita3K, Rosalie's Mupen GUI, Supermodel, PrimeHack, Xenia Edge, Eden and Ryujinx. Xbox 360 lists Xenia Canary first (yours shows as installed), Xenia Edge second.
- **Xenia's Linux build** (from Get Emulators) starts games with a plain path instead of the Windows-style Z: path.
- **Rumble when switching pages:** LB/RB and LT/RT (sections and top tabs) give a short, firmer pulse than moving does, at your Look & Feel rumble level.
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
- **Add-on pictures:** GameBanana mods and PS2 texture packs show their preview pictures. Cartridge's page rules only allowed its own pictures, and the texture packs' pictures were never shown.
- **Slow downloads of games made of many files** (PS3, PS4 and Vita folders): every file started its own download thread and a new connection to RomM, which cost far more than the file itself for small ones. Each game now uses one thread and one connection for all its files (about 60 times faster per small file in a local test). Large single files were not affected by this.
- **Vita3K missing after its update:** the update correctly put back Vita3K's own build (the program in its folder, as EmuDeck installs it), but Cartridge only listed emulators that are AppImages, so Vita3K disappeared from the Emulators page. Folder builds are listed again, with their updates.
- **Consoles page:** the controller pictures are no longer cut off at the card corners.
- **Settings → Emulators:** LB, the pages and RB stay on one row.

## Cartridge 0.9.20 · Start, Refined

### Changed
- **Start, after a design review with the new taste and redesign skills:**
  - **Labels:** each tile is named in plain words, without the small icon and count every tile used to carry.
  - **Clock:** shows just the time, with the day and date under it.
  - **Storage:** now reads "Free space … of 931 GB on the games drive".
  - **This week:** now reads "Played this week".
  - **Cover rows:** New, Recently played, Favourites and Recommended fill their tile and fade out at the edge. Each has a soft, dark wash of its first game's colours behind it, so not every tile is the same grey.
  - **Consoles:** a few consoles stretch to fill the tile instead of leaving it half empty.
  - **Latest trophies:** one trophy shows large, with how long ago you got it.
  - **Entrance:** tiles arrive one after another, rising a little, rather than all at once.
  - **Hints:** "A Open, hold to arrange" is one hint instead of two.
- **Start widgets, redrawn:**
  - **Clock:** a large, light time over a soft sky that changes with the hour. The sun (or the moon at night) moves along a faint path across the tile.
  - **Free space:** a ring of ticks lit for the space that's left, with the percentage in the middle. It turns amber below 10%.
  - **Played this week:** says which day you played most, today's bar shows its own minutes, days without play are a dot, and the bars rise in turn.
- **Top bar:** the current tab is back on a white highlight with dark text, as before the underline, now redone: the highlight glides from tab to tab and hugs the name as it opens. A tab picked with the controller or keyboard shows a white ring, so it is never mistaken for the current one.
- **Search:** search is a round button with a mouse or touch. The Y hint shows only while a controller is in use, like LT and RT.
- **Design skills:** taste-skill (with its redesign, soft and minimalist skills) and img2threejs are now in the project's design skills.

### Fixed
- **Reduced motion:** it now also stops the media bar's settle and Start's tile animations. Three of 0.9.19's style rules were written in a way the app's style compiler doesn't support, so they never applied.

## Cartridge 0.9.19 · Start

### New
- **Start: a menu you arrange yourself.** A new tab of tiles: Continue playing (LB/RB through your recent games), Clock, Storage, This week (play time by day), Consoles, New in your library, Recently played, Latest trophies, Downloads, Favourites, Recommended for you, Surprise me, and any game or console you pin.
  - Hold A on a tile (or press and hold with a finger or the mouse) to arrange. A picks a tile up and the D-pad moves it, X changes its size ("4 by 2"), Y removes it, B is done. With touch or a mouse, drag tiles where you want them.
  - **Pin to Start** is in a game's More menu.
  - Look & Feel → Top Bar → **Open on** picks the menu Cartridge starts on.
- **Backgrounds are styles now.** The console scenes are gone. In their place, built the way Ribbons is:
  - **Aurora:** curtains of light.
  - **Contours:** slow height lines, like a map.
  - **Drift:** soft lights floating by.
  - **Tide:** a sea of points rising and falling.
  - If you had a console scene picked, you now see that console's games panning.
- **Vita games install in the background,** like RPCS3, without opening Vita3K. Unencrypted .vpk, .zip and folder dumps are unpacked by Cartridge the way Vita3K's own installer does it (game, update and DLC folders). NoNpDrm dumps still need Vita3K to decrypt them, so Vita3K runs with no window.
- **Texture packs already in place show a green check,** with whether Cartridge installed them or they were added outside Cartridge.
- **Get Emulators:** Xbox 360 (Xenia Edge), Saturn, arcade (MAME, Supermodel), ScummVM and ares.
- **Switch .xci files** (and .nsp files without a ticket) have their title ID read from the game itself, using the keys your Switch emulator already has, for mod folders.
- **Syncthing, first look** (Settings → Storage → Sync): Cartridge finds your Syncthing and shows what it shares and with whom, and which folders look like emulator saves. It changes nothing.

### Changed
- **Top bar redesigned:**
  - each tab is its icon, and the current one opens out with its name over a short line;
  - search folds into a button until you use it;
  - status is one tidy group.
- **Pages move with you:** a tab slides in from its side, a deeper page settles in, back eases out. Reduced motion keeps a plain fade.
- **Home's media bar is larger,** and each new picture settles in once.
- **Emulator downloads and updates:**
  - releases are read from each emulator's own sources: GitHub, plus Eden's and Ryujinx's own servers;
  - shadPS4's launcher comes as a .zip and is unpacked;
  - an emulator falls back to its Flatpak when there's no AppImage;
  - downloaded AppImages get one lasting name (like `DuckStation.AppImage`) and updates never rename them, so launch options keep working.
- **GameBanana** also finds games whose RomM names are written "Title, The".
- **RomM on this device:**
  - the server name you pick becomes the server's own host name;
  - adding IGDB and ScreenScraper keys is a step straight after setup.
- **Trophy names** are remembered for PS3 and Vita games too, so a code never shows where a name was known.

### Fixed
- **RPCS3 patches showed none.** RPCS3's patch list can name a key twice, which RPCS3 accepts but Cartridge's reader rejected, throwing the whole list away. Cartridge now reads it as forgivingly as RPCS3 does.
- **Vita3K installs:** "no Qt platform plugin could be initialized".
- **403 errors:** when a site answers with a browser check, Cartridge passes it once in a hidden window, as a browser would, then retries. Sony's "403" for a game with no update list now means no updates.
- **Steam games from a failed apply** no longer count as added: they're dropped from Cartridge's list at start.

## Cartridge 0.9.18 · Textures In Place

### New
- **GameBanana for PS2 games too:** PS2 texture packs and mods from GameBanana are listed after the EmuCoreX catalog's packs, and go in the same folder.

### Changed
- **Texture packs and mods go in the exact folder each emulator reads for that game,** whatever folders the pack was zipped in:
  - **PCSX2 and DuckStation:** `textures/<serial>/replacements`, plus DuckStation's per-game `config.yaml`. Packs with no replacements folder have their images put in one.
  - **PPSSPP:** the folder holding the pack's `textures.ini`, under `PSP/TEXTURES/<game ID>`.
  - **Dolphin:** `Load/Textures/<game ID>`, with packs in a 6 or 3 character ID folder unwrapped.
  - **Azahar and Citra:** `load/textures/<title ID>`.
  - **Cemu:** each graphic pack (a folder with `rules.txt`) in its own folder in `graphicPacks`.
  - **Switch emulators:** a mod's own folder name is kept, and Atmosphere-style mods (`contents/<title ID>/romfs`) get the mod's name.
- **PS3 serials are found in more places:** game folders nested one or two levels deeper, and RPCS3's own game list for games it has already booted.

### Fixed
- **Vita3K installs:** "no Qt platform plugin could be initialized". Vita3K builds without Qt's hidden display mode are run again on the normal display, and closed as soon as the game is installed. The same fix applies to Vita firmware installs.

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

## Cartridge 0.9.16 · Your Emulators

### New
- **Emulators has its own pages** (Settings → Emulators, LB/RB): Overview, Updates, Game Updates, Patches, Texture Packs and Console Folders. Each emulator shows its own icon, taken from your installed copy.
- **Update your emulators from Cartridge.** Updates checks the emulators you have against their own releases: Flatpaks through Flatpak, AppImages from the emulator's own GitHub releases, swapped in place so your Steam shortcuts keep working. Nothing is updated until you press Update. EmuDeck's launchers still update through EmuDeck.
- **PS3 game updates.** Cartridge reads Sony's own update list for each PS3 game (the same list ps3.aldostools.org uses), shows what's newer than your copy, and installs the updates into RPCS3 in order. Also on the game page when one is waiting.
- **Patches and cheats for more consoles.** GameCube and Wii through Dolphin (its patches, Action Replay and Gecko codes) and PSP through PPSSPP (its cheat list), in the same sheet as the PlayStation patches. When PPSSPP has no cheat list yet, Cartridge fetches it from PPSSPP's own source. Turning on a cheat also turns on the emulator's cheats setting, and only what Cartridge turned on is turned off again.
- **RPCS3's patch list** is fetched the way RPCS3 does it when it's missing or a week old, so games like Uncharted 2 show their patches without opening RPCS3 first. Patches for another version of the game are listed too, with a note.
- **Turn custom textures on from Cartridge** for PCSX2, DuckStation, Dolphin, PPSSPP and Azahar, written the way each emulator writes it. Close the emulator first. Cartridge only turns off what it turned on.
- **Mods for Switch and Wii U:** the mod folder for each game in Eden, Citron, Yuzu and Ryujinx, and Cemu's graphic packs folder.
- **More games recognised for texture packs:** PS1 discs (from the disc itself), GameCube and Wii in RVZ, WIA, WBFS and CISO, 3DS .cia and Switch .nsp.
- **PS3 and Vita firmware from RomM** now installs into RPCS3 and Vita3K.
- **Add to a Steam collection** from a game's More menu.
- **Backgrounds follow your library:** your five most played consoles come first in the picker, each with its scene, or its own games panning when it has no scene.

### Changed
- **Downloads run in their own thread,** so nothing else in Cartridge can slow them down. Game Mode's process check no longer holds anything up.
- **Controller movement:** up and down always go to the very next row and start at its first item (grids keep their column), and left and right stay in the row.
- **Game page:** the header has Ready to play and More only, and going up to it shows the whole header. More is split into Game, Steam, Emulator, Details and Artwork (Manual is here now) and Options (Hide, Re-download, Delete).
- **Steam artwork for games** uses the same sharp background Cartridge shows for the hero and banner.
- **Console backgrounds** for PS2, GameCube, Wii, Xbox 360 and Switch rebuilt from fine lines of light, the way Ribbons is made.
- **Welcome:** each step sits in a card over the background, it opens and closes with a short animation, picks up where you left it, and its system scan shows your console folders (fix a match), games already in Steam and anything that needs you.
- **Consoles page and Achievements** show console makers and consoles as logos at text size.
- **Continue playing** shows the console as a logo and the device in a quieter label.
- **RomM on this device** asks for metadata keys (IGDB, ScreenScraper) as a step after setup, keeps them for updates, and uses the name you gave it. The "on another computer" QR code opens RomM's setup guide.
- **Recommended for you** drops the "Same series" line.

### Fixed
- **RetroAchievements sign-in** works again and shows RetroAchievements' own error when it fails.
- **Vita games installed in Vita3K before Cartridge** no longer ask to be installed again.
- **PS4 trophies** of games not on this device show the game's name instead of an NPWR code, or say they're unnamed and can be linked.
- **Developer names:** games with two developers show both (Tokyo Jungle shows Crispy's! and Japan Studio).
- **Home shelf titles** no longer shrink and clip as you scroll, and are a bit bigger.
- **The welcome's "Your system" step** scrolls.
- **The latest unlocks** on the RetroAchievements and Trophies tabs are as big as on All.
- **Patches sheet** focus box is no longer cut by a dark line.

## Cartridge 0.9.15 · Welcome Home

0.9.15 brings together everything planned for 0.9.3 M and 0.9.4. The 0.9.3 parts ended with L, and the version number now matches GitHub again.

### New
- **A new welcome.** New installs start with a short setup on the Ribbons background: your name, language, a controller check, instant Steam changes, getting emulators (EmuDeck or RetroDECK, or your own), RomM, a scan of your system, optional extras and adding Cartridge to Steam. Existing users are offered it once. It's always in Settings → About → Run the Welcome Again, starts from your current settings and resets nothing.
- **Get your emulators.** If you have neither EmuDeck nor RetroDECK, the welcome can download EmuDeck's official app and open it (Desktop Mode), or install RetroDECK from Flathub with a progress bar (works in Game Mode). EmuDeck or RetroDECK installs the emulators; Cartridge never does.
- **RomM on this device.** No server? Cartridge can run RomM here in the background with Podman (RomM's own setup: RomM and its database). You choose your own RomM username and password, which you can use from any browser or device. It starts with the device and keeps running in Game Mode. Offered in the welcome and in Settings → RomM, with Update RomM.
- **Sign In to Emulators** (Settings → Achievements): signs PCSX2, DuckStation, Dolphin, PPSSPP and RetroArch in to RetroAchievements, each the way it does it itself. It lists what it changes first; your password goes to RetroAchievements once and is never saved.
- **Console backgrounds, rebuilt.** New animated scenes for PlayStation 2, GameCube, Wii, Xbox 360 and Switch, and any console in your library can use its own game art as a slow, dark background (Look & Feel → Background → Your games). Wii U, DS, 3DS and Xbox now use their games' art.
- **Texture packs** (the first part of Add-ons): a game's More menu shows where its texture pack goes in each emulator that can run it (PCSX2, DuckStation, Dolphin, PPSSPP, Azahar), read from the emulator's own settings, and whether custom textures are on, with how to turn them on. Settings → Emulators lists each emulator's texture folder. Downloads of packs, cheats and mods come in a later update.
- **Per-game Steam settings** on a console's page: each game can have its own emulator, Target, Start in and Launch options, or be removed from Steam.
- **Media bar size** in Look & Feel: Compact, Spacious or Large.
- **A hello** with your name when Cartridge starts.

### Fixed
- **shadPS4 (top priority).** Cartridge sometimes picked one of the shadPS4 launcher's own core AppImages (from its versions folder) as the Target, which starts with a black screen. The Target is now always the Qt launcher, with "-d -g" and Start in written exactly as shadPS4's own shortcuts write it. Press Update on the PS4 console page once.
- **Launching a game from Steam in Game Mode** no longer brings Cartridge up first: it steps aside until the game is on screen, then waits behind it.
- **Patches follow the emulator the game uses:** a fork (such as a shadPS4 fork), a portable copy, or the Flatpak or AppImage of RPCS3 and PCSX2.
- **PS3 patches** find the serial in more places: ISO folders, more serial styles in names, and .pkg files.
- **Vita installs** run in the background like RPCS3's, without opening Vita3K's window.
- **Games installed in Vita3K or RPCS3 before Cartridge** are recognised, no reinstall needed to manage them.
- **Manual** is only in More (it showed twice).
- **Game page headers** fade into the page with no visible edge.
- **Moving between rows** with up and down glides smoothly instead of jumping.

### Changed
- **Fetch All Metadata** (was Fetch All Logos): logos, icons, sharp backgrounds, covers and screenshots in one go.
- **Forks** are grouped under one Forks entry in emulator lists.

## Cartridge 0.9.3 L · Fixes from the couch

### Fixed
- **shadPS4 games start from Steam.** Cartridge's shortcuts now start the way shadPS4's own do: the same Target and Launch options, and a Start in that doesn't exist, just like shadPS4's (theirs points at the launcher's temporary folder, which is gone once it closes). Press Update on the PS4 console page once. The "shadPS4 core without the launcher" choice from K is gone.
- **Vita3K through EmuDeck.** EmuDeck's Vita3K script adds "-Fr" itself, so games added to Steam got it twice and didn't boot, and installs never reached Vita3K. Shortcuts now pass just the game's ID (press Update on the Vita console page), and installs use Vita3K itself. Cartridge also finds Vita3K's storage in its portable folder and under XDG_DATA_HOME.
- **Controller in the background.** In Game Mode, with Steam's menu in front, the controller no longer moves around in Cartridge.
- **PS3 patches for disc games:** the serial is read from the disc folder, the ISO or a name like "BLUS-30443".
- **PS2 patches without PCSX2's game list:** for ISO files Cartridge reads the game's serial and CRC itself, the way PCSX2 does. Compressed games (CHD) still need PCSX2 to have listed them once.
- **Patches sheet:** no stray dot before the explanation; PS2 games show their CRC.
- **Developer names** come from RomM's developers list, not the first company (often the publisher).
- **Console names** in trophies and RetroAchievements follow the names on your RomM server.
- **A changed RetroAchievements picture** now shows (asked again every few hours, and on Refresh).
- **Back from Emulator setup, Shortcut health and other screens in Settings** lands on the row you opened them from.
- **Timeline** uses the normal focus box; Search results have room for the focused card.

### New
- **RPCS3's recommended settings.** When a PS3 game finishes downloading or installing, Cartridge sets RPCS3's settings for it from RPCS3's own database (the same as "Create Custom Configuration From Database Settings"), only when the game has no settings of its own yet.
- **Background previews** in Look & Feel's background picker.
- **Manual** in the game page's More.
- **Shortcut health** offers Remove from Steam for shortcuts of games that are gone from this device, whoever made them (never while their drive is missing).
- **Missing from Steam collections:** Issues shows which games before putting them back.

### Changed
- **Trophies All** is one calm list: a summary line, your six latest unlocks as small badges, and your games newest first.
- **Continue playing** on Home is one row (it replaces Continue playing and Recently played) and says which device: "on Steam Deck".
- **"on" before device names** wherever trophies or play time came from another device.
- **Settings → Steam:** Add Cartridge to Steam comes first until it's added; then it moves to the bottom and says Added to Steam.
- **Title Case** for menu items.

## Cartridge 0.9.3 K · One place for trophies, and a calmer look

### New
- **One trophy home.** Achievements opens on All: RetroAchievements and emulator trophies together, the latest unlocks from both in one row, and your games grouped by console with the same card for each. LB/RB still reach RetroAchievements and Trophies & Gamerscore on their own.
- **Recommended for you** on Home, and better **Similar games** on the game page. They use IGDB's similar games when your RomM server has them, but also work without IGDB: series, studio and genres from whatever metadata RomM has, weighted by what you play. Every card says why it's there.
- **Rumble** (Look & Feel → Motion and Sound): None, Low, Medium or High, a light buzz when you move and select.
- **PCSX2 patches.** PS2 games get Patches in the game page's More, from PCSX2's own patch list, saved in PCSX2's settings for that game. As with RPCS3 and shadPS4, Cartridge only turns off patches it turned on. PCSX2 must have the game in its game list.
- **shadPS4 core without the launcher.** PS4's emulator choice now offers "shadPS4 core · without the launcher": the version the Qt launcher has selected, started the way the launcher starts it. It is there to test the black screen some PS4 games show on their first start.
- **PS4 trophy names without opening the game first.** With the trophy key set in shadPS4, Cartridge reads each installed game's trophy list itself (into its own folder, never shadPS4's).
- **Flatpak Steam.** Games added to Flatpak Steam, and Cartridge's own entry, now start your emulators outside Steam's sandbox. Settings → Emulators → Issues offers the one permission Steam needs for it.
- **Xenia's Windows build** (xenia_canary.exe) is found and started through Proton.

### Changed
- **Look & Feel** is five short pages (Theme, Background, Text and Cards, Motion and Sound, Controls), LB/RB to move between them, with rarely used options under Advanced.
- **One sheet for secondary things.** The game page's More, Show and sort in the Library and on Achievements, and a console's More open as one sheet from the bottom, its groups as tabs (LB/RB).
- **Headers** on Home and the game page are bigger and fade into the page with no edge. With a SteamGridDB key they use its sharpest background (4K first), also on the idle screen.
- **Connection** in the top bar is a small icon next to the clock (house for LAN, globe for Tunnel), with colour only when offline.
- **Trophy games known only by a code** (shadPS4 NPWR…, some Xenia games) take their name from your other devices or your library.
- **Controller:** the stick only moves the way you push it most, and no longer double-moves when resting near the edge.
- **RomM version check:** a server older than RomM 3 shows in Settings → Emulators → Issues instead of features failing one by one.

## Cartridge 0.9.3 J · Sturdier with every RomM version

### Changed
- **RomM versions.** Cartridge reads each game from RomM so that a missing, empty or unexpected field (older servers, newer ones, or a broken entry) never stops a library sync. New tests cover a current RomM, an older one without metadata, and odd values.
- **Emulator for this game** has a test making sure a game's own emulator pick always beats its console's, and falls back to the console's when that emulator is gone.

## Cartridge 0.9.3 I · Scores, ratings and the idle screen

### New
- **Score and age rating on game pages.** The game's info box shows the critic score as a coloured badge (IGDB's critic score, else RomM's combined rating from its other metadata sources) and the age rating as its badge (RomM's rating image, else a PEGI or ESRB badge drawn from the text). Each is hidden when RomM has nothing, so it works without IGDB on the server.

### Changed
- **Idle screen:** the game's logo and the console's logo replace the plain text, over the sharpest art Cartridge has for the game.

## Cartridge 0.9.3 H · One RomM tab, problem reports

### New
- **Report a problem** (Settings → About): shows your setup report with personal details taken out, so you can read it first. Copy it, open a GitHub issue with it filled in, or scan a QR code to open the issue page on your phone (handy in Game Mode).
- **shadPS4 trophy key guide.** When shadPS4 has no trophy key set, the Trophies & Gamerscore tab says so and shows the steps to add it. Cartridge never ships or downloads the key.

### Changed
- **One RomM tab in Settings.** Connection, Library & Sync and Upload to RomM are together under **RomM**, each with its own heading.
- **Recently played from other devices:** the device name shows in full on its own line under the game, instead of being cut short.

## Cartridge 0.9.3 G · Tidier menus and achievements

### Changed
- **Refresh Library.** The Quick Menu's "Resync library" and "Scan server for new ROMs" are one item now. RomM looks for new files when your sign-in allows it, then Cartridge pulls new and changed games; otherwise it just resyncs.
- **Title case** for the Quick Menu items and the remaining Settings headings (Top Bar, Undo & Clean Up, Storage Manager, Check Downloaded Games).
- **Achievements:** the Trophies & Gamerscore tab is plain text, no gradient, and its mark is the same size as the RetroAchievements logo.
- **Hide** (on a trophy game's More) replaces "Hide from totals". Settings → Achievements has a **Hidden Games** list to bring them back.
- **RetroAchievements tab:** a console filter and a sort (Latest, Most complete, Least complete, A to Z) for recently played games, the same as Trophies & Gamerscore.

## Cartridge 0.9.3 F · PS4 patches

### New
- **Patches for PS4 games.** On a PS4 game's page, More → Steam and emulator → **Patches** now lists shadPS4's patches for that game and its version (including an installed update), plus the ones made for any version. Tick and press **Apply**: Cartridge switches them on in shadPS4's own patch files, exactly as ticking them in shadPS4's launcher does, so they stay on.
- As with RPCS3, Cartridge only turns off patches it turned on itself, and changes nothing else in those files. If shadPS4 hasn't downloaded its patches yet, Cartridge tells you where to do that.

## Cartridge 0.9.3 E · PS3 patches

### New
- **Patches for PS3 games.** On a PS3 game's page, More → Steam and emulator → **Patches** lists the patches RPCS3 has for that game and its version (60 FPS, widescreen and the like), from RPCS3's own patch list. Tick the ones you want and press **Apply**: they're saved in RPCS3's own patch settings, so they stay on exactly as if you'd ticked them in RPCS3. Nothing changes until you press Apply.
- Cartridge only turns off patches it turned on itself. Patches you turned on in RPCS3 show as "On in RPCS3" and are left alone, and so is everything else in RPCS3's patch settings.
- If RPCS3 hasn't downloaded its patch list yet, Cartridge tells you where to do that in RPCS3.

## Cartridge 0.9.3 D · Vita games

### New
- **Install in Vita3K.** Vita games that come as `.pkg`, `.vpk` or `.zip` get an **Install in Vita3K** button on their game page once downloaded. Nothing installs until you press it.
  - A `.pkg` installs without opening Vita3K. It needs its zRIF key: Cartridge reads it from a text file that came with the game, or asks you for it.
  - A `.vpk` or `.zip` opens Vita3K, which starts the game once it's installed. Close Vita3K to finish.
- Steam shortcuts start these games by title ID, as before, and work as soon as the install is done.
- After installing, Cartridge offers to delete the downloaded file, which isn't needed to play any more.
- **Safe delete.** Delete can also remove a game Cartridge installed in Vita3K, after a clear confirmation and the same checks as for RPCS3. Only that game's folder goes; saves, DLC and licences stay.

- **Licences.** A Vita game installed without a licence now says so, instead of looking ready and then not starting.

### Changed
- **Game page More is shorter.** Favourites, Play status, Add to a collection, Timeline and Hide stay at the top. Steam, emulator and file options are under **Steam and emulator**; artwork, details and theme are under **Details and artwork**. B goes back to the first list.

### Fixed
- **PS3 games from packages: "Failed to decrypt content".** PSN games need their licence file (`.rap`) next to the `.pkg`, and RPCS3 only finds it under the exact name `<content ID>.rap`. Cartridge now finds the `.rap` itself, in the download or in RomM, and hands it to RPCS3 under that name whatever it's called. Without it, nothing is installed and Cartridge says "RAP file not found". The install screen says this before you start. Games already installed without one get a **Get licence (.rap)** button on their game page, which finds it the same way.
- **PS3 games from packages and Steam.** Before they're installed, they show on the PS3 console page as needing to be installed in RPCS3 first, instead of getting a shortcut that can't start. Once installed, a shortcut Cartridge already made is updated to start the game from RPCS3. If **Add automatically** is on, a new shortcut is added; otherwise the game shows on the console page ready to add.

## Cartridge 0.9.3 C · PS3 games from packages

### New
- **Install in RPCS3.** PS3 games that come as `.pkg` files get an **Install in RPCS3** button on their game page once downloaded (Downloads points to it too). Nothing installs until you press it. RPCS3 installs the game without opening its window, with its licence files (`.rap`, `.edat`), DLC and updates in the right order. Cartridge then checks the game really arrived in RPCS3.
- **Updates and DLC.** Update packages in the same game install into the same game in RPCS3. "Install again in RPCS3" (More) installs ones added later.
- **Starts by serial.** Steam shortcuts for these games start them by their serial, like RPCS3's own shortcuts, so they keep working if RPCS3's storage moves.
- **Free up space.** After installing, Cartridge offers to delete the downloaded package, which isn't needed to play any more.
- **Safe delete.** Delete can also remove a game Cartridge installed in RPCS3, after a clear confirmation. It only ever removes that one game's folder, after checking it's exactly the game Cartridge installed. Saves, trophies, licences, settings and games you installed yourself are never touched.

## Cartridge 0.9.3 B · More emulators

### New
- **More emulators for Steam shortcuts.** Cartridge now finds and starts DeSmuME (DS), Mupen64Plus (N64), Snes9x (SNES), Mesen (NES, SNES, Game Boy, GBA, PC Engine, Master System, Game Gear, WonderSwan), Play! (PS2), Kronos (Saturn) and Xenia Edge (Xbox 360, the native Linux build EmuDeck installs). Each one's launch options were read from its own source code.
- **PrimeHack** (EmuDeck's Flatpak or an AppImage) is listed as a fork of Dolphin, for GameCube and Wii. Like other forks, it's only used when you pick it.

### Changed
- **Version names.** 0.9.3 is finished in parts: this is 0.9.3 B, and Settings → About and update messages show that name.

## Cartridge 0.9.3 · Emulators

### New
- **Settings → Emulators.** One place for Emulator setup, Shortcut health and Console Folders, with an **Issues** list at the top: games missing from Steam collections, shortcuts that would fail, setups pointing at an emulator that's gone, missing BIOS. Each has its fix. A dot on the Settings tab means something is waiting. The pop-ups at start-up are gone.
- **Forks.** When Cartridge can't tell what an AppImage is, "Which One?" asks: Not an Emulator, It's a Fork (pick which emulator it comes from and name it) or It's an Emulator. B goes back a step. A copy that was found can also be marked as a fork. Forks show by their own name (for example "BB Launcher · fork of shadPS4") and are only used when you pick them. GR2, BB Launcher, PrimeHack and Slippi are recognised by name.
- **RetroDECK.** If you use RetroDECK and not EmuDeck, it's offered for each console and starts games with the emulator RetroDECK has set.
- **Take over your own shortcuts.** On a console's page in Settings → Steam, More can bring games you added to Steam yourself under Cartridge, so every game of that console starts the same way. With Steam's live connection play time and collections stay.
- **Home rows** show 15 games and a **Show all** card that opens the whole row.
- **Deleting a game** shows a progress ring on its card and on the Delete button.

### Changed
- **Which emulator is used.** Each console uses one emulator found on your device: EmuDeck's first, then RetroDECK (without EmuDeck), then AppImages, Flatpaks and installed programs. How your own Steam shortcuts start games is offered as another choice. Steam ROM Manager setups are no longer listed; the emulators they use still are.
- **Real names.** A Citra or Lime3DS install is no longer called Azahar, and Sudachi, suyu, torzu and Ryubing show by their own names.
- **Lists A to Z.** Consoles and emulators are sorted alphabetically. In Emulator setup, finished consoles move to the bottom with a check mark.
- The current top tab is a full white box. Text options Standard, High contrast and Soft are clearly different. The game page buttons stay on one row.
- With Steam's live connection, adding or removing games no longer asks "Apply now or later".
- "Cartridge itself" in Settings is now "Cartridge".

### Fixed
- **shadPS4 games that only started sometimes.** Cartridge started shadPS4 next to its AppImage, where a stray `user` folder gave it different settings. Shortcuts now start where shadPS4 keeps its normal data. Existing PS4 shortcuts show **Update** on their console page.
- **Lag and Cartridge staying open after quitting.** Cartridge no longer works in the background while a game runs (controller reading slows down, the animated background stops) and quits fully within 3 seconds, from its own Quit and from Steam's Exit game.
- **Remove from Steam** no longer has to be chosen twice.
- **Settings** stays on the section you were on after an action or after leaving a sub-screen, and a quick right press no longer loses focus.
- **Library:** scrolling up no longer stops on the filters bar early.
- Shortcuts pointing inside an AppImage's temporary folder (`/tmp/.mount_...`) are no longer learned from and show in Shortcut health.

## Cartridge 0.9.2 · Controls and colour

### Changed
- **White by default.** Highlights, Buttons and Progress bars are white in the Cartridge theme. You can still pick your own colours in Settings → Look & Feel.
- **Clearer selection.** What you've chosen is a lighter grey, and where you are is white (or your Highlights colour). The grey boxes with a coloured stripe are gone, and the current top tab has a faint outline instead of an underline.
- **The D-pad stays where you are.** Once you're in a part of the screen, like the right side of Settings, the D-pad only moves inside it. Down at the bottom no longer jumps to the left list, and **B** takes you back to it. Up from a page no longer lands in the top bar; LT/RT still switch tabs.

### Fixed
- **Game page:** pressing up from the screenshots goes back up the page instead of jumping to the search box.

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

## Cartridge 0.9.0 · Setup

### New
- **Emulator setup.** On first launch, and any time from Settings → Steam → Emulator setup, Cartridge looks for your emulators wherever they are: EmuDeck, Flatpaks, installed programs (including Snap, Nix and Homebrew), Steam's RetroArch, your app menu, Steam ROM Manager's saved setup if you have one, and AppImages in any folder under your home, even renamed ones. It tells which emulator an AppImage is from what's inside it, not its name, so a file called "switch emulator" in Documents is still found and recognised. Each console shows which emulator its Steam shortcuts use, lets you pick another or Browse to any file, and flags anything that would stop a game starting: a missing RetroArch core, a missing BIOS, a Flatpak emulator without access to your games folder (with the command to fix it), or an AppImage that isn't allowed to run. Where it can't be sure, it asks.
- **An emulator for one game.** A game's More menu has **Emulator for this game**, for the one game that runs better somewhere else. Its Steam shortcut updates to match.
- **Shortcut health.** Settings → Steam → Shortcut health lists Steam shortcuts that would fail: an emulator that moved (an update that renamed the AppImage, say), a game that's gone, a missing core. Fix points them at where the emulator is now, in place with Steam running, so play time and collections stay. When an emulator Cartridge's shortcuts use goes missing, Cartridge notices on start and offers to fix it.
- **Check downloaded games.** Settings → Storage compares every game on this device with RomM's record of it, and re-downloads damaged ones when you say so.
- **Manuals.** Games with a manual in RomM have a **Manual** button. Read it with the controller: up and down scroll, LB and RB turn pages, X zooms.
- **BIOS from RomM.** When a console's BIOS is missing and your RomM server has it, Emulator setup offers to save it to your BIOS folder.
- **Console collections in Steam** (Settings → Steam). Games Cartridge adds also go into a Steam collection named after their console. Your Cartridge collections are never copied into Steam.
- **A short tour** of the controls after setup.
- **Copy setup report** (Emulator setup → More) for bug reports, with your name, paths, addresses and server taken out.

### Changed
- **A new look.** Solid, dark and quiet around your game art: bigger art on Home and game pages, one type scale, one set of corners and one accent colour across every screen, and a white highlight wherever you are. New logo and colours, including Cartridge's own artwork in Steam. If you picked your own theme, font or background, they stay; ones left at the old defaults move to the new look. The old themes, fonts, glass panels and backgrounds are all still in Look & Feel.

### Fixed
- Cartridge no longer copies a shortcut's setup for new games when that shortcut's emulator is gone.

## Cartridge 0.8.2 · Fixes

### Fixed
- **Launch options are back where they were.** Target holds the emulator, and Launch options hold its settings and the game, with no `%command%` in front. `%command%` only appears after something that has to run first, like `vblank_mode=0`. Games already added show **Update** on their console page in Settings → Steam. With Steam reachable, Update changes them in place, so play time and collections stay.
- **LT and RT work straight away.** A trigger could read as half pressed until it was first used, so the first press did nothing. Triggers now go by how far they're pulled.
- **The highlight is back on Home and Library.** With reduced effects (Game Mode on a handheld), a selected game lost its accent ring.
- **Touch scrolls like a phone.** Swipes use the system's own scrolling, which follows your finger and glides smoothly. Touches that Game Mode sends as mouse clicks also scroll with momentum, and a swipe never opens a game by accident.
- **Snappier controls.** The controller is read every 8 ms instead of once per frame, scrolling after a press takes about 120 ms instead of about 320 ms, holding a direction repeats sooner and speeds up, the highlight appears instantly, and moving up and down keeps to your column.
- **Sharper backgrounds from SteamGridDB.** Full-size backgrounds (3840×1240 or 1920×620) are picked first, and the picker sorts by size and shows each image's size.

### New
- **Recently played across devices.** Your Steam play time is shared with RomM as play sessions from this device, and games played on your other devices show up in Recently played with that device's name (for example "Living Room PC"). Older RomM servers only get "last played".
- **Trophy filters.** On the Trophies page, Show picks a console, Sort orders by latest unlock, most or least complete, or name. **Hide from totals** (a game's More menu) takes a game out of your trophy counts, gamerscore and latest unlocks. Hidden brings them back.
- **Controller test.** Settings → About shows live button, trigger and stick values, and how touches arrive.

### Changed
- **This device's name moved to Settings → About.** It's used for trophies and for Recently played on your other devices, and it renames the device in RomM too.
- **QR pairing asks RomM for device access,** for Recently played across devices. If you paired before 0.8.2, pair again to use it.

## Cartridge 0.8.1 · Connection Colours

### Changed
- **The connection pill in the top bar is colour coded.** LAN is a green pill, Tunnel a purple one and Offline a red one, each with a matching edge. They look the same on every background colour.

## Cartridge 0.8.0 · Your Library, Alive

### New
- **Play time.** Cartridge reads how long you've played each game from Steam, and from RetroArch's own logs when "Save runtime log" is on. The game page shows it (for example "12 h played · 2 d ago").
- **New Home rows.** Most played, Finish what you started, Short games (under 5 hours to beat), Top rated you haven't played, and Local multiplayer. Each only shows up when it has enough games.
- **Timeline.** Game page → More → Timeline: when the game was added to RomM, downloaded, added to Steam, your first and latest trophy, and when you last played, with your total time.
- **Edit details.** Game page → More → Edit details: change the name and description, or use the cover you picked from SteamGridDB, and save it to RomM for every device.
- **Theme from this game.** Game page → More: Cartridge takes its colours from the game's cover. "Back to your own theme" in the same menu undoes it.
- **Upload to RomM.** Settings → RomM lists files in your console folders that RomM doesn't have yet, and uploads them one by one or all at once. Run a scan in RomM afterwards to add them to your library.
- **Server status.** Settings → About shows your RomM server: online or not, LAN or tunnel, response time, version, how many consoles and games it holds, library size and where its metadata comes from.
- **Idle screen.** After a few minutes without input, your games' artwork drifts by with a big clock. Any button wakes it, and that press does nothing else. Choose 3, 5, 10 or 15 minutes, or turn it off, in Look & feel.
- **Word suggestions on the on-screen keyboard.** When searching, your game names appear above the keys as you type. Pick a whole title, or finish the word you're typing.
- **Console backgrounds.** New backgrounds in the style of the PlayStation 2, Wii, Wii U, Switch, Nintendo DS, Nintendo 3DS, Xbox and Xbox 360, each with its own colours and motion. The brighter ones are toned down so text stays readable.
- **Refresh artwork in Steam.** Settings → Steam → Refresh artwork gives every game Cartridge added new art: your own picks, or SteamGridDB's most popular, clean, alternate, blurred or material styles. It goes straight into Steam when Steam can be reached, otherwise after a restart.
- **Free up space.** Settings → Storage picks games you haven't played for two months (biggest first) for you to check before deleting. Nothing is deleted until you press Delete.

### Changed
- **HowLongToBeat card.** The game page shows a small card with the HowLongToBeat logo (from your RomM server) and the times as big numbers, each with a bar.
- **Latest achievements on Home show when you unlocked them.** Each shows the time ("12 min ago" today), with Today, Yesterday or the day between them, like a timeline.
- **Background picker.** Look & feel shows the background you're using in one row, and Change opens a list: your theme colours (XMB Waves, Ribbons), the consoles, and Still, Game artwork or Wallpaper. Bokeh, Blades, Dots and Glow are gone; if you used one, you now get XMB Waves.
- **Storage by drive.** Each drive shows which consoles download to it, including console folders on other drives.
- **QR pairing asks RomM for permission to change games,** for Edit details and Upload. If you paired before 0.8, pair again, or sign in with your password, to use them.


## Cartridge 0.7.13 · Console Cards

### Changed
- **New console cards.** Each card is filled with the console's own colours, with a glossy top edge, the controller picture large on the right fading out to the left, and the game count in a small pill. The selected card lifts with a glow in the console's colour. The same cards are used on Home.
- **New Consoles header.** A clean "Consoles" title with big numbers underneath: consoles, games, on this device and last sync.
- **LAN and Tunnel label.** The coloured dot is gone. The top bar shows a light green "LAN" or a light purple "Tunnel" on a dark see-through pill, so it stays readable on any background colour.

### Fixed
- The console picture and the colour strip were cut off at the bottom and right edges of each card. The picture now always sits inside the card.
- "1 games" now reads "1 game".

## Cartridge 0.7.12 · Smoother

### Fixed
- **Games added to Steam no longer get `%command%` in their Launch options.** When Cartridge added a game while Steam was running, Steam filled in `%command%` by itself, and with the emulator's settings in Target that stopped RetroArch, Xbox, Xbox 360, 3DS and Dreamcast games from starting. Cartridge now checks what Steam saved after adding a game and clears it again.
- **Games already affected are fixed with Update.** Their console page in Settings → Steam shows Update; pressing it clears `%command%` in place, so play time and the shortcut stay as they are.

### Changed
- **Smoother moving around, most of all in Game Mode.** Rows, shelves and lists now scroll without redrawing the whole screen, the background is drawn in a way that is cheaper to show, and focusing a game no longer redraws its shadow on every frame in reduced effects mode. In tests without the GPU this cut the drawing work while moving around by about a third. Nothing looks different.

## Cartridge 0.7.11 · Launch Fix

### Fixed
- **RetroArch and Xbox games should now start.** Games kept in a folder (multi-disc PS1, Dreamcast, cue/bin and m3u sets) were handed to the emulator as a folder, which RetroArch and xemu can't open. Cartridge now points the shortcut at the game file inside: the .m3u playlist, the .cue or .gdi, or the console's game file.
- **Shortcuts are written the way Steam ROM Manager writes them.** The emulator and its arguments go in Target, and Launch options stay empty, exactly like EmuDeck's own shortcuts (for example `"xemu-emu.sh" -full-screen -dvd_path "Sonic Riders.iso"`). Launch options are only used when something has to wrap the command. Games you already added show an **Update** button on their console page in Settings → Steam; press it to rewrite them.
- **PS3 games you added to Steam yourself are recognised.** RPCS3 shortcuts that start a game by its serial (`%RPCS3_GAMEID%:BCUS...`) now count as In Steam, and names match even when punctuation or ™ differ.

### New
- **Missing from Steam list.** Settings → Steam shows "N missing from Steam". It opens a list of every downloaded game with no shortcut, grouped by console. A adds one, X adds all.
- **PS Vita games installed in Vita3K.** Vita games must be installed inside Vita3K first (File → Install .pkg or .vpk). Once installed, Cartridge adds them to Steam and Vita3K starts them by title ID. Games not installed yet say so instead of making a shortcut that won't work.
- **Series show a picture** in their header, taken from their games.

### Changed
- **Tidier library toolbar.** Show and Sort are each one button with a menu. Surprise me, Select games and Get all are together under More.
- A highlighted game in a collection or series no longer covers the console heading above it.

## Cartridge 0.7.10 · Emulator List

### Changed
- **The Emulator picker only lists what you have, once.** EmuDeck's launchers are often a wrapper: `dolphin-emu.sh` runs the Dolphin Flatpak, `pcsx2-qt.sh` runs the AppImage in ~/Applications. Cartridge now reads the launcher and doesn't list that same copy again. A copy that really is separate (an AppImage in another folder) is still listed.
- **Cartridge knows many more emulators**, taken from EmuDeck's and Steam ROM Manager's setups: MAME (arcade), ares (NES, SNES, N64, Game Boy, Mega Drive and more), simple64 and Parallel Launcher (N64), bsnes (SNES), Nestopia (NES), Stella (Atari 2600), Ymir (Saturn), ScummVM and BigPEmu, plus Flycast for NAOMI and Atomiswave. They're only offered when installed.
- **Many more RetroArch cores and consoles**, including Atari, Amiga, MSX, PC Engine CD, Neo Geo, WonderSwan, 3DO and DOS.
- Flycast gets its fullscreen option when it isn't started through EmuDeck.

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

## Cartridge 0.7.8 · Launch Fixes

### Fixed
- **RetroArch games didn't start** (NES, SNES, Game Boy, N64, Dreamcast and the rest). Cartridge gave RetroArch the full path to its core, which the Flatpak RetroArch can't see on systems like Bazzite, where home is under /var/home. Cores now go by name, the way EmuDeck's Steam ROM Manager setup does it, and RetroArch finds them itself.
- **Xbox games didn't start.** Cartridge looked for the wrong EmuDeck launcher and left out xemu's options. It now uses `xemu-emu.sh -full-screen -dvd_path "<game>"`, like EmuDeck.
- **Xbox 360 games didn't start.** Xenia runs under Proton, so the game now gets a Windows path (`"Z:<game>"`), like EmuDeck.
- **Shortcuts made by Steam ROM Manager weren't recognised.** ROM Manager puts the arguments in Target and leaves Launch options empty. Cartridge now reads them, so those games show as In Steam and their setup is copied for new games.
- **The same game could show twice in a series**, and near-identical series ("Mario" and "Mario Bros.") showed separately. They are now one series.
- Launch options for PS1, PSP, DS and Switch (Ryujinx) now match EmuDeck's.

### New
- **Pick the emulator for each console (Settings → Steam → a console → Emulator).** Lists the emulators installed for that console, including RetroArch with each core you have, for example DuckStation or RetroArch · SwanStation for PS1. New shortcuts use your pick.
- **Update games already in Steam.** When a console's setup changes, its page says how many games use the older setup, and **Update** replaces those shortcuts.
- **Game icons in Steam.** Added games get an icon: SteamGridDB's square icon, or the cover cut square.
- **New genre tiles**, each in its own colour with a genre icon and a column of covers.
- **Collections, series and genres are split by console**, with the console's logo on each section, when they span more than one.
- **New Downloads screen when nothing is downloading.**

## Cartridge 0.7.7 · Steam Logo Fix

### Fixed
- **Logos on games added to Steam could show blank.** Steam only shows a shortcut's logo once it has a position, so Cartridge now saves one (bottom left) right after the logo, the same way the SteamGridDB Decky plugin does. Applies when games are added live through Decky Loader.

## Cartridge 0.7.6 · Steam Fixes

### Fixed
- **Adding games to Steam in Game Mode.** Game Mode starts Steam again the moment it closes, so Cartridge's changes could be lost or never written, and the top bar stayed on "Waiting for Steam…". When Decky Loader is installed, Cartridge now adds games straight into the running Steam, the same way the SteamGridDB plugin changes artwork: shortcut, launch options, artwork and collections, with no restart. Removing works the same way.
- **Restart Steam from Game Mode.** When Decky Loader is installed, Restart Steam asks Steam to restart itself, like the SteamGridDB plugin does.
- **Without Decky Loader**, Cartridge now watches much more closely for Steam closing in Game Mode, so the change is written before Game Mode brings Steam back.

### New
- **Live changes (Settings → Steam).** Shows whether Steam takes changes live. Without Decky Loader, **Turn on** adds the same small file Decky uses to open Steam's interface to apps on this device. Restart Steam once afterwards.

### Changed
- **One "Change metadata" entry in a game's More menu** instead of three. It opens Change cover, Change logo, Change background and Reset artwork.

## Cartridge 0.7.5 · Fixes and Polish

### New
- **Steam consoles have their own page (Settings → Steam).** Each console is now a card with its logo, how many games you have and how many are in Steam. Open one to see every downloaded game for that console with **In Steam** or **Not in Steam**, and add or remove each one with A. **Add all** adds the rest in one go. The emulator setup (Target, Start in, Launch options) is shown at the top, and **More** holds Edit, Test and how games start.
- **How long to beat on every game page.** Main story, Main + extras and Completionist times. Cartridge uses RomM's times when it has them, and otherwise asks HowLongToBeat itself. Results are saved, so each game is looked up once.

### Changed
- **New collection and series tiles.** Collections and series show a game's artwork with its covers fanned on top, and a series shows its game logo. Genres keep their tiles.

### Fixed
- **The Steam collection list couldn't scroll** past the first few collections with a controller, and the rows squashed together. Long pop-up menus had the same problem.
- **A game page wouldn't scroll back up to its banner** after you scrolled down. Moving back to the buttons now shows the top of the page again.
- **Console tiles showed square edges** when highlighted: the colour strip and faded logo slipped past the rounded corners.

## Cartridge 0.7.0 · The Library Update

### New
- **Collections.** A Collections row on Home and a Collections page.
  - **Your own collections**, made in Cartridge and saved in RomM, so every device and RomM's web page have them. Make one with **New collection**, add games from a game page (More → Add to a collection) or many at once from the Library. Rename or delete them from the collection's page.
  - **Made by Cartridge:** Top rated, Hidden gems (rated highly by few people), Couch multiplayer and Short games (under 5 hours), built from your library.
  - **Series:** every series with two or more games, in release order.
  - RomM's own collections and smart collections are still there.
- **Genres.** A row of genre tiles on Home and a Genres page. LB and RB switch genre.
- **Customise the top bar (Look & Feel → Top bar).** Show or hide any tab and change the order: Home, Library, Consoles, Genres, Collections, Achievements, Downloads. Settings always stays. LT and RT follow your order.
- **Play status and favourites, synced with RomM.** From a game's More menu: add to favourites, set Playing now, Backlog, Finished, Completed 100%, Gave up or Not for me, or hide the game. Home gets **Continue playing**, **Backlog** and **Favourites** rows.
- **Recently played.** A Home row from Steam's last played times for games added to Steam, and RomM's.
- **Game page:** "About N h to beat" from HowLongToBeat, and **More in this series** and **Similar games** rows with games you have.
- **PS4 and PS5 zips unpack themselves.** The zip is downloaded, unpacked into the game's folder, then deleted. The space check counts room for both.
- **Better Library filters.** A **Filters** button: genre, decade, couch multiplayer, rated 80% and up, play status, and show hidden games. Sort by **Rating**, and **Surprise me** opens a random game.
- **Select many games.** **Select** in the Library, pick games with A, then download them, add them to a collection or add them to Steam in one go.
- **Download queue controls.** Move waiting games up or down, **Pause all** and **Resume all**, and a **Speed limit** in Settings → Downloads (5, 10, 25 or 50 MB/s).

### Changed
- Games you hide in RomM stay out of Home, the Library and Search. Library → Filters → Show hidden games brings them back.
- Pairing with a code or QR now asks RomM for permission to change collections. Paired before 0.7.0? Pair again to use collections and play status.

## Cartridge 0.6.1

### New
- **Downloads are checked against RomM.** When a game finishes downloading, Cartridge compares every file with the size and checksum RomM keeps for it. A damaged file is deleted and the download shows "Damaged download", so **Retry** gets a fresh copy.
  - Zip, 7z, rar and CHD files get the size check only, because RomM checksums what is inside them, not the file itself.
  - Consoles RomM doesn't checksum (like PS4 and Switch) get the size check only.
  - If a retry brings exactly the same file again, the file on your server is fine and RomM's checksum is out of date. Cartridge keeps the game and tells you a rescan in RomM would fix it.
- **Storage manager (Settings → Storage), like Steam's.**
  - Each drive with a bar showing what Cartridge's games use, what everything else uses, and what is free.
  - Every downloaded game on that drive with its real size on disk, sorted by size, name or when you added it.
  - Pick any number of games with A and delete them in one go. They stay on your RomM server.
- **Warning before a download that won't fit.** If a game doesn't fit on its drive (counting what is still downloading there), Cartridge says so first and offers **Free up space**, **Download anyway** or **Cancel**.
- **Look & Feel presets.** Save your current look under a name (up to 5) and switch between them in one press: colour, background, fonts, cards, motion and sounds. Interface size and controller settings stay as they are. Each preset can be updated, renamed or deleted.
- **Pair with a QR code.** In Setup → Pairing code, **Pair with a QR code instead** shows a QR code. Scan it with your phone, approve Cartridge in RomM, and Cartridge signs in by itself. Needs a RomM version with device pairing; older versions keep the typed pairing code.

### Fixed
- **Y on the Search page now opens the on-screen keyboard** when the built-in keyboard is on (Game Mode).
- **Adding Cartridge itself to Steam could replace another shortcut** when Steam's list had a gap in its numbering. It now always takes a free spot.
- **Undo in Settings → Steam could restore the wrong file** in a rare case where the Steam step ran twice. Each change now runs exactly once, and a backup is never replaced.
- **Adding games to Steam showed no progress** while artwork was being fetched, which could look stuck with many games. The top bar now shows "Steam artwork 3/12", then "Waiting for Steam…".

## Cartridge 0.6.0 · The Steam Update

### New: your games in Steam
Settings → Steam now adds the games you downloaded to Steam as non-Steam shortcuts, so you can start them straight from Game Mode.

- **Launches the way your setup already does.** Cartridge reads the shortcuts you already have (from Steam ROM Manager, EmuDeck or made by hand) and copies each console's **Target**, **Start in** and **Launch options**, only swapping in the new game. Mixed setups work, for example EmuDeck for PS2 and Dolphin next to AppImages for RPCS3, shadPS4 and Eden.
  - Frame generation wrappers (like `mako-run` and lsfg-vk) are left out. Prefixes like `vblank_mode=0` are kept.
  - Quoting is kept exactly as your shortcuts write it.
  - PS3 games start by game ID (`%RPCS3_GAMEID%:BLUS…`) when RPCS3 already knows the game, and from the file when it doesn't.
  - PS4 games through the shadPS4 launcher start by title ID (`-g CUSA…`) or from `eboot.bin`.
  - Wii U game folders start from their `.rpx`.
  - Paths are written the way your shortcuts write them, even when a drive shows up under two paths (`/run/media/…` and `/media/…`).
- **Consoles with no shortcut yet** use the emulator Cartridge finds: the EmuDeck launcher, then an AppImage (including `~/Documents/Apps`), then a Flatpak, then RetroArch with a matching core.
- **See it before it happens.** A preview lists every Target, Start in and Launch options before Steam is touched. You can turn it off.
- **Collections.** Pick one or more of your Steam collections, none, or make a new one. Cartridge remembers the choice per console, tells you if Steam Cloud drops them, and can put them back.
- **Artwork.** Cover, background, logo and wide banner from RomM and SteamGridDB, each checked for the right shape.
- **Safe to use.** Steam closes for a moment while its files change, then opens again (Game Mode brings it back by itself). Your other shortcuts are not touched, the shortcuts file is backed up first, and **Undo last change** puts it back.
- **Games already in Steam are skipped**, whoever added them. Games that share a name get the console added, like "God of War (PS3)", or always if you prefer.
- **Per game:** More → **Add to Steam** or **Remove from Steam** on any downloaded game. PS4 games you marked as installed ask for their folder once.
- **Edit any console** in Settings → Steam → Emulators: Target, Start in and Launch options, with a Test button.
- **Optional:** add games to Steam after they download, and remove them when you delete them. Both are off by default.
- **Remove everything Cartridge added** in one go, and **Restart Steam** from Cartridge.
- **Start through Cartridge (optional, per console).** A shortcut can go through a small script instead of starting the emulator directly. If the game is gone, Cartridge opens on that game's page so you can download it again.
- Clear messages when Steam isn't installed or no account has signed in yet. Flatpak Steam works too. With several accounts, the one that signed in last is used.

### New: trophies
- **Trophies & Gamerscore tab, redesigned** in the style of the RetroAchievements tab.
- **Game logos and console wordmarks** on trophy cards and trophy pages instead of plain names, sized evenly.
- **Latest achievements on Home include trophies**, mixed with RetroAchievements, newest first. Choose All, RetroAchievements, Trophies or Off in Settings → Achievements.
- **Trophy pictures sync between devices.** Small copies are stored with your trophies in RomM, so a device that never played the game still shows them. You can turn this off.
- **Change a game's icon** from its trophy page (More → Change icon), picked from SteamGridDB.
- **Icons are always full rounded squares.** Round icons with see-through corners are skipped.
- **Better SteamGridDB matches.** Exact names come first, so Skate 3 no longer picks up "skate: recompiled".

### New: your controller's buttons
- **Button hints match the controller you're holding**: Xbox, PlayStation, Nintendo (with A/B and X/Y in their real places) or Steam. Cartridge reads the real controller even when Steam presents it as an Xbox pad. Pick one yourself in Settings → Look & Feel → Button icons.

### Fixed
- **shadPS4 showed "Not found" without a trophy key.** It is now found as soon as its folder exists and says "no trophy key" until you add one in shadPS4. The shadPS4 Qt launcher's folder is no longer used, since it only holds emulator versions.
- **Portable shadPS4 in `~/Documents/Apps`** is now found for trophies.
- **Start and Select icons were too big** in the button bar, and **LT had a white box** that RT didn't.
- **Cartridge sometimes wouldn't open again until Steam restarted.** Only one Cartridge runs at a time now: opening it again brings the running one forward, and one that stopped responding is closed so the new one can start.

## Cartridge 0.5.6

### New
- **Sharp square game icons on the trophy pages.** Games in Achievements → Others, the latest unlocks and each game's trophy page now use a square, rounded icon from SteamGridDB, the same key you use for logos. Without a key, or for games SteamGridDB doesn't have, the emulator's own picture is fitted inside the square over a soft blurred copy of itself, instead of being cropped and stretched.
- **Fine-tune colours (Settings → Look & Feel → Colour).** On top of the theme, pick your own colour for:
  - **Highlights:** focus, the selected tab and switches
  - **Buttons:** main action buttons
  - **Progress bars:** downloads, achievements and trophies
  - **Background:** the waves and gradients

  Each one can go back to the theme's colour on its own, or all at once with **Use theme colours**.

### Fixed
- **shadPS4 trophies were not found** for many setups, which showed "Found · 0 games". Cartridge now:
  - reads shadPS4's settings, including a custom home folder (for example on an SD card)
  - checks the shadPS4 Qt launcher's folder, portable `user` folders next to AppImages (including Gear Lever's `~/AppImages`), Flatpak and EmuDeck storage
  - understands every trophy layout shadPS4 has used, old and new
- **The same trophy folder was listed several times** when a drive is reachable under more than one path (for example `/run/media/…` and `/media/…`). Each real folder now shows once.
- **Emulator folders that no longer hold trophies** stop showing as Found.
- **The Home header now resizes the logo to fit every time you move to a new game.** 0.5.5 only did this when the window changed size.

### Changed
- **Smoother, especially in Game Mode without the GPU:**
  - progress bars only shimmer while something is actually downloading or syncing, instead of every bar animating all the time
  - moving the selection does half the layout work it did before
  - with light effects, the animated background pauses while you navigate and picks up again a moment after you stop
  - lighter shadows and no full-screen blending with light effects

## Cartridge 0.5.5 · Fixes

### Fixed
- **Home could not scroll down right after launch.** Moving down to the next row (like Picks for you) left it half hidden behind the bottom bar until you touched the screen or used a mouse. Cartridge now starts in controller mode properly, so rows scroll into place from the first press.
- **Holding the D-pad now keeps up.** When you held a direction, the selection moved faster than the page scrolled, so it ran off screen. While a direction is held, the page now follows the selection instantly. Single presses still scroll smoothly.
- **The top of the Home header was clipped** on some games (the console name went under the top bar), when a tall logo and a long info line did not fit. The logo now shrinks to fit, and the info line stays on one line.
- **The end of a row no longer jumps to the search box.** Pressing right on the last item of a row now stays on it.

### Changed
- **LB / RB no longer switch the top tabs.** LT / RT switch tabs. The bumpers only switch sections inside a page, like RetroAchievements / Others on the Achievements tab.

## Cartridge 0.5.0 · The Customisation Update

### New
- **Colour themes that change everything.** A theme now colours the whole interface, not just the background: highlights, focus rings, buttons, tabs, chips, progress bars, panels and the background all follow it. Nothing is stuck on purple any more.
  - 14 themes: Purple, Blue, Red, Green, Orange, Pink, Teal, Midnight, and new Gold, Crimson, Lime, Sky, Lavender and Graphite.
  - **Custom colour:** pick any colour and Cartridge builds a full theme from it. Choose from 39 swatches with the controller, or use the full colour picker with a mouse or touch.
  - **Panels:** Glass (see-through, the default), Solid, or OLED black (true black background and panels).
  - **Text:** Standard, High contrast or Soft.
- **New backgrounds.** Original designs, each loosely inspired by a console menu, drawn in your theme's colours:
  - **XMB Waves** (inspired by the PSP, the original background)
  - **Ribbons** (inspired by the PS3)
  - **Bokeh** (inspired by the PS5)
  - **Blades** (inspired by the Xbox)
  - **Dots** (inspired by Nintendo)
  - **Glow** (inspired by Steam)
  - **Still:** a still gradient with no motion
  - **Game artwork**, as before
  - **Wallpaper:** any PNG, JPG or WebP image from your device, picked with the controller-friendly file browser, with Bright, Dimmed or Dark dimming.
- **Fonts.** Six bundled open-source fonts: Outfit (the default), Inter, Nunito, Rubik, Space Grotesk and Lexend.
- **Cards and grids:**
  - Box art size: Small, Medium, Large and new Huge.
  - Card corners: Rounded, Square, Soft or Extra round.
  - Spacing: Compact, Normal or Spacious.
  - Game names under box art can be turned off for a clean wall of covers.
- **Motion:**
  - **Animations:** Normal, Fast, or Reduced. Reduced turns off movement, and the background shows a still frame.
  - **Effects:** Auto, Full or Light. Light draws backgrounds at a lower resolution and frame rate and skips blur. Auto picks Light when the GPU is off (software rendering, as in Game Mode on handhelds), so it stays smooth.
- **Sounds:** three styles (Soft, Retro and Bubble) and three volumes (Low, Medium and High). You hear a preview when you pick one.
- **Reset Look & Feel** puts every look option back to the defaults.

### Changed
- **Settings → Look & Feel** is grouped into Colour, Background, Text & Size, Games & Cards, Motion & Sound, and Controls & Display, with small previews of each background and each font.
- The first-run screen, dialogs, the Quick Menu, the keyboard and the download ring follow the theme too.

## Cartridge 0.4.0 · The All Achievements Update

### New
- **Trophies from your emulators.** The Achievements tab now has two sections: **RetroAchievements** and **Others**. Switch with LB / RB or tap them. Others reads the trophies and achievements that these emulators keep on your device:
  - **RPCS3** (PS3 trophies)
  - **shadPS4** (PS4 trophies)
  - **Xenia** (Xbox 360 achievements and gamerscore)
  - **Vita3K** (PS Vita trophies)
- **Others section:**
  - A summary of your platinum, gold, silver and bronze trophies and your Xbox 360 gamerscore.
  - **Latest unlocks** across every emulator, with the trophy icon, grade and date.
  - **Games**, each with a progress bar and grade counts.
  - Open a game to see every trophy, unlocked and locked, with its grade and unlock date. Hidden trophies stay hidden until you unlock them. Filter All / Unlocked / Locked with Y. **Open in library** jumps to the game.
- **Trophies on game pages** for PS3, PS4, Xbox 360 and PS Vita games: a progress bar, grade counts, a row of trophy icons and **See all**. Games are matched by title ID (CUSA for PS4, the Xbox title ID in the file name) or by title. If the match is wrong or missing, open **More → Link to trophies** on the game page and pick the right set, or unlink it.
- **Finds emulators wherever they are installed:** Flatpak, AppImage, EmuDeck, RetroDECK, native packages, or any mix of them. Three layers, in order:
  1. Each emulator's own settings (RPCS3's `vfs.yml`, Vita3K's `config.yml`, shadPS4's and Xenia's usual folders, including Xenia inside Proton or Wine prefixes).
  2. A short background scan of your home, emulation and SD card folders on the first run.
  3. **Choose folder**: point Cartridge at the folder yourself. It checks the folder really holds trophy data before accepting it, and it also finds the right subfolder if you pick one level too high.
- **Settings → Achievements → Other sources:**
  - Each emulator shows **Found** (with its path and how it was found: from settings, known place, found by scan or chosen by you), **Not found** or **Off**.
  - An on/off switch per emulator.
  - **Choose folder** and **Scan again**. The folder picker shows hidden folders here, so Flatpak data under `.var` can be picked.
- **Trophies sync across devices through RomM.**
  - Trophies unlocked on your Deck, Ally or PC show up together on every device, with the name of the device that unlocked each one.
  - They are stored as a private note on the game in RomM. No new account: it uses your RomM login.
  - Unlocks are only ever added, never removed. If two devices unlocked the same trophy, the earlier date wins.
  - Games you only played on another device show up too.
  - Rename this device in Settings. Turn sync off there too.
  - If your RomM version has no notes, or your login cannot write them, Cartridge says so and keeps working on this device.
- **Trophy pop-ups.** When a trophy unlocks while Cartridge is open, a pop-up shows the trophy, its grade and the game. It can be turned off in Settings.
- **Game page header banner.** A wide banner across the top of every game page with the game's logo on it. It uses the background you picked in More, otherwise the first screenshot, otherwise a blurred cover.
- **The on-screen keyboard is back.** Settings → Look & Feel → On-screen keyboard:
  - **Auto** (the default): the built-in keyboard in Game Mode, your real keyboard on the desktop.
  - **Built-in**: always.
  - **Steam**: leaves typing to the Steam keyboard (Steam + X).
  - It opens from any text field and from the search box, and it has a Paste key.
- **Paste buttons** on text fields, for pasting API keys and addresses.

### Changed
- **PS5 console logo.** The PS5 tile now shows a filled PS5 wordmark.
- **Settings sidebar in Title Case:** Connection, Library & Sync, Storage, Console Folders, Downloads, Look & Feel, Achievements, Steam, Updates, About.
- **Settings → Achievements** is split into RetroAchievements and Other sources. The RetroAchievements header and switcher use the RetroAchievements logo.

### Notes
- Cartridge only reads the emulators' files, and it never changes them. It does not touch saves.
- Switch, Wii U, 3DS, original Xbox and PS5 emulators have no trophy or achievement system, so there is nothing to show for them.

## Cartridge 0.3.0 · The RetroAchievements Update

### New
- **Achievements tab** (between Consoles and Downloads):
  - Your RetroAchievements profile: avatar, points, softcore and true points, and what you are playing right now.
  - **Latest unlocks** from the last 30 days, with badge, points, a hardcore tag and when you got them.
  - **Recently played** games with a progress bar, achievements and points earned, and a crown on mastered games. Games that are in your RomM library are marked "In your library".
  - Open any game to see **every achievement**, unlocked and locked, with points, type (progression, win condition, missable), the unlock date, a hardcore tag and how rare it is. Filter All / Unlocked / Locked with Y. **Open in library** jumps to the game in Cartridge.
  - X refreshes. The last results are kept, so the tab still shows something offline.
- **Achievements on every game page that supports them.** Shows a progress bar, a row of badges (unlocked first, then locked) and **See all**. Games are matched by RomM's RetroAchievements ID or, if RomM has none, by an exact title match on RetroAchievements' list for that console. Consoles RetroAchievements does not support (PS3, PS4, PS5, Vita, Switch, 3DS, Xbox, Xbox 360) never show the section.
- **Latest achievements row on Home.**
- **Settings → Achievements:** sign in with your RetroAchievements username and web API key (retroachievements.org → Settings → Authentication; your password is never needed), open the tab, sign out, and turn achievements on game pages or the Home row on or off.

### Changed
- **Top bar at Steam Deck width:** with six tabs, inactive tabs show only their icon below about 1560px wide. The tab you are on keeps its label.

## Cartridge 0.2.5 · console overhaul

### Changed
- **Console tiles redesigned** (Consoles tab and the Consoles shelf on Home):
  - **Official console logos** replace the plain names: Dreamcast, Game Boy, PlayStation, Xbox, Switch and the rest. They are white wordmarks from the open-source Art Book Next theme for ES-DE, downloaded once and cached in `~/.config/Cartridge/syslogos`. A console without a logo (like PS5) keeps its name.
  - **Each console in its own colours** instead of the same purple and pink everywhere: orange for Dreamcast, green for Xbox, red and blue for Switch, deep blue for PS2 and PS4, and so on. The colour sits in a dark glass gradient with a thin colour strip along the bottom, so it still matches the rest of Cartridge.
  - The tilting console pictures stay as they were, and the logo grows slightly on focus.

## Cartridge 0.2.4

### New
- **PS4 and PS5: Mark as installed.** These games are stored on RomM as zips that you extract into a folder yourself, so Cartridge could not tell they were on your device. On a PS4 or PS5 game page, open **More** (or press Y) and choose **Mark as installed**. The game then shows as on your device everywhere: the check badge on its cover, the On device filter and Home. **Unmark** (on the game page or in More) only removes the mark and never touches any files. The option only appears for PS4 and PS5 games. Marks are saved in `~/.config/Cartridge/marked.json`.
- **PS4 and PS5 folders are detected automatically.** If a folder in the console's ROM folder has the same name as the zip (for example `Bloodborne.zip` and a `Bloodborne` folder), or contains the same PlayStation title ID (CUSA12345 or PPSA12345), the game counts as installed without marking it.
- **Fetch all logos (Settings → Look & feel, under Game logos).** Gets the logo for every game in one go instead of one at a time as you browse, with a live progress bar (games checked and logos found) and a Stop button. Logos only. It uses the same order as always: your own picks, then RomM, then SteamGridDB.
- **PS5 folder mapping.** PS5 games go to a `ps5` folder in your ROMs folder, like the other consoles. You can change it in Settings → Console folders.

### Changed
- **Safer Delete.** Cartridge now refuses to delete a whole console folder or your ROMs folder, whatever path it is given.

## Cartridge 0.2.3 · the TV update

### New
- **Interface size (Settings → Look & feel).** Auto is the default: every time Cartridge starts it measures the screen and scales the whole interface so it looks like it does on a 1080p handheld. A 4K TV gets 200%, a 1440p monitor 133%, and the Ally and Steam Deck stay at 100%. You can also pick 100% to 300% yourself. It follows window resizes and fullscreen changes.

### Changed
- **Smooth on TVs.** Big screens (1440p and up) now always use the GPU, including when Steam or Game Mode launches Cartridge. Drawing a 4K screen without the GPU is what made it slow and stuttery. Handheld-size screens keep the software rendering that is proven to launch there. If the screen size cannot be read at startup, Cartridge notices the big window and restarts once with the GPU.
- **GPU safety net under Steam.** If the GPU fails at startup, Cartridge switches to Compatible rendering by itself, now under Steam and Game Mode too.
- **Background waves** draw at the right sharpness for the interface size, and on a big screen without the GPU they use a lighter setting.

### Fixed
- **Change cover / logo / background showed images stacked on top of each other** when a game had many results. Every image now has its own full-size tile and the list scrolls. Logo tiles sit on a checkered backdrop so white and black logos are both visible.

## Cartridge 0.2.2

### New
- **More menu on every game page** (the new "More" button, or press Y):
  - **Change cover**, **Change logo** and **Change background**: browse SteamGridDB images for that game and pick one. You can switch to another SteamGridDB match or search with a different name.
  - **Reset artwork**: goes back to RomM's cover and the automatic logo.
  - **Refresh details from RomM** and **Show file location**.
  - Your picks are saved in `~/.config/Cartridge/artwork.json` and used everywhere: grids, Home, the media bar and the game page.

### Changed
- **Logos are the same visual size.** Cartridge trims empty space around each logo and gives every logo the same amount of screen area. Tall emblems (like Twisted Metal) grow and very wide wordmarks shrink, so they sit at a similar size to Midnight Club 3.
- **Black logos show up.** When SteamGridDB's logo is black, Cartridge uses the white version if there is one, otherwise it draws the black logo in white.
- **Game page layout.** The info box (publisher, developer and so on) sits directly under the cover at the same width, and the screenshot row stops before it instead of sliding underneath.
- **Touch scrolling rewritten.** Swipe rows sideways and pages up and down with momentum. Tapping a game no longer makes the page jump. It also works when Game Mode sends touches as mouse input, and you can drag with a mouse too.
- **Steam Deck width.** On game pages the top bar hides the word "Cartridge" (the icon stays) so the back button, search box and clock fit. Button hints no longer run off the edge.

### Fixed
- **Add to Steam** detects a running Steam reliably. Before, it could miss it, and Steam would put its old shortcut back when it closed.

## Cartridge 0.2.1

### Fixed
- **Launching from Steam.** Add to Steam now points Steam at a small launch script instead of the AppImage. The script removes the Steam overlay and Steam's runtime libraries from Cartridge's environment and starts it without the Chromium sandbox, which could kill it under Steam before it even opened. Every Steam launch is logged to `~/.config/Cartridge/steam-launch.log`. **After updating, open Settings → Steam → Add to Steam once** so your shortcut uses the script.
- **Game logos.** Logos now also come from SteamGridDB: add a free API key in Settings → Look & feel (steamgriddb.com → Preferences → API). RomM's own logos are still used first when your server has them.
- **Sharper background.** The XMB waves are drawn at full resolution instead of being scaled up, with no change in frame rate.
- **Starting focus.** Home opens on your games, not the search box.

## Cartridge 0.2.0

The first big update. Everything since 0.1.0 is in here.

### New
- **Search box in the top bar.** Start typing from any screen and results filter as you type. Press Y to jump to it.
- **Game logos.** Home and game pages show the game's logo instead of plain text. Turn it off in Settings → Look & feel → Game logos.
- **Media bar.** The top of Home shows artwork of the highlighted game and swaps as you move.
- **Background colors.** Eight PSP XMB-style colors in Settings → Look & feel: Purple, Blue, Red, Green, Orange, Pink, Teal and Midnight.
- **Touch mode.** Tapping the screen no longer shows a mouse cursor. The cursor only appears when a real mouse moves. Pick Auto, Touch or Mouse in Look & feel.
- **In-app updates.** Settings → Updates → Check for updates downloads the new version and swaps it in on restart. Same file, same Steam shortcut, nothing to reinstall.
- **Screenshots.** Quick Menu → Take screenshot saves to `~/Pictures/Cartridge`.
- **One-line installer.** Downloads the AppImage, makes it executable and adds it to your app menu.
- **Add to Steam.** Settings → Steam adds Cartridge as a non-Steam game with its cover, banner, logo and icon.

### Changed
- **No more on-screen keyboard.** Text boxes are real inputs: type with any connected keyboard, or press Steam + X in Game Mode for the Steam keyboard.
- **LT / RT switch tabs** (Home, Library, Consoles, Downloads, Settings). LB / RB flip between consoles or collections.
- **Box art is 2:3**, like Steam, and no longer cropped at the top. Corners are less rounded.
- **Smoother.** Scrolling and focus now hold 60fps on handhelds (up from roughly 25 to 30).

### Fixed
- **Rendering under Steam.** Cartridge uses software rendering whenever Steam or Game Mode launches it. Launching from the app menu still uses the GPU.
- **Blank grey window and no launch** on some handhelds (0.1.0 and 0.1.1).
- **Duplicate "ready to play" messages** after a download finished.

### Update
Already on 0.1.2 or later: open Cartridge from the app menu in Desktop Mode, go to Settings → Updates → Check for updates, then restart. Then press Settings → Steam → Add to Steam once.

New install, in Desktop Mode → Konsole:
```bash
curl -fsSL https://raw.githubusercontent.com/abdu2304/cartridge/main/install.sh | bash
```
