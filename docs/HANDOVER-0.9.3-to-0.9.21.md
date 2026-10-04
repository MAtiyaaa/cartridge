# Handover: everything from 0.9.3 to 0.9.21

To the Claude on the first account, from the Claude on the second account.

You built Cartridge from the start up to 0.9.2. On 1 October 2026 the owner moved to a second Claude account for a few days, and I picked up from your 0.9.2. Between 1 and 3 October we shipped **19 releases**, from 0.9.3 to 0.9.21: PRs #19 to #37, about 113,000 lines added and 480 files changed. This document is for you. It tells you what changed while you were away, why, how, what broke and how it was fixed, how the owner worked with me, and what is still open, so you can carry on without breaking anything.

Read it in this order:
1. This document, top to bottom, once.
2. `CLAUDE.md`. It is kept current. Its sections from "0.9.3" down to "0.9.21" are my short notes per version.
3. `docs/SESSION-LOG.md`, newest entry first. It is the per-update diary, with the owner's decisions in chat.
4. `CHANGELOG.md`, for the exact user-facing wording of every release.

The repo is public. Nothing private is in this document: no usernames, paths from the owner's machines, emails or IPs. Keep it that way when you extend it.

---

## Part 1. Where things stand right now

- **Latest release:** v0.9.22 "Cartridge 0.9.22 · Home Fix" (3 Oct 2026), a one-fix release after v0.9.21 "Start, Your Way" (PR #37). See Part 7, item 22.
- **Branch:** all my work was on `claude/relaxed-fermat-30pigp`. Each PR merged it into `main`, and after each merge the branch was restarted from `main`. `main` is the truth: start your branch from `main`.
- **package.json:** `version` 0.9.21, `versionName` "0.9.21", `build.releaseInfo.releaseName` "Cartridge 0.9.21".
- **Tests:** 116 pass (`npm test`, node:test, files in `test/`).
- **Build:** `npm ci --ignore-scripts && npx vite build` works in the cloud container. The full `npm run dist` needs Electron, which the container can't download. CI does the full build.

The owner's very last messages to me, and what I did:
1. GameBanana is for mods, so keep texture packs apart. Done in 0.9.21: the Texture Packs tab shows only the EmuCoreX PS2 catalog, and GameBanana shows only under Mods.
2. Downloads went back to being slow. I found one cause: folder games opened one worker thread and one TLS connection per file. Fixed with one worker per game, reused for all its files.
   - Not confirmed: whether the owner's slow download was one big file. I asked them whether the top bar said LAN or Tunnel.
3. "Updating Vita3K did something to the AppImage, I can't find it, it's not on Steam, the original shortcut I added isn't there."
   - Half explained. The update correctly restored Vita3K's zip build, but Cartridge's emulator list only knew AppImages, so Vita3K vanished from it. Fixed: folder builds are listed again.
   - **Not explained:** the owner's own Steam shortcut for Vita3K being gone. I asked for the log (Settings → About → Report a problem) and the shortcut's old Target. Follow up on this first. See Part 9.

---

## Part 2. The owner: how they work with us

Read this part carefully. It matters as much as the code.

### How they talk
- They often dictate by voice, so names come through mangled. The ones I saw:

  | Dictated | Means |
  |---|---|
  | "Chat PS4", "Shad PS4", "Shop PS4", "SHAD PS4" | shadPS4 |
  | "MU deck", "MUDU deck", "Mudeck", "Amadeus" | EmuDeck |
  | "VRT to 3K", "Vita 3K" | Vita3K |
  | "Aries", "Saturn Aries" | ares |
  | "Ryu Jinx" | Ryujinx |
  | "Deki" | Decky |
  | "PCX2", "PCSX two" | PCSX2 |
  | "duct station" | DuckStation |
  | "PPSB" | PPSSPP |
  | "amplifiers" | (in one list) Add-ons/emulators, a transcription slip |
  | "ESD", "ESDE" | ES-DE |
  | "Texas" | "text as" |
  | "L1/R1" | LB/RB |

- They send **lists as text attachments** with `- [ ]` checkboxes, often with "add these to <version>". Every item gets built in the version named. They repeat items they think are still broken.
- They send **photos of the device screen** (Steam's shortcut properties, error dialogs, Cartridge screens). Read every detail in the photo: the important line is often small, like "top right of the image".
- They sometimes **paste briefs from Gemini or other AIs**, for example a long shadPS4 "technical briefing" and an RPCS3 patches explanation. They said themselves: "you don't have to use this, read the code and fix it based on your own professional assessment".
  - Those briefs were often wrong in detail. The shadPS4 one suggested targeting the core binaries directly, which gave a black screen.
  - **Always go to the emulator's own source code.** The owner explicitly wants this: "you have everything you need, read and study the source".
- They add items **while you are building** ("Did you also read and add everything I was telling you while you were building?"). Keep a running list. Before you ship, re-read every message since the last release and tick each item off.
- Strong language ("looks like dog shit", "for God's sake") is frustration with a result, not with you. Fix the thing, explain the cause plainly, move on.
- They love it when a problem gets a real root cause: "you were right, Start in is the only difference" landed well. They hate guesses presented as fixes.

### Standing rules from the owner (on top of CLAUDE.md)
- **Ship without asking:** when an update is built, tested and the test build launches, open the PR and merge it to `main` (this releases it). This is in CLAUDE.md. They reconfirmed it many times.
- **"Package all of these into X and just build it"** means build everything, decide the details yourself, release.
  - In 0.9.19 they said "don't ask me any questions, I was very clear... you have my permission to do anything".
  - When they say "don't build yet" or "just answer", don't touch code. When they ask "what's left", answer with a list and wait for their pick.
- **Design changes:** offer options when it's a real design choice.
  - They picked from **live mockups** for console cards (0.7.13 "Showcase", your time), the design direction (B, your time), the backgrounds (0.9.15, A + B) and the trophies home (option A).
  - When they say "use the taste skill", use it and they will judge the result.
- **Owner's taste, learned the hard way:**
  - They loved the XMB Waves and Ribbons backgrounds ("a work of genius").
  - They hated every console-themed animated scene: "cheap", "look really bad". Those scenes were removed in 0.9.19 in favour of style backgrounds (aurora, contours, drift, tide).
  - They loved the bottom sheet with LB/RB tabs (the game page More, since 0.9.3 K).
  - **Selection** is the full white box with contrasting text, or the colour picked in Look & Feel. Never a stripe, never a clipped outline, never a ring with a dark gap around it. A clipped focus box was reported several times ("Timeline", "Patches sheet").
  - **Logos at text size:** company and console logos replace their text at the same size as the text.
    - Nintendo, Sega, Dreamcast, GameCube and Wii logos must read as large as Sony's and Xbox's, but **never bigger than PS3's**.
    - Sega must be the real wordmark, not an "S".
  - **Title Case** for menu items and Settings headings (but sentence case in body text).
  - **No clutter.** They asked several times to merge things: Continue playing with Recently played; Connection, Library & Sync and RomM into one RomM tab; Theme with Background; Game Updates, Patches and Add-ons into Game Add-ons; Get Emulators with Updates.
  - **Motion:** smooth but snappy, never "jittery", "rough", "blocky" or "too snappy". Animations must have weight and character, not "cheap and tacky and weightless".
  - The Start menu in 0.9.19 and 0.9.20 was called "AI generated, lacks character". 0.9.21 rebuilt it.
  - "Feels like AI made the app" is their worst verdict. They mean templated look and finicky controls.
- **Controls must make sense everywhere:**
  - Up and down go to the next row's **first** item.
  - Left and right stay in the row.
  - B in a sub-screen comes back to where you came from, not to the top of Settings.
  - Their 0.9.16 list has many concrete examples; see Part 6, "Controller".
- **Cartridge is for everyone:** they keep reminding: "make sure it's based on the user and not me", "fix that discrepancy so it doesn't happen to other users". Never hard-code their emulators, devices or folders.

### Their devices and setup (only what the code needs to know)
- A ROG Ally X running SteamOS, and a Bazzite desktop PC. They also mention a "Steam Machine".
  - Game Mode (gamescope) on the handheld is the main target.
  - The TV is 4K.
- EmuDeck-style setup. Emulators in `~/Applications`, some in other folders. shadPS4 through its Qt launcher AppImage. Forks: BB Launcher (Bloodborne) and a GR2 fork (Gravity Rush 2).
- Syncthing syncs saves and shadPS4 trophies between the Ally and the PC.
- They use RomM with a LAN address and a tunnel.
- They are in Dubai (UTC+4). Their Claude credits ran out at times and reset at 1:30 a.m. there. They asked me to keep building overnight (see "Night runs" in Part 3).

### Things they asked to be reminded of
- **The stray `v2.3.1` tag** in the repo. They asked to be reminded several times; it is still there. Ask them what to do with it.
- **PS3 games that said "serial not found":** they never re-checked them after the 0.9.15 and 0.9.18 fixes.
- The release branches `claude/relaxed-fermat-30pigp-release-g` and `-release-i` can be deleted. Each held an exact tested commit that was merged.

---

## Part 3. Process and tooling (what changed in how we ship)

### Test builds
- `.github/workflows/test-build.yml` (new in 0.9.3) runs on every push to `claude/**`:
  - `npm ci`, then `npm test`.
  - Sets the version to `<next>-test.<run>` and `versionName` to the same, inside the job only.
  - `npm run dist`, then the launch check (`CARTRIDGE_SMOKE=1 APPIMAGE_EXTRACT_AND_RUN=1 xvfb-run`, which must print "SMOKE OK").
  - Attaches the AppImage to the run. Nothing is published.
- The owner can download that AppImage from the Actions run to test on a device.
- My release rule: push, wait for the Test build to go green, then open the PR and merge it. `release.yml` (yours, unchanged) builds, launch-checks and publishes when `version` changes on `main`.

### Version names (important)
- On 1 Oct the owner wanted to release each part of 0.9.3 as it was finished, named "0.9.3 B", "0.9.3 C"...
- electron-updater only installs a higher version number, so the **number** kept rising (0.9.4, 0.9.5...) while a separate **`versionName`** in package.json carries the display name.
  - `versionName()` and `nameOf()` in main.js. Settings → About, the Quick Menu and update messages show the name. An update's name comes from its release title.
  - RomM, RetroAchievements and the log still get the number.
- The full mapping:

  | Number | Name | PR | What |
  |---|---|---|---|
  | 0.9.3 | 0.9.3 | #19 | Emulators: sections A, B4, B5, C |
  | 0.9.4 | 0.9.3 B | #20 | More emulators |
  | 0.9.5 | 0.9.3 C | #21 | PS3 games from packages |
  | 0.9.6 | 0.9.3 D | #22 | Vita games, PS3 licences |
  | 0.9.7 | 0.9.3 E | #23 | PS3 patches |
  | 0.9.8 | 0.9.3 F | #24 | PS4 patches |
  | 0.9.9 | 0.9.3 G | #25 | Tidier menus and achievements |
  | 0.9.10 | 0.9.3 H | #26 | One RomM tab, problem reports |
  | 0.9.11 | 0.9.3 I | #27 | Scores, ratings, idle screen |
  | 0.9.12 | 0.9.3 J | #28 | Sturdier with every RomM version |
  | 0.9.13 | 0.9.3 K | #29 | One trophy home, calmer look |
  | 0.9.14 | 0.9.3 L | #30 | Fixes from the couch |
  | 0.9.15 | 0.9.15 | #31 | Welcome Home |
  | 0.9.16 | 0.9.16 | #32 | Your Emulators |
  | 0.9.17 | 0.9.17 | #33 | Set Up In One Place |
  | 0.9.18 | 0.9.18 | #34 | Textures In Place |
  | 0.9.19 | 0.9.19 | #35 | Start |
  | 0.9.20 | 0.9.20 | #36 | Start, Refined |
  | 0.9.21 | 0.9.21 | #37 | Start, Your Way |

- After L, the owner merged "0.9.3 M" and the whole 0.9.4 plan into one update and asked for it to be called **0.9.15** "to keep it consistent on GitHub". Since then `versionName` equals the number again. Keep it that way unless the owner says otherwise.
- The Releases section of CLAUDE.md still describes the lettered scheme as history; the current rule is the plain number.

### How every release was checked
1. `npm test`.
2. `npx vite build`.
3. A Playwright screenshot pass (details below).
4. Grep the diff for private info and em dashes.
5. Push, wait for the green Test build, then PR and merge. Confirm the release published (latest release has the AppImage and `latest-linux.yml`).

The screenshot pass:
- I used Playwright with Chromium at `/opt/pw-browsers` and loaded `dist/index.html` from file.
- `window.cart` was stubbed in an init script: a map of channel → fake data, `call()` answering from it, and `on()` returning a no-op.
- `romimg://` URLs were rewritten to local files, and `/assets/platforms/*.svg` routed to local copies.
- Screenshots at 1280x800 and 1920x1080, clicking through the screen being changed.
- The harness lived in the session's scratchpad, **not in the repo** (like your mock RomM). Rebuild it the same way when you need it; it takes a few minutes.

### Release notes
- `RELEASE_NOTES.md` holds only the current version.
- `CHANGELOG.md` gets the same notes at the top.
- Groups are New / Changed / Fixed with bold lead-ins.
- The owner reads them, so say exactly what changed and why, in plain words.

### The cloud container's limits (they shaped many decisions)
- **Blocked:** GitHub's API and website (but `raw.githubusercontent.com` works, and so do GitHub release asset downloads), gamebanana.com, git.eden-emu.dev, jsdelivr, mednafen.github.io, metadata.ppsspp.org, Sony's update servers, libretro's buildbot.
  - Many integrations were therefore built from the projects' public source and couldn't be checked live. Each such item is listed as "owner to test" in the session log.
- Electron can't be downloaded, so no real app run. Only the vite build and node tests.
- The owner's 403 complaints (GitHub, RetroAchievements, Sony) were **real on their device too**. `electron/webFetch.js` (Electron `net.fetch`, plus a hidden-window pass for Cloudflare-style checks) was built for them.
  - It was never tested against the real sites from here. On 3 Oct the owner said they hadn't re-checked Sony's 403 yet.

### Night runs and scheduled wakes
- When the owner went to sleep with work left, I scheduled a wake-up into the same session (the `send_later` tool) at the time their credits reset.
- Overnight I built, tested and released parts one by one (0.9.3 D to J on the night of 1 Oct, 0.9.19 on the night of 2 Oct), logging each in SESSION-LOG.md.
- The owner liked this. They also asked: "if my credits run out while you're building, restart in 5 hours".

### Skills and plugins
- The owner asked on 1 Oct to install these plugins: ponytail, graphify, rtk, taste-skill, impeccable, img2threejs, and the awesome-design-md references; caveman was declined.
  - I cloned and read them (nothing harmful; rtk's checksum matched).
  - Writing into `.claude/` was blocked by that session's permission check. They were never installed as plugins.
- In 0.9.20 (3 Oct) the owner said "install them now".
  - These were copied into `.claude/skills/` as published: **taste-skill**, **redesign-skill**, **soft-skill**, **minimalist-skill** (third-party, MIT) and **img2threejs** (Apache 2.0).
  - Your skills (animate, apple-design, emil-design-eng and the animation family) are still there.
  - ponytail, graphify, rtk, impeccable and awesome-design-md were not installed. Ask the owner whether they still want them.
- **Rule (in CLAUDE.md):** the design skills are used only when the owner asks.
  - They asked for the taste skill on the top bar (0.9.17b, 0.9.19, 0.9.20) and on the Start widgets (0.9.20). They asked for a redesign-skill audit of Start (0.9.20).
  - In 0.9.17 the top bar used apple-design and emil-design-eng, because taste-skill wasn't present then.

---

## Part 4. The design language: what changed and why

`docs/design.md` (your direction B) is still the base: tokens, solid surfaces, white focus, one accent. On top of it:

### Top bar (it went through five versions; the current one is what the owner wants)
1. 0.9.3 A1: the current tab became a full white box (owner: "use the same select method as Settings").
2. 0.9.17: words-only tabs with a sliding underline (`.tab-ink`), LT/RT hints only in pad mode. Owner: still "designed by AI".
3. 0.9.19: icon tabs where the current tab opens its name (`.tab-label` grid 0fr to 1fr), from photos of a frontend the owner liked. Search folds. Orange `--tab-ink` underline.
4. 0.9.20: the owner said "I don't like the white underline, I like what we had before with the white highlight and contrasting colour but redone, use taste skill". So `.tab-ink` is now a **white pill** (`--focus`) behind the current tab with dark text (`--on-focus`):
   - `placeInk()` places it, with a ResizeObserver.
   - It glides in 380 ms on transform and width.
   - Keyboard and pad focus on a tab is a **ring**, so focus can't be confused with the current tab.
   - `--tab-ink` is gone.
5. 0.9.21: closed search is a plain magnifier like the tab icons, with the Y hint like LT/RT. It opens as before; the owner liked the open animation.

### Start (the owner's new home screen, 0.9.19 to 0.9.21)
- **0.9.19:** a tab of tiles you arrange, inspired by the owner's photos of another frontend. They hated those widgets' style ("no character, we will design our own").
  - Arranging: hold A, or press and hold with touch or mouse.
  - Tiles: Continue playing, Clock, Storage, This week, Consoles, New, Recently played, Latest trophies, Downloads, Favourites, Recommended, Surprise me, a pinned game or console.
  - "Open on" setting in Look & Feel. Game More → Pin to Start.
- **0.9.20:** taste and redesign skill pass:
  - words-only tile labels; covers fill and fade;
  - staggered entry; art-tinted tiles;
  - a sky clock; a tick gauge for storage; a week chart.
- **0.9.21**, after the owner said it felt AI generated, blocky, and they wanted drag to resize, any size and per-edge resize: the board was rebuilt.
  - `src/startLayout.js` (pure functions, tested): tiles have `x, y, w, h` on 8 columns, rows up to `MAX_H` 4, any size from 1 by 1.
    - `pack` places old saves.
    - `settle(list, fixedId)` pushes overlaps down and lets tiles fall up.
  - `Start.vue` places tiles **absolutely in pixels** (`geo` from a ResizeObserver, `px()`), so moving and resizing are CSS transitions (that is the "smooth motion").
  - A tile's face is `.st-face` with `container-type: size`; content adapts with `@container` rules.
  - Controller arrange:
    - A picks up, and the D-pad swaps with the neighbour or steps one cell.
    - X resizes: the D-pad moves the lit corner, and LB/RB pick another corner.
    - Y removes, B is done.
  - Touch and mouse: drag the body to move; drag `.st-handle` edges and corners to resize. A ghost shows the landing cell, and slots show the grid.
  - `StartClock.vue`: a drawn SVG scene for night, sunrise, morning, afternoon and evening. Sun or moon on an arc, stars, clouds, hills. No location is known, so the day is 6 to 18.
  - `ConsoleCard.vue`: the Consoles page's card look (SysTile), not a button. The owner wanted the same boxes, not icons.
  - Latest trophies is a grid of as many as fit.
- **Owner must still test** arranging on the device with touch and controller.

### Consoles and logos
- `src/makers.js`: company wordmarks from HVR88's Monochrome Gaming Logos.
  - 0.9.17 copied only the first path of each SVG, which is why Sega was just an "S" and Microsoft was wrong. 0.9.21 has every path (`paths` arrays). Nintendo has `tall` (its pill shape).
- `src/consoleOptical.js` (`OPTICAL`, `opticalOf`): a per-logo scale so console wordmarks read alike (Switch, GameCube, Wii, Dreamcast, Genesis vs PS and Xbox), never bigger than PS3. Used by ConsoleMark, SysTile, ConsoleCard.
- `PIcon` trims SVG margins (alpha box, up to 1.8x) since 0.9.17, because the Switch icon with Joy-Cons looked tiny.
- The SysTile glyph is inset 16px and doesn't rotate on focus (it was clipped at the card corners on first launch).

### Backgrounds
- 0.9.15: console scenes for PS2, GameCube, Wii, Xbox 360 and Switch, plus `art:<slug>` (that console's covers panning, `artPan`).
- 0.9.16: scenes rebuilt "from fine lines of light like Ribbons". The owner still hated them.
- 0.9.19: scenes removed. New style backgrounds `aurora`, `contours` (marching squares), `drift` and `tide`, built like Ribbons. Old scene values map to `art:<slug>` via `LEGACY_ART`.
- The picker lists your most played consoles first (`topConsoles`). Previews come from `bgPreview()`.
- 0.9.21: Look & Feel's Theme and Background pages are one page (owner).

### Other design decisions
- **One bottom sheet for secondary menus** (0.9.3 K, owner loved it). `Menu.vue` takes `tabs` (LB/RB) or `sheet: true`. Used for the game page More (tabs Game, Steam, Emulator, Details and Artwork, Options), Show and sort, and console More.
- **Game page header:** only Ready to play and More since 0.9.16 (owner). Re-download, Delete and Hide moved to More → Options. Going up to More shows the whole header.
- **Heroes (0.9.21):** only SteamGridDB's sharp heroes (`heroArt(rom)` in store.js). RomM's picture showing first and then swapping looked "off-putting". Without SteamGridDB, the blurred cover is used. A RomM screenshot is used only when there is no SteamGridDB key.
- **Connection** (0.9.3 K, owner's pick A): a quiet icon next to the clock (house for LAN, globe for Tunnel), red only when offline. It replaced the pills.
- **Trophies** (0.9.3 K, pick A, then L): `AchAll.vue` is one calm list, RetroAchievements and emulator trophies together, grouped by console.
- **Rumble** (0.9.3 K): None, Low, Medium or High in Look & Feel. 0.9.21 adds a firmer pulse on LB/RB/LT/RT (`rumble('tab')`).
- **Pages slide** in the direction you go (`store.navDir`, `main.main[data-dir]` keyframes). Covers fade in only when not loaded yet. Press gives a small squeeze (`pressFx` on A).
- **Media bar** (Home header) has three sizes: Compact, Spacious, Large.

---

## Part 5. Map of new code (where to look)

New back-end files in `electron/`:

| File | What it does |
|---|---|
| `pkgInstall.js` | PS3 .pkg through `rpcs3 --headless --installpkg`, .rap licences, Vita installs (Cartridge unpacks unencrypted ones itself; NoNpDrm goes through Vita3K), firmware installs, `safeToRemove` per emulator (`RULES`), Vita3K storage rules (`vita3kFsPaths`) |
| `patches.js` | RPCS3 patches (`patch_config.yml`, js-yaml FAILSAFE), shadPS4 (`isEnabled` on `<Metadata>`), PCSX2 (`gamesettings/<SERIAL>_<CRC>.ini`), PS2 ISO serial/CRC, RPCS3 database configs (`rpcs3ApplyDb`) |
| `cheats.js` | Dolphin (GameSettings, AR, Gecko, graphics mods), PPSSPP cheats |
| `ps3Updates.js` | Sony's update list per serial, `newer()` |
| `addons.js` | Emulators' texture folders and on/off |
| `addonSources.js` | EmuCoreX catalog, GameBanana apiv11 |
| `addonInstall.js` | Install a pack into the exact folder per emulator |
| `emuUpdates.js` | Emulator updates: Flatpak, GitHub, Forgejo, same-kind builds |
| `emuGet.js` | Get Emulators catalogue and downloads |
| `emuIcons.js` | Emulator icons from the installed copy, else known URLs |
| `emuFolders.js` | Point emulators at game folders |
| `raLogin.js` | Sign In to Emulators (RetroAchievements) |
| `rommLocal.js` | RomM on this device (Podman) |
| `localLibrary.js` | Use without RomM |
| `welcome.js` | Welcome helpers (EmuDeck app, RetroDECK, Flatpak) |
| `romm.js` | RomM game fields read defensively, `rommTooOld`, `developerOf` |
| `discImage.js` | ISO/CHD/CSO/ZSO/GCZ/PBP reader |
| `webFetch.js` | Electron `net.fetch` for outside hosts, 403 handling |
| `github.js` | GitHub releases with a release-page fallback |
| `frameGen.js` | lsfg-vk / MAKO detection |
| `syncthing.js` | Read-only Syncthing view |
| `dlWorker.js` | Download worker, jobs since 0.9.21 |

New UI files in `src/`:
- **Views:** `Start.vue`, `Welcome.vue`, `AchAll.vue`, `FrameGen.vue`.
- **Components:**
  - `GameAddons.vue`, `AddonsSheet.vue`, `PatchesSheet.vue`;
  - `EmuGet.vue`, `EmuIcon.vue`;
  - `StartClock.vue`, `ConsoleCard.vue`, `SyncCard.vue`;
  - `RommLocal.vue`, `ReportProblem.vue`, `ChangelogCard.vue`, `Ring.vue`.
- **Modules:** `startLayout.js`, `startTiles.js`, `recs.js`, `makers.js`, `consoleOptical.js`.

Heavily changed:
- `electron/main.js` (+1350 lines: handlers for all of the above, downloads, watchGamescopeFocus, heroes, play stats);
- `electron/steamManager.js` (+478: forks, startOf, health, frame gen, play, installedEmulators, takeOver, Flatpak Steam);
- `src/nav.js` (+164);
- `src/views/Settings.vue` (+547);
- `src/views/Game.vue` (+287);
- `src/App.vue`, `src/store.js`, `src/styles.css`.

The tests cover: detection, steam, pkg, vita, patches, rpcs3patches, cheats, addons, disc, raLogin, recs, romm, setup, startLayout, trophies. Fixtures: `test/fixtures/disc` (CHDs made with chdman, CSO, ZSO, GCZ).

---

## Part 6. Every subsystem, what it does now and why

### 6.1 shadPS4 (the longest saga; read all of it before touching PS4 shortcuts)
**Symptom (owner, 1 Oct):**
- PS4 games added by Cartridge showed a black screen for about 30 s, then closed.
- Opening shadPS4's own window, launching the game there, closing it, and then using the Steam shortcut worked once. After that, it failed again.

**What did NOT fix it (don't redo these):**
1. Starting next to the AppImage (your original). A stray `user` folder there could select different settings. `startOf()` now avoids it, but that wasn't the main cause.
2. `-i` before `-d` (the launcher's no-IPC switch). The owner tested it: still a black screen.
3. "shadPS4 core without the launcher" (0.9.3 K): starting the selected core directly. Still a black screen. Removed in L at the owner's request: "I would much prefer the standard way".
4. Gemini's brief (target the core binaries in `shadPS4QtLauncher/versions/...`). Same black screen. In 0.9.15 I also found Cartridge sometimes **picked one of those core AppImages from the versions folder as the Target**. That always fails. Now the Target is always the Qt launcher.

**What fixed it (0.9.3 L, confirmed by the owner in 0.9.17: "Shad PS4 works beautifully"):**
- The owner insisted the only difference from shadPS4's own shortcuts was Start in (photos of its shortcut properties).
- I read the Qt launcher's `create_steam_shortcut.cpp`. It saves `QCoreApplication::applicationFilePath()`'s folder as StartDir, which for an AppImage is its temporary mount `/tmp/.mount_<random>/usr/bin`. That folder is gone as soon as the launcher closes.
- So shadPS4's own shortcuts always start in a folder that **doesn't exist**, and Steam then starts the game from its own default working directory.
- Cartridge now does the same: `SHAD_START = '/tmp/.mount_shadPS4/usr/bin'` (never exists) as Start in for shadPS4 AppImages, in `steamManager.js`.
- Portable installs keep their folder. The Target is the launcher AppImage. The Launch options are shadPS4's own: `-d -g "<game>/eboot.bin"`.
- **This looks like a bug, but it is deliberate. Never "fix" it.** The CLAUDE.md "Do not change" list says to replace `/tmp/.mount_` Start in when learning shortcuts; shadPS4 is the one exception, written by Cartridge itself.

**Also for shadPS4:**
- **Version per game** (0.9.17): `shadVersions()` reads `shadPS4QtLauncher/versions.json`; `withShadVersion` passes `-e "<path>"` before `-d`; `steam.shadVersions`. The owner asked for this because some games need 0.17 and others 0.18.
- **Forks:** BB Launcher and GR2 are forks (`FORKS` in emulators.js). Forks never default; they are grouped under one "Forks" entry in emulator lists (0.9.15). Patches go to the copy that game uses (`patchHome`).
- **Trophies:**
  - `readTrp`/`shadTrophyKey` decrypt trophy lists with the user's key into Cartridge's own `trophylists/` cache, never shadPS4's folder. With no key, there's a guide.
  - NPWR codes get names from other devices' synced folders, RomM notes or the library (`isCode`/`nameOf`, `titles.json`).
- **The owner's "Later" note:** even with EmuDeck, use the shadPS4 AppImage, not `shadps4.sh`, wherever EmuDeck put it. The current code uses the Qt launcher AppImage.

### 6.2 Vita3K (second longest; still the least proven on device)
- **0.9.3 D:** Vita games through Vita3K (`--pkg <f> --zrif <k>` installs headless; .vpk/.zip went through Vita3K, which opened its window). Licence check (`vitaLicenced`). `--deleted-id` is never used: it deletes savedata.
- **0.9.3 L:** EmuDeck's `vita3k.sh` **always adds `-Fr`**.
  - Games from Steam got `-F -r` twice and didn't boot. Fix: `argsBy.emudeck: '{SERIAL}'`.
  - Installs through the script became "boot this", so nothing installed. Fix: `vita3kCommand()` never uses the script and uses EmuDeck's real binary `~/Applications/Vita3K/Vita3K`.
- **0.9.15:** installs in the background like RPCS3 (owner: opening Vita3K "breaks immersion"). Games installed in Vita3K before Cartridge are recognised; no reinstall is needed to manage them.
- **0.9.18:** "no Qt platform plugin could be initialized". Cartridge ran Vita3K with `QT_QPA_PLATFORM=offscreen` and that build has no offscreen plugin. It is now retried without it (`NO_QT`); later `QT_TRIES` is offscreen, minimal, normal, and Vita3K is killed at "will auto-boot".
- **0.9.19:** Cartridge unpacks unencrypted .vpk, .zip and folder dumps itself, the way Vita3K's `interface.cpp` does:
  - gd → `ux0/app`;
  - ac → `ux0/addcont/<id>/<content id from char 20>`;
  - gp → `ux0/patch`, merged into app.
  - Vitamin dumps are refused. Only NoNpDrm dumps (PCS* with `sce_sys/package`) still go through Vita3K, which alone decrypts them (`work.bin`, native F00D).
- **0.9.21**, after the owner's photo of "Vita3K didn't install it" for *Unit 13.zip*, with "make this a priority". I read Vita3K's main.cpp, interface.cpp, pkg.cpp, app_init.cpp, config.cpp and logging.cpp.
  - Vita3K's storage is `portable/fs` next to the program, else `config.yml` pref-path (`$XDG_CONFIG_HOME` or `~/.config/Vita3K`; portable ignores pref-path), else the SDL default `~/.local/share/Vita3K/Vita3K`.
  - `vita3kFsPaths(exe)` follows that order and is searched first. Roots named in Vita3K's "Extracting" and "Decrypt layer" lines are searched too.
  - `vita3kWhy`/`vita3kLogTail` put Vita3K's own reason in the error (from its output or `vita3k.log`), and the full output is logged.
  - **Still unknown:** the actual reason on the owner's Ally. The next failure message will show it.
- **Updating Vita3K (0.9.21):**
  - EmuDeck's Vita3K is the **zip build**: the program `Vita3K` plus `data/`, `translations/` (older builds `lang/`), `shaders-builtin/` and so on, in `~/Applications/Vita3K/`.
  - The 0.9.16 updater wrote the AppImage over that program. The owner reported "updating Vita3K breaks the Steam launcher".
  - Now updates keep the **kind** of build: `installKind(file)` returns appimage, folder or program.
    - A folder build updates from Vita3K's `ubuntu-latest.zip` (`REPOS.vita3k.folder`), unpacked over its folder (`replaceFolder`, which strips one top folder and never writes outside).
    - A plain program Cartridge can't update in kind is never overwritten.
  - Updating an already-overwritten copy puts the zip build back. Then Cartridge's emulator list didn't show it, because it only knew AppImages. Fixed: `installedEmulators()` lists folder builds (kind `folder`).
  - The owner's own Steam shortcut for Vita3K disappearing is **not explained** (Part 9).

### 6.3 PS3 (RPCS3)
- **Packages (0.9.3 C, D):** `pkgInfo` reads the PKG header like RPCS3's `unpkg.h`. `packagesIn` orders licences, game, DLC, then updates. Installs run `rpcs3 --headless --installpkg` one file at a time.
- **Licences:** PSN packages need `<content ID>.rap` in `dev_hdd0/home/<user>/exdata`, under exactly that name. Otherwise RPCS3 says "Failed to decrypt content" (owner's photo).
  - `rapsFromRomm` finds the .rap in RomM (the game's files, or entries named after the content ID or title ID).
  - `stageLicences` copies it under the right name.
  - No .rap means "RAP file not found" and no install (owner's rule: never ask, just find it).
- **Steam:** an un-installed package game is `missing` (blocked, with a reason) until installed. `afterInstall` then updates or adds its shortcut. Recorded games start by serial (`%RPCS3_GAMEID%:<serial>`).
- **Serials:** `ps3Serial` looks in `PS3_GAME/PARAM.SFO` up to two levels down, in ISO folders, in names like "BLUS-30443", and in RPCS3's `games.yml`. The owner never re-confirmed "serial not found".
- **Patches:**
  - The list is `patch.yml` from rpcs3.net's own patch API (`freshRpcs3Patches`, 7 days), written to `<config>/patches/`. Switches live in `config/patch_config.yml`.
  - 0.9.19 bug: RPCS3's YAML can name a key twice, which RPCS3 accepts but js-yaml rejected, so the whole list was thrown away. Fixed with `readPatchFile`/`loosePatchYaml`.
  - 0.9.21: only patches for the copy's version (APP_VER, with an installed update in dev_hdd0 first) are listed. Other-version patches show only if already on. Owner's example: Uncharted 3 at 1.19.
- **Database settings (0.9.3 L):** RPCS3's "Create Custom Configuration From Database Settings" uses `api.rpcs3.net/config/?api=v1` and `config_database.dat`.
  - Cartridge writes `config/custom_configs/config_<SERIAL>.yml` after a download or install, only when none exists. Recorded in `rpcs3-configs.json`.
  - This is one of the owner-approved exceptions to "never modify emulator files".
- **Game updates (0.9.16):**
  - Sony's `<SERIAL>-ver.xml` (the list ps3.aldostools.org reads). HTTPS first, with `rejectUnauthorized:false` for that host only.
  - A 403 on both schemes means no updates.
  - Updates install in order through RPCS3. 0.9.21 put them on the game page too.
  - **The owner asked how the order works, so answer the same way if asked again:** every newer update is downloaded first, then installed one at a time, oldest first, each through `rpcs3 --headless --installpkg`. RPCS3 needs the earlier ones before a later one applies.
- **Firmware** from RomM installs with `--installfw` (and Vita3K `--firmware`).

### 6.4 PS2 (PCSX2), PS1, PSP, GameCube/Wii, Switch, Wii U, 3DS, Xbox 360
- **PCSX2 patches (0.9.3 K):** `gamesettings/<SERIAL>_<CRC>.ini` `[Patches] Enable = <name>`, `patches.zip` read from the AppImage (`detect.readAppImageFile`).
  - The CRC comes from PCSX2's `gamelist.cache` (v34), else from the ISO itself in 0.9.3 L (`ps2IsoInfo`: SYSTEM.CNF BOOT2, XOR of the ELF's words). CHD needed PCSX2's list until `discImage.js` (0.9.17) could read CHD.
- **`discImage.js` (0.9.17):** `open(file)` gives a 2048-byte sector view of:
  - ISO, raw bin/cue;
  - CHD v5 (Huffman map, zlib/LZMA/zstd, CD codecs);
  - CSO, ZSO, GCZ;
  - and `pbpDiscId` for PBP.
- **Dolphin:**
  - Sys and user GameSettings (ID3, ID6, ID6rN revision files), `[OnFrame|ActionReplay|Gecko]`, `<Section>_Enabled/_Disabled`, `[Core] EnableCheats`.
  - Gecko codes are downloaded like Dolphin's Download Codes (codes.rc24.xyz, `geckoTxt`).
  - 0.9.21:
    - **graphics mods** (Load/GraphicMods and `Config/GraphicMods/<ID>.json`, GFX.ini `[Settings] EnableMods`, from Dolphin's GraphicsModGroup and HiresTextures source);
    - **tabs** in the sheet: Patches, AR Codes, Gecko Codes, Graphics Mods.
  - Bug fixed: codes on in Dolphin showed as off. EmuDeck's launcher hid which user folder Dolphin uses (Flatpak or not), so Cartridge now prefers the folder holding the game's settings.
- **PPSSPP:** `PSP/Cheats/<ID>.ini` `_C0/_C1`, cheat.db (downloaded from metadata.ppsspp.org/cheats.json when missing), `[General] EnableCheats`. Dolphin and PPSSPP refuse changes while running.
- **IDs for add-ons:** `psxSerial`, `gcWiiId` (ISO/GCM/RVZ/WIA/WBFS/CISO), `ciaTitleId`, `switchTitleId`.
  - Switch .xci and ticketless .nsp files have their NCA header decrypted with the user's prod.keys header_key (AES-128-XTS). Nothing is shipped.
- **Xenia:**
  - The Canary Windows build (xenia_canary.exe) runs through Proton (`EMU.xenia.win`).
  - Xenia Edge (EmuDeck's native `~/Applications/Xenia.AppImage`) is separate.
  - Get Emulators lists Xenia Canary's Linux build first (0.9.21).
  - Xenia updates from xenia-canary-releases.

### 6.5 Add-ons (texture packs and mods), now "Game Add-ons"
- **0.9.15:** each emulator's texture folder and on/off read from its own settings (`addons.js`) for PCSX2, DuckStation, Dolphin, PPSSPP and Azahar/Citra. Switch emulators (Eden, Citron, yuzu, Ryujinx) and Cemu are mods-only.
- **0.9.16:** turning custom textures on from Cartridge (`setTextures`, `texture-settings.json`). Cartridge only turns off what it turned on.
- **0.9.17 downloads:**
  - The PS2 catalog is **EmuCoreX** (`sashkinbro/EmuCoreX-Textures/textures.json`, 769 packs, SHA-256, parts). I found it by reading ARMSX2's source; the owner pointed me there.
  - The rest come from **GameBanana** apiv11 (`gbGame`, `gbMods`, `gbFiles`; `titleForms` tries "Title, The" orders).
  - `addonInstall.js` installs zip (yauzl) or 7z/rar (bsdtar/7z), never over a file. `addons-installed.json` records what was installed so Remove deletes only those files.
- **0.9.18:** the exact folder per emulator (`plan()` kinds):
  - PCSX2 and DuckStation: a `replacements` anchor (DuckStation also gets `config.yaml`);
  - PPSSPP: a `textures.ini` anchor;
  - Dolphin: a 6 or 3 character ID folder;
  - Azahar: the title ID;
  - Cemu: `rules.txt` packs;
  - Switch: Atmosphere `contents/<id>`.
  - `wrapper()` strips folders around everything.
- **0.9.19:** `addons:present` shows packs already in a game's folder, with a check: by Cartridge, by someone else, or both.
- **0.9.21:** `GameAddons.vue` (modal `gameaddons`) is one sheet per game with tabs, only those the console has:
  - **Mods**: all of GameBanana.
  - **Texture Packs**: the EmuCoreX catalog only. Not for Switch or Wii U. The owner said "GameBanana is primarily for mods, you're confusing the texture packs".
  - **Patches**: for Dolphin, one tab each for Patches, AR Codes, Gecko Codes and Graphics Mods.
  - **Game Updates**: PS3.
  - `AddonsSheet` and `PatchesSheet` have an `embedded` mode. Embedded `PatchesSheet` applies itself, and its ticks survive tab switches.
  - The confirm dialog takes the single modal slot, so the hub reopens itself on the same tab (`onReopen`).
  - Settings → Emulators → Game Add-ons lists every installed game by console, with its emulator and a search box (`gaFind`).
  - Pictures: the page's CSP only allowed `romimg:` and `data:` images, so GameBanana previews never showed. `index.html` now has `img-src 'self' romimg: data: https:`. EmuCoreX `previews[0]` is shown too.
- Texture packs for consoles other than PS2: there is **no catalog** I could find. The tab says so and shows the folder.

### 6.6 Emulators: detection, setup, updates, downloads
- **Setup and Issues (0.9.3 A5/C1):** Settings → Emulators replaced the start-up pop-ups.
  - An Issues list (`issues:list`): games missing from Steam collections, shortcuts that would fail, setups pointing at a missing emulator, missing BIOS, RomM too old, Flatpak Steam permission.
  - A yellow dot on the Settings tab when something is waiting.
- **Order of choice (0.9.3 C4/C5, owner):**
  - The default is EmuDeck, then RetroDECK (only without EmuDeck), then AppImage, Flatpak, installed program.
  - "From your Steam shortcuts" is a **second** choice, used by default only when nothing else is found.
  - Steam ROM Manager setups are no longer a choice.
  - The owner was very clear: base it on what most users have, not on their own setup.
- **Forks (0.9.3 C3):**
  - "Which One?" has three answers: Not an Emulator, It's a Fork (pick which emulator, then its name), It's an Emulator.
  - Saved in `steam.forks[path]`. Known forks by name: shadPS4 GR2, BB Launcher, PrimeHack, Slippi.
  - Real names are shown (Citra isn't called Azahar, Ryubing isn't Ryujinx; `realName`).
- **Take over** your own shortcuts (console More): changed in place with the live connection (same appid, play time kept), else removed and re-added.
- **New emulators (0.9.3 B)**, each launch line read from the emulator's own argument parser and tested: DeSmuME, Mupen64Plus, Snes9x, Mesen 2, Play!, Kronos, PrimeHack, Xenia Edge.
  - Not added: Redream (closed source), Mednafen and torzu (sources blocked). BigPEmu and Citron were later dropped by the owner.
  - **Rule:** launch options confirmed from source, or not at all.
- **Per-game templates (0.9.15):** a console page lets each game have its own emulator, Target, Start in and Launch options, or be removed (`steam.gameTemplates`). Forks are grouped.
- **Emulator setup inside Cartridge (0.9.17):**
  - `bios.place()` copies BIOS into set-up emulators' folders, never over.
  - Switch NAND and firmware.
  - `emuFolders.js` points PCSX2, DuckStation and Dolphin at game folders.
  - A default BIOS folder.
- **Updates (0.9.16 → 0.9.21):**
  - Flatpak updates use `remote-ls --updates` and `update`.
  - AppImages come from `REPOS` (GitHub, with a release-page fallback in `github.js` when the API says 403, and Forgejo for Eden and Ryujinx, `forgeRelease`).
  - **Owner rule (0.9.19): an update never renames an AppImage.** Shortcuts point at it. The new file goes at the same path, and Cartridge remembers the version in `emulator-releases.json` (`cache.installed[path]`), since the file name keeps the old one. "Updates not sticking" (RPCS3) was this.
  - Hidden from updates: forks, `_old`, previous and `.cartridge-*` copies, and the shadPS4 launcher's `versions` folders.
  - Eden: git.eden-emu.**dev** (not .org); it keeps your build (Steam Deck or amd64) via `pickAsset`.
  - Xenia: Linux .tar.gz (`fileFromTar`) or the Windows .zip.
  - Same-kind updates (Vita3K, 6.2).
- **Get Emulators (0.9.17):**
  - `emuGet.js` `CATALOG` by console. GitHub AppImages go into `~/Applications` (or the chosen Emulation folder), else Flathub `--user`.
  - The welcome version first asks which drive, then makes an ES-DE style Emulation folder (`roms/<console>`, `bios`, `emulators`).
  - **0.9.21:** Get Emulators and Updates are one list (`EmuGet updates`). Installed ones say "Up to date" with the green check, or show the update. "Also on this device" lists the rest.
- **Emulator icons:** `emuIcons.js` takes the icon from the installed copy (Flatpak export, AppImage .DirIcon, .desktop Icon=), else from checked URLs (`ICON_URLS`, lists allowed). Eden's and Ryujinx's couldn't be checked from the container.

### 6.7 Steam
- **Remove twice (0.9.3 A7):** shortcuts removed live are hidden until Steam saves its file (`steam-live-removed.json`). With live changes on, there's no "Apply now or later" question.
- **Launch options back to normal (your 0.8.2 rule, kept):** Target `"exe"`, args in Launch options, never a leading `%command%` unless something must come before it (`vblank_mode`, env).
- **Frame Generation (0.9.17):**
  - `frameGen.js` finds lsfg-vk (`~/lsfg`, `~/.lsfg`, from Decky LSFG-VK) and MAKO (`~/.local/bin/mako-run`).
  - `withFg` puts the wrapper at the start of Launch options, **after** env like `vblank_mode=0`, before the **one** `%command%`. Two `%command%`s won't launch; the owner stressed this.
  - It can be set for every game, per console or per game (`FrameGen.vue`, `steam.frameGen`).
  - `sigOf` adds `fg:` only when set, so existing shortcuts don't all turn "outdated".
- **Multi-disc (0.9.17):** `multiDisc()` writes `<folder>.m3u` (flag wx: never over) for emulators that read playlists.
- **Flatpak Steam (0.9.3 K):** `hostLaunch` wraps with `flatpak-spawn --host --directory= --env=`. `readShortcuts` unwraps it. Issues offers the permission. Not for .exe (Proton).
- **F11 Game Mode (0.9.15):** launching a Steam game while Cartridge is open used to bring Cartridge up first. `watchGamescopeFocus` now hides Cartridge when Steam starts another app (`reaper SteamLaunch AppId=`) and shows it inactive after. The owner hasn't confirmed this one.
- **Ready to play (0.9.21):** `steam:play` → `steamManager.play` → `steamLive.runGame` (`SteamClient.Apps.RunGame`), else `steam://rungameid/<appid<<32|0x02000000>`. A game not in Steam offers to add it.
- **Steam art** for games uses the same sharp background as Cartridge (0.9.16). Add to a Steam collection is in More.
- **`reconcile()`** at start (0.9.19) drops registry entries not in shortcuts.vdf (your F4).
- **Health:** learned shortcuts whose game is gone get Remove from Steam, only when their ROMs folder exists (never on a missing drive).

### 6.8 Downloads (it broke twice, read this)
- **0.9.16:** downloads moved into a worker thread (`dlWorker.js`). The owner saw **70 MB/s fall to 7 MB/s** after an update; work on the main thread (image serving, IPC, start-up scans) was slowing the stream. Measures:
  - 1 MB writes;
  - progress every 250 ms;
  - the speed limit shared out between running downloads.
- **0.9.21:** "downloads went back to being slow".
  - Cause found: **every file of a folder game started its own worker and a new TLS connection to RomM**. A PS3, PS4 or Vita folder game can have thousands of small files.
  - Local test: 1000 small files in 1.4 s with one worker, against about 89 ms per file the old way.
  - Fix: `dlWorker.js` takes jobs (`{ type: 'job', job, url, headers, part, start, limit }`). `downloadTo` keeps one worker per download item (`it.dlw`), ended 3 s after its last file (`it.dlwIdle`). `publicItem` strips these before broadcasting.
  - Large files now log their MB/s.
- **Not proven:** that this was the owner's slow download. If they saw one big file slow, check LAN vs Tunnel and the log line.
- **Checksums and re-download** (your code) are unchanged. Re-download keeps the old copy until the new one passes (0.9.1).

### 6.9 Controller, touch, focus (the owner judges the whole app by this)
- **0.9.3 A3/A4/A13:**
  - Up and down stay inside a scrolling list while it has more that way.
  - Settings focuses the current section's row.
  - When a focused button disappears, the D-pad stays in its zone (`lastZone`).
- **0.9.3 B1 (K):** the stick moves only along its stronger axis, with hysteresis 0.55/0.35 (`stickHeld`).
- **0.9.15:** row-to-row moves glide (owner: "too snappy, rough").
- **0.9.16 `pickRow`** (from the owner's long list of examples):
  - Up and down go to the next row; a horizontal scroll row lands on its **first item**, the same grid keeps the column, otherwise the leftmost item.
  - Left and right never leave the row.
  - `[data-top]` scrolls the page to the top (the game page header).
  - Their examples: Settings → Storage "Auto detect" down should go to Browse; Home row 2 down shouldn't skip "New since last sync"; the game page "Ready to play" down should go to "See all".
- **0.9.19:** hold A on `[data-hold]` fires on release; held for 450 ms it dispatches `hold` (Start). App routes accept, hold and the D-pad to `store.viewHandlers` first.
- **0.9.21:**
  - **LT/RT at launch:** Chromium hides a gamepad until its first press, so a trigger pulled first was never "seen at rest" and was ignored until released. `firstSeen`: a pad's first 400 ms count as triggers at rest.
  - Rumble on LB/RB/LT/RT.
- **Background input (0.9.3 L):** `watchGamescopeFocus` (xprop GAMESCOPE_FOCUSED_APP vs SteamGameId) sends a `background` event, and nav.js `setBackground` stops pad input while Steam's menu or a game is in front. Needs `xprop` on the system.
- **Touch:** your 0.8.2 rules stand. The owner hasn't tested touch since 0.9.3 ("touch is still very bad" was in their old list). Start's drag and resize is new touch code.
- **Keyboard:**
  - In Game Mode, `steam:keyboard` opens Steam's keyboard (TextPrompt) so they don't need Steam+X (0.9.17).
  - The built-in keyboard is forced while welcoming, with Caps and a cursor moved by LB/RB.
- **Focus look:** see Part 2's taste notes. 0.9.17 fixed dark text on a dark row for mouse and touch focus.

### 6.10 Performance and "Cartridge stays running" (A14 and the lag)
- **0.9.3 A14:**
  - `backgroundThrottling` back to Chromium's default.
  - The controller is polled every 8 ms only while in front (250 ms otherwise).
  - The animated background stops when not in front.
  - Quit and SIGTERM/SIGINT/SIGHUP (Steam's Exit game sends them) stop trophy polling, downloads, uploads and the library check, then exit within 3 s.
- **0.9.21:** in Game Mode the window keeps focus with Steam or a game in front, so blur never fires and the background kept drawing.
  - The `background` event now sets `store.away` and `body.away`. CSS animations pause, and `Background.vue` stops drawing.
  - Owner to test. If they still see Cartridge alive after Exit, ask for a process list from the Ally.
- **0.9.20 trap:** Vue scoped CSS drops everything after `:global(x)`. `:global(body.pad-mode) .thing` compiled to `body.pad-mode { ... }` and **shrank the whole app at 1920**. Always write `:global(body.pad-mode .thing)`. This is in CLAUDE.md.
- Light effects (software rendering in Game Mode): no drifting animations in tiles. Start's clouds and stars don't animate under `body.light-fx`.

### 6.11 Welcome (onboarding), 0.9.15 to 0.9.17
- `Welcome.vue` with `store.welcoming` and `config.welcomed`.
- Steps: name, language, a controller check, instant Steam changes, getting emulators (EmuDeck app as its install.sh does it, RetroDECK from Flathub `--user`, or Pick your own via `EmuGet` flow), RomM, a system scan (console folders with "fix a match", games already in Steam, issues), Your controls (`ui.buttons` label style).
- Each step is a centred card over the Ribbons background (owner's drawing).
- It opens with an intro animation (any press skips), remembers its step, and has a back arrow for touch and A/B hints.
- RetroDECK without Flatpak: it offers to install Flatpak with the system's package manager (password once).
- **Use without RomM** (`config.localOnly`, `localLibrary.js`, negative ids). The owner insisted RomM is optional but strongly recommended, with a clear list of what you miss.
- `autoZoom` under 1280x800 (zooms to 0.6) because Desktop Mode windows clipped.
- `setupDone` and `welcomed` keep existing users from seeing it.

### 6.12 RomM
- **0.9.3 G/H:** Connection, Library & Sync and Upload are one **RomM** tab (`OLD_SEC` maps old ids). Refresh Library merges "Resync" and "Scan server". Report a problem (scrubbed setup report, GitHub issue link, QR).
- **0.9.3 J:** `romm.js` reads every game field defensively, with a contract test for a current RomM, an older one and junk. The owner asked that future RomM changes never break Cartridge. `rommTooOld` (older than RomM 3) shows in Issues.
- **RomM on this device (0.9.15/0.9.17):**
  - `rommLocal.js`: a Podman pod `cartridge-romm` with MariaDB 11 and rommapp/romm, `label=disable`, port from 8095, `romm-local.env` mode 600, `podman-restart.service`. First admin through `POST /api/users`.
  - SteamOS 3.5+ ships Podman but lacks /etc/subuid ranges, so `prepare` runs `sudo -S usermod --add-subuid/--add-subgid` with the password once.
  - When there's no Podman, `podman-launcher` goes into `~/.local/share/cartridge-romm/bin`.
  - Metadata keys are a step after setup. The pod hostname is the server name.
  - Never run on a real device by me: owner to test.
- **Play sessions and devices** are your 0.8.2 code. Trophies from other devices show "on <device>".
- **Scores and age ratings (0.9.3 I):** IGDB `aggregated_rating`, else RomM's average; age rating images. The owner agreed IGDB's score stands in for Metacritic (RomM has none).
- **Developers:** RomM's developers list, up to two (`developerOf`). Tokyo Jungle shows Crispy's! and Japan Studio.

### 6.13 Achievements
- **K:** `AchAll.vue` is the default tab, merging RetroAchievements with emulator trophies, grouped by console, LB/RB for all, RA and others.
- Hide and Hidden Games (Settings → Achievements). Console names follow RomM's current platform names (`consoleName()`).
- **Sign In to Emulators (0.9.15):** `raLogin.js` writes each emulator's own login format, read from its source:
  - PCSX2: `PCSX2.ini` plus `secrets.ini`.
  - DuckStation: an encrypted token, AES-128-CBC with a key from SHA256 of machine-id and username, 100 rounds, checked against openssl.
  - Dolphin: `RetroAchievements.ini`.
  - PPSSPP: `ppsspp.ini` plus `ppsspp_retroachievements.dat`.
  - RetroArch: `cheevos_token`.
  - The password goes to RetroAchievements once (`dorequest.php r=login2`) and is never stored. Running emulators are skipped.
  - **0.9.21:** the row shows "All signed in" or "2 of 5", and opens a list.
- The RetroAchievements avatar refreshes every few hours (L).

### 6.14 Recommendations, Home, Sync and the rest
- **`recs.js` (K, owner's brief):** works without IGDB, using series, studio and genres from whatever RomM has, weighted by play history, with a short `why` on each card. IGDB similar games are a bonus. "Same series" lines were removed (owner: distracting).
- **Home:**
  - rows of 15 plus a Show all card (B5);
  - one Continue playing row (L merged it with Recently played), with the console as a logo and the device as a quiet label;
  - media bar sizes;
  - SteamGridDB heroes.
- **Sync (0.9.19, 0.9.21):** `syncthing.js` and `SyncCard.vue` in Settings → Sync (its own tab, owner). Devices, folders (saves first), newest files via `sync:browse` from Syncthing's index. **View only:** nothing is written. A fuller Syncthing feature was moved to 1.0 by the owner.
- **Updates page (0.9.17):** Roll back (`update:rollback`, `config.updateHold` pauses auto-download until Check for updates) and a changelog card (`RELEASE_NOTES.md?raw`).
- **Idle screen (I, K):** game logo, console logo and the sharpest hero.
- **Delete ring (B4):** file-by-file delete (`removeWithProgress`, links never followed) with `Ring.vue` on the card and the button.

---

## Part 7. Things that broke and how they were fixed (learn from these)

1. **Downloads slowed 10x (0.9.16):** main-thread streaming. Fixed with worker threads. **Slowed again for folder games (0.9.21):** a worker and connection per file. Fixed with one worker per item. Keep it that way.
2. **shadPS4 Target picked a core from the launcher's versions folder (before 0.9.15):** black screen. The Target is always the Qt launcher.
3. **Vita3K via EmuDeck's script (before L):** double `-Fr`, and installs that booted instead. Never use `vita3k.sh` for installs; pass only `{SERIAL}` to it for launching.
4. **Vita3K Qt offscreen plugin missing (0.9.18):** retry on the normal display.
5. **Vita3K update overwrote the zip build with an AppImage (0.9.16 to 0.9.20):** broke Steam launches. Same-kind updates since 0.9.21, plus folder builds listed.
6. **Emulator updates "didn't stick" (RPCS3, 0.9.17):** the version came from the file name, which updates never change. Now remembered per path.
7. **RPCS3 patches empty:**
   - First the list wasn't there at all, so it is now downloaded the way RPCS3 does.
   - Then a duplicate YAML key threw everything away, so the loose reader came in.
8. **"Failed to decrypt content" (PS3 .pkg):** a .rap missing or misnamed. Staged under the content ID name.
9. **Scoped CSS `:global(...) .x` (0.9.19):** compiled to a bare body rule and shrank the app at 1920. Three reduced-motion rules never applied either.
10. **Sega was an "S" and Microsoft wrong (0.9.17):** only the first SVG path had been copied.
11. **Dolphin codes on in Dolphin showed off:** wrong user folder, and the revision files were missed.
12. **LT/RT dead at launch:** the trigger was never seen at rest (firstSeen).
13. **Lag in Game Mode with a game in front:** the window kept focus and kept animating (`store.away`).
14. **GameBanana images not showing:** the CSP.
15. **Remove from Steam needed twice (A7):** the live removal wasn't reflected until Steam saved.
16. **Settings jumped back to Connection (A4/A13), and B from sub-screens landed on the section, not the row (L):** `store.settingsSpot` remembers the row.
17. **Patches sheet focus box clipped by a dark line (0.9.16):** plain white box now, no ring.
18. **Home shelf titles shrank and clipped while scrolling (0.9.16).**
19. **Media bar header edges visible (0.9.15/K):** headers fade into the page.
20. **"%command%" in empty Launch options (your 0.7.12)** is still guarded. Remember Steam does this to live-added shortcuts.
21. **RetroAchievements sign-in in Settings stopped working** (reported while 0.9.16 was being built): fixed in 0.9.16. It now shows RetroAchievements' own error when it fails, so a future break says why.
22. **Home vanished after a couple of moves, with no headers (0.9.21, fixed in 0.9.22):** Home.vue's own `heroArt` computed shadowed the store's `heroArt` function, which Home never imported, so `artOf` threw during render. When a view and the store share a name, import the store's under another name.

---

## Part 8. Do-not-break additions (on top of CLAUDE.md's list)

- shadPS4 AppImage shortcuts' Start in `SHAD_START` (`/tmp/.mount_shadPS4/usr/bin`, never exists) and the Qt launcher as Target. `-d -g "<eboot.bin>"`.
- Vita3K: never `vita3k.sh` for installs; `argsBy.emudeck: '{SERIAL}'`; never `--deleted-id`.
- Emulator updates: never rename an AppImage; same kind of build only; never overwrite a plain program; remember versions by path.
- `dlWorker.js` jobs and one worker per download item.
- `index.html` CSP `img-src` must keep `https:` for add-on previews (and stay that narrow otherwise).
- Patches and settings Cartridge may write (owner-approved exceptions to "never modifies emulator files"):
  - patches it turns on (RPCS3, shadPS4, PCSX2, Dolphin, PPSSPP), and it only turns off its own (`patches.json`);
  - custom textures on/off (only off where it turned them on);
  - RPCS3 database configs only when none exist;
  - RetroAchievements logins (password never stored);
  - add-on files (Remove deletes only its own);
  - BIOS copies (never over);
  - multi-disc `.m3u` (never over).
  - **Never** saves.
- Single modal slot: any sheet that opens a confirm must reopen itself (`GameAddons` `reopen`, `AddonsSheet` `onReopen`).
- Vue scoped CSS: `:global(<whole selector>)`.
- `RELEASE_NOTES.md` is imported by the app (`ChangelogCard.vue`), so keep its format.
- `startLayout.js` has no imports, so it stays testable in node.
- The owner's Start layouts are saved in `config.ui.start.tiles`; `pack` migrates old saves. Don't break old saves.

---

## Part 9. Open items, unverified work and what to ask the owner

**Follow up first:**
1. **Vita3K's Steam shortcut disappeared** after the update. Ask for the log (Settings → About → Report a problem) and what the shortcut pointed at. Cartridge never removes a shortcut it didn't add except through Shortcut health's Remove.
   - One idea to check: whether `steam:refresh` or a console page Update re-added a Vita game shortcut, and whether a missing Vita3K made it `blocked`.
2. **Slow downloads:** ask whether it was a folder game or one big file, and LAN or Tunnel. Read the new MB/s log lines.
3. **Vita3K installs:** the next failure message carries Vita3K's own reason. Ask for it.

**The owner's amended list (3 Oct), status:**
1. Console page path: done.
2. Multi-language: later (1.0 or after).
3. Syncthing view only, own tab: done.
4. IGDB score: agreed.
5. The empty "structured technical summary" item: ignore.
6. LT/RT at launch: owner to test.
7. Touch: not tested.
8. SteamOS lag: owner to test.
9. shadPS4 first launch: fixed (owner confirmed).
10. Remove from Steam twice: fixed (confirmed).
11. Game Mode launch bringing Cartridge up first: not checked.
12. Slower downloads: was fixed, now reported again; see above.
13. Sony 403: not checked.
14. Vita3K installs and booting: not checked.

**Never run on a real device (owner to test):**
- Start arranging (controller, touch, mouse); the clock at different hours.
- Game Add-ons on PS2, GameCube, Switch and PS3 games: a GameBanana install and remove, Apply on Dolphin's tabs.
- Emulator updates per emulator (Eden from its Forgejo, Xenia both builds, Vita3K zip build).
- Get Emulators downloads (asset names for Eden, Ryujinx, shadPS4 launcher and Flycast are from release pages, unchecked).
- Podman setup on SteamOS and Bazzite; frame generation with lsfg-vk and MAKO; multi-disc playlists.
- RetroAchievements Sign In to Emulators (DuckStation especially).
- PS3 game updates; Gecko codes; graphics mods; Switch .xci mod folders; F11 Game Mode handling; Flatpak Steam.

**Dropped by the owner (don't build unless they bring it back):**
- PS4 .pkg installs (would need Sony-derived keys in a public repo).
- BigPEmu, Citron.
- Console-themed backgrounds.
- The shadPS4 "core without the launcher" option.
- The plugins ponytail, graphify, rtk, impeccable and awesome-design-md, never installed: ask whether still wanted.

**Later (owner):**
- Multi-language.
- A fuller Syncthing feature (1.0).
- A built-in list of trophy codes to names (no reliable source found).
- A full speed test on hardware.
- A row-by-row review of empty Settings rows.

**Housekeeping:**
- The stray `v2.3.1` tag (remind the owner).
- Delete the `-release-g` and `-release-i` branches.
- HANDOFF.md was updated in K (J14), but this document and CLAUDE.md are newer.

---

## Part 10. How I'd work in your place

- Before building, re-read the owner's last few messages and every list they attached. Build every item into the version they named, then tick each one off in your summary. They notice when one is missing.
- For anything emulator-related, read the emulator's source first (clone it into the scratchpad, never into the repo) and write a test with a fake home or fixture. That habit found almost every real cause above.
- Say what you couldn't check (blocked hosts, no device) in the release notes' test list and in SESSION-LOG.md, plainly.
- Keep `CLAUDE.md` (one short section per version) and `docs/SESSION-LOG.md` (diary with decisions) current after every update. That is how this handover was possible.
- Write to the owner in plain short sentences. No em dashes anywhere. Answer their direct questions at the end of a build when they ask you to ("answer this once you're done building").

Good luck. The app is in a good place, and the owner is close to happy with it. The open items in Part 9 are where they'll start.

The Claude on the second account, 3 October 2026
