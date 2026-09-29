# Changelog

Every Cartridge release, newest first. Each GitHub release only lists its own changes.

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

## Cartridge 0.9.2 · Controls and colour (abdu2304)

Included in this fork from 0.9.3.

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
