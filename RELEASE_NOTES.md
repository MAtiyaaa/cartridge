## Cartridge 0.9.41 · Light, Rebuilt

### New
- **Right stick scrolls:** push the right stick up or down to scroll whatever you're reading, a list, a page or a pop-up like What's New. The further you push, the faster it goes.
- **Pages on Start move up and down too:** in the page overview, a page you've picked up moves a whole row with up and down, as well as left and right.

### Changed
- **Light, rebuilt from the ground up:** a soft grey page with near-white cards raised on gentle shadows, dark text, a near-black highlight and a white Dock (unless you picked another Dock colour). Picture tiles, trophy icons and game icons have lighter frames to match.
- **OLED is its own look:** black cards and panels set apart by a fine edge, so it no longer looks the same as Cartridge.
- **OLED Black left Background:** it lives in the OLED colour now. If you used OLED Black, Cartridge switches you to the OLED colour.
- **Always uses the GPU:** the Rendering setting is gone. If the GPU ever fails at start-up, Cartridge still restarts without it for that time only.
- **Console at a Glance fits its size:** as many covers as fit side by side, none cut off and no empty space; the narrowest size shows one cover, a centred logo and two numbers.
- **"On this device" is the green tick** in Game of the Day and Spotlight, the same tick the game cards carry.
- **What's New is a solid card,** so the page behind no longer shows through, with an RS hint for scrolling.

### Fixed
- **The emulator widget emptying after you closed the emulator:** the chosen emulator wasn't saved with the layout, so Start forgot it when it came back. It's saved now (a widget that already lost it needs its emulator picked once more).
- **Page 1 showing a placeholder in the page overview:** a page only got its picture while it was on screen. Opening the overview now takes a picture of every page that has none.
- **Moving pages in the overview getting laggy over more than one row:** the lift and the slide fought over the same property, and the whole board behind was blurred on every frame. Both are gone.
- **The More sheet popping out twice:** a sheet's own opening animation started again once the pop-up had opened. It plays once now, and the same for every pop-up.
- **Light with Glass or OLED Black in Background going black:** Light has its own page now and Background's options don't apply to it.
