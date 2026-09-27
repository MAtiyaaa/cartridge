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

**🚂 One-click Add to Steam**<br>
Settings → Steam adds Cartridge to your library as a non-Steam game, complete with cover, banner, logo and icon.

</td>
<td valign="top">

**⬆️ Updates in place**<br>
Settings → Updates checks GitHub Releases and swaps in the new version on restart. Same file, same Steam shortcut, nothing to reinstall.

</td>
</tr>
<tr>
<td valign="top">

**🎨 Make it yours**<br>
PSP XMB-style animated waves in eight colors, a media bar with the highlighted game's artwork, game logos (from RomM or SteamGridDB) sized evenly, custom covers, logos and backgrounds per game from SteamGridDB, and three box art sizes.

</td>
<td valign="top">

**⚡ Smooth on handhelds**<br>
A lightweight renderer, lazy-loaded grids and a cached image store keep it at 60fps on an Ally or a Deck.

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

> **Won't start from Steam?** Press Settings → Steam → Add to Steam again after updating, so Steam uses Cartridge's launch script. Each Steam launch is logged to `~/.config/Cartridge/steam-launch.log`. **Blank window?** It also switches to software rendering if the GPU process fails. You can also force it with **Settings → Look & feel → Rendering → Compatible**, or launch once with `./Cartridge-x86_64.AppImage --disable-gpu`. A log is kept at `~/.config/Cartridge/cartridge.log`.

<br>

## ✦ Connecting to RomM

| | |
|---|---|
| **Addresses** | A LAN address, a Cloudflare Tunnel address, or both. In **Auto** mode Cartridge uses the LAN when you're home and falls back to the tunnel. |
| **Sign-in** | Username & password, a RomM **pairing code**, or an `rmm_` API token. |
| **Cloudflare Access** | Optional service-token headers if your tunnel sits behind Zero Trust. |
| **Server scans** | "Scan server for new ROMs" needs username & password sign-in. |

<br>

## ✦ Controls

| Button | Action |
|:---:|---|
| **D-pad / Stick** | Move |
| **A** | Select |
| **B** | Back |
| **X** | Download highlighted game |
| **Y** | Search box (type with any keyboard, or Steam + X in Game Mode) · on a game page: More (custom artwork) |
| **LT / RT** | Switch tabs (Home, Library, Consoles, Downloads, Settings) |
| **LB / RB** | Inside a console or collection: previous / next |
| **Select** | Downloads · in a grid: cycle All / On device / Not downloaded / New |
| **Start** | Quick Menu (resync, scan, updates, screenshot) |
| **Touch** | Tap anything. The cursor only appears when a mouse moves |

<br>

## ✦ Build from source

```bash
npm install
npm start       # run in development
npm run dist    # build release/Cartridge-x86_64.AppImage
```

Bumping `version` in `package.json` on `main` builds the AppImage on GitHub Actions and publishes it as a release. Installed copies pick it up automatically.

Settings and the library cache live in `~/.config/Cartridge/`.

<br>

<div align="center"><sub>Cartridge is an unofficial client and isn't affiliated with the RomM project.</sub></div>
