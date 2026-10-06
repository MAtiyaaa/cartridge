## Cartridge 0.9.44 · Real Glass

### Changed
- **Glass, rebuilt to look like real glass:** made from the reference pictures you sent. The Dock, search, buttons, switches, pop-ups and toasts now have:
  - almost no fill, so the page shows through blurred and brighter instead of under a grey wash;
  - a thin rim that catches the light, brightest at two corners;
  - a sense of thickness (a light inner edge on top, a dark one underneath);
  - a diagonal reflection across the top;
  - a soft shadow, so they float.
- **Pop-ups and sheets are frosted glass with a fine grain.** Their rows sit on the glass instead of being grey blocks.
- **Whatever is focused or chosen becomes lit glass:** brighter, filled with your highlight colour, with a glowing rim. Light makes it white glass, as before.
- **Glass buttons shimmer when pressed:** a band of light sweeps across, as Apple's interactive glass does (not with reduced motion).
- **Clearer glass over game art:** the buttons on a game's page are more see-through so the art shows, with a soft shadow keeping their labels readable.
- **Rounded shapes nest properly:** the highlight inside a switch follows the switch's own curve.

### Fixed
- **Start's page overview showing the same picture for two different pages:** a page's picture was sometimes taken while the previous page was still sliding away, so it was saved as the other page's. This happened when the overview pictured pages you hadn't opened yet, and on two quick page turns. Each page now waits for its own board before its picture is taken.
