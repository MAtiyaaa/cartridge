# Changelog

Every Cartridge release, newest first. Each GitHub release only lists its own changes.

## Cartridge 0.9.23 · Holding Still

An Android fix. Nothing changes on Linux.

### Fixed
- **The screen no longer keeps zooming in and out on Android.** Since 0.9.21 the whole interface grew and shrank over and over on handhelds like the AYN Thor. Cartridge zoomed out because the screen looked smaller than 1280x800, which made it look big enough again, so it zoomed back in, and so on. Android now keeps its own sizing, as before 0.9.21. Look & Feel → Interface size still works.

## Cartridge 0.9.22 · Your Pages

abdu2304's 0.9.23. On Linux, Cartridge works exactly as his 0.9.23 does, with this fork's phone remote and Fuse bridge on top.

### New
- **Start pages:** add more pages to Start, each with its own widgets, and flick the right stick left or right to switch (swipe on touch). Add Page and Remove Page are in Arrange. The right stick now works on Android too.
- **New Start widgets:** Your Library (games, hours played, on this device, consoles), Game of the Day, A Picture (any PNG, JPG, WebP, AVIF or GIF) and Your Own Widget (paste HTML, or start from a note or a countdown). The trophies widget can show one console and be added more than once.
- **Linux (from abdu2304):** per-game emulator settings from the game page (RPCS3, PCSX2, DuckStation, Dolphin, PPSSPP, shadPS4), shadPS4 versions per game, an emulator menu with Update, Download Again, Delete and stable or nightly updates, a Syncthing page with your devices and synced games, add-ons that install into the right folder by themselves, featured GameCube texture packs, PS4 patches from shadPS4's and GoldHEN's lists.

### Changed
- **Start redesigned:** game rows show the first game's art and logo with the rest fanned beside it, Surprise Me deals three games, the trophies widget shows the newest unlock large, pinned games show their logo, console cards match the Consoles page.
- **Cartridge opens on Start** unless you picked another tab in Look & Feel.
- **Pages settle in** the way Start does, and animations are calmer overall.
- **Home's header** shows at once when it was already downloaded, and the picture that fits the space best is picked, so less is cut off.
- **Settings:** right goes to the first item on the right, and left at the edge goes back to that section.

### Fixed
- **Media bar:** pictures crossfade properly, a picture that fails no longer leaves the last game's up, and the blurred cover stand-in shows blurred.
- **Start:** moving a tile past another and back no longer spoils the layout.
- **On-screen keyboard:** up and down go to the key above or below.
- **Controller button letters** are centred in their circles.
- **Linux (from abdu2304):** Vita3K updates and installs on SteamOS, Cartridge staying open in Game Mode when another game closes, touch in Game Mode counting as touch, Switch game IDs.

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

## Cartridge 0.9.20 · Steps Aside

An Android fix for dual-screen handhelds. Nothing changes on Linux.

### Fixed
- **The second screen is Cartridge's only while Cartridge is in front.** Cartridge's bottom screen stayed up after you left Cartridge, on top of whatever came next there: an app or game Fuse opened on the bottom screen showed Cartridge's second screen instead, Fuse's own second screen was hidden behind it, and a DS emulator started from Cartridge couldn't show its bottom screen. It now steps aside when you leave Cartridge and comes back straight away, on the same page, when you return.

## Cartridge 0.9.19 · Straight In

Android fixes. Nothing changes on Linux.

### Fixed
- **No more emulator setup screen on Android.** Cartridge could open the Linux emulator setup (the one for Steam shortcuts) when it started. Its Done button did nothing on Android, and while it was open it searched your storage, so the top bar said Not connected and the other tabs had no games until you restarted. It now only opens on Android when Settings → Android → Steam & PC game apps is on, as intended.
- **Signing in to RomM works straight away.** After signing in for the first time, the connection and your library now load at once instead of after a restart.

## Cartridge 0.9.18 · Smooth Sync

Android fixes. Nothing changes on Linux.

### Fixed
- **Syncing no longer freezes Cartridge on Android.** Sync asked RomM for every file inside every game. Extracted PS4 and PS5 games have thousands each, so a sync downloaded hundreds of megabytes and Cartridge's backend spent its time reading them instead of answering the screens: taps in Settings did nothing, the second screen stuttered and logos didn't come. Sync now asks for the games without their file lists (RomM 4 says whether each game is one file, one file in a folder, or many). A test library with 230 extracted PS4 games went from 55 MB to under 0.1 MB. Older RomM servers still send file lists, and that still works. Linux keeps the full lists.
- **PS4 and PS5 game pages open quickly on Android**, on both screens. A game's page asked for all its files too; it now keeps at most 300 (the base game, updates and DLC) and shows the real file count.
- **Moving around Home is smooth again on Android.** The sharp backgrounds from SteamGridDB were 4K images that Cartridge decoded and re-encoded itself, which held everything up for seconds each time you moved to another game. Android now takes the 1080p version as it comes.
- **Logos on Android load for the game you're looking at first,** two at a time, instead of waiting behind every logo asked for while scrolling, and they're made smaller (640 wide), so each takes less work.
- **Home shows your games again on Android.** The media bar now defaults to Compact there (Large left room for barely one row). You can still pick Spacious or Large in Look & Feel.
- **The welcome's controller check accepts B too on Android,** so button layouts that send B for the button marked A don't go back a step.

## Cartridge 0.9.17 · Welcome Home

Everything from abdu2304's 0.9.15 (Welcome Home), working on Android too, plus fixes for Fuse, Settings, missing covers and the screen opening upside down.

