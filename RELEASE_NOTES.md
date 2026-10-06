## Cartridge 0.9.28 · Plain and Glass

abdu2304's 0.9.44 to 0.9.46. On Linux, Cartridge works exactly as his 0.9.46 does, with this fork's phone remote and Fuse bridge on top.

### New
- **Linux (from abdu2304):** Game Settings has an All Settings tab listing every setting the emulator's per-game file can change (shadPS4, RPCS3, PCSX2, DuckStation, Dolphin, PPSSPP), grouped by section, with Type a Number or Type a Value for typed settings.

### Changed
- **One Style setting: Plain or Glass.** Look & Feel → Theme has one Style choice under Colour, for the whole app. It replaces the separate Background and Elements settings, and your old choice carries over. Glass is see-through (frosted panels, glass buttons, switches and Dock). Plain is solid and matte, designed on its own: crisp edges, a faint light along the top of raised things, slightly raised buttons, slightly sunk switch tracks, solid pop-ups.
- **Glass, rebuilt to look like real glass:** almost no fill, a thin rim that catches the light, a sense of thickness, a diagonal reflection and a soft shadow. Pop-ups and sheets are frosted with a fine grain, focused and chosen things become lit glass in your highlight colour, buttons shimmer when pressed, and cards and panels are see-through again instead of nearly black.
- **The Dock follows the Style:** glass in Glass; in Plain you pick Black, White or Accent. Switching to Light turns a black Dock white, and leaving Light turns it black again.
- **Settings sections open on their first page.** Coming back from a screen you opened from a page returns you to that page.

### Fixed
- **Screens opened from Settings did nothing (since 0.9.27):** Steam console cards, "missing from Steam", Emulator setup, Shortcut health, Frame Generation and others open again.
- **A game's cover flying to the game page** landed off target and snapped. It now follows its target the whole way.
- **The chosen pill in switches** showed grey when focused with the controller. It's white with dark text again.
- **Pop-ups dimmed twice:** the backdrop no longer fades in a second time.
- **Start's page overview** sometimes showed one page's picture for another.
- **Light:** Start's storage ring, bars, counts, page dots and the Arrange grid are drawn dark so they show.
- **Holding A on a row whose text already fits** needed B twice to leave. Hold A now only opens a row with more to show.
- **Long paths in messages** wrap inside their box.
- **Linux (from abdu2304):** "Games aren't in their Steam collection" when they are, Game Settings going to the Steam tab after typing a value, shadPS4 Game Settings showing "Default" without its value.
