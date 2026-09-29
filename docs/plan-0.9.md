# Cartridge 0.9 plan

Agreed with the owner, not built yet. 0.9 fully nails the Linux experience; 0.9.x is fixes only; 1.0 brings Android. Nothing here is started until the owner says go.

## 1. Setup (headline)

The goal: emulators are found and launch correctly for everyone, not just EmuDeck users. Any mix of EmuDeck, RetroDECK, Flatpak, AppImages, distro packages and Steam RetroArch, stored anywhere, renamed or not.

### What we learned from Steam ROM Manager's source
- SRM does not detect emulators. Its presets (`files/presets/*.json`) are templates with blanks such as `"path": "path-to-eden"` and `"romDirectory": "path-to-roms"`; the user browses to each one. Flatpak presets are `/usr/bin/flatpak` with `run <id>` in the arguments. RetroArch cores use a `${racores}` variable the user sets.
- It only feels automatic on a Deck because EmuDeck writes SRM's config for it.
- What we take from SRM: its argument table (already in `emulators.js`) and Browse as a normal last step. SRM's `userConfigurations.json` is read as an extra source when present, never required.

### Where the scan looks (first launch, and Settings → Steam)
1. Existing Steam shortcuts (what the user already uses wins).
2. SRM's saved setup, if any.
3. EmuDeck (read `emulationPath` from `~/.config/EmuDeck/settings.sh`, not assumed `~/Emulation`) and RetroDECK.
4. App menu entries (`~/.local/share/applications/*.desktop`, `Exec=` points at AppImages wherever they live; Gear Lever, AppImageLauncher).
5. Flatpaks (user and system).
6. Programs: `/usr/bin`, `/usr/games`, `/usr/local/bin`, `~/.local/bin` (distrobox exports), `/snap/bin`, `~/.nix-profile/bin`, `/run/current-system/sw/bin`, Homebrew, and `PATH` from a login shell (Steam gives us a minimal one).
7. Steam RetroArch.
8. A full walk of home, plus `/opt` and `/usr/local`; other drives (`/run/media`, `/mnt`) as an option. Background, time limited, progress shown. Skips caches, `.git`, `node_modules`, Steam libraries, Proton prefixes and ROM folders. Symlink loops avoided by device:inode.

### Finding AppImages by content, not name
- Every AppImage starts with an ELF header with `AI` and a type byte at offset 8. Reading 11 bytes tells us, whatever the file is called or where it is. Only executable files or files over a few MB are opened.
- Unpacked AppImages (`squashfs-root`) are found by their `.desktop` file.

### Identifying the emulator (renamed files included)
Strongest first, each with a confidence level:
- Flatpak: the app id (certain).
- EmuDeck or custom scripts: read the text and follow what it runs (certain).
- AppImage: read the `.desktop` and AppStream `.appdata.xml`/`.metainfo.xml` from the squashfs inside the file without running or unpacking it; `.upd_info` often names the GitHub project (very high). Needs a small squashfs reader that handles the compression used (zstd, xz, gzip).
- Windows `.exe` under Proton: PE version info (high).
- Plain program files: known names in a bounded read (medium).
- Otherwise: ask "Which emulator is this?".
High confidence is used automatically; medium asks once. Emulators are grouped into argument families (yuzu forks: Eden, Citron, Sudachi, Suyu, Torzu; Ryujinx forks), so a close guess still launches.

Before building: download the current AppImages (shadPS4, RPCS3, Eden, Cemu, Ryujinx, PCSX2, DuckStation, Dolphin, and the rest) and record what each one's `.desktop`, AppStream and compression actually are.

### Launch arguments
- `emulators.js` gains arguments by version where flags changed between versions (version from AppStream, `flatpak info` or the file name).
- "Unknown emulator": pick which emulator it behaves like, or type arguments with `{ROM}`.
- Order per console: the user's Steam shortcuts, then their pick, then EmuDeck/RetroDECK, then standalone or RetroArch per `RA_FIRST`.
- **Different emulator for one game:** a game can override its console's emulator.

### Results screen
Per console: found, pick one of several, or not found with Browse. "Test with one game": Cartridge adds one game to Steam and the user launches it from Steam (Cartridge still never launches emulators on Linux).

### Relinking
Emulators are remembered by identity plus path. The start-up check only `stat`s remembered paths. If one is gone (moved, or an update changed the file name, e.g. Cemu-2.4 to Cemu-2.6), find the same identity again and offer "Emulator moved, fix N shortcuts" with `updateShortcut` in place (same appids). A path counts as removed only after two starts, so an unplugged SD card doesn't trigger it.

