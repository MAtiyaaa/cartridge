## Cartridge 0.9.40 · Pictures That Load

### Changed
- **GIF search finds more:** it now searches Wikimedia Commons as well as Openverse (both free and openly licensed), spells out short names (PS4 also searches "PlayStation 4", SNES "Super Nintendo" and so on), and keeps GIFs down to 200 pixels wide instead of 320.
- **Game Shelf** shows the console's logo instead of "PlayStation 4 Shelf".

### Fixed
- **GIF results not loading:** the previews were asked for straight from the page, which got nothing back on devices. Cartridge now fetches them itself, the way it reaches every other outside site, and keeps them. A preview that still can't load shows a plain picture icon instead of a broken image.
- **The cut-off outline in the picture search:** the ring around the picked result was drawn outside its box and clipped. It's now a solid ring inside the edge, and the picture zooms within its frame, so nothing is cut off.
