# Plan: next update (not built)

Owner, 4 Oct 2026, after 0.9.28: "Eden can find the game IDs immediately through any format, xci, nsp, anything. See how it does that and do the same thing. Put it in the next update but don't build it yet."

## Switch title IDs, read the way Eden reads them

Eden (yuzu's loaders: `core/loader/nsp.cpp`, `xci.cpp`, `nca.cpp`, `core/file_sys/submission_package.cpp`, `card_image.cpp`, `content_archive.cpp`) gets a game's ID from its files, not its name:
- It loads `prod.keys` (header_key) and every ticket (`.tik`) inside an NSP into its key manager.
- NSP/NSZ: PFS0 -> every NCA. The Meta NCA's CNMT gives the title ID and type (application, patch, add-on); the Program NCA header gives program_id (0x210).
- XCI/XCZ: root HFS0 -> secure partition -> the same NCAs.
- NCZ: the first 0x4000 bytes are the plain NCA header.

Cartridge's `switchTitleId` (electron/addons.js) already does most of this. What to add so it matches Eden:
1. Find `prod.keys` everywhere Eden and other setups keep it: Eden's own data folder from its `qt-config.ini` (custom data dir), EmuDeck `Emulation/bios/keys` style folders, RetroDECK `~/retrodeck/bios/switch/keys`, Ryujinx portable folders, any folder the user picked in Settings.
2. Read every NCA, not the first 40, and prefer the CNMT (Meta NCA, application type) over guessing from the Program NCA.
3. Base ID from the CNMT for updates and DLC (base = ID & ~0x1FFF, as 0.9.24).
4. Folder games: look inside for the .nsp/.xci/.nsz/.xcz, else the extracted NCAs.
5. Fallbacks when no keys are found: the emulator's own game list (Eden/yuzu family cache, Ryujinx's games folder per title ID), then RomM's metadata, then the file name.
6. Tests with small fake NSP/XCI files built in the test (a made-up header key, as `switchTitleId` takes key dirs).

Read Eden's source (git.eden-emu.dev) before building, as with every emulator change.

## Also waiting
See the newest docs/SESSION-LOG.md entry and the list given to the owner on 4 Oct.