### New
- **A new welcome** (from abdu2304's 0.9.15). New installs start with a short setup: your name, language, a controller check, RomM and optional extras. On Linux it also covers Steam, getting emulators (EmuDeck or RetroDECK) and a system scan; on Android those steps are left out, and emulators are still picked in Settings → Emulators. You can run it again any time from Settings → About.
- **RomM on this device** (Linux): no server? Cartridge can run RomM in the background with Podman. Offered in the welcome and in Settings → RomM. Not on Android.
- **Sign In to Emulators** (Linux, Settings → Achievements): signs PCSX2, DuckStation, Dolphin, PPSSPP and RetroArch in to RetroAchievements. Not on Android, where emulators keep their settings in their own storage.
- **Console backgrounds, rebuilt.** New animated scenes for PlayStation 2, GameCube, Wii, Xbox 360 and Switch, and any console in your library can use its own game art as a slow, dark background (Look & Feel → Background → Your games). On Android too.
- **Texture packs** (Linux): a game's More menu shows where its texture pack goes in each emulator, and Settings → Emulators lists each emulator's texture folder.
- **Per-game Steam settings** on a console's page (Linux, or Android with Steam & PC game apps on).
- **Media bar size** in Look & Feel: Compact, Spacious or Large.
- **A hello** with your name when Cartridge starts.

### Changed
- **Fetch All Metadata** (was Fetch All Logos): logos, icons, sharp backgrounds, covers and screenshots in one go.
- **Forks** are grouped under one Forks entry in emulator lists.

### Fixed
- **Fuse sees Cartridge again.** Fuse reads Cartridge's status with a permission Android only gives it when Cartridge was installed first. After Cartridge was reinstalled, Fuse lost it and said "This Cartridge opens, but it can't be opened on a page or show its downloads here" with "Status unknown". Cartridge now gives Fuse read access itself every time it starts, so the order you install them in no longer matters.
- **Games uploaded from Fuse show up straight away.** Once RomM has added an uploaded game, it goes into your library at once instead of after the next sync (which, for most people, meant after restarting Cartridge).
- **Settings no longer freezes on Android.** Opening Settings → Emulators ran the desktop's Steam and emulator checks, which search through shared storage and kept Cartridge busy, so taps in Settings did nothing for a long time. On Android only Android's own checks run now.
- **Covers for games RomM has none for.** Games RomM couldn't match (or whose gamelist.xml cover it never copied) showed empty tiles, as the Xbox 360 games did, and their pages had no background. With a SteamGridDB key, Cartridge now fills in a SteamGridDB cover for those games and saves it, so it's fetched once.
- **Broken images no longer stick.** If a tunnel or proxy answered an image request with a web page, Cartridge saved that page as the image and the picture stayed blank for good. Only real images are kept now, and old saved pages are fetched again.
- **The screen no longer opens upside down on Android.** Cartridge turned with the device's motion sensor, so on an AYN Thor it could start flipped. It now always uses the normal landscape direction.
- **Xbox 360 console picture** also shows when the console's folder is named `x360`.
- **From abdu2304's 0.9.15:** shadPS4 shortcuts always use the Qt launcher (no more black screen), games started from Steam in Game Mode no longer bring Cartridge up first, patches follow the emulator copy a game uses, PS3 patches find more serials, Vita installs run in the background, games installed in Vita3K or RPCS3 before Cartridge are recognised, the manual shows once, game page headers fade in with no visible edge, and moving between rows glides.

## Cartridge 0.9.16 · Snappy Again

### Fixed
- **Taps and presses take effect right away again after a big sync.** Cartridge kept the name of every file inside every game. For extracted games (PS4, PS5, Switch folders with thousands of files each) that made the library tens of megabytes, and the app went through all of it every time anything changed, so on Android a tap could take a minute to do anything. The screen no longer gets the file lists at all (game pages ask RomM for a game's files when you open it), and Cartridge keeps at most 40 file names per game. A library of 230 PS4 games went from 28 MB to under 0.1 MB. Libraries already on your device are trimmed when Cartridge starts.

## Cartridge 0.9.15 · Sync Fix 2

### Fixed
- **Library sync gets through PS5 (and other big consoles) too.** After 0.9.14, a sync could still stop with "Cannot reach server (ETIMEDOUT)". When Cartridge gives up waiting for a very big page, RomM keeps building it, and while it's busy the next connection can time out or drop. Sync now treats a dropped or timed-out connection like a slow answer: it waits a few seconds for the server to catch up, asks for smaller pages from where it was, and tries up to six times.
- **One console can't stop the whole sync.** If a console still can't be read after that, Cartridge keeps the games it already had for it, carries on with the rest of your library, and tells you which console to refresh again later.

## Cartridge 0.9.14 · Sync Fix

### Fixed
- **Library sync no longer stops at big consoles.** Syncing asked RomM for 500 games at a time with all their files and gave up after 30 seconds. Consoles whose games are folders with thousands of files (PS4, and often PS3 and Switch) took RomM longer than that to answer, so the sync stopped there with "timed out", most often over a tunnel. Cartridge now waits up to two minutes for these pages, and if RomM still can't answer in time it asks for smaller pages and carries on from where it was. The sync shows "big games, going slower" while it does.
- A slow answer from your server is no longer asked for twice before giving up.

## Cartridge 0.9.13 · Couch and Trophies

Everything from abdu2304's 0.9.3 K and L, with the Android side of it.

### New
- **From abdu2304's 0.9.3 K and L:** one trophy home (Achievements opens on All: RetroAchievements and emulator trophies together); Recommended for you on Home and better Similar games, each saying why; Rumble in Look & Feel; Manual in the game page's More; background previews in the background picker; RPCS3's recommended settings set for a new PS3 game; PCSX2 patches; Flatpak Steam and Xenia's Windows build on desktop.
- **Rumble on Android.** Android can't buzz a controller from the app, so the Rumble setting uses the handheld's own vibration motor, a little longer for Medium and High.
- **The controller rests while a game is in front on Android.** When an emulator or another app is in front, Cartridge stops reading the controller, the same fix abdu2304 made for Steam's menu in Game Mode.

### Changed
- **Look & Feel** is five short pages (LB/RB between them), with rare options under Advanced.
- **One sheet for secondary things:** the game page's More, Show and sort, and a console's More open from the bottom with their groups as tabs (LB/RB). On Android, Emulator for this game and Open in a PC game app are in its Steam and Emulator tab.
- **Headers** on Home and the game page are bigger and fade into the page with no edge; with a SteamGridDB key they use its sharpest background.
- **Connection** in the top bar is a small icon (house for LAN, globe for Tunnel), coloured only when offline. The Quick Menu's status pills use the same icons.
- **Continue playing** is one row on Home and says which device ("on Steam Deck").
- **Trophies All** is one calm list. Menu items use Title Case.

### Fixed
- Steadier stick (it only moves the way you push it most). Developer names come from RomM's developers list. Console names follow your RomM server. A changed RetroAchievements picture shows. Back from a Settings screen lands on the row you opened it from.
- Desktop: shadPS4 and Vita3K (EmuDeck) shortcuts start again (press Update on their console page); PS3 and PS2 patches for disc and ISO games.

## Cartridge 0.9.12 · The Big Merge

Everything from abdu2304's 0.9.3 (parts A to J), with Android versions of the parts that were desktop only.

### New
- **From abdu2304's 0.9.3:** Settings → Emulators with an Issues list and a dot on the Settings tab; PS3 games from `.pkg` installed in RPCS3 (with their `.rap` licences), Vita games installed in Vita3K, PS3 and PS4 patches from RPCS3's and shadPS4's own lists; more desktop emulators (DeSmuME, Mupen64Plus, Snes9x, Mesen, Play!, Kronos, Xenia Edge, PrimeHack) and RetroDECK; critic score and age rating badges on game pages; the idle screen shows the game's logo and the console's logo; Report a problem in Settings → About; Home rows of 15 with Show all; a progress ring while a game is deleted.
- **Settings → Emulators on Android.** Issues lists what stops games on this device from starting: a console with games but no emulator installed (with a button to get one), a BIOS that's missing or can't be checked, and PS3 or Vita packages still to install in the emulator (it opens the emulator and tells you which file; mark it done after). Below that, each console shows which emulator opens its games, and you can pick one. The Settings tab gets the same dot as on desktop.
- **Report a problem on Android.** The report lists the device, Android and WebView versions, the emulators installed and which one each console uses, with no paths or addresses. Open a GitHub issue opens your browser on this fork's issue page.

### Changed
- **One RomM tab in Settings** (Connection, Library & Sync and Upload together), and Console Folders moved into Settings → Emulators.
- **Refresh Library.** The Quick Menu's first tile asks RomM to look for new files, then pulls new and changed games, in one go.
- **Game page More is shorter:** Steam and emulator options, and details and artwork, are in their own lists. On Android, Emulator for this game and Open in a PC game app are under Steam and emulator.
- **Sturdier with any RomM version.** Missing or odd fields from older or newer servers no longer stop a library sync.
- Problem reports from this fork's builds go to this fork's GitHub issues.

### Fixed
- Settings keeps your section after an action, and a quick right press no longer loses focus. The D-pad stays in the list you are scrolling.
- Desktop: Cartridge quits fully within 3 seconds, and stops background work while a game runs.

## Cartridge 0.9.11 · The Bridge Expansion

Fuse and other launchers can now do much more with Cartridge: see every game it downloaded with RomM's details and pictures, follow its downloads game by game, and hand it games to upload to your RomM server. The details for launcher developers are in `docs/FUSE_BRIDGE.md` (bridge protocol 3; apps made for the 0.9.10 bridge keep working).

### New
- **Fuse can show your downloaded games with their details.** Launchers like Fuse now see every game Cartridge downloaded with RomM's description (in full), year, genres, developer, publisher, rating, players and series, plus its cover, logo and screenshot. Cartridge hands the pictures over itself, so Fuse never needs your RomM sign-in; a missing picture of a downloaded game is fetched once in the background.
- **Downloads game by game for other apps.** Fuse can list what is downloading, waiting, paused, failed or done, with each game's progress.
- **Upload games to RomM from Fuse.** In Fuse, a game's options have "Upload to RomM", and the Cartridge tab has "Upload a game". Cartridge opens with what it would send: the game's files (every disc, and DLC and updates in their own folders), the console on your server and the size. Nothing is sent until you press Upload. The first file becomes the game on RomM; Cartridge asks RomM to add it (with a password sign-in) and puts the other files in its folder, which needs RomM 5.3 or newer. Progress shows on the page, in Android's notification and in Fuse.

## Cartridge 0.9.10 · Fuse Bridge

### New
- **Other apps can open Cartridge on the right page.** Game launchers like Fuse can open Home, Library, Consoles, Downloads or Settings, a console's page, a game's page or a search, or start a resync. On Android they use a `cartridge://` link; on the desktop they start the AppImage with the link (like `Cartridge-x86_64.AppImage cartridge://downloads`), and a Cartridge that is already open takes it over. A game or console that isn't in your library opens Library or Consoles with a note instead. Web pages can't open these links. The details for launcher developers are in `docs/FUSE_BRIDGE.md`.
- **Back takes you back to Fuse.** When Fuse opens Cartridge on Android, pressing Back on the page it opened returns to Fuse, and downloads keep going in the background. Opened any other way, Back works as before.
- **Download status for other apps.** Fuse can see what Cartridge is downloading and how far along it is, whether it's connected to your server, and the games it downloaded last, so new games show up in Fuse on their own. On Android an app needs the "Read Cartridge download status" permission for this; on the desktop it's a small file, `~/.local/state/cartridge/status.json`. Your server address, account and tokens are never in it.

## Cartridge 0.9.9 · Quick Menu

### New
- **A new Quick Menu.** It opens with the time and date, then a status card: battery (level, charging and how, time to full or left, and on Android the temperature and power draw), the server connection and your library. Below that are six quick tiles (Resync, Downloads, Screenshot, Sounds, Second screen or Fullscreen, Settings) and a short list for the rest.
- **Tap the status area to open it.** The connection pill, battery and clock in the top bar now open the Quick Menu.
- **Series logos.** A series shows its logo instead of its written name at the top of Home, at the top of its page and on the second screen, like games do.

### Changed
- **Second screen for consoles, collections, series and genres.** One full screen with no scrolling: the art fills it, three covers stand in the middle, the logo or name sits below, and Open is in the same place as a game's Open. The row of games is gone.
- **Buttons stay put on a game's second screen.** Show more, Open, Download and On this device are always in the same place, whatever the game's header or description is like. A download's progress shows above the buttons without moving them.
- **The top bar is plain again.** The coloured fade from 0.9.8 is off.

### Fixed
- **Manuals on Android.** A manual opened to nothing: the PDF reached the viewer as an empty file. It now arrives whole.
- **Screenshots.** Stepping through screenshots quickly kept showing the previous picture until the next one loaded. Each picture now shows only once it has loaded, and the ones either side load ahead.
- **D-pad down on the last row.** Pressing down on a bottom row moved right. Up and down now never move along the row.

## Cartridge 0.9.8 · Bar and Bottom Screen

### Changed
- **The top bar is back in your theme's colour.** It is a deep shade of the theme you picked, solid behind the tabs and fading out just below them. The Home and game banners start in the same colour and fade down, so the bar and the art read as one piece. Page headers below it stay clear.
- **No folder path on the second screen.** Highlighting a console no longer shows where its games are stored.

### Fixed
- **Game covers on the second screen.** On the Thor the row of games under a console, collection, series or genre was squashed into thin strips. The covers keep their full size now, and the row scrolls under the pinned Open button when space runs out.
- **Titles no longer sit under the covers.** A series logo on its Home tile, and a console logo or collection name on the second screen, are kept clear of the fanned covers and drawn above them.

## Cartridge 0.9.7 · Logos and Collections

### Changed
- **Consoles lead with their logo.** On Home and at the top of a console's page, the console's wordmark now takes the place of its written name, the same way a game's logo does. The name sits small above it.
- **A new second screen for consoles, collections, series and genres.** They now use the game view's layout: the console logo or the collection's name up top, its covers fanned beside it, a row of its games to tap (games on this device first, with a tick), and Open pinned above the dock.
- **The top bar is plain again.** The tinted top bar that blended into the art (a preview in 0.9.5) is gone, along with its setting.

### Fixed
- **Collections and Series tiles on Android.** On some Android WebViews the tiles showed as a thin, tall outline with no picture. Older WebViews line up the insides of buttons differently, which squeezed the picture box to nothing. Buttons now lay out the same everywhere.

## Cartridge 0.9.6 · Emulator Expansion

### New
- **The ARM emulators.** Play now starts games in ARMSX1 (PS1), ARMSX2 (PS2, including the debug build), ARMSX3 (PS3), EmuCoreX (PS2), EmuCoreC (PS3), aX360e, XenDroid and Xenra (Xbox 360), hakuX (Xbox), BachataS4 (PS4), Citra MMJ (3DS), SkyEmu (Game Boy, GBC, GBA, DS), NooDS (also GBA) and MAME4droid (arcade). Their launch methods are the ones the big frontends use.
- **PS Vita, PS4 and Xbox consoles.** Vita3K and EmuCoreV start a Vita game from its title ID when the game's name carries it (like `[PCSB00245]`), BachataS4 a PS4 game from its CUSA ID. ARMSX3 can start from either the file or the title ID.
- **Emulators that can't be told which game:** RPCSX, shadPS4 and Xenia are found by name and Play opens them, with a note to pick the game inside. The same happens for Vita3K, EmuCoreV or BachataS4 when a game has no title ID in its name. Ready to play says "opens the app" for these.
- **Firmware and BIOS checks** for PS3, Vita and Xbox, with the same "I have it" confirmation.
- **A new app icon.** The launcher icon, round icon and splash use the current Cartridge mark on a dark tile, replacing the old purple one.

### Fixed
- **Genres on the second screen.** Highlighting a genre now shows it (its name, game count, covers and Open), and Open takes you to that genre. Series and Cartridge's own lists are labelled as what they are instead of "Collection".
- **Pictures on Collections, Series and Genres.** The tiles used lazily loaded images at fractional sizes, which some Android WebViews never started loading. They now load straight away with fixed sizes, and try again if the image server wasn't ready. The covers on the second screen no longer rely on a newer layout feature either.

## Cartridge 0.9.5 · Smooth Moves

### Fixed
- **Games you have are found, even under another name.** Cartridge now also matches a file to a game by its name without the region and dump tags, or by the game's title, when exactly one file fits. "Assassin's Creed - Bloodlines (USA).cso" now counts as installed.
- **The Home banner is no longer cut in half after leaving a game.** Coming back to a game card could scroll the whole page up under the top bar. That part of the screen can't scroll any more.
- **The animated background moves on Android without touching the screen.** It only showed new frames while something else changed on screen.
- **Covers load on the first start.** Home loads its covers straight away, and a cover that fails because the image server wasn't ready yet is tried again.
- **Scrolling no longer jumps back to the top.** When a list refreshed under the highlighted game, the next press started from the first item; it now carries on from the same game, or the nearest one.
- **The second screen follows the right game.** It could show a game you'd already moved past (updates arrived out of order), and now shows the newest one sooner.
- **The second screen comes back.** A back gesture on it no longer closes it, it reopens when you return to Cartridge, and the Quick Menu has a Second screen switch.
- **Your emulator's real name.** Play and Ready to play show the installed app's own name (like Azahar Plus), and each installed app is listed once.
- **Long console names** stay under their own game card.
- **Home ends at the last row** instead of scrolling on into empty space.

### New
- **Top bar and art as one piece (preview, Android).** The top bar takes a deep shade of the art on screen, the art fades up into it, and it fades into the page with a long, soft edge. Turn it off in Settings → Android → Blend the top bar with the art.

## Cartridge 0.9.4 · Handheld Polish

### Fixed
- **Games you already have are found.** Cartridge used to look only for the exact file name in the console's folder. It now also finds the game in another case, under another format of the same game (a .cso for RomM's .iso, .rvz for .iso), one folder down (like `psp/ISO`), and in any of the folder names that console can use. Unfinished downloads (.part) are never counted.
- **Home on Android: the story is readable.** Bright art sat right behind the text. The art now has a proper shade on the left, fades into the page (in any theme colour) instead of ending in a dark box, and a small screenshot is softened instead of stretched blocky.
- **Home after leaving a game.** The top of the Home banner was cut off when you came back from a game. It now fits again once the logo loads.
- **Game page on a 720p handheld.** Play and Download are on screen straight away: a shorter banner, with HowLongToBeat moved below the buttons.

### Changed
- **The second screen's game view.** Open and Download stay pinned just above the tabs at the bottom and are never covered. The box art stands straight next to the logo. Scrolling moves the art slower than the page and eases the logo and box art back.

## Cartridge 0.9.3 · Android Hotfix

Includes abdu2304's 0.9.2 (white highlights by default, clearer selection, the D-pad stays inside the part of the screen you're in).

