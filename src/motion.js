// Motion (0.9.37, owner: a fluid motion engine, with the apple-design skill: springs, interruptible transitions,
// shared element transitions, micro-interactions; nothing jarring, no cost). Three parts:
// 1. Spring curves for CSS: a damped spring simulated once and written as linear() easing tokens (--spring and its
//    duration --spring-d). CSS transitions start from where the element is now, so retargeting mid-way never jumps.
// 2. A spring for values Cartridge moves itself (nav.js scrolling): it keeps its velocity when the target changes,
//    so presses in a row blend into one motion instead of restarting.
// 3. morph(): a picture flying from where you picked it to where it lands (a game card into the game page), with
//    the View Transitions API; only with the GPU, and skipped at once by any new input.
// Apple's parameters (Designing Fluid Interfaces): damping ratio (1 = no overshoot) and response (seconds).

// ---------- 1. spring curves for CSS
// x'' = -k (x - 1) - c x', from 0 at rest; k = (2π / response)², c = 4π ζ / response
export function springCurve({ damping = 1, response = 0.35, samples = 48 } = {}) {
  const k = (2 * Math.PI / response) ** 2, c = (4 * Math.PI * damping) / response, dt = 1 / 1000;
  let x = 0, v = 0, t = 0;
  const pts = [];
  while (t < 3) {
    for (let i = 0; i < 4; i++) { const a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; t += dt; }
    pts.push(x);
    if (Math.abs(1 - x) < 0.0015 && Math.abs(v) < 0.02) break;
  }
  const dur = Math.round(t * 1000);
  const step = Math.max(1, Math.floor(pts.length / samples));
  const out = [];
  for (let i = 0; i < pts.length; i += step) out.push(+pts[i].toFixed(4));
  out[out.length - 1] = 1;
  return { easing: `linear(0, ${out.join(', ')})`, duration: dur };
}
// critically damped by default; a little bounce only for things that carry momentum (a flick, a page turn)
export const SPRINGS = {
  spring: { damping: 1, response: 0.38 },        // most movement: settles, never overshoots
  'spring-snappy': { damping: 1, response: 0.24 }, // small things: presses, rings, chips
  'spring-soft': { damping: 1, response: 0.55 },   // big surfaces: sheets, pages
  'spring-bounce': { damping: 0.78, response: 0.38 }, // after momentum only
};
export function installSprings(root = document.documentElement) {
  if (!CSS.supports?.('transition-timing-function', 'linear(0, 1)')) return; // older engines keep the cubic curves
  for (const [name, p] of Object.entries(SPRINGS)) {
    const s = springCurve(p);
    root.style.setProperty('--' + name, s.easing);
    root.style.setProperty('--' + name + '-d', s.duration + 'ms');
  }
}

// ---------- 2. a spring for values moved by script, interruptible with velocity kept
// spring(state, target, { response, damping }) steps the value each frame towards target; calling it again while it
// runs only moves the target, so the motion carries on from its current position and speed.
export function springTo(st, target, { response = 0.3, damping = 1, apply, done } = {}) {
  st.target = target; st.k = (2 * Math.PI / response) ** 2; st.c = (4 * Math.PI * damping) / response; st.apply = apply; st.done = done;
  if (st.v == null) st.v = 0;
  if (st.raf) return st;
  let last = performance.now();
  const frame = (now) => {
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    // small fixed steps: steady at any frame rate, also when a slow frame comes in without the GPU
    while (dt > 0) { const h = Math.min(dt, 0.004); const a = -st.k * (st.x - st.target) - st.c * st.v; st.v += a * h; st.x += st.v * h; dt -= h; }
    if (Math.abs(st.x - st.target) < 0.5 && Math.abs(st.v) < 8) { st.x = st.target; st.v = 0; st.raf = 0; st.apply?.(st.x); st.done?.(); return; }
    st.apply?.(st.x);
    st.raf = requestAnimationFrame(frame);
  };
  st.raf = requestAnimationFrame(frame);
  return st;
}
export function stopSpring(st) { if (st?.raf) cancelAnimationFrame(st.raf); if (st) { st.raf = 0; st.v = 0; } }

// ---------- 3. shared element transitions
const morphOK = () => !!document.startViewTransition && !document.body.classList.contains('light-fx') && !document.body.classList.contains('motion-reduce') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
let running = null;
// fromEl flies to the element toSel finds after change() has run (Vue's DOM update awaited); with nothing to land
// on it fades. Returns at once; change() always runs, with or without the transition.
export function morph(fromEl, change, toSel, nextTick) {
  if (!morphOK() || !fromEl || !fromEl.isConnected) { change(); return; }
  skipMorph();
  fromEl.style.viewTransitionName = 'cart-morph';
  document.documentElement.classList.add('morphing');
  let to = null;
  try {
    running = document.startViewTransition(async () => {
      fromEl.style.viewTransitionName = '';
      change();
      await nextTick(); await nextTick();
      to = toSel && document.querySelector(toSel);
      if (to) to.style.viewTransitionName = 'cart-morph';
    });
  } catch { fromEl.style.viewTransitionName = ''; document.documentElement.classList.remove('morphing'); change(); return; }
  const end = () => { if (to) to.style.viewTransitionName = ''; document.documentElement.classList.remove('morphing'); running = null; };
  running.finished.then(end, end);
}
// any new input ends a morph at once (the page is already there underneath): never a wait
export function skipMorph() { try { running?.skipTransition(); } catch {} }
