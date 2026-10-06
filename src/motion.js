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
  // 0.9.38 (owner: "more prominent, but never jarring"): a touch of life for things that answer you (a press let go,
  // a pop-up arriving, a toggle's knob, the pill sliding to what you picked): one small overshoot, then still
  'spring-pop': { damping: 0.72, response: 0.42 },
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
// 0.9.38: the picture flies as one element (FLIP) instead of a View Transition. A View Transition snapshots the
// whole screen, so it was kept to the GPU, and handhelds in Game Mode (software rendering) never saw it. One picture
// moved by transform alone costs the compositor almost nothing, so it now runs everywhere, light effects included.
const reduced = () => document.body.classList.contains('motion-reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;
let running = null;
const imgOf = (el) => el?.querySelector?.('img') || (el?.tagName === 'IMG' ? el : null);
// fromEl flies to the element toSel finds after change() has run (Vue's DOM update awaited); with nothing to land
// on, the page's own arrival is all there is. Returns at once; change() always runs, with or without the flight.
export function morph(fromEl, change, toSel, nextTick) {
  const img = imgOf(fromEl);
  if (reduced() || !img || !fromEl.isConnected) { change(); return; }
  skipMorph();
  const a = fromEl.getBoundingClientRect(), src = img.currentSrc || img.src;
  change();
  (async () => {
    await nextTick(); await nextTick();
    const to = toSel ? document.querySelector(toSel) : null;
    const b = to?.getBoundingClientRect();
    if (!b || b.width < 8 || b.height < 8 || !a.width) return;
    const fly = document.createElement('img');
    fly.className = 'morph-fly'; fly.src = src; fly.alt = '';
    Object.assign(fly.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', borderRadius: getComputedStyle(to).borderRadius, transformOrigin: '0 0' });
    document.body.appendChild(fly);
    to.style.visibility = 'hidden';
    // 0.9.45 (owner: the picture landed off its place, then snapped there, both ways): the target is read again every
    // frame. It moves while the flight runs (the new page settles in, a list scrolls the card into view), and the
    // old flight was aimed at where it was in the first frame. A critically damped spring (no overshoot) carries the
    // picture from where it was picked to wherever the target is now, so the last frame is exactly on it.
    const w = (2 * Math.PI) / SPRINGS.spring.response, dur = 7.5 / w; // x(t) = 1 - (1 + wt) e^(-wt), done at 99.6%
    const t0 = performance.now();
    let raf = 0, alive = true;
    const end = () => { if (!alive) return; alive = false; cancelAnimationFrame(raf); to.style.visibility = ''; fly.remove(); if (running?.end === end) running = null; };
    const frame = (now) => {
      if (!alive) return;
      const t = (now - t0) / 1000, p = t >= dur ? 1 : Math.min(1, (1 - (1 + w * t) * Math.exp(-w * t)) / 0.985); // the last 1.5% folded in: it ends on the target, never a few pixels short
      const c = to.isConnected ? to.getBoundingClientRect() : b;
      if (c.width >= 8 && c.height >= 8) {
        const x = a.left + (c.left - a.left) * p, y = a.top + (c.top - a.top) * p, wd = a.width + (c.width - a.width) * p, ht = a.height + (c.height - a.height) * p;
        Object.assign(fly.style, { left: c.left + 'px', top: c.top + 'px', width: c.width + 'px', height: c.height + 'px', transform: `translate(${x - c.left}px, ${y - c.top}px) scale(${wd / c.width}, ${ht / c.height})` });
      }
      if (p >= 1) return end();
      raf = requestAnimationFrame(frame);
    };
    running = { end };
    raf = requestAnimationFrame(frame);
  })();
}
// any new input ends a flight at once (the page is already there underneath): never a wait
export function skipMorph() { const r = running; running = null; if (r) r.end(); }

// ---------- 4. the sliding pill (0.9.38): in every segmented row (.seg), the chosen option's fill is one element that
// glides to the next choice on a spring, stretching to its width, instead of one fill vanishing and another appearing.
// Watches class changes on .seg buttons only; transform and size of one small box, nothing else repaints.
export function slidingPills(root = document.body) {
  const place = (seg, still) => {
    const on = seg.querySelector(':scope > button.on');
    let ink = seg.querySelector(':scope > .seg-ink');
    if (!on) { if (ink) ink.style.opacity = '0'; return; }
    if (!ink) { ink = document.createElement('i'); ink.className = 'seg-ink'; ink.setAttribute('aria-hidden', 'true'); seg.prepend(ink); still = true; }
    if (still) ink.classList.remove('live');
    Object.assign(ink.style, { opacity: '1', width: on.offsetWidth + 'px', height: on.offsetHeight + 'px', transform: `translate(${on.offsetLeft}px, ${on.offsetTop}px)` });
    seg.classList.add('inked');
    if (still) requestAnimationFrame(() => ink.classList.add('live')); // first placing never slides in from the corner
  };
  const all = (still) => root.querySelectorAll('.seg').forEach((seg) => place(seg, still));
  let queued = new Set(), raf = 0;
  const flush = () => { raf = 0; for (const seg of queued) if (seg.isConnected) place(seg); queued = new Set(); };
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'attributes') { const seg = m.target.parentElement; if (seg?.classList?.contains('seg') && m.target.tagName === 'BUTTON') queued.add(seg); }
      else for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.classList.contains('seg')) queued.add(n); else if (n.querySelector) n.querySelectorAll('.seg').forEach((x) => queued.add(x)); if (n.parentElement?.classList?.contains('seg') && n.tagName === 'BUTTON') queued.add(n.parentElement); }
    }
    if (queued.size && !raf) raf = requestAnimationFrame(flush);
  }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', () => all(true));
  all(true);
  return () => all(true);
}