### Fixed
- **Console logos on Android.** Only PS5, PSP and Wii showed a logo: the others are drawn from files that give no size, which older Android WebViews draw at zero size. Cartridge now adds the size, so every console's logo shows, including ones already downloaded.
- **Console pictures appear straight away.** On the Consoles screen, the controller pictures only showed once you moved onto a card.
- **Manuals open on Android.** They failed with "Promise.withResolvers is not a function" on WebViews older than Chrome 119. The Android app now uses the PDF reader build made for older browsers.
- **Play in PPSSPP and other emulators.** The game is now handed over with permission to read it, instead of a storage link the emulator could only open if you had added that folder in it ("file doesn't exist"). Disc sheets (.cue, .gdi, .m3u) still need their folder added in the emulator, since their tracks sit next to them.
- **Your own emulator build is used.** Forks and beta builds under other names (an Azahar beta, yuzu forks, NetherSX2 and so on) are found too. When more than one emulator could run a console, the first Play asks which one you use and remembers it.
- **Settings with a controller.** The list on the left now scrolls to what you're on, so About can be reached and seen with the D-pad.
- **The background no longer restarts when you tap.** It used to pause while you touched or moved and then jump ahead. On Android it now keeps moving smoothly, and where it still pauses (the Deck without a GPU) it carries on from where it stopped.
- **Game page banner.** A small screenshot stretched across the top looked blocky on Android. It's now softened, so the logo and cover stand out.

