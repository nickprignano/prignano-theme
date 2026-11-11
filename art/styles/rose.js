// Rose curves with fractional petal ratios (like 5/7) that weave into lace.
// The radius never reaches zero, so the petals ring the middle instead of all
// meeting in one bright hub.

import { between, gcd, intBetween } from "../rng.js";

const TRACE = 6;

export default {
  id: "rose",
  name: "Rose",
  pattern: "free",
  params(rand) {
    let n, d;
    do {
      n = intBetween(rand, 2, 11);
      d = intBetween(rand, 2, 7);
    } while (gcd(n, d) !== 1 || n * d > 35);
    return {
      n,
      d,
      offset: between(rand, 1.2, 2.2),
      inner: between(rand, 0.8, 0.9),
      twist: rand() * Math.PI,
      spin: between(rand, 0.02, 0.05) * (rand() < 0.5 ? -1 : 1),
    };
  },
  scene(p, { w, h, hues }) {
    const scale = Math.min(w, h);
    const width = Math.max(1, scale * 0.0016);
    const steps = 420 * p.d;
    const k = p.n / p.d;
    let t = 0;
    const curve = (size, rot, part) => {
      const pts = [];
      const n = Math.floor(steps * part);
      for (let i = 0; i <= n; i++) {
        const th = (i / steps) * Math.PI * 2 * p.d;
        const r = ((p.offset + Math.cos(k * th)) / (p.offset + 1)) * size;
        pts.push(w / 2 + r * Math.cos(th + rot), h / 2 + r * Math.sin(th + rot));
      }
      return pts;
    };
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const part = Math.min(1, t / TRACE);
        const rot = t * p.spin;
        return [
          { paths: [curve(scale * 0.44, rot, part)], h: hues[0], l: 0.78, c: 0.15, a: 0.85, w: width },
          { paths: [curve(scale * 0.44 * p.inner, rot + p.twist, part)], h: hues[1], l: 0.7, c: 0.15, a: 0.6, w: width },
        ];
      },
    };
  },
};
