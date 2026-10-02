# Cartridge 0.9.17 plan

Status: built and released as 0.9.17 (2 Oct 2026). What was done differently is in docs/SESSION-LOG.md.

Owner, 2 Oct 2026, after 0.9.16 shipped: "package all of these for the next update and start building."

Moved to 0.9.18 (owner): more animated console scenes; the small cleanups (duplicate CSS in Achievements.vue, unused `.padbtn`, the graphics comment at the top of main.js, the two migration lines, steam-games.json written before the helper finishes). Reminder for the owner: check the PS3 games that said "serial not found" (send a log or a folder layout). Owner: shadPS4 now works; dropped: the game page header blend check.

## 1. Add-ons downloads
- **PS2 texture packs, as ARMSX2 does it.** ARMSX2 reads two catalogs: dl.ps2ktxpak.net (ASTC packs for phone GPUs, no use on a PC) and sashkinbro's EmuCoreX-Textures on GitHub (`textures.json`: 769 packs, PNG/DDS in `replacements/`, matched by PS2 serial, size + SHA-256, multipart for packs over 2 GB, original author and source credited). Cartridge uses the EmuCoreX catalog: find packs for the PS2 games you have (serial from PCSX2's list or the disc), download through the download queue with the space check, check SHA-256, unpack into PCSX2's `textures/<SERIAL>/replacements`, record what it installed (removable).
- **GameBanana** for the other consoles (Switch, Wii U, GameCube, Wii, 3DS, PSP mods and packs). gamebanana.com is blocked from the cloud container, so the API (apiv11 search, game subfeed, mod files) is built from public client code and must be checked on a device. Zip unpacks natively; 7z and rar through the system's `bsdtar` or `7z` when present, else a clear message.
- **Add-ons live in Settings → Emulators** (owner): the Texture Packs page becomes Add-ons, split by console, listing your installed games with packs available, what's installed and its size, and each emulator's folders and textures switch. The game page keeps More → Emulator → Add-ons, which opens the same sheet.

## 2. RomM on this device: Podman from within Cartridge
- SteamOS 3.5+ and Bazzite ship Podman; what's missing on SteamOS is the user's ID ranges in /etc/subuid and /etc/subgid. Cartridge asks for the device password once (never stored) and runs `sudo -S usermod --add-subuid 100000-165535 --add-subgid 100000-165535 <user>`, as distrobox's Steam Deck guide does. No password set: say how to set one (Desktop Mode, `passwd`).
- No Podman at all: download podman-launcher (89luca89/podman-launcher, the static Podman distrobox uses on the Deck) into Cartridge's own folder and use it. All inside the RomM setup, before RomM starts.

## 3. Get emulators yourself (welcome third option + Settings → Emulators)
- Welcome's emulator step gets a third choice, **Pick your own**: a page split by console listing each console's emulators, a green check for the ones you have, and Download for the rest: the AppImage from the emulator's own GitHub releases into `~/Applications` (where EmuDeck keeps them and Cartridge already looks), or its Flatpak from Flathub when it has no AppImage (Dolphin, RetroArch). The same page in Settings → Emulators. Owner-approved exception to "never downloads emulators".

## 4. Emulator setup without leaving Cartridge
- **Firmware and keys from RomM installed into every emulator that takes them**: PS3 and Vita (done in 0.9.16), Switch firmware and keys into Eden, Citron, yuzu forks and Ryujinx folders, PS2/PS1/other BIOS files into each emulator's BIOS folder.
- **Emulator folders set from Cartridge**: point each installed emulator's game list at your console folders and its BIOS folder at where the BIOS went (PCSX2, DuckStation, Dolphin, PPSSPP, RPCS3 and others whose settings keys are known), recorded and reversible, never while the emulator runs. In the welcome and in Settings → Emulators.

## 5. shadPS4 version per game
- The shadPS4 Qt launcher keeps its emulator versions in `~/.local/share/shadPS4QtLauncher/versions.json` and takes `-e <name|path>` (its source). On a PS4 game's Steam settings: "Start with a specific shadPS4 version", listing the installed versions; the shortcut becomes `-e "<version path>" -g "{ROM}"` instead of `-d`.

