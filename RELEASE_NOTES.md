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
