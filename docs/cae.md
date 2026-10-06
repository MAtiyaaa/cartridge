# CAE, the Cartridge Animation Engine

CAE is how everything in Cartridge moves. It grew out of `src/motion.js` (0.9.37, 0.9.38) and was rebuilt in 0.9.47
when the owner asked for motion that is "smooth and fluid but heavy, so it feels like something for a handheld or a
PC, not a phone app", with performance first and no new bugs. It is our own code: no animation library is loaded
(the owner had trouble with library bugs before, and every library we looked at, anime.js included, adds a second
frame loop and its own timing).

Code: `src/motion.js` (engine), `src/styles.css` (the CSS motion values), `src/nav.js` (scrolling and presses),
`src/glassEngine.js` (Glass light, see `docs/glass-engine.md`).

## The rule set

These are the rules every new motion must follow. If something can't follow them, ask the owner first.

1. **Heavy, not bouncy.** Movement is critically damped (damping 1): it arrives and stops. Only a press let go, a
   toggle's knob and a pill reaching its choice get a hint of give (`spring-pop`, damping 0.86, about 1% overshoot).
   Nothing wobbles, nothing overshoots more than that.
2. **Short distances.** Things move 8 to 24 px, never across the screen. Pages slide 24 px (12 px with a 0.985 scale
   when going deeper, back the other way), toasts 16 px, page content settles 10 px.
3. **Big is slower than small.** Pages and sheets use the heavy curve, everyday movement the settle curve, presses,
   rings, chips and focus the snap curve. Never a big surface faster than a small one.
4. **Closing is quicker than opening.** Pop-ups open on `--spring` (sheets `--spring-soft`) and leave in 150 ms.
5. **Interruptible.** Every move starts from where the thing is now, with its speed kept. Presses in a row blend;
   nothing snaps back to a start position. Any new input finishes a picture still flying (`skipMorph`).
6. **Transform and opacity only.** No animating width, height, top, left, filters or shadows. A shadow that must
   change fades on a pseudo-element.
7. **One frame loop.** Anything moved by script registers with `frame(fn)`. There is at most one
   `requestAnimationFrame`, it sleeps when nothing moves, and it uses real elapsed time (dt, capped at 50 ms), so a
   slow frame never makes things jump or speed up.
8. **Respect the person.** Reduced motion (the setting or the system's) turns movement into fades or nothing. Light
   effects (no GPU) keep pages to a 160 ms fade, because a moving full page doubled slow frames there (measured).
9. **Plain and Glass are separate.** A motion made for Glass (the liquid morph of pop-ups, the light on the rim)
   never leaks into Plain, and the other way round.
10. **Quiet when nobody is looking.** The governor (below) pauses decoration when you're idle and stops nearly
    everything while a game is in front.

## The parts

### 0. The ticker
`frame(fn)` runs `fn(now, dt)` every frame until it returns `false`; it returns a stop function. One loop for
everything: the scroll glide, shared-element flights, the Glass light, the Glass frame sampler.

### 1. Spring curves for CSS
`springCurve({ damping, response })` integrates the spring `x'' = -k (x - 1) - c x'` (k = (2π / response)²,
c = 4π ζ / response) and turns it into a CSS `linear()` easing with its natural duration. `installSprings()` writes
them as custom properties at start, so CSS uses springs without any script per frame:

| Token | Damping | Response | Used for |
|---|---|---|---|
| `--spring-snappy` | 1 | 0.22 s | presses, focus rings, chips, small things |
| `--spring` | 1 | 0.34 s | most movement, pop-ups opening, going back |
| `--spring-soft` | 1 | 0.46 s | pages, sheets, big surfaces |
| `--spring-pop` | 0.86 | 0.36 s | a press let go, toggle knobs, sliding pills |
| `--spring-bounce` | 0.86 | 0.36 s | after momentum only (a flick) |

Each has a matching `-d` duration token. Engines without `linear()` keep the older cubic curves.

### 2. Springs for script
`springTo(state, target, { response, damping, apply, done })` moves a value by script on the ticker, keeping its
velocity when the target changes mid-way. nav.js uses it for scrolling (`glideBy`): holding a direction retargets
the same spring, so the list keeps its speed instead of stopping and starting. `stopSpring` ends one.

### 3. Shared element flights
`morph(fromEl, change, toSel)` flies a picture from where it is (a cover in a grid) to where it lands (the game
page's cover) and back. It reads the target every frame, so it lands where the target really is even while the new
page settles in or a list scrolls (measured: 0 to 4 px off, it was 39 to 52 px before 0.9.45).

### 4. Sliding pills
`slidingPills()` gives every segmented control one fill that slides to the chosen option on `--spring-pop`.

### 5. The governor
Three states, set from input and from main's `background` event:

| State | When | What runs |
|---|---|---|
| active | you're using Cartridge | everything; controller read every 8 ms |
| idle | nothing pressed for 60 s | decorative loops paused (`body.cae-idle`: background drift, cover drift, clock clouds and stars, picture drift); the animated background draws 8 times a second from a timer instead of waking every frame; controller read every 16 ms |
| away | a game or another app is in front, or the window is hidden | CSS animations paused (`body.away`), the background stops drawing, the controller is read 4 times a second |

The animated background also halves its own frame rate when drawing a frame starts costing more than 8 ms (a slow device or a 4K screen). Any input wakes it at once.

Measured in the real app (software rendering, Aurora, Glass): about 6.7% of one CPU core in use with nothing pressed, 3.3% idle, 2.1% with a game in front; about 550 MB across all of Electron's processes. In the main process, the Game Mode focus watcher checks every 1.5 s instead of 0.6 s
while another app is in front, and the trophy service skips 3 of every 4 checks while a game runs.

## Checking a change

- `npm run audit:ui` (focus and contrast in Plain and Glass, three colours; see `tools/ui-audit/README.md`).
- Watch the move in Plain and Glass, with and without light effects, and with reduced motion.
- With the CPU throttled (Chromium DevTools, 4x), no frame should take longer than before the change.
