## Cartridge 0.9.35 · Steady Pictures

### Fixed
- **Console pictures glitching while an emulator updates** (Settings → Emulators): every progress step redrew the page and each console's picture lost its fit, jumping between sizes. A picture now keeps its fit unless it really changes, on every page that shows console pictures.
- **Deleted Steam collections coming back:** if you had kept your own console collection (for example "PlayStation 3") and then deleted it in Steam, Cartridge could make it again when filling collections, and the start-up check reported its games as "dropped by Steam" with a Fix that made it again. Collections you delete are now forgotten, and the console uses Cartridge's name ("Sony PlayStation 3") from then on.
