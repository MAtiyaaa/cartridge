## Cartridge 0.9.3 L · Fixes from the couch

### Fixed
- **shadPS4 games start from Steam.** Cartridge's shortcuts now start the way shadPS4's own do: the same Target and Launch options, and a Start in that doesn't exist, just like shadPS4's (theirs points at the launcher's temporary folder, which is gone once it closes). Press Update on the PS4 console page once. The "shadPS4 core without the launcher" choice from K is gone.
- **Vita3K through EmuDeck.** EmuDeck's Vita3K script adds "-Fr" itself, so games added to Steam got it twice and didn't boot, and installs never reached Vita3K. Shortcuts now pass just the game's ID (press Update on the Vita console page), and installs use Vita3K itself. Cartridge also finds Vita3K's storage in its portable folder and under XDG_DATA_HOME.
- **Controller in the background.** In Game Mode, with Steam's menu in front, the controller no longer moves around in Cartridge.
- **PS3 patches for disc games:** the serial is read from the disc folder, the ISO or a name like "BLUS-30443".
- **Developer names** come from RomM's developers list, not the first company (often the publisher).
- **Console names** in trophies and RetroAchievements follow the names on your RomM server.
- **A changed RetroAchievements picture** now shows (asked again every few hours, and on Refresh).
- **Back from Emulator setup, Shortcut health and other screens in Settings** lands on the row you opened them from.
- **Timeline** uses the normal focus box; Search results have room for the focused card.

### New
- **RPCS3's recommended settings.** When a PS3 game finishes downloading or installing, Cartridge sets RPCS3's settings for it from RPCS3's own database (the same as "Create Custom Configuration From Database Settings"), only when the game has no settings of its own yet.
- **Background previews** in Look & Feel's background picker.
- **Manual** in the game page's More.
- **Shortcut health** offers Remove from Steam for shortcuts of games that are gone from this device, whoever made them (never while their drive is missing).
- **Missing from Steam collections:** Issues shows which games before putting them back.

### Changed
- **Trophies All** is one calm list: a summary line, your six latest unlocks as small badges, and your games newest first.
- **Continue playing** on Home is one row (it replaces Continue playing and Recently played) and says which device: "on Steam Deck".
- **"on" before device names** wherever trophies or play time came from another device.
- **Settings → Steam:** Add Cartridge to Steam comes first until it's added; then it moves to the bottom and says Added to Steam.
- **Title Case** for menu items.