### Pre-flight checks on each console card (read only)
- RetroArch core present in that install's own cores folder, else "Install X in RetroArch's Online Updater".
- BIOS, firmware or keys present in the known locations.
- Flatpak emulators can see the ROM folder (metadata and overrides files); if not, show the `flatpak override --user --filesystem=...` command, or a button with consent.
- AppImage not executable or FUSE 2 missing: explain; offer `+x` only as a button the user presses; suggest `APPIMAGE_EXTRACT_AND_RUN=1` as a prefix.

### Risks still to decide
- Flatpak Steam (`~/.var/app/com.valvesoftware.Steam`) can't run host programs directly; detect and warn, `flatpak-spawn --host` only after testing.
- RetroDECK command line launching differs by version; likely 0.9.x after checking a real install. Until then: "RetroDECK found, pick an emulator for Steam shortcuts".
- Windows emulators through Proton: learn from existing shortcuts only in 0.9.
- Forks keep appearing: the Unknown emulator escape hatch now; an updatable database file from the repo later.

## 2. Shortcut health
One screen listing Steam shortcuts that would fail (missing emulator, missing ROM, missing core), with one-press fixes.

## 3. Setup report
"Copy setup report" with the detection results. Home paths become `~`; user names, IPs and server addresses are removed.

## 4. Detection tests in the repo
The fake homes used in earlier sessions become automated checks: EmuDeck, Flatpak only, distro packages, AppImages anywhere, renamed files, nothing installed.

## 5. Also in 0.9
- **Library check and repair:** re-verify downloaded games against RomM checksums and re-download damaged ones.
- **Controller prompts that match the pad** (Xbox, PlayStation, Nintendo), read from the pad id.
- **First-run tour** after Setup.
- **Manuals and extras from RomM** on the game page (manuals, soundtracks, screenshots where the server has them). Read only.
- **BIOS from RomM:** show which BIOS files the server holds and where each one goes. Copying them into place automatically would bend "never touch emulator files", so that part waits for the owner's decision.
- **Steam collections per console, kept in sync** when games are added or removed. Rule: Steam collections are ALWAYS separate from Cartridge (RomM) collections. Neither is ever copied into the other.

Dropped: "Take with me".

## 6. Design and branding

### Why it feels AI-made (measured)
- No design system: about 180 different font sizes, about 270 different colour values and 8 corner radii (3, 6, 7, 8, 10, 12, 16 px and pill) across the app.
- The default AI look: purple to peach gradient (`#8b74e8` to `#e1a38d`), glass on every panel, a corner glow, film grain.
- No weight: see-through panels, light grey text, small spaced capitals, hairline borders.
- Everything has equal importance (cards, pills, chips, stat rows, small labels), so it reads as a dashboard.
- Too much explaining text on screen.
- Motion durations and curves vary per screen.
- iiSU and CocoonFE feel heavy because art leads, surfaces are solid and few, and one personality runs through icons, sounds and themes.

### Directions (owner to pick)
- **A. Refine:** a real design system (type scale, spacing, radii, palette, one motion curve, solid surfaces) applied to every screen. Layouts stay.
- **B. Art-led:** artwork and big type lead, minimal chrome on solid dark surfaces, closer to PS5 or Switch.
- **C. Own character:** a language taken from physical cartridges (label stickers, chunky edges, tactile sounds, a distinct colour).

Process: static mockups of 2 or 3 directions (Home, a game page, Settings at 1280x800 and TV size), the owner picks, a short design system document, then apply screen by screen. The design skills in `.claude/skills/` only if the owner asks.

### Branding
- The logo is a gradient cartridge with the generic "image" mountain and sun on the label, so it reads as clip art and fails as one colour at small sizes.
- Keep the name. Aim for a mark that works in one colour at 16 px, a wordmark, and one signature colour instead of a gradient (themes can still change the accent).
- A small commission from a human designer is the most reliable way to not look AI-made; drawn options are possible too.

## 7. Towards 1.0 (Android)
- No Steam features on Android.
- The interface only talks to the back end through `call()`, so the Vue UI can run in an Android app shell (for example Capacitor) with the back end (RomM, downloads, library, images) rewritten behind the same calls. In 0.9, keep the interface free of anything Linux-only.
- On Android the frontend launches emulators (Android intents per emulator app; ES-DE's Android rules as the reference). So "never launches emulators" becomes a Linux-only rule; the owner's call.
