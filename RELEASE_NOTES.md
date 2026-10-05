## Cartridge 0.9.42 · Glass

0.9.41 never went out on its own (GitHub couldn't build it), so this update carries it too: everything under "From 0.9.41" below.

### New
- **Game Shelf, redesigned:** your games stand as cases on a lit shelf, spines out, each with its console's band on top (blue for PS4, white for PS5, red for Switch, green for Xbox). The game you pick turns out to face you and show its cover, with its name, play time and the green tick if it's on this device. Tap a case to pick it, tap it again (or press A) to open the game.

### Changed
- **Glass, rebuilt:** Glass now follows Apple's Liquid Glass rules. It's for the things you press and the bars you move with, floating over your games, never the games themselves:
  - The Dock, search, buttons, switches, pop-ups, sheets and toasts are glass. The page shows through them blurred, with a bright edge where the light catches.
  - Your cards, lists and panels stay solid, so they read clearly.
  - Whatever is focused or chosen becomes glass filled with your highlight colour.
  - Buttons light up from inside when pressed.
  - With Glass picked, the Dock is glass too (unless you picked a Dock colour).
  - Light makes it white glass. Reduced transparency in your system makes it frosted and solid, and higher contrast gives it a clear edge.
- **"On this device" is the green tick** on the disc and cartridge widget too.
- **The Nintendo Switch logo is bigger** so it reads as large as PlayStation's. On the Game Shelf it was drawn at the same height as PS4's, and its small "SWITCH" letters looked tiny next to it.

### From 0.9.41

#### New
- **Right stick scrolls:** push the right stick up or down to scroll whatever you're reading, a list, a page or a pop-up like What's New. The further you push, the faster it goes.
- **Pages on Start move up and down too:** in the page overview, a page you've picked up moves a whole row with up and down, as well as left and right.

#### Changed
- **Light, rebuilt from the ground up:** a soft grey page with near-white cards raised on gentle shadows, dark text, a near-black highlight and a white Dock (unless you picked another Dock colour). Picture tiles, trophy icons and game icons have lighter frames to match.
- **OLED is its own look:** black cards and panels set apart by a fine edge, so it no longer looks the same as Cartridge.
- **OLED Black left Background:** it lives in the OLED colour now. If you used OLED Black, Cartridge switches you to the OLED colour.
- **Always uses the GPU:** the Rendering setting is gone. If the GPU ever fails at start-up, Cartridge still restarts without it for that time only.
- **Console at a Glance fits its size:** as many covers as fit side by side, none cut off and no empty space; the narrowest size shows one cover, a centred logo and two numbers.
- **"On this device" is the green tick** in Game of the Day and Spotlight, the same tick the game cards carry.
- **What's New is a solid card,** so the page behind no longer shows through, with an RS hint for scrolling.

#### Fixed
- **The emulator widget emptying after you closed the emulator:** the chosen emulator wasn't saved with the layout, so Start forgot it when it came back. It's saved now (a widget that already lost it needs its emulator picked once more).
- **Page 1 showing a placeholder in the page overview:** a page only got its picture while it was on screen. Opening the overview now takes a picture of every page that has none.
- **Moving pages in the overview getting laggy over more than one row:** the lift and the slide fought over the same property, and the whole board behind was blurred on every frame. Both are gone.
- **The More sheet popping out twice:** a sheet's own opening animation started again once the pop-up had opened. It plays once now, and the same for every pop-up.
- **Light with Glass or OLED Black in Background going black:** Light has its own page now and Background's options don't apply to it.
