// Rolling-circle curves: a pen on a wheel rolling inside or outside a ring,
// with high-order ratios. One curve traces, holds, then fades as the next one
// traces over it.

import { between, gcd, intBetween } from "../rng.js";

const TRACE = 8;
const HOLD = 6;

export default {
  id: "gear-curves",
  name: "Gear curves",
  pattern: "free",
  params(rand) {
    const curves = Array.from({ length: 6 }, (_, i) => {
      let R, r;
      do {
        R = intBetween(rand, 5, 17);
        r = intBetween(rand, 2, Math.min(9, R - 1));
      } while (gcd(R, r) !== 1);
      return { R, r, d: between(rand, 0.4, 1.3) * r, outside: rand() < 0.35, hue: i % 3 };
    });
    return { curves, spin: between(rand, 0.01, 0.03) * (rand() < 0.5 ? -1 : 1) };
  },
  scene(p, { w, h, hues }) {
    const scale = Math.min(w, h);
    const width = Math.max(1, scale * 0.0016);
    const cache = new Map();
    // A curve's points, normalized to a unit radius; it closes after r turns.
    const shape = (c) => {
      if (cache.has(c)) return cache.get(c);
      const steps = 360 * c.r;
      const k = c.outside ? (c.R + c.r) / c.r : (c.R - c.r) / c.r;
      const big = c.outside ? c.R + c.r : c.R - c.r;
      const max = big + c.d;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2 * c.r;
        const x = big * Math.cos(th) + (c.outside ? -1 : 1) * c.d * Math.cos(k * th);
        const y = big * Math.sin(th) - c.d * Math.sin(k * th);
        pts.push(x / max, y / max);
      }
      cache.set(c, pts);
      return pts;
    };
    let t = 0;
    const place = (unit, part, angle) => {
      const out = [];
      const n = Math.floor((unit.length / 2) * part);
      const ca = Math.cos(angle), sa = Math.sin(angle), r = scale * 0.43;
      for (let i = 0; i < n; i++) {
        const x = unit[2 * i], y = unit[2 * i + 1];
        out.push(w / 2 + (x * ca - y * sa) * r, h / 2 + (x * sa + y * ca) * r);
      }
      return out;
    };
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const cycle = TRACE + HOLD;
        const index = Math.floor(t / cycle);
        const local = t - index * cycle;
        const angle = t * p.spin;
        const now = p.curves[index % p.curves.length];
        const out = [];
        if (index > 0) {
          const before = p.curves[(index - 1) % p.curves.length];
          const left = 1 - local / TRACE;
          if (left > 0) out.push({ paths: [place(shape(before), 1, angle)], h: hues[before.hue], l: 0.74, c: 0.15, a: 0.8 * left, w: width });
        }
        out.push({ paths: [place(shape(now), Math.min(1, local / TRACE), angle)], h: hues[now.hue], l: 0.78, c: 0.15, a: 0.85, w: width });
        return out;
      },
    };
  },
};
