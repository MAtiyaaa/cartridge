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
