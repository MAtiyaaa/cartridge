# Cartridge 0.9.2 · Controls and colour

Agreed with the owner, built in 0.9.2. The old 0.9.2 list moved to docs/plan-0.9.3.md.

1. White by default: Highlights, Buttons and Progress bars are white in the Cartridge theme. Picking colours in Look & Feel still works. Animated backgrounds keep the brand colour.
2. Selected states: chosen but not focused is a lighter grey fill (`--sel`), where you are is white (or the Highlights colour, with text picked for contrast). No stripes or outlines. The current top tab has a faint outline.
3. D-pad zones (`data-zone` in nav.js): the D-pad stays inside the part of the screen you're in. The page is a zone (up never reaches the top bar), Settings' right side is one (B goes back to the left list).
4. Game page: up from the screenshots goes back up the page instead of jumping to the search box (fixed by 3).
