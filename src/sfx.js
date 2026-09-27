// Tiny synthesized UI sounds (no assets). Three styles and three volumes.
let ctx;
let enabled = true;
let style = 'soft';
let gain = 1;
export function setSoundEnabled(v) { enabled = v; }
export function setSoundStyle(s, vol) { style = PACKS[s] ? s : 'soft'; gain = { low: 0.5, medium: 1, high: 1.7 }[vol] || 1; }
function tone(freqs, { dur = 0.05, type = 'sine', vol = 0.05, glide = 0 } = {}) {
  if (!enabled) return;
  try {
    ctx ||= new AudioContext();
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      const st = t0 + i * dur * 0.8;
      o.frequency.setValueAtTime(f, st);
      if (glide) o.frequency.exponentialRampToValueAtTime(f * glide, st + dur);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(Math.min(0.2, vol * gain), st + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      o.connect(g).connect(ctx.destination);
      o.start(st); o.stop(st + dur + 0.02);
    });
  } catch {}
}
const PACKS = {
  // soft console-like clicks (the original sounds)
  soft: {
    move: () => tone([1320], { dur: 0.035, type: 'triangle', vol: 0.025 }),
    accept: () => tone([660, 990], { dur: 0.06, type: 'triangle', vol: 0.05 }),
    back: () => tone([520, 390], { dur: 0.06, type: 'triangle', vol: 0.04 }),
    tab: () => tone([880], { dur: 0.05, type: 'sine', vol: 0.04, glide: 1.25 }),
    error: () => tone([220, 180], { dur: 0.09, type: 'square', vol: 0.02 }),
    done: () => tone([784, 988, 1319], { dur: 0.09, type: 'sine', vol: 0.05 }),
  },
  // chiptune bleeps
  retro: {
    move: () => tone([1760], { dur: 0.025, type: 'square', vol: 0.012 }),
    accept: () => tone([988, 1319], { dur: 0.05, type: 'square', vol: 0.02 }),
    back: () => tone([659, 494], { dur: 0.05, type: 'square', vol: 0.018 }),
    tab: () => tone([1175, 1568], { dur: 0.035, type: 'square', vol: 0.015 }),
    error: () => tone([147, 110], { dur: 0.1, type: 'square', vol: 0.02 }),
    done: () => tone([1047, 1319, 1568, 2093], { dur: 0.07, type: 'square', vol: 0.02 }),
  },
  // round, low bubbles
  bubble: {
    move: () => tone([520], { dur: 0.05, type: 'sine', vol: 0.04, glide: 1.6 }),
    accept: () => tone([440, 700], { dur: 0.07, type: 'sine', vol: 0.06, glide: 1.3 }),
    back: () => tone([500], { dur: 0.08, type: 'sine', vol: 0.05, glide: 0.6 }),
    tab: () => tone([620], { dur: 0.07, type: 'sine', vol: 0.05, glide: 1.4 }),
    error: () => tone([200], { dur: 0.12, type: 'sine', vol: 0.06, glide: 0.7 }),
    done: () => tone([523, 659, 784], { dur: 0.1, type: 'sine', vol: 0.06, glide: 1.2 }),
  },
};
export const SOUND_PACKS = [{ v: 'soft', l: 'Soft' }, { v: 'retro', l: 'Retro' }, { v: 'bubble', l: 'Bubble' }];
export const sfx = new Proxy({}, { get: (_, k) => () => PACKS[style][k]?.() });
export function previewSound() { PACKS[style].accept(); }