## 6. Multi-disc games in Steam
- A game with more than one disc and no .m3u gets an .m3u (Cartridge's own file, in the game's folder) listing the discs in order, and the shortcut points at it, for emulators that take playlists (DuckStation, PCSX2, Dolphin, RetroArch, PPSSPP no). Emulators that don't get disc 1 with a note.

## 7. Frame generation (Settings → Steam → Frame Generation)
- Detects lsfg-vk (Decky LSFG-VK: `~/lsfg`, `~/.lsfg`) and MAKO (`~/.local/bin/mako-run`). Pick one for all games, per console, or per game, or off. Put at the very start of Launch options, after env vars such as `vblank_mode=0`, before the single `%command%` (never a second `%command%`). Applied with Update like other shortcut changes.

## 8. Files that couldn't be read
- PS1 CHD and PBP, PS2 CHD, GameCube/Wii GCZ, PSP CSO: read the game's ID from inside (CHD v5 with zlib, LZMA and zstd hunks; PBP's compressed ISO; GCZ zlib blocks; CSO deflate blocks), for texture packs, patches and Steam.

## 9. Nintendo logo
- A real Nintendo wordmark at the size of the other makers' logos, from a high-quality vector source.

## 10. Owner's second list (2 Oct 2026, all in 0.9.17)
1. **Controller detection in the welcome:** Nintendo, Xbox or PlayStation layout, or keyboard or touch, from what is actually used.
2. **Built-in keyboard during the welcome**, sleek and matching the page; back to the user's setting (Auto) after. **Keyboard:** a Caps key, and LB/RB move the cursor between letters.
3. **Welcome back:** show that B goes back; touch users get a back arrow.
4. **Opening animation** for the welcome, sleek.
5. **Scaling to the window size** (Desktop Mode windows clip).
6. **Top bar redesign** (owner: still looks AI-made; use the design skills).
7. **Fluidity** across the app.
8. **403s:** GitHub ("try again later"), RetroAchievements, Sony's PS3 update list, RPCS3's patch download. Requests go through Chromium's network stack (as a browser), GitHub falls back to its release pages when its API limit is hit, Sony's list over HTTPS like the PS3 tools.
9. **RetroDECK without Flatpak:** say RetroDECK needs Flatpak, offer to install Flatpak, then install everything in the background.
10. **Download emulators flow:** where emulators live (pick a drive) → an ES-DE style folder there (Emulation/roms/<console>, bios, emulators) → a sleek page of every console's emulators and forks from GitHub, installing in the background with progress bars, Download all, Continue or Later. Also in Settings → Emulators.
11. **Contrast:** the line under EmuDeck in the welcome blends into the focused row.
12. **RomM optional:** Cartridge starts without RomM, using games already on the device (a local library from the console folders), with a clear warning about what's missing (trophies sync, covers, collections...). Skipping RomM in the welcome opens the app with those games instead of an empty one.
13. **Settings → Updates:** roll back to an earlier version, and a card with this version's changes.
14. **Steam's keyboard opens by itself** in Game Mode when typing.
15. **Consoles:** Sega's and Microsoft's wordmarks instead of the S and the four squares.
16. **RPCS3 patches still none:** RPCS3's patch download (rpcs3.net, same as Manage → Game Patches) through the browser network stack; check the patches folder RPCS3 reads.
17. **Vita3K install error** (owner to send the message).
18. **Game Updates (PS3):** can't select anything; make it clearly PS3 games.
19. **Patches and Texture/Add-ons pages split by console**, nicely, with icons (Eden, yuzu missing; RPCS3's for PS3).
20. **Emulator updates:** update everything from Cartridge (no "updates through its own app" where Cartridge can), hide "shadPS4 previous", the launcher's versions folder, forks and *_old AppImages, a new update animation, the page usable while one updates, icons for RPCS3 and Xenia; updates must stick (RPCS3).
21. **More GameCube/Wii codes:** Dolphin's own code download (Gecko codes from codes.rc24.xyz, as Dolphin's Download Codes).
22. **Console icons:** Nintendo consoles look small (Switch with Joy-Cons, GameCube, SNES): use their base icons at the same size as PlayStation's.
