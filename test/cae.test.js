// CAE everywhere (0.9.52, owner: "any older animations, change them to the Cartridge Animation Engine's timings"):
// every transition and animation in src/ takes its curve and duration from CAE's tokens (springs from motion.js, the
// named timings in styles.css :root). Allowed as they are, with reasons:
// - delays (choreography: when a thing starts, not how it moves);
// - scenery loops of 2 s or more and stepped ones (the caret's blink): their length is part of the scene;
// - 0 durations (switching motion off) and the Reduce and Fast motion overrides (body.motion-*), which are settings;
// - var(--x, fallback): a fallback only applies on engines without CAE's springs.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../src');
const files = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : /\.(vue|css)$/.test(e.name) ? [path.join(d, e.name)] : []));
// var(...) with nested brackets taken out, so only timings written by hand are left
const noVars = (v) => { let out = '', depth = 0, i = 0; while (i < v.length) { if (depth === 0 && v.startsWith('var(', i)) { depth = 1; i += 4; continue; } if (depth) { if (v[i] === '(') depth++; else if (v[i] === ')') depth--; i++; continue; } out += v[i++]; } return out; };
// commas at the top level only (not inside var(...) or cubic-bezier(...))
const splitTop = (v) => { const out = []; let depth = 0, cur = ''; for (const ch of v) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const secs = (t) => { const m = t.match(/^(\d*\.?\d+)(ms|s)$/); return m ? parseFloat(m[1]) / (m[2] === 'ms' ? 1000 : 1) : null; };
// per-tile variation of Start's decorative glint (each tile turns at its own pace)
const ALLOWED = [/st-tile:nth-child\(3n( \+ 2)?\) \.st-face::after/];

test('every transition and animation uses CAE\'s timings', () => {
  const bad = [];
  for (const f of files(SRC)) {
    const text = fs.readFileSync(f, 'utf8');
    const re = /([^{};]*)\{([^{}]*)\}/g;
    for (const m of text.matchAll(re)) {
      const sel = m[1].trim();
      if (/:root|body\.motion-(reduce|fast)|@keyframes/.test(sel) || ALLOWED.some((a) => a.test(sel))) continue;
      for (const d of m[2].matchAll(/(?<![\w-])(transition|animation)(-duration|-timing-function|-delay)?\s*:\s*([^;]+)/g)) {
        if (d[2] === '-delay') continue;
        const v = d[3].replace(/!important/, '');
        for (const raw of splitTop(v)) {
          // a CAE timing (var) first: a time written after it is the delay
          const item = /var\(--(spring|fade|tint|progress|loop|move|press|d-|ease)/.test(raw) ? noVars(raw).replace(/\d*\.?\d+m?s/g, '') : noVars(raw);
          const w = item.trim().split(/\s+/).filter(Boolean);
          const times = w.filter((x) => secs(x) !== null);
          const loop = /\binfinite\b/.test(item);
          const handEase = /cubic-bezier\(|\b(ease|ease-in|ease-out|ease-in-out)\b/.test(item) || (/\blinear\b/.test(item) && !loop);
          const handTime = times.length && secs(times[0]) > 0 && secs(times[0]) < 2 && !/steps\(/.test(item); // 2 s or more: scenery
          if ((d[2] !== '-timing-function' && handTime) || (handEase && !(secs(times[0] || '0s') >= 2))) bad.push(`${path.relative(SRC, f)}: ${sel.slice(-60)} { ${d[0].trim().slice(0, 90)} }`);
        }
      }
    }
  }
  assert.deepStrictEqual(bad, [], 'use CAE\'s tokens (--spring*, --fade-*, --tint, --progress, --loop-*, --move-*), docs/cae.md');
});

test('script animations take their timing from CAE too', () => {
  const bad = [];
  for (const f of files(SRC).concat(fs.readdirSync(SRC).filter((n) => n.endsWith('.js')).map((n) => path.join(SRC, n)))) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/\.animate\(([^;]*)\)/g)) if (/easing:\s*'cubic-bezier|duration:\s*\d/.test(m[1])) bad.push(path.relative(SRC, f) + ': ' + m[0].slice(0, 100));
  }
  assert.deepStrictEqual(bad, []);
});
