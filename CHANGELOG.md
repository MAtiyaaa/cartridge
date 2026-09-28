# Changelog

Every Cartridge release, newest first. Each GitHub release only lists its own changes.

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
