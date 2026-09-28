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
