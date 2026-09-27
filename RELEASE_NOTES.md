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
