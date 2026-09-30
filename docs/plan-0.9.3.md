# Cartridge 0.9.3 plan

One big release, agreed with the owner. Built and tested in stages; nothing ships half done. Items marked **Discuss** get options shown to the owner before any code. The owner says when to start building.

Already done on the branch: the Settings list has no grey box for the current section (the page follows the list as you move), only brighter text.

## A. Bugs
1. **Top bar tabs select like Settings.** The current or focused tab is a full white box (or the Highlights colour) with contrasting text, the same as the Settings list. (Owner's "highlight missing on Home and Library".)
2. **LT/RT at launch.** Chromium hides the controller until a "user gesture" and may not count the triggers. First test on a real pad which inputs unlock it; try reading the controller outside Chromium; a "Press any button" screen only as a last resort.
3. **Library:** scrolling back up lands on the filters bar and only leaves it when you press up from there.
4. **Settings jumps back to Connection** after an action (for example Fetch all logos in Look & Feel) and when leaving a sub-screen (for example Emulator setup). Stay on the page you were on.
5. **No start-up pop-ups.** "N games are missing from <collection>" (`src/steam.js` toast) and "An emulator moved" (`checkMoved` in App.vue) show on every launch. Replace with one **Issues** list in Settings (top of the new Emulators tab): missing collection games, moved emulators, broken shortcuts, missing BIOS, each with its fix. A small dot on the Settings tab when something is waiting.
6. **`/tmp/.mount_` shortcuts.** Shortcuts made while an AppImage was running point inside its temporary mount and look "moved" after every reboot. Recognise them and point them at the real AppImage.
7. **Remove from Steam** has to be chosen twice.
8. **shadPS4 GR2 fork detected as shadPS4.** Forks get their own identity (see C3).
9. **Xenia found on the Bazzite PC, not on the ROG Ally** (same `xenia.sh`). EmuDeck launchers are only looked for in the Emulation folder EmuDeck's settings name, or next to Cartridge's ROMs folder. Look in every usual place (SD cards, `~/Emulation`, EmuDeck and RetroDECK paths). Confirm with Setup's "Copy report" from the Ally.
10. **PS4 games fail on their first launch** from a Cartridge shortcut; they work after the game is opened once from shadPS4, and again after Cartridge changes the launch options. Read the shadPS4 Qt launcher's source for what it creates per game, and make the shortcut not need that first run. Never write into shadPS4's files.
11. **Text Standard, High contrast and Soft** look the same (the colour sets are nearly identical). Make them clearly different.
12. **Game page:** Ready to play, Re-download, Delete, Manual and More stay on one row.
13. **Settings list quick right press** (found in 0.9.2 testing): pressing right while the page is still changing loses focus.

## B. Controls and feel
1. **Controls feel finicky, animations jittery** between rows and columns. Review the whole input, focus and scroll path in `nav.js` and the card transitions, not one patch. Snappy but smooth.
2. **Touch is still bad.** Test on a device with touch.
3. **Rumble when moving:** Look & Feel option None / Low / Medium / High (Gamepad `vibrationActuator`). Check it gets through Steam Input in Game Mode.

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

## D. Installing games that need it
Only for games that need installing. ISOs and folders stay as they are.
1. **PS3 `.pkg` (RPCS3):** when the download finishes, Downloads shows "Install in RPCS3" on that item plus a notice; nothing installs until pressed. Runs `rpcs3 --installpkg <pkg>`, and the `.rap` too if it came with the game (RPCS3's installer copies it where it belongs).
2. **Vita `.vpk`, `.zip`, `.pkg` (Vita3K):** same box, "Install in Vita3K". `Vita3K <file.vpk|.zip>` installs (it may start the game after). `.pkg` needs its zRIF key: ask for it or read it from a file that came with the game (`--pkg <file> --zrif <key>`).
3. **After installing:** find the installed game in the emulator's own game folder and make the Steam shortcut to that (RPCS3 by game ID, Vita3K `-r <title ID>`).
4. **PS4 `.pkg`:** Cartridge extracts it itself, like PS4 zips today (offer, extract into the console folder, delete the PKG, add to Steam). shadPS4 has had no PKG installer since after 0.7.0 and 0.7.0's was only in its window. Written from the published PKG format, not copied from shadPS4 (GPL; Cartridge is MIT). Unencrypted ("fake") PKGs only. The biggest item here.
5. PS4 zips keep today's method.

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
4. **Discuss:** Look & Feel is cluttered; the game page's More menu is cluttered; clutter across the app. Options first.

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
1. **Xenia and BigPEmu found however they're installed**, not only through EmuDeck's launcher script (the Linux build, the Windows build through Wine or Proton, AppImage, Flatpak where one exists). Also find out why the same `xenia.sh` is found on the owner's Bazzite PC and not on the ROG Ally (Setup's "Copy report" from both).
2. **Flatpak Steam gets the same features as native Steam.** Shortcuts launched from Flatpak Steam run inside its sandbox, so emulators outside it are started through `flatpak-spawn --host` (Steam's Flatpak needs permission to talk to Flatpak; Cartridge asks first and sets it with `flatpak override --user`, like the existing Allow access). Cartridge's own Steam entry, artwork, collections, play time and instant changes work the same. Tested against a fake Flatpak Steam home.
3. **Report a problem** (Settings → About): shows the setup report (already scrubbed of private info) so the user can read it first, copies it, and opens GitHub's new issue page with it filled in. In Game Mode, where a browser is awkward, a QR code for the same page.
4. **Graphics:** AMD first (Steam Deck, Bazzite). NVIDIA desktops are out of scope for now.
5. **Languages:** English only for now; multi-language support is for 1.0 or later.

## L. New onboarding (agreed)
A smooth first run on the Ribbons background, A for next, B for back. It replaces the current first-run steps and leads into Emulator setup.
1. **Welcome** animation: "Welcome to Cartridge" and one line on what it is.
2. **What should we call you?** Used for a greeting on Home and as the default device name.
3. **Language:** the step is there, English only for now (translations are for 1.0).
4. **Controller check:** press A.
5. **Instant Steam changes:** explain briefly, then Turn on (Cartridge sets Steam's remote debugging switch itself, the same as the Settings → Steam button; Steam restarts once). No Decky install needed.
6. **EmuDeck or RetroDECK:** if found, a green check ("Good news, you already have EmuDeck"). If neither, a short explanation and **Get EmuDeck**, which downloads and opens EmuDeck's official installer; the user picks emulators there, and Cartridge scans again when they come back. The owner allows this one exception to "never downloads emulators": Cartridge may download and open official installers when the user asks.
7. **RomM:** "Do you have a RomM server?" Yes: sign in (local, remote or tunnel, with the connection test). No: a short, friendly "What is RomM", then a QR code to RomM's own setup guide, and "I'll do it later".
8. **Optional extras,** each with Skip: SteamGridDB key, RetroAchievements sign-in.
9. **Emulator setup,** then done.

Later (1.0): "Set up RomM on this device" (Podman on Bazzite; not stock SteamOS) and full translations.

## Owner to test on a device
Controller feel and LT/RT at launch, touch, rumble in Game Mode, PS4 first launch, Xenia on the Ally, trophies across the two devices, RPCS3 and Vita3K installs, 1080p handheld and 4K TV.

## Reminders for the owner
- A stray `v2.3.1` tag is in the repo (not a release; it deletes most of the code compared with 0.9.2). The owner said not to delete it yet: ask again when 0.9.3 is being built.
