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
Every screen works with a controller: D-pad navigation, an on-screen keyboard, button hints, a Quick Menu on Start, soft UI sounds and a PSP XMB-inspired background.

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

**⬆️ Updates itself**<br>
New versions download in the background from GitHub Releases. Restart from the Quick Menu to update.

</td>
</tr>
</table>

<br>

## ✦ Tour

<table>
<tr>
<td width="50%"><img src="docs/library.png" alt="Library"><p align="center"><b>Library</b> · every game, filter by console, collection or status</p></td>
<td width="50%"><img src="docs/consoles.png" alt="Consoles"><p align="center"><b>Consoles</b> · your RomM platforms with icons and counts</p></td>
</tr>
<tr>
<td><img src="docs/console.png" alt="Console view"><p align="center"><b>Console view</b> · box art grid with a live details panel</p></td>
<td><img src="docs/game.png" alt="Game page"><p align="center"><b>Game page</b> · metadata, screenshots and one-button download</p></td>
</tr>
<tr>
<td><img src="docs/downloads.png" alt="Downloads"><p align="center"><b>Downloads</b> · queue, progress, pause and resume</p></td>
<td><img src="docs/settings.png" alt="Settings"><p align="center"><b>Settings</b> · sync, folders, look &amp; feel</p></td>
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

> **Blank grey window?** Cartridge renders in software by default because the GPU path shows a grey window on some handhelds. If you switched **Settings → Look & feel → Rendering** to Hardware and hit this, launch once with `./Cartridge-x86_64.AppImage --disable-gpu` and switch it back. A log is kept at `~/.config/Cartridge/cartridge.log`.

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
| **Y** | Search |
| **LB / RB** | Switch tabs · inside a console or collection: previous / next |
| **LT / RT** | Page up / down |
| **Select** | Downloads · in a grid: cycle All / On device / Not downloaded / New |
| **Start** | Quick Menu |

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

## ✦ Demo library credits

The screenshots use a demo RomM library made only of free, open-source homebrew games. Covers are composed from each game's own title screens and artwork, used under their licenses:

| Game | Platform | By | License |
|---|---|---|---|
| [Tobu Tobu Girl](https://github.com/SimonLarsen/tobutobugirl) · [Deluxe](https://github.com/SimonLarsen/tobutobugirl-dx) | Game Boy / Color | Tangram Games | MIT · assets CC BY 4.0 |
| [µCity](https://github.com/AntonioND/ucity) | Game Boy Color | AntonioND | GPL-3.0 |
| [Geometrix](https://github.com/AntonioND/geometrix) | Game Boy Color | AntonioND | GPL-3.0 |
| [Libbet and the Magic Floor](https://github.com/pinobatch/libbet) | Game Boy | Damian Yerrick | zlib |
| [Thwaite](https://github.com/pinobatch/thwaite-nes) | NES | Damian Yerrick | GPL-3.0 |
| [Concentration Room](https://github.com/pinobatch/croom-nes) | NES | Damian Yerrick | GPL-3.0 |
| [Freedoom: Phase 1 & 2](https://github.com/freedoom/freedoom) | Doom engine | The Freedoom Project | BSD-3-Clause |

<br>

<div align="center"><sub>Cartridge is an unofficial client and isn't affiliated with the RomM project.</sub></div>
