# Cartridge design system (0.9)

**The rules** (how Cartridge looks and feels, clipping, focus, Plain and Glass, motion, logos, what makes a screen
finished) are in `docs/design-rules.md` since 0.9.50. This file keeps the values: type, space, radius, colour.

Direction B, built on a real system: the artwork leads, the interface is solid, dark and quiet around it.
Every screen uses these values and nothing else. If something new needs a value that isn't here, change
this file first.

## Principles
- **Art first.** Game art is the colour on screen. Chrome is neutral and stays out of its way.
- **Plain or Glass.** Since 0.9.45 there are two separate styles (see the end of this file and `docs/design-rules.md`).
- **White means "you are here".** Focus is white (or the Highlights colour when one is picked): a ring
  on art, a full fill on buttons, rows and tabs. Readable from a sofa, the same on every screen.
- **Chosen is a lighter grey fill** (`--sel`), never a stripe or an outline. The current top tab has a
  faint outline (0.9.2).
- **One accent.** The theme colour (white in Cartridge's own theme since 0.9.2) marks the main action,
  progress and switches. Never gradients.
- **Fewer words.** Short labels. No sentence explaining a screen when the layout can.

## Type
Display: Archivo (variable, slightly wide, bold). Body and interface: Inter.

| Token | Size | Use |
|---|---|---|
| `--t-xs` | 12px | captions, counts, key hints |
| `--t-sm` | 14px | secondary text, small buttons, labels |
| `--t-md` | 16px | body, buttons, rows |
| `--t-lg` | 20px | section titles, card titles in dialogs |
| `--t-xl` | 28px | page titles, dialog titles |
| `--t-2xl` | 44px | hero titles on small screens |
| `--t-3xl` | 64px | hero titles |

Section titles are display 700 at `--t-lg`, sentence case, no icon. Labels are sentence case, never
spaced capitals.

## Space
4px grid: 4, 8, 12, 16, 24, 32, 48, 64 (`--s-1` to `--s-8`). Page side margin 48px (36px under 1400px).

## Radius
`--r-sm` 6px (chips, keys, small controls), `--r-md` 10px (buttons, cards, rows), `--r-lg` 16px
(panels, dialogs, tiles). Pills only for the connection status.

## Colour
- Surfaces: `--s0` page, `--s1` panels, `--s2` controls, `--s3` hover. Neutral greys with no hue.
- Text: `--text`, `--muted`, `--dim`.
- Accent: `--primary` (theme), `--on-primary` for text on it.
- Status: green (on this device, ok), red (danger), gold (ratings).

## Elevation
Cards: one soft shadow. Dialogs: one deep shadow. Nothing glows.

## Motion
One curve `--ease` (0.2, 0, 0, 1). 120ms for focus and press, 200ms for moves, 320ms for pages.
Focus appears at once; only the lift animates.

## Focus
- Buttons, rows, tabs, menu items: white fill, near-black text. A main button is already white, so it
  also gets the ring when focused.
- Game cards and tiles: 3px white ring outside a 3px gap, lifted 6%.
- Fields: white 2px ring.


## Plain and Glass (0.9.45, owner)
Two separate modes, chosen with one Style setting, never merged. Every element is designed for both:
- **Glass:** see-through. Frosted panels over the background; Liquid Glass on controls, the Dock and pop-ups (rim, reflection, lit glass for focus). `body.elements-glass`, `--lg-*` tokens.
- **Plain:** solid and matte. Nothing see-through; depth from a hairline edge, a faint light top edge on raised things, raised buttons and chosen pills, sunk tracks. `body.style-plain`, `--pl-*` tokens.
A new element isn't finished until it looks right in Plain, Glass, Light and OLED.
