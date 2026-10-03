## Cartridge 0.9.20 · Start, Refined

### Changed
- **Start, after a design review with the new taste and redesign skills:**
  - **Labels:** each tile is named in plain words, without the small icon and count every tile used to carry.
  - **Clock:** shows just the time, with the day and date under it.
  - **Storage:** now reads "Free space … of 931 GB on the games drive".
  - **This week:** now reads "Played this week".
  - **Cover rows:** New, Recently played, Favourites and Recommended fill their tile and fade out at the edge. Each has a soft, dark wash of its first game's colours behind it, so not every tile is the same grey.
  - **Consoles:** a few consoles stretch to fill the tile instead of leaving it half empty.
  - **Latest trophies:** one trophy shows large, with how long ago you got it.
  - **Entrance:** tiles arrive one after another, rising a little, rather than all at once.
  - **Hints:** "A Open, hold to arrange" is one hint instead of two.
- **Start widgets, redrawn:**
  - **Clock:** a large, light time over a soft sky that changes with the hour. The sun (or the moon at night) moves along a faint path across the tile.
  - **Free space:** a ring of ticks lit for the space that's left, with the percentage in the middle. It turns amber below 10%.
  - **Played this week:** says which day you played most, today's bar shows its own minutes, days without play are a dot, and the bars rise in turn.
- **Top bar:** the current tab is back on a white highlight with dark text, as before the underline, now redone: the highlight glides from tab to tab and hugs the name as it opens. A tab picked with the controller or keyboard shows a white ring, so it is never mistaken for the current one.
- **Search:** search is a round button with a mouse or touch. The Y hint shows only while a controller is in use, like LT and RT.
- **Design skills:** taste-skill (with its redesign, soft and minimalist skills) and img2threejs are now in the project's design skills.

### Fixed
- **Reduced motion:** it now also stops the media bar's settle and Start's tile animations. Three of 0.9.19's style rules were written in a way the app's style compiler doesn't support, so they never applied.