### Changed
- **The second screen's game view:** the game's logo leads, the box art peeks in from the right edge, the name is a small hint under the logo, then the story with Show more, and Open and Download.

## Cartridge 0.9.2 · The Android Expansion

Includes everything from abdu2304's 0.9.1 (launch options checked against EmuDeck and Steam ROM Manager, your own launch options, Flatpak access, Emulator setup notice).

### New
- **A real Play button on Android.** Press Play and the game opens in the right emulator: PPSSPP, Dolphin, Azahar and other 3DS emulators, melonDS, DuckStation, NetherSX2 and ARMSX2, Eden, Flycast, Cemu, aPS3e and more, plus RetroArch with the right core for everything else. Cartridge finds what is installed, and only asks an emulator to open a game the way a frontend does. It never installs or changes an emulator.
- **Ready to play, on every game.** A section on the game page that says what stands between you and the game: ROM, Emulator, BIOS, Core, Update and Storage. Ready shows **Ready to play** with every check green. If not, it says how many things are needed and what they are, and **Fix everything** does what Cartridge can (allow file access, download the game, open the emulator's download page). BIOS files are never downloaded or copied: it tells you what is missing. Android hides other apps' folders, so where a BIOS or RetroArch core can't be checked you confirm it once with **I have it**.
- **Pick the emulator per game or per console.** More → Emulator for this game, or **Change emulator**. Settings → Android → Emulators lists what was found.
- **Game bundles.** A game with an update and DLC shows as one: base game, the newest update (for example Update 3.0.4), DLC counted and expandable, each with a check for what is on this device, and "Installed on AYN Thor". The base game is what gets opened, never the update or DLC file.

### Fixed
- **D-pad right on a shelf is steady.** Pressing right quickly no longer overshoots the row, and the end of a shelf no longer jumps to the shelf above or below.
- **Smoother at 120 Hz.** The app asks Android for the screen's fastest mode, so scrolling and focus moves run at 120 on screens that support it.

## Cartridge 0.9.1 · Handheld Fixes

### Fixed
- **Settings fit on handheld screens.** On shorter screens like the AYN Thor, the bottom of every Settings page was cut off, so About never showed fully. The side menu and the page now each scroll within the screen.
- **Console cards and the game preview on Android.** Some Android versions ignore a colour effect the new look relies on, so console cards came out flat grey and the game preview on Home had no dark shade behind the text, making it hard to read. Both now have a fallback and look right everywhere.
- **Console logos missing on the Consoles screen.** If a logo download failed once (a slow or dropped connection), Cartridge treated that console as having no logo for a week. It now only gives up when the logo really doesn't exist, and tries again otherwise. Consoles affected before are checked again.
- **Fetch all logos did nothing** for games whose logo lookup had failed recently. It now tries them again, and says when a SteamGridDB key is needed.
- **Smoother on Android.** The animated background now uses the lighter mode on Android (the one the Deck uses in Game Mode): it draws at a lower resolution and frame rate and pauses while you move around. You can still pick Full in Look & Feel.

### Changed
- **The second screen matches the new look:** solid dark panels, a flat accent button, white highlights and the new type, without the old glows and gradients. The phone remote's Controls tab follows it too.

## Cartridge 0.9.1 · Fixes (abdu2304)

Included in this fork from 0.9.2.

## Cartridge 0.9.15 · Welcome Home (abdu2304)

Included in this fork from 0.9.17.

## Cartridge 0.9.16 to 0.9.22 (abdu2304)

Included in this fork from 0.9.21. On Android, the parts that need a Linux desktop (Steam, Flatpak and AppImage emulators, Syncthing, emulator add-ons and updates) are left out.

## Cartridge 0.9.23 (abdu2304)

Included in this fork from 0.9.22. On Android, per-game emulator settings, shadPS4 versions and the Syncthing page are left out.

## Cartridge 0.9.23 · Make It Yours (abdu2304)

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

## Cartridge 0.9.22 · Home Fix (abdu2304)

### Fixed
- **Home disappeared** after moving a couple of times (down twice, or right once): the header and every row vanished. Home called the wrong thing to find a game's header picture, which failed the moment a game was highlighted and took the whole page down with it. It came in with 0.9.21's change to SteamGridDB headers.
- **No header pictures on Home:** the same fault stopped Home's header from showing. Headers are SteamGridDB's, as asked in 0.9.21. When SteamGridDB can't be reached, the game's cover shows blurred instead of nothing.

## Cartridge 0.9.21 · Start, Your Way (abdu2304)

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

## Cartridge 0.9.20 · Start, Refined (abdu2304)

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

## Cartridge 0.9.19 · Start (abdu2304)

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

## Cartridge 0.9.18 · Textures In Place (abdu2304)

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

## Cartridge 0.9.17 · Set Up In One Place (abdu2304)

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

## Cartridge 0.9.16 · Your Emulators (abdu2304)

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

## Cartridge 0.9.3 L · Fixes from the couch (abdu2304)

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

## Cartridge 0.9.3 K · One place for trophies, and a calmer look (abdu2304)

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

## Cartridge 0.9.3 J · Sturdier with every RomM version (abdu2304)

### Changed
- **RomM versions.** Cartridge reads each game from RomM so that a missing, empty or unexpected field (older servers, newer ones, or a broken entry) never stops a library sync. New tests cover a current RomM, an older one without metadata, and odd values.
- **Emulator for this game** has a test making sure a game's own emulator pick always beats its console's, and falls back to the console's when that emulator is gone.

## Cartridge 0.9.3 I · Scores, ratings and the idle screen (abdu2304)

### New
- **Score and age rating on game pages.** The game's info box shows the critic score as a coloured badge (IGDB's critic score, else RomM's combined rating from its other metadata sources) and the age rating as its badge (RomM's rating image, else a PEGI or ESRB badge drawn from the text). Each is hidden when RomM has nothing, so it works without IGDB on the server.

