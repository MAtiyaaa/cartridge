# Cartridge 0.9.3 plan

One big release, agreed with the owner. Built and tested in stages; nothing ships half done. Items marked **Discuss** get options shown to the owner before any code. The owner says when to start building.

Already done on the branch: the Settings list has no grey box for the current section (the page follows the list as you move), only brighter text.

**Progress** (details in `docs/SESSION-LOG.md`): stage 1 built on 1 Oct: A1, A3, A4, A5 (with C1), A6, A7, A9, A10, A11, A12, A13, A14, B4, B5, and a test build for every branch push. Stage 2 (1 Oct): A8, C2 to C9 and the C10 real names. Waiting on a device: A2. 0.9.3 B (1 Oct): C10's new emulators: DeSmuME, Mupen64Plus, Snes9x, Mesen, Play!, Kronos, PrimeHack (as a Dolphin fork), Xenia Edge. Redream, Mednafen and torzu are left out (owner, 1 Oct: not needed). 0.9.3 C (1 Oct): D1 (PS3 .pkg through RPCS3), the RPCS3 half of D3 (serial launch, installs.json, safe delete with tests), D6 (updates and DLC in order). Still to do in D: D2 Vita, D3 for Vita3K, D4 PS4 .pkg, D7 patches.

## A. Bugs
1. **Top bar tabs select like Settings.** The current or focused tab is a full white box (or the Highlights colour) with contrasting text, the same as the Settings list. (Owner's "highlight missing on Home and Library".)
2. **LT/RT at launch.** Chromium hides the controller until a "user gesture" and may not count the triggers. First test on a real pad which inputs unlock it; try reading the controller outside Chromium; a "Press any button" screen only as a last resort.
3. **Library:** scrolling back up lands on the filters bar and only leaves it when you press up from there.
4. **Settings jumps back to Connection** after an action (for example Fetch all logos in Look & Feel) and when leaving a sub-screen (for example Emulator setup). Stay on the page you were on.
5. **No start-up pop-ups.** "N games are missing from <collection>" (`src/steam.js` toast) and "An emulator moved" (`checkMoved` in App.vue) show on every launch. Replace with one **Issues** list in Settings (top of the new Emulators tab): missing collection games, moved emulators, broken shortcuts, missing BIOS, each with its fix. A small dot on the Settings tab when something is waiting.
6. **`/tmp/.mount_` shortcuts.** Shortcuts made while an AppImage was running point inside its temporary mount and look "moved" after every reboot. Recognise them and point them at the real AppImage.
7. **Remove from Steam** has to be chosen twice.
8. **shadPS4 GR2 fork detected as shadPS4.** Forks get their own identity (see C3).
9. **Emulator lists sorted A to Z.** In the Emulators tab (Emulator setup, a console's emulator choice, "Which one?"), emulators and consoles are listed alphabetically instead of in the order they were found. (Replaces the Xenia-on-the-Ally report, which turned out to be a non-issue: Xenia was found, just listed out of order.)
10. **PS4 games through shadPS4 are unreliable** (owner, 1 Oct). A game added by Cartridge often won't start. It starts after opening shadPS4 in Game Mode, launching the game there and closing it, but only for one run; after that the process has to be repeated. Shortcuts that shadPS4 adds to Steam itself don't have the problem, and no other emulator does. The launch options are right: they do work some of the time.
    - **Owner's finding:** with the shortcut's Start in set to the AppImage's temporary mount (`/tmp/.mount_XXXX/usr/bin`) it starts every time; with the AppImage's own folder it fails about half the time. The temporary mount can't be used (it's renamed on every start, and gone after a reboot or an update).
    - **Cartridge's part in it:** `learnOne` replaces a `/tmp/.mount_` Start in with the AppImage's folder (on purpose, HANDOFF D5), and found AppImages also get their own folder as Start in. So Cartridge's shortcuts start shadPS4 from a different working folder than shadPS4's own shortcuts.
    - **First lead to check in shadPS4's source:** shadPS4 picks its user folder from the working folder (a `user` folder there means portable mode, else `~/.local/share/shadPS4`). A different working folder can mean different settings, keys and game data. Also read what the Qt launcher does with `-d -g` and what its own Steam shortcuts contain (Target, Start in, Launch options, environment), and copy that.
    - **Likely fix (owner's research agrees):** point the shortcut at the shadPS4 build the Qt launcher keeps unpacked in its versions folder (`~/.local/share/shadPS4QtLauncher/versions/<version>/`), with that folder as Start in, or reproduce exactly what the launcher passes. Not a script that starts the AppImage, reads its mount and kills it (fragile). Decided after reading the source, not before. Never write into shadPS4's files.
11. **Text Standard, High contrast and Soft** look the same (the colour sets are nearly identical). Make them clearly different.
12. **Game page:** Ready to play, Re-download, Delete, Manual and More stay on one row.
13. **Settings list quick right press** (found in 0.9.2 testing): pressing right while the page is still changing loses focus.
14. **Cartridge still counts as running in Game Mode after it's closed** (Steam's Performance → per-game profile shows "Cartridge"). Steam treats an app as running until every process it started has exited, so something Cartridge started is outliving it. Suspects: Electron helper processes not ending with the main one, a detached child (the Steam helper started directly when `systemd-run` is silent, or a restart it triggers), timers or the detection worker keeping Node alive, or the AppImage mount staying up. Fix: on Quit (and when Steam asks it to close), stop timers, workers, downloads and child processes, then exit with a hard deadline; anything that must outlive Cartridge (the Steam helper) always runs outside Steam's process tree. Test: run Cartridge under a subreaper like Steam's and check that no process from it is left 3 seconds after Quit and after Steam's Exit game. Owner confirmed it happens both ways: Steam's Exit game and Cartridge's own Quit. `ps -ef | grep -i cartridge` after closing shows which process is left. **ROG Ally (1 Oct):** SteamOS gets very laggy while Cartridge is open and after it has been "closed"; only a restart of the device clears it. Leads from the code: the window is created with `backgroundThrottling: false`, so timers and drawing don't slow down when Cartridge is in the background; the controller is polled every 8 ms forever (`setInterval(poll, 8)` in `nav.js`), and the animated background and trophy polling keep going too. When Cartridge isn't focused (a game is running) or is hidden, polling and drawing should stop or slow right down. Test on the Ally: CPU use of every Cartridge process while a game runs, and after Quit.

## B. Controls and feel
1. **Controls feel finicky, animations jittery** between rows and columns. Review the whole input, focus and scroll path in `nav.js` and the card transitions, not one patch. Snappy but smooth.
2. **Touch is still bad.** Test on a device with touch.
3. **Rumble when moving:** Look & Feel option None / Low / Medium / High (Gamepad `vibrationActuator`). Check it gets through Steam Input in Game Mode.
4. **Delete animation.** Deleting a game shows its progress on the game's card (and the game page): a circular progress ring while the files go, then the card updates. Big folder games take a while, so the ring shows real progress, not a spinner.
5. **Home rows stop at 15.** Each Home row shows its first 15 games; the 16th is a **Show all** card that opens the full list (Library grid for that row: On this device, Recently added and so on). No row ever loads every game.

## C. Emulators and Steam
1. **New Emulators tab in Settings:** Issues (A5), Emulator setup, Console Folders.
2. **Emulator setup finished:** a check mark and it moves down the list.
3. **Forks.** In "Which one?": "Not an emulator" at the top, then "It's a fork" (pick which emulator it's a fork of, for example BB Launcher and GR2 are shadPS4 forks), then "It's an emulator" with the full list. B goes back one step without closing the menu. Title case. Known forks can also be recognised automatically.
4. **One standard emulator per console** by default: RPCS3 (PS3), PCSX2 (PS2), shadPS4 (PS4), and so on, the most used ones. A fork or other copy is only used when chosen, for a whole console (console page's emulator box) or for one game (Emulator for this game).
5. **Launch option order:** EmuDeck preset, then RetroDECK (only when RetroDECK is installed and EmuDeck isn't; otherwise it never shows), then the AppImage. The user's existing Steam shortcuts are a second choice, never the default, and hidden when there are none. Read RetroDECK's source for how it starts one game.
6. **Steam ROM Manager** stops being a visible choice; it stays as a data source behind the scenes.
7. **Take over your own shortcuts:** an option to bring games you added to Steam yourself under Cartridge, so every game of a console launches the same way (existing shortcuts are still kept exactly until you choose this).
8. Wording in Setup and Add to Steam is about the user's own system, never the owner's setup.
9. "Cartridge itself" becomes "Cartridge".
10. **More emulators, and their real names.** The database already has several per console (Switch: Eden, Citron, yuzu, Sudachi, suyu, Ryujinx and Ryubing; 3DS: Azahar, Citra, Lime3DS; N64: RMG, simple64, ares...) plus RetroArch cores for 68 consoles. Two gaps:
    - Family members are shown under the family's name (a Citra install is labelled "Azahar", Sudachi "Yuzu"). Show the name of what's actually installed.
    - Add the popular standalones still missing, with launch options from their own docs, EmuDeck and SRM: DeSmuME (DS), Redream (Dreamcast), Mednafen (Saturn, PS1 and more), mupen64plus (N64), Snes9x and Mesen (SNES, NES), Play! (PS2), Kronos (Saturn), torzu (Switch), Dolphin forks (PrimeHack, Slippi) and Xenia Edge next to Canary. Forks without a known entry use C3.
    - **Launch options must be right the first time.** For every new or changed emulator: read the argument parser in the emulator's own source code (the real answer, per version), then cross-check with SRM's presets and EmuDeck. Where they disagree, the source wins, and version differences go into `below`/`argsBy`. Where possible, run the real program with its help flag in a fake home. Each emulator gets a test of the exact launch line in `test/`. An emulator whose launch options can't be confirmed this way isn't added; its RetroArch core stays the way to play.

## D. Installing games that need it
Only for games that need installing. ISOs and folders stay as they are.
1. **PS3 `.pkg` (RPCS3):** when the download finishes, Downloads shows "Install in RPCS3" on that item plus a notice; nothing installs until pressed. Runs `rpcs3 --installpkg <pkg>`, and the `.rap` too if it came with the game (RPCS3's installer copies it where it belongs).
2. **Vita `.vpk`, `.zip`, `.pkg` (Vita3K):** same box, "Install in Vita3K". `Vita3K <file.vpk|.zip>` installs (it may start the game after). `.pkg` needs its zRIF key: ask for it or read it from a file that came with the game (`--pkg <file> --zrif <key>`).
3. **After installing:** the game no longer lives in the ROMs folder, it lives inside the emulator's own storage. Cartridge finds it there and makes the Steam shortcut to that:
   - RPCS3: `dev_hdd0/game/<title ID>` (the `.rap` in `dev_hdd0/home/<user>/exdata`). `dev_hdd0` is found the same way trophies already find it: RPCS3's `vfs.yml` first (it can be moved anywhere), then EmuDeck's `Emulation/storage/rpcs3`, `~/.config/rpcs3`, the Flatpak's config. Launch by game ID (`%RPCS3_GAMEID%:<ID>`), so the path never goes into the shortcut. The title ID comes from the PKG header before installing, so Cartridge knows which folder to wait for.
   - Vita3K: `ux0/app/<title ID>` in Vita3K's pref path (already read by the `vitaid` launch), launched with `-r <title ID>`.
   - The game counts as installed from there (library, Storage, Delete, Library check). Delete may remove a game Cartridge installed from the emulator's storage (`dev_hdd0/game/<ID>`, Vita3K `ux0/app/<ID>`), always after a clear confirmation. The owner allows this one exception to "never modifies emulator files", and only in this case: nothing else in the emulator's folders (saves, settings, licences, other games) is ever touched.
   - **How Cartridge knows it is exactly that game, and nothing else (all must pass, or it refuses and tells the user to delete it in the emulator):**
     1. **The serial is read before installing,** from the file itself: the PKG header's content ID (for example `UP9000-BCUS98137_00-...` gives `BCUS98137`), or `sce_sys/param.sfo` inside a Vita VPK or ZIP.
     2. **The install is recorded:** Cartridge lists the emulator's game folder before and after the install. The one new folder must be named exactly that serial. It saves the serial, the full path and the time in its own `installs.json`. Only games in that record can ever be deleted this way; games the user installed in the emulator themselves never can.
     3. **Checked again at delete time:** the folder name is a serial and nothing else (`^[A-Z]{4}\d{5}$`); its real path (after following links) is directly inside the emulator's game folder, one level down, never the game folder itself or anything above it; its own `PARAM.SFO` says the same serial.
     4. **Only that one folder is removed.** Saves, trophies, licences (`.rap`, `exdata`), settings, other games and the emulator are never touched. The confirmation names the game, the serial and the folder, and says that updates and DLC installed into it go with it.
     5. **Tests in `test/`** with fake emulator folders: another game with a similar serial, a symlinked folder pointing elsewhere, a missing or wrong `PARAM.SFO`, a game installed outside Cartridge. Delete must refuse every one of them.
   - **PS4 PKGs are different:** Cartridge extracts them into the ROMs console folder, not shadPS4's folders, so they follow the normal delete rules (never the ROMs root or a console folder). The same serial check applies (`sce_sys/param.sfo`).
   - After a successful install, offer to delete the downloaded PKG, VPK or ZIP (it's no longer needed to play).
   - Update and DLC PKGs install into the same game folder; they're shown as extras of the game, not as new games.
4. **PS4 `.pkg`:** Cartridge extracts it itself, like PS4 zips today (offer, extract into the console folder, delete the PKG, add to Steam). shadPS4 has had no PKG installer since after 0.7.0 and 0.7.0's was only in its window. Written from the published PKG format, not copied from shadPS4 (GPL; Cartridge is MIT). Unencrypted ("fake") PKGs only. The biggest item here.
5. PS4 zips keep today's method.
6. **RPCS3 game updates.** Update `.pkg` files for a PS3 game install through RPCS3 the same way (D1: "Install in RPCS3", `--installpkg`), into the same `dev_hdd0/game/<ID>` folder, shown as an update of the game, not a new game.
7. **Patches that stick (owner chose option 1, 1 Oct).** Patches come into 0.9.3 (texture packs, cheats and mods stay in 0.9.4's Add-ons). Patches added through Cartridge stay on in RPCS3, shadPS4, PCSX2 and the rest, the way each emulator keeps its own. A second exception to "never modifies emulator files", like D3's: Cartridge may write the emulator's own patch settings (RPCS3 `patch_config.yml`, PCSX2 per-game settings and so on), but only to turn on or off patches it installed itself, recorded in its own file; the user's other patch settings are kept exactly. Each emulator's patch format is read from its own source first, with tests on fake folders.

## E. Trophies and RetroAchievements
1. **Games not installed on this device show with their names**, for every emulator:
   - Each device already writes trophies to RomM notes; also store the names (and a small icon) it knows.
   - A device with only a code (shadPS4 `NPWR…`, an empty Xenia title) fills the name from those notes.
   - Last resort: a built-in list of PS3/PS4/Vita trophy codes and Xbox 360 title IDs to names.
   - Covers come from the RomM library when the game is in it. Nothing is written into emulator folders.
   - Note: PS3 and Vita keep the name inside the trophy folder; shadPS4 keeps names and icons with the installed game (why syncing only `user` gives codes); Xenia's profile sometimes has no title.
2. **Overhaul** (**Discuss**): suggest ideas first.
3. Trophies & Gamerscore: remove the gradient; its icon the same size as the RetroAchievements one.
4. "Hide from totals" becomes "Hide". Settings → Achievements gets a Hidden Games list to bring them back.
5. RetroAchievements tab gets the same console filter and sort as Trophies & Gamerscore (latest, most complete, A to Z...).
6. **shadPS4 games show their trophies without "View trophies" first.** Cause (read in shadPS4's source): a game's trophy list ships encrypted inside the game (`sce_sys/trophy/trophy00.trp`). shadPS4 only decrypts it into its `user` folder when the game boots or when you use "View trophies" in its launcher, and only if the trophy key is set. Cartridge reads that decrypted copy, so games that haven't been opened since the key was added show nothing. Fix in Cartridge: when the key is set (Cartridge already reads `keys.json`), it decrypts `trophy00.trp` itself from each installed game (AES, using the user's own key and the game's NP ID) into its own cache. Nothing is written into shadPS4's folders; unlocks still come from shadPS4. Written from the format, not copied from shadPS4.
7. **When the shadPS4 trophy key isn't set:** an info icon on the PS4 trophies with a short guide: shadPS4 needs your trophy key to read trophies; add it in shadPS4's settings (`keys.json`), then come back. Cartridge never ships or downloads the key. If a game's trophy file can't be read (for example the game is only on another device), the guide also says to open that game once in shadPS4.

## F. Look
1. **Console backgrounds** rebuilt from scratch, except Ribbons and XMB. The owner finds the current ones very poor and cheap looking; the new ones must look premium, not a patch on the old ones (**Discuss**: show options first).
2. **Headers on Home (media bar) and the game page:** bigger than now, and they must blend into the background with no visible edge. Sharp, highest resolution art only, never blurry.
3. **SteamGridDB images:** always the highest resolution, then the next one down. Add to Steam, Home header and the idle screen.
4. **Idle screen:** game logo and console logo instead of text; 4K art or the next best.
5. **Consoles:** company logos (Sega, Nintendo, Sony...) at text height instead of the name. A console's page drops the folder path under its title.
6. **LAN and Tunnel pills** look more premium (**Discuss**: options).
7. **Recently played from other devices:** the device name fits without "..." in an area no bigger than the game card.
8. **Game info box:** critic score and age rating as icons. Score: IGDB critic score, else RomM's combined rating (ScreenScraper, MobyGames, LaunchBox), else hidden. Age rating: RomM's rating image, else a badge drawn from the text ("PEGI 16", "ESRB M"), else hidden. Works without IGDB on the server.

## G. Settings and clutter
1. Connection, Library & Sync and RomM merge into one **RomM** tab.
2. Title case for all headers and dividers in Settings and the Quick Menu.
3. Quick Menu: "Resync library" and "Scan server" become one "Refresh Library" (scans when the sign-in allows it, otherwise resyncs).
4. **Discuss: clutter across the app.** Look & Feel, the game page's More menu, and the app overall. Show options first. The direction to propose:
   - One main action per screen, big and obvious; everything else one level down, grouped, never a long flat list.
   - Show nothing that's empty or not available (no dead rows, no disabled buttons for things that don't apply).
   - One shared "sheet" pattern for secondary things (game page More, filters, Add-ons in 0.9.4), so every screen works the same way.
   - Settings: fewer tabs (RomM merged, Emulators new), each split into a few clear groups; rarely used options under "Advanced".
   - This also sets up 0.9.4's Add-ons (textures, patches, cheats, mods) so they add one entry on the game page, not several.

## H. Smarter
1. Better recommendations on Home and better similar games on the game page (**Discuss**: approach first).
2. **RomM updates:** check RomM's version at start, never break on missing or new fields, turn features off cleanly instead of failing. A contract test against RomM's API in `test/`.

## I. Discuss only
1. **Syncthing saves, view only:** read Syncthing's local status (last sync, conflicts, devices). Never touch saves.

## J. Carried over
6. Measure Home's full-width art without the GPU; a cheaper version under reduced effects if it costs too much.
11. Review the screens the redesign didn't cover: Trophies and Achievements, Search, Quick Menu, keyboard, a console's page in Settings → Steam, the Steam changes preview, the idle screen, the second first-run step, and Emulator setup, Shortcut health and the manual reader at 1080p and 4K, with touch and mouse. Fix anything clipped or off the design system; layouts stay.
13. Tests for Shortcut health, relinking, the per-game emulator and the library check move into `test/` where they don't need the app running.
14. HANDOFF.md updated for 0.9.

## K. For everyone, not one setup (agreed after the audit)
1. **Xenia and BigPEmu found however they're installed**, not only through EmuDeck's launcher script (the Linux build, the Windows build through Wine or Proton, AppImage, Flatpak where one exists).
2. **Flatpak Steam gets the same features as native Steam.** Shortcuts launched from Flatpak Steam run inside its sandbox, so emulators outside it are started through `flatpak-spawn --host` (Steam's Flatpak needs permission to talk to Flatpak; Cartridge asks first and sets it with `flatpak override --user`, like the existing Allow access). Cartridge's own Steam entry, artwork, collections, play time and instant changes work the same. Tested against a fake Flatpak Steam home.
3. **Report a problem** (Settings → About): shows the setup report (already scrubbed of private info) so the user can read it first, copies it, and opens GitHub's new issue page with it filled in. In Game Mode, where a browser is awkward, a QR code for the same page.
4. **Graphics:** AMD first (Steam Deck, Bazzite). NVIDIA desktops are out of scope for now.
5. **Languages:** English only for now; multi-language support is for 1.0 or later.

## L. Onboarding
Moved to 0.9.4 (docs/plan-0.9.4.md), with everything involved in it, so it's built once, together with RomM and EmuDeck/RetroDECK setup.

## Owner to test on a device
Controller feel, Cartridge fully closed and no lag on the ROG Ally, and LT/RT at launch, touch, rumble in Game Mode, PS4 first launch, trophies across the two devices, RPCS3 and Vita3K installs, 1080p handheld and 4K TV.

## Reminders for the owner
- A stray `v2.3.1` tag is in the repo (not a release; it deletes most of the code compared with 0.9.2). The owner said not to delete it yet: ask again when 0.9.3 is being built.
