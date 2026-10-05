## Cartridge 0.9.36 · Collections, Checked Properly

### Fixed
- **"Games are missing from …" in Settings → Emulators → Setup and Health:** the check trusted what Cartridge remembered about collections from before they were sorted, so it listed old collections (RomM's plain names, Steam ROM Manager's "Nintendo DS - melonDS (Standalone)") and its Put Them Back would have made them again. Now it reads what's really in Steam: a console's games are checked against that console's collection only (and only with "Put new games in their console's collection" on), and any other collection only while it's still in Steam.
- **Put Them In** (was Put Them Back) adds the games straight into Steam when Cartridge can reach its interface, without a restart.
- **Steam ROM Manager's collection names** ("<console> - <emulator>") are recognised as console collections, so the Collections page offers to use or rename them instead of making a second one.
- The issue's title names at most three collections, then "and N more".