### Changed
- **Idle screen:** the game's logo and the console's logo replace the plain text, over the sharpest art Cartridge has for the game.

## Cartridge 0.9.3 H · One RomM tab, problem reports (abdu2304)

### New
- **Report a problem** (Settings → About): shows your setup report with personal details taken out, so you can read it first. Copy it, open a GitHub issue with it filled in, or scan a QR code to open the issue page on your phone (handy in Game Mode).
- **shadPS4 trophy key guide.** When shadPS4 has no trophy key set, the Trophies & Gamerscore tab says so and shows the steps to add it. Cartridge never ships or downloads the key.

### Changed
- **One RomM tab in Settings.** Connection, Library & Sync and Upload to RomM are together under **RomM**, each with its own heading.
- **Recently played from other devices:** the device name shows in full on its own line under the game, instead of being cut short.

## Cartridge 0.9.3 G · Tidier menus and achievements (abdu2304)

### Changed
- **Refresh Library.** The Quick Menu's "Resync library" and "Scan server for new ROMs" are one item now. RomM looks for new files when your sign-in allows it, then Cartridge pulls new and changed games; otherwise it just resyncs.
- **Title case** for the Quick Menu items and the remaining Settings headings (Top Bar, Undo & Clean Up, Storage Manager, Check Downloaded Games).
- **Achievements:** the Trophies & Gamerscore tab is plain text, no gradient, and its mark is the same size as the RetroAchievements logo.
- **Hide** (on a trophy game's More) replaces "Hide from totals". Settings → Achievements has a **Hidden Games** list to bring them back.
- **RetroAchievements tab:** a console filter and a sort (Latest, Most complete, Least complete, A to Z) for recently played games, the same as Trophies & Gamerscore.

## Cartridge 0.9.3 F · PS4 patches (abdu2304)

### New
- **Patches for PS4 games.** On a PS4 game's page, More → Steam and emulator → **Patches** now lists shadPS4's patches for that game and its version (including an installed update), plus the ones made for any version. Tick and press **Apply**: Cartridge switches them on in shadPS4's own patch files, exactly as ticking them in shadPS4's launcher does, so they stay on.
- As with RPCS3, Cartridge only turns off patches it turned on itself, and changes nothing else in those files. If shadPS4 hasn't downloaded its patches yet, Cartridge tells you where to do that.

## Cartridge 0.9.3 E · PS3 patches (abdu2304)

### New
- **Patches for PS3 games.** On a PS3 game's page, More → Steam and emulator → **Patches** lists the patches RPCS3 has for that game and its version (60 FPS, widescreen and the like), from RPCS3's own patch list. Tick the ones you want and press **Apply**: they're saved in RPCS3's own patch settings, so they stay on exactly as if you'd ticked them in RPCS3. Nothing changes until you press Apply.
- Cartridge only turns off patches it turned on itself. Patches you turned on in RPCS3 show as "On in RPCS3" and are left alone, and so is everything else in RPCS3's patch settings.
- If RPCS3 hasn't downloaded its patch list yet, Cartridge tells you where to do that in RPCS3.

## Cartridge 0.9.3 D · Vita games (abdu2304)

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

## Cartridge 0.9.3 C · PS3 games from packages (abdu2304)

### New
- **Install in RPCS3.** PS3 games that come as `.pkg` files get an **Install in RPCS3** button on their game page once downloaded (Downloads points to it too). Nothing installs until you press it. RPCS3 installs the game without opening its window, with its licence files (`.rap`, `.edat`), DLC and updates in the right order. Cartridge then checks the game really arrived in RPCS3.
- **Updates and DLC.** Update packages in the same game install into the same game in RPCS3. "Install again in RPCS3" (More) installs ones added later.
- **Starts by serial.** Steam shortcuts for these games start them by their serial, like RPCS3's own shortcuts, so they keep working if RPCS3's storage moves.
- **Free up space.** After installing, Cartridge offers to delete the downloaded package, which isn't needed to play any more.
- **Safe delete.** Delete can also remove a game Cartridge installed in RPCS3, after a clear confirmation. It only ever removes that one game's folder, after checking it's exactly the game Cartridge installed. Saves, trophies, licences, settings and games you installed yourself are never touched.

## Cartridge 0.9.3 B · More emulators (abdu2304)

### New
- **More emulators for Steam shortcuts.** Cartridge now finds and starts DeSmuME (DS), Mupen64Plus (N64), Snes9x (SNES), Mesen (NES, SNES, Game Boy, GBA, PC Engine, Master System, Game Gear, WonderSwan), Play! (PS2), Kronos (Saturn) and Xenia Edge (Xbox 360, the native Linux build EmuDeck installs). Each one's launch options were read from its own source code.
- **PrimeHack** (EmuDeck's Flatpak or an AppImage) is listed as a fork of Dolphin, for GameCube and Wii. Like other forks, it's only used when you pick it.

### Changed
- **Version names.** 0.9.3 is finished in parts: this is 0.9.3 B, and Settings → About and update messages show that name.

## Cartridge 0.9.3 · Emulators (abdu2304)

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

## Cartridge 0.9.2 · Controls and colour (abdu2304)

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

### New: abdu2304's 0.8.2 and 0.9.0
Everything from the original Cartridge's latest releases is now part of this build:
- **A new look.** Solid, dark and quiet around your game art, with bigger art, one type scale, one accent colour and a white highlight, plus a new logo. Themes, fonts and backgrounds you picked yourself stay. The phone remote and the second screen follow it too.
- **Emulator setup** finds your emulators wherever they are (even renamed AppImages, by what's inside them), shows which emulator each console uses, and flags missing cores, BIOS files and Flatpak folder access. **BIOS from RomM** when it has them.
- **Emulator for one game**, **Shortcut health** that fixes shortcuts whose emulator moved, and **console collections in Steam**.
- **Check downloaded games** (Settings → Storage) against RomM and re-download damaged ones.
- **Manuals** readable with the controller, a short **tour** of the controls, and **Copy setup report** for bug reports.
- **Recently played across devices** through RomM, **trophy filters** and Hide from totals, and a **controller test** in Settings → About.
- **Fixes:** Steam launch options back where they were, LT and RT work on the first press, snappier controls, touch scrolls like a phone, and sharper SteamGridDB backgrounds.
- QR pairing with RomM asks for device access (for Recently played across devices). Paired before? Pair again to use it.

On Android, Emulator setup and the Steam options only appear when Settings → Android → Steam & PC game apps is on.

## Cartridge 0.8.0 · Your Library, Alive

### New: upload to RomM from your phone
- **Upload tab in the phone remote.** Pick a game file on your phone, check the console (Cartridge picks it from the file type), and it goes through your Cartridge device to RomM, with live progress for both steps. It's sent in small pieces, so big files work through a Cloudflare tunnel too, and a dropped piece is sent again by itself. Run a scan in RomM afterwards to add it to your library.
- **Games on your device that RomM doesn't have.** The same tab lists the files in the device's console folders that aren't in RomM yet, found automatically. Upload one, or all at once.
- Phones can only upload those files or the file they sent. They can't reach anything else on the device.

### New: abdu2304's 0.7.8 to 0.8.1
Everything from the original Cartridge's latest releases is now part of this build:
- **Play time, new Home rows, Timeline and Edit details.** Time played from Steam and RetroArch, Most played, Finish what you started and more, a game's history, and name, description and cover changes saved to RomM.
- **Upload to RomM** (Settings → RomM), **Server status** (Settings → About), an **Idle screen**, **word suggestions** on the on-screen keyboard, **console backgrounds**, **Theme from this game**, **Refresh artwork in Steam** and **Free up space**.
- **Steam launches fixed and every setup found:** RetroArch, Xbox and Xbox 360 games start, Steam ROM Manager shortcuts are recognised, an Emulator picker per console, Update for games already in Steam, Missing from Steam, PS Vita through Vita3K, and emulators from your distro, Flatpaks, AppImages and RetroArch anywhere.
- **New console cards, genre tiles and Downloads screen**, collections split by console, a tidier library toolbar, and smoother scrolling, most of all in Game Mode.
- **Colour-coded connection pill:** LAN green, Tunnel purple, Offline red.
- QR pairing with RomM now asks for permission to change games (for Edit details and Upload). Paired before? Pair again, or sign in with your password.

On Android, the Steam options still only appear when Settings → Android → Steam & PC game apps is on.

## Cartridge 0.7.5 · Steam & Polish

### New: abdu2304's 0.7.5, 0.7.6 and 0.7.7
Everything from the original Cartridge's latest three releases is now part of this build:
- **Steam consoles have their own page** (Settings → Steam): each console as a card with its logo and how many games are in Steam, every downloaded game with In Steam or Not in Steam, and **Add all**.
- **Adding games to Steam in Game Mode works live** when Decky Loader is installed: shortcut, launch options, artwork and collections go straight into the running Steam, with no restart. Without Decky, Cartridge watches Steam much more closely so changes aren't lost. **Live changes** in Settings → Steam shows the state and can turn it on.
- **Logos on games added to Steam no longer show blank.**
- **How long to beat on every game page:** Main story, Main + extras and Completionist, from RomM or HowLongToBeat, looked up once and saved.
- **New collection and series tiles** with the game's artwork and fanned covers.
- **One "Change metadata" entry** in a game's More menu for cover, logo, background and reset.
- **Fixes:** the Steam collection list and long pop-up menus scroll with a controller, a game page scrolls back up to its banner, and console tiles keep their rounded corners when highlighted.

On Android, the Steam options still only appear when Settings → Android → Steam & PC game apps is on.

## Cartridge 0.7.4 · Security & Resume

### New
- **Sign-in for phones.** Settings → Phone remote → Sign-in for phones sets a username and password. Every phone then has to sign in with them, with no codes or QR shortcuts, so you can put the device behind a Cloudflare tunnel (or any other) safely. Phones get a clean sign-in screen. The password is stored only as a salted hash, five wrong tries lock sign-in for a minute, and changing or turning it off signs out every phone.
- **Phones work through a tunnel.** Open the device's https address on your phone and everything works over it: sign-in, library, downloads, controls and live updates.
- **Downloads pick up where they left off.** Close Cartridge (or restart the device) in the middle of a download and it carries on from the same byte when you open it again, with the rest of the queue and paused games as they were. Unfinished downloads from before this update are found in your console folders and continue too.
- **How long is left for everything.** The Downloads page, the second screen and the phone show the time left for each game and for the whole queue.

### Changed
- **Auto connection is smarter.** Cartridge uses your local address only when RomM actually answers there, otherwise the remote one, and keeps checking every 30 seconds: coming home switches to local, leaving switches to remote.
- **Downloads never fail because the connection dropped.** They wait ("Waiting for the server") and continue by themselves when RomM is reachable again, on whichever address works.

## Cartridge 0.7.3 · The Library Update

### New: abdu2304's 0.7.0
Everything from the original Cartridge's Library Update is now part of this build:
- **Collections.** Your own collections saved in RomM, plus Top rated, Hidden gems, Couch multiplayer, Short games and every series, on Home and a Collections page.
- **Genres** on Home and a Genres page.
- **Customise the top bar** in Look & Feel → Top bar: show, hide and reorder tabs. LT and RT follow your order.
- **Play status and favourites, synced with RomM.** Playing now, Backlog, Finished, Completed 100%, Gave up, Not for me, or hide a game. Home gets Continue playing, Backlog, Favourites and Recently played rows.
- **Game page:** "About N h to beat" from HowLongToBeat, plus More in this series and Similar games.
- **PS4 and PS5 zips unpack themselves** after downloading, on Android too.
- **Better Library filters** (genre, decade, couch multiplayer, rating, play status, hidden games), sort by Rating, and **Surprise me**.
- **Select many games** in the Library to download them or add them to a collection in one go.
- **Download queue controls:** move waiting games up or down, Pause all, Resume all, and a Speed limit in Settings → Downloads.

### Phone remote
- **Queue controls on your phone.** Each device's downloads get Pause all or Resume all, and waiting games can be moved up or down.
- **Hidden games stay hidden** in the phone's Library too.

### Changed
- On Android, Library → Select → Add to Steam only shows when Settings → Android → Steam & PC game apps is on, like the other Steam options.
- Pairing with RomM by code or QR now asks for permission to change collections. Paired before? Pair again to use collections and play status.

## Cartridge 0.7.2 · Touch Enhancement

### New
- **Tap a button hint to press it.** Every controller hint now works with touch and the mouse too: tap **≡ Menu** for the Quick Menu, **Downloads** for your queue, **Y Filter**, **X Download**, **B Back**, or the **LT** / **RT** next to the tabs to switch tabs. The same goes for the hints in the on-screen keyboard, the folder picker and the screenshot viewer. Tapping never brings up the controller highlight, and swiping across the hint bar doesn't trigger anything.

## Cartridge 0.7.1 · The Steam Update

### New: abdu2304's 0.6.0 and 0.6.1
Everything from the original Cartridge's latest two releases is now part of this build:
- **Your games in Steam** (Settings → Steam on a Deck or PC), with previews, collections, artwork and Undo.
- **Trophies redesign**, trophy pictures that sync between devices, and game icons from SteamGridDB.
- **Button hints that match your controller** (Xbox, PlayStation, Nintendo or Steam). These replace this fork's earlier icon set everywhere, including the second screen and the phone's touch controls. Your saved choice carries over.
- **Downloads are checked against RomM**, a **Storage manager** in Settings → Storage, a **warning before a download that won't fit**, and **Look & Feel presets**.
- **Pair with RomM using a QR code** in Setup. With Phone remote on, **Send to my phone** opens RomM's approval page on your phone, so you don't have to point a camera at the handheld in your hands.

### Android
- **Steam & PC game apps (optional).** Settings → Android has a new switch, off by default. Turned on, it shows Settings → Steam and adds **Open in a PC game app** to Windows games. GameNative, GameHub and Winlator keep their game lists private, so Cartridge downloads the game, opens the app you pick and shows (and copies) the folder to add there.
- The phone's **Download to** list warns when a game won't fit on a device and offers Download anyway.

## Cartridge 0.7.0 · Phone Remote

### New
- **Your phone is a remote for every Cartridge at home.** Turn on **Settings → Phone remote** on any Cartridge (Android or Deck/desktop), then scan its QR code with your phone or open its address in the phone's browser. Nothing to install on the phone. It works anywhere on the same Wi-Fi, even from another room.
- **Every device in one place.** The phone finds every Cartridge on your network and shows each one's name, battery and current download. Tap one to connect: a 6-digit code appears on that device's screen, you enter it once, and the phone is remembered from then on. Scanning the QR code connects straight away with no code.
- **Pick where a game downloads.** Browse and search the library on your phone. Each game shows which devices already have it, and **Download to** lists every device with the folder the game will go into, whether that folder exists, and the free space there.
- **All downloads together.** The Downloads tab shows every device's queue, grouped by device, with live progress, speed, cancel, retry and clear.
- **Devices tab.** Storage per ROM location with free space bars, what each device is downloading, switching between devices, and one-tap Disconnect.
- **Now and Controls.** See what's highlighted on the device, open it, and drive the device with a touch D-pad, face buttons, shoulders and quick jumps.
- **Theme sync.** The phone follows the selected device's theme, colours, fonts and background, live.
- **Safe by design.** Phone remote is off until you turn it on. Phones get their own key, can't change settings, delete games or see your server passwords, and can be removed one by one (or all at once) in **Settings → Phone remote**. The device shows who is asking before any phone connects.

## Cartridge 0.6.5 · Polish

### New
- **Settings on the second screen.** A small gear in the second screen's dock opens all of Settings there, laid out for the smaller screen; changes show on the top screen right away. Turning the second screen off lives there too.
- **A redesigned second screen.** Artwork now fills the top edge to edge and fades into your background, with the cover, logo and details over it, and big pill buttons. Downloads show the current game large, with its percent, speed and what's left; an empty queue gets a friendly screen with a shortcut to your library. The tabs moved into a small floating dock at the bottom.

### Fixed
- **Settings kept jumping back to the first section** when you moved right into a section with the D-pad or stick while it was still switching.

### Changed
- **The clock and status icons on Android sit in a pill** like the tabs next to them, instead of floating over the background.
- **The second screen's D-pad is one cross-shaped pad,** without the dark box behind it.
- **Downloads on Android go back to the 0.6.3 method,** which was faster.

## Cartridge 0.6.4 · Controls & Speed

### New
- **Button icons match your controller** everywhere in the app: Xbox (and Xbox-style handhelds like the ROG Ally, Legion Go and MSI Claw), PlayStation, Nintendo, Steam Deck, or keyboard keys when you use a keyboard. Cartridge switches automatically as you change what you hold; **Settings → Look & Feel → Button icons** can pin one. The second screen's touch buttons use the same icons.
- **The second screen's buttons match your controller.** Its touch A / B / X / Y follow a Nintendo layout (A on the right) or an Xbox layout (A at the bottom), picked from your controller. If it guesses wrong, set it in **Settings → Android → Button layout**.

### Fixed
- **Faster downloads on Android.** Games are written to storage in large blocks instead of many small pieces, which Android's shared storage and SD cards handle much faster.
- **The Quick Menu scrolls** to follow the selection, so every item is reachable with the D-pad.
- **The Home header no longer ends up cut off** after scrolling down a list and back up on a touchscreen.

## Cartridge 0.6.3 · Second Screen Polish

### Changed
- **The second screen looks like the first.** It is rebuilt from the same pieces as the top screen:
  - **Games:** a banner with the game's artwork and logo, the cover art on top, then the same details line as the Home header, Open and Download, and the description with Show more.
  - **Consoles:** a banner in the console's own colours with its logo, how many games are on your server and on this device, and its ROM folder.
  - **Collections and Favourites:** a banner of their covers, the name and how many games they hold.
  - **Downloads:** cover, name, live progress and speed, with cancel and retry.
  - The top screen's tabs, buttons and panels.
- **The second screen's background stays still.** It uses the same theme, colours, background style and wallpaper as the top screen, without the animation.

### Fixed
- **Game art loads reliably and fast on both screens.** Images now load over several connections at once without depending on special addresses, and each one fades in once it is ready instead of popping in or showing as broken.

## Cartridge 0.6.2 · The Android Hotfix

### Fixed
- **Tapping a section in Settings now opens it.** On a touchscreen the list on the left ignored taps.
- **Game art loads much faster,** on both screens. Images now load many at a time instead of six at once, which also fixes covers that showed on the top screen but not the bottom one. An image that fails to load gets one more try.
- **Look & Feel changes show on the second screen right away:** theme, colours, fonts, panels, background and wallpaper.
- **Moving up from the second row goes to the row above,** not the top bar, even when that row is scrolled sideways. The same fix applies to moving down.
- **Long game descriptions on the second screen** show four lines, with More to read the rest.

### New
- **Consoles and collections on the second screen.** Highlight a console and the bottom screen shows its tile, how many games it has, how many are on this device and its ROM folder. Collections show their covers and counts. Both have Open on top screen.
- **Bigger touch targets** on the second screen.

### Also in this release
- **Everything from Cartridge 0.5.6:** square game icons on the trophy pages, fine-tuned colours for highlights, buttons, progress bars and the background, shadPS4 trophy fixes, and smoother performance.

## Cartridge 0.6.1 · Android Fixes

### New
- **A second screen that matches the first.** On the AYN Thor and other dual-screen devices, the bottom screen now uses your theme, background, fonts and game logos. It has three tabs:
  - **Game:** artwork, cover, logo, year, rating, size, genres, the description and live download progress, with Open, Download and Cancel.
  - **Downloads:** your whole queue with live progress; cancel, retry or clear finished.
  - **Controls:** a touch D-pad (hold to repeat), A / B / X / Y, shoulder buttons, Select / Start and shortcuts that jump the top screen to Home, Library, Consoles, Search, Downloads or Settings.
- **Turn the second screen off** from Settings → Android → Use the second screen, or with the button on the second screen itself.

### Fixed
- **Downloads on the second screen and in the notification stayed at 0%.** They now show live progress.
- **Touch scrolling and tapping on Android.** Lists now scroll smoothly with momentum, and taps register properly.
- **The search box no longer traps the D-pad on Android.** Android's keyboard used to open and grab the D-pad; the built-in on-screen keyboard is used instead (change it under Look & Feel → On-screen keyboard).
- **Releases include the AppImage again,** next to the APK.

## Cartridge 0.6.0 · The Android Update

### New
- **Cartridge for Android.** Every release now also comes as `Cartridge-android.apk`, built from the same code as the AppImage, so Android gets every update at the same time. Same look, same controls, same features.
- **Your ROM folders are found for you.** Cartridge looks on internal storage and SD cards for `ROMs`, `Emulation/roms` and the ES-DE ROM folder, and saves each game into its console folder (`nds`, `n3ds`, `psp`, `ps2`, `switch` and the rest). A console folder somewhere else, like `NDS` at the top of the SD card, is picked up too.
- **Controllers and touch.** Built-in and Bluetooth controllers work like on the Deck, including held directions and triggers. Everything can also be tapped and swiped, and the Android back gesture goes back.
- **Dual screen on the AYN Thor.** On dual-screen devices the bottom screen becomes a touch companion: the highlighted game with its cover and a Download button, live download progress, a touch d-pad and quick tabs. Single-screen devices never see it.
- **Settings → Android.** File access, found ROM folders, dual screen, downloads that keep going in the background, full screen and in-app updates. These settings only exist in the Android app.

### Also in this release
- Everything from 0.5.5 (smoother held D-pad scrolling, Home fixes, LT / RT switch tabs).

## Cartridge 0.9.0 · Setup (abdu2304)

Included in this fork from 0.9.0.

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

## Cartridge 0.8.2 · Fixes (abdu2304)

Included in this fork from 0.9.0.

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

## Cartridge 0.8.1 · Connection Colours (abdu2304)

Included in this fork from 0.8.0.

### Changed
- **The connection pill in the top bar is colour coded.** LAN is a green pill, Tunnel a purple one and Offline a red one, each with a matching edge. They look the same on every background colour.

## Cartridge 0.8.0 · Your Library, Alive (abdu2304)

Included in this fork from 0.8.0.

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


## Cartridge 0.7.13 · Console Cards (abdu2304)

Included in this fork from 0.8.0.

### Changed
- **New console cards.** Each card is filled with the console's own colours, with a glossy top edge, the controller picture large on the right fading out to the left, and the game count in a small pill. The selected card lifts with a glow in the console's colour. The same cards are used on Home.
- **New Consoles header.** A clean "Consoles" title with big numbers underneath: consoles, games, on this device and last sync.
- **LAN and Tunnel label.** The coloured dot is gone. The top bar shows a light green "LAN" or a light purple "Tunnel" on a dark see-through pill, so it stays readable on any background colour.

### Fixed
- The console picture and the colour strip were cut off at the bottom and right edges of each card. The picture now always sits inside the card.
- "1 games" now reads "1 game".

## Cartridge 0.7.12 · Smoother (abdu2304)

Included in this fork from 0.8.0.

### Fixed
- **Games added to Steam no longer get `%command%` in their Launch options.** When Cartridge added a game while Steam was running, Steam filled in `%command%` by itself, and with the emulator's settings in Target that stopped RetroArch, Xbox, Xbox 360, 3DS and Dreamcast games from starting. Cartridge now checks what Steam saved after adding a game and clears it again.
- **Games already affected are fixed with Update.** Their console page in Settings → Steam shows Update; pressing it clears `%command%` in place, so play time and the shortcut stay as they are.

### Changed
- **Smoother moving around, most of all in Game Mode.** Rows, shelves and lists now scroll without redrawing the whole screen, the background is drawn in a way that is cheaper to show, and focusing a game no longer redraws its shadow on every frame in reduced effects mode. In tests without the GPU this cut the drawing work while moving around by about a third. Nothing looks different.

## Cartridge 0.7.11 · Launch Fix (abdu2304)

Included in this fork from 0.8.0.

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

## Cartridge 0.7.10 · Emulator List (abdu2304)

Included in this fork from 0.8.0.

### Changed
- **The Emulator picker only lists what you have, once.** EmuDeck's launchers are often a wrapper: `dolphin-emu.sh` runs the Dolphin Flatpak, `pcsx2-qt.sh` runs the AppImage in ~/Applications. Cartridge now reads the launcher and doesn't list that same copy again. A copy that really is separate (an AppImage in another folder) is still listed.
- **Cartridge knows many more emulators**, taken from EmuDeck's and Steam ROM Manager's setups: MAME (arcade), ares (NES, SNES, N64, Game Boy, Mega Drive and more), simple64 and Parallel Launcher (N64), bsnes (SNES), Nestopia (NES), Stella (Atari 2600), Ymir (Saturn), ScummVM and BigPEmu, plus Flycast for NAOMI and Atomiswave. They're only offered when installed.
- **Many more RetroArch cores and consoles**, including Atari, Amiga, MSX, PC Engine CD, Neo Geo, WonderSwan, 3DO and DOS.
- Flycast gets its fullscreen option when it isn't started through EmuDeck.

## Cartridge 0.7.9 · Every Setup (abdu2304)

Included in this fork from 0.8.0.

### Changed
- **Cartridge finds your emulators however you installed them.** Settings → Steam used to look only for EmuDeck launchers, AppImages and one Flatpak per emulator. It now also finds:
  - **Programs from your distro** (for example `dolphin-emu`, `pcsx2-qt`, `retroarch` on your PATH).
  - **More Flatpaks**: Ryujinx (Ryubing), Lime3DS and Citra, Eden, Citron, Sudachi, mGBA, Flycast, melonDS, Rosalie's Mupen GUI.
  - **RetroArch from anywhere**: EmuDeck, Flatpak, AppImage, your distro, or RetroArch on Steam, each with the cores it has.
- **Every copy is listed.** If you have an emulator twice (say the Flatpak and an AppImage), both show in the Emulator picker and you choose.
- **Standalone emulators for more consoles**: mGBA for Game Boy, GBC and GBA, Rosalie's Mupen GUI for N64, Flycast for Dreamcast, next to RetroArch.

### Fixed
- **Games on a symlinked home folder** (Bazzite and other image-based systems) are now given to emulators by their real path, which sandboxed emulators can always open.

## Cartridge 0.7.8 · Launch Fixes (abdu2304)

Included in this fork from 0.8.0.

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

## Cartridge 0.7.7 · Steam Logo Fix (abdu2304)

Included in this fork from 0.7.5.

### Fixed
- **Logos on games added to Steam could show blank.** Steam only shows a shortcut's logo once it has a position, so Cartridge now saves one (bottom left) right after the logo, the same way the SteamGridDB Decky plugin does. Applies when games are added live through Decky Loader.

## Cartridge 0.7.6 · Steam Fixes (abdu2304)

Included in this fork from 0.7.5.

### Fixed
- **Adding games to Steam in Game Mode.** Game Mode starts Steam again the moment it closes, so Cartridge's changes could be lost or never written, and the top bar stayed on "Waiting for Steam…". When Decky Loader is installed, Cartridge now adds games straight into the running Steam, the same way the SteamGridDB plugin changes artwork: shortcut, launch options, artwork and collections, with no restart. Removing works the same way.
- **Restart Steam from Game Mode.** When Decky Loader is installed, Restart Steam asks Steam to restart itself, like the SteamGridDB plugin does.
- **Without Decky Loader**, Cartridge now watches much more closely for Steam closing in Game Mode, so the change is written before Game Mode brings Steam back.

### New
- **Live changes (Settings → Steam).** Shows whether Steam takes changes live. Without Decky Loader, **Turn on** adds the same small file Decky uses to open Steam's interface to apps on this device. Restart Steam once afterwards.

### Changed
- **One "Change metadata" entry in a game's More menu** instead of three. It opens Change cover, Change logo, Change background and Reset artwork.

## Cartridge 0.7.5 · Fixes and Polish (abdu2304)

Included in this fork from 0.7.5.

### New
- **Steam consoles have their own page (Settings → Steam).** Each console is now a card with its logo, how many games you have and how many are in Steam. Open one to see every downloaded game for that console with **In Steam** or **Not in Steam**, and add or remove each one with A. **Add all** adds the rest in one go. The emulator setup (Target, Start in, Launch options) is shown at the top, and **More** holds Edit, Test and how games start.
- **How long to beat on every game page.** Main story, Main + extras and Completionist times. Cartridge uses RomM's times when it has them, and otherwise asks HowLongToBeat itself. Results are saved, so each game is looked up once.

### Changed
- **New collection and series tiles.** Collections and series show a game's artwork with its covers fanned on top, and a series shows its game logo. Genres keep their tiles.

### Fixed
- **The Steam collection list couldn't scroll** past the first few collections with a controller, and the rows squashed together. Long pop-up menus had the same problem.
- **A game page wouldn't scroll back up to its banner** after you scrolled down. Moving back to the buttons now shows the top of the page again.
- **Console tiles showed square edges** when highlighted: the colour strip and faded logo slipped past the rounded corners.

## Cartridge 0.7.0 · The Library Update (abdu2304)

Included in this fork from 0.7.3.

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

## Cartridge 0.6.1 (abdu2304)

Included in this fork from 0.7.1.

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

## Cartridge 0.6.0 · The Steam Update (abdu2304)

Included in this fork from 0.7.1.

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
