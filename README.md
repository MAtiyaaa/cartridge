<div align="center">

<img src="docs/logo.png" width="520" alt="Cartridge">

### Your RomM library, on the couch.

A controller-first [RomM](https://github.com/rommapp/romm) client for **SteamOS** and **Bazzite**.<br>
Browse your whole library in Game Mode and pull games straight into your EmuDeck / ES-DE folders.

[![Latest release](https://img.shields.io/github/v/release/abdu2304/cartridge?style=for-the-badge&color=8b74e8&label=release)](https://github.com/abdu2304/cartridge/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/abdu2304/cartridge/total?style=for-the-badge&color=a18fff)](https://github.com/abdu2304/cartridge/releases)
[![Platform](https://img.shields.io/badge/SteamOS%20%7C%20Bazzite-AppImage-e1a38d?style=for-the-badge&logo=steamdeck&logoColor=white)](#install)
[![License](https://img.shields.io/badge/license-MIT-6043c8?style=for-the-badge)](LICENSE)

<a href="https://github.com/abdu2304/cartridge/releases/latest/download/Cartridge-x86_64.AppImage"><img src="https://img.shields.io/badge/Download-Cartridge--x86__64.AppImage-8b74e8?style=for-the-badge&logo=linux&logoColor=white" height="42" alt="Download"></a>

<br><br>

<img src="docs/home.png" width="900" alt="Cartridge home screen">

</div>

<br>

## ✦ Highlights

<table>
<tr>
<td width="50%" valign="top">

**🎮 Made for Game Mode**<br>
Every screen works with a controller: D-pad navigation, button hints, a Quick Menu on Start and soft UI sounds. Text boxes take any keyboard, or the Steam keyboard with Steam + X. Tap the screen and it switches to a proper touch mode with no cursor.

</td>
<td width="50%" valign="top">

**🗂 Straight from RomM**<br>
Covers, screenshots, descriptions, genres, developers, ratings, console icons and collections all come from your RomM server. Nothing is scraped twice.

</td>
</tr>
<tr>
<td valign="top">

**📥 Lands in the right folder**<br>
Each console is matched to its ES-DE folder inside your EmuDeck `roms` directory, with per-console overrides. Downloads resume, multi-disc games get an `.m3u`, and BIOS files come from RomM too.

</td>
<td valign="top">

**🔄 Always in sync**<br>
Your library is mirrored locally, so it opens instantly and works offline. Resync or ask RomM to scan for new ROMs from the couch, and new games get a NEW badge.

</td>
</tr>
<tr>
<td valign="top">

**🚂 Your games in Steam**<br>
Adds downloaded games to Steam with artwork and collections, launching exactly like the shortcuts you already have (Steam ROM Manager, EmuDeck or your own). Preview first, undo any time. Cartridge itself goes in with one click too.

</td>
<td valign="top">

**⬆️ Updates in place**<br>
Settings → Updates checks GitHub Releases and swaps in the new version on restart. Same file, same Steam shortcut, nothing to reinstall.

</td>
</tr>
<tr>
<td valign="top">

**🏆 Achievements and trophies**<br>
RetroAchievements for retro consoles, plus trophies and Gamerscore from RPCS3, shadPS4, Xenia, Vita3K and KytyPS5 wherever they are installed (read only). Every game syncs between your devices through private notes on your RomM server, installed there or not, and unlocks pop up as they happen.

</td>
<td valign="top">

**🧩 Emulators, set up for you**<br>
Finds your emulators however they're installed (EmuDeck, Flatpak, AppImages, packages, RetroDECK), gets and updates new ones, places BIOS and firmware, and installs PS3 and Vita packages. Mods, texture packs, patches, cheats and per-game settings for the emulators that have them, and save sync between devices through Syncthing.

</td>
</tr>
<tr>
<td valign="top">

**🎨 Make it yours**<br>
Two styles, designed separately: **Plain** (solid and matte) and **Glass** (see-through, with real refraction). 17 colours including OLED black and Light, or any colour you like. Animated backgrounds (Ribbons, XMB Waves, Aurora, Contours, Drift, Tide), a still one, game artwork, a pan over a console's covers or your own wallpaper. Seven fonts, card sizes, corners and spacing, motion and sound styles, and a Start page of tiles you arrange yourself. Custom covers, logos and backgrounds per game from SteamGridDB. The first-run welcome lets you pick the style, colour and background before anything else.

</td>
<td valign="top">

**⚡ Handheld to TV**<br>
The interface sizes itself to your screen on every launch, from a Steam Deck to a 4K TV. Motion runs on Cartridge's own animation engine (heavy, short, interruptible), and Cartridge goes quiet when you're idle and nearly silent while a game is running. Lazy-loaded grids and a cached image store keep it smooth.

</td>
</tr>
</table>

<br>

## ✦ Tour

<table>
<tr>
<td width="50%"><img src="docs/library.png" alt="Library"><p align="center"><b>Library</b> · your whole RomM library with a live details panel</p></td>
<td width="50%"><img src="docs/game.png" alt="Game page"><p align="center"><b>Game page</b> · metadata, screenshots and one-button download</p></td>
</tr>
<tr>
<td><img src="docs/settings.png" alt="Look and feel"><p align="center"><b>Look &amp; feel</b> · colors, media bar, logos, touch mode</p></td>
<td valign="middle">

**Home** (top of the page) · recently added, picks for you and what's on your device, with a media bar that follows your selection.

**Downloads** · a queue with progress, speed, pause and resume.

**Consoles** · every RomM platform with its folder, game count and what's installed.

</td>
</tr>
</table>

<br>

## ✦ Install

**One line** (Desktop Mode → Konsole):

```bash
curl -fsSL https://raw.githubusercontent.com/abdu2304/cartridge/main/install.sh | bash
```

This downloads the latest AppImage to `~/Applications`, makes it executable and adds Cartridge to your app menu. Then open Cartridge and use **Settings → Steam → Add to Steam** to get it into Game Mode, with its cover, banner, logo and icon.

**Manual:** download [`Cartridge-x86_64.AppImage`](https://github.com/abdu2304/cartridge/releases/latest/download/Cartridge-x86_64.AppImage), right-click it → **Properties → Permissions → Is executable**, and double-click it. Keep the file name as it is, because updates replace it in place.

**Updating:** open **Settings → Updates → Check for updates**, or pick it from the Quick Menu. The new version downloads in the background and replaces the AppImage when you restart, so your Steam shortcut keeps working.

> **Won't start from Steam?** Press Settings → Steam → Add to Steam again after updating, so Steam uses Cartridge's launch script. Each Steam launch is logged to `~/.config/Cartridge/steam-launch.log`. **Blank window?** Cartridge restarts once without the GPU if the GPU process fails at start. You can also launch once with `./Cartridge-x86_64.AppImage --disable-gpu`. A log is kept at `~/.config/Cartridge/cartridge.log`.

<br>

## ✦ Connecting to RomM

| | |
|---|---|
| **Addresses** | A LAN address, a Cloudflare Tunnel address, or both. In **Auto** mode Cartridge uses the LAN when you're home and falls back to the tunnel. |
| **Sign-in** | Username & password, a RomM **pairing code** or **QR code**, or an `rmm_` API token. |
| **Cloudflare Access** | Optional service-token headers if your tunnel sits behind Zero Trust. |
| **Server scans** | "Scan server for new ROMs" needs username & password sign-in. |

<br>

## ✦ Controls

| Button | Action |
|:---:|---|
| **D-pad / Left stick** | Move |
| **Right stick** | Scroll |
| **A** | Select · hold to arrange Start or open a row's details |
| **B** | Back |
| **X** | Download the highlighted game, or the page's action |
| **Y** | Search, or More on a game page |
| **LT / RT** | Switch top tabs |
| **LB / RB** | Switch sections inside a page |
| **Select** | Downloads |
| **Start** | Quick Menu (resync, scan, updates, screenshot) |
| **Touch** | Tap, swipe to scroll, swipe from the left edge to go back, swipe the tabs to switch them |
| **Keyboard** | Arrows, Enter, Esc; Tab moves focus, 1 to 9 pick a tab, Ctrl+F or / searches, F1 lists the keys |

<br>

## ✦ Under the hood

Cartridge is Electron with a Vue 3 interface and no UI, state or animation library: the engines are its own.
[docs/architecture.md](docs/architecture.md) maps them all. The main ones:

- **CAE, the Cartridge Animation Engine** ([docs/cae.md](docs/cae.md)): springs, one frame loop, shared-element flights, and a governor that quiets Cartridge while you're idle or playing.
- **The Glass engine** ([docs/glass-engine.md](docs/glass-engine.md)): refraction through generated lens maps, a rim light that follows you, and a step down to frosted glass on slow frames.
- **The focus engine** (`src/nav.js`): controller, keyboard, touch and mouse on every screen.
- **The Steam manager**: shortcuts, artwork and collections, live through Steam's own client when it can.
- **Emulator detection and updates**: every install kind, read from inside AppImages, with a check that a new build can run on your Linux.
- **Trophy sync**: emulator trophies read only, shared between devices through private RomM notes.

## ✦ Build from source

```bash
npm install
npm start          # run in development
npm test           # detection, Steam, trophies, readers and more
npm run audit:ui   # focus and contrast in every look (needs Playwright)
npm run dist       # build release/Cartridge-x86_64.AppImage
```

Bumping `version` in `package.json` on `main` builds the AppImage on GitHub Actions and publishes it as a release. Installed copies pick it up automatically.

<br>

Settings and the library cache live in `~/.config/Cartridge/`. The full history of changes is in [CHANGELOG.md](CHANGELOG.md).

Console logos come from the open-source [Art Book Next](https://github.com/anthonycaccese/art-book-next-es-de) theme for ES-DE and are downloaded on first use. The RetroAchievements logo belongs to RetroAchievements. Trophy data is read from RPCS3, shadPS4, Xenia and Vita3K using the file formats in their open-source code. Fonts: Archivo, Inter, Outfit, Roboto, Nunito, Rubik, Space Grotesk and Lexend, all under the SIL Open Font License. The backgrounds are original designs. All logos and trademarks belong to their owners.

<div align="center"><sub>Cartridge is an unofficial client and isn't affiliated with the RomM project.</sub></div>
