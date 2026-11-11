// Space-filling and snowflake fractal curves (dragon, Gosper and Koch types),
// drawn one segment at a time, then fading out and back in one level deeper,
// stopping while neighbouring lines are still 4% of the height apart.

import { between, choose } from "../rng.js";

const TRACE = 8;
const HOLD = 6;
const FADE = 1.5;

// L-systems: start, rules, turn angle, and how far apart the closest parallel
// lines sit, as a share of one segment.
const CURVES = {
  dragon: { start: "FX", rules: { X: "X+YF+", Y: "-FX-Y" }, angle: 90, gap: 1 },
  gosper: { start: "A", rules: { A: "A-B--B+A++AA+B-", B: "+A-BB--B-A++A+B" }, angle: 60, gap: Math.sqrt(3) / 2 },
  koch: { start: "F--F--F", rules: { F: "F+F--F+F" }, angle: 60, gap: Math.sqrt(3) / 2 },
};

export function curve(name, level) {
  const c = CURVES[name];
  let s = c.start;
  for (let i = 0; i < level; i++) s = s.replace(/[A-Z]/g, (ch) => c.rules[ch] ?? ch);
  let x = 0, y = 0, a = 0;
  const pts = [0, 0];
  for (const ch of s) {
    if (ch === "F" || ch === "A" || ch === "B") {
      x += Math.cos((a * Math.PI) / 180);
      y += Math.sin((a * Math.PI) / 180);
      pts.push(x, y);
    } else if (ch === "+") a += c.angle;
    else if (ch === "-") a -= c.angle;
  }
  return pts;
}

export default {
  id: "fractal-curves",
  name: "Fractal curves",
  pattern: "periodic",
  params: (rand) => ({
    kind: choose(rand, Object.keys(CURVES)),
    spin: between(rand, 0.006, 0.015) * (rand() < 0.5 ? -1 : 1), // under one turn every 7 minutes
    hue: Math.floor(rand() * 2),
  }),
  scene(p, { w, h, hues, mode }) {
    const full = mode === "full";
    const scale = Math.min(w, h);
    const box = scale * 0.82;
    const minGap = h * 0.042;
    const width = Math.min(Math.max(1, scale * 0.0018), h * 0.003);
    // Each level, centred and fitted to the box, with its segment length.
    const fitted = (level) => {
      const pts = curve(p.kind, level);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        x0 = Math.min(x0, pts[i]);
        x1 = Math.max(x1, pts[i]);
        y0 = Math.min(y0, pts[i + 1]);
        y1 = Math.max(y1, pts[i + 1]);
      }
      const k = box / Math.max(x1 - x0, y1 - y0);
      return { pts: pts.map((v, i) => (v - (i % 2 ? (y0 + y1) / 2 : (x0 + x1) / 2)) * k), seg: k };
    };
    const levels = [];
    for (let level = 1; level < 12; level++) {
      const f = fitted(level);
      if (f.seg * CURVES[p.kind].gap < minGap) break;
      levels.push(f);
    }
    const shown = levels.slice(-2);
    let t = 0;
    return {
      repeat: Math.min(...shown.map((f) => f.seg)) * CURVES[p.kind].gap,
      maxSpeed: Math.abs(p.spin) * box * 0.75,
      advance(dt) {
        t += dt;
      },
      lines() {
        // The first level traces in; each later one follows a hold, fading the
        // old level out and the new one in (never both at once).
        let index = 0;
        let alpha = 1;
        let part = Math.min(1, t / TRACE);
        let left = t - TRACE;
        while (left > 0 && index < shown.length - 1) {
          if (left < HOLD) break;
          left -= HOLD;
          if (left < FADE) {
            alpha = 1 - left / FADE;
            break;
          }
          left -= FADE;
          index++;
          part = 1;
          if (left < FADE) {
            alpha = left / FADE;
            break;
          }
          left -= FADE;
        }
        const { pts } = shown[index];
        const a = t * p.spin;
        const ca = Math.cos(a), sa = Math.sin(a);
        const n = Math.max(2, Math.floor((pts.length / 2) * part));
        const out = [];
        for (let i = 0; i < n; i++) out.push(w / 2 + pts[2 * i] * ca - pts[2 * i + 1] * sa, h / 2 + pts[2 * i] * sa + pts[2 * i + 1] * ca);
        return [{ paths: [out], h: hues[p.hue], l: full ? 0.6 : 0.76, c: 0.14, a: (full ? 0.7 : 0.85) * alpha, w: width }];
      },
    };
  },
};
