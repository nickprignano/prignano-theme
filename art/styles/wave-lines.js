// Stacked horizontal lines rippling like a sound wave, strongest in one band.
// Ported from prignano.ai's card art. Full screen it is a stripe pattern, so it
// uses fewer, fainter, slower lines there (see limits.js).

import { between, intBetween } from "../rng.js";

export default {
  id: "wave-lines",
  name: "Wave lines",
  pattern: "periodic",
  params(rand, mode) {
    const full = mode === "full";
    return {
      lines: full ? intBetween(rand, 12, 19) : intBetween(rand, 26, 43),
      amp: full ? between(rand, 2, 3) : between(rand, 2.5, 5.5),
      waves: Array.from({ length: 3 }, () => ({
        f: between(rand, 2, 9),
        speed: full ? between(rand, 0.06, 0.16) : between(rand, 0.3, 0.9),
        phase: rand() * 10,
        rowShift: between(rand, 0.15, 0.55),
      })),
      center: between(rand, 0.35, 0.65),
      width: between(rand, 0.18, 0.33),
      t0: rand() * 100,
      full,
    };
  },
  scene(p, { w, h, hues }) {
    const top = h * 0.12;
    const gap = (h * 0.76) / (p.lines - 1);
    const amp = gap * p.amp;
    const points = p.full ? 200 : 140;
    const width = Math.min(Math.max(1, Math.min(w, h) * 0.0028), p.full ? h * 0.003 : Infinity);
    let t = p.t0;
    return {
      repeat: gap,
      advance(dt) {
        t += dt;
      },
      lines(reveal = 1) {
        const out = [];
        for (let i = 0; i < p.lines; i++) {
          const y0 = top + i * gap;
          const k = i / (p.lines - 1);
          const pts = [];
          for (let j = 0; j <= points; j++) {
            const x = (j / points) * w;
            const env = Math.exp(-(((x / w - p.center) / p.width) ** 2));
            let d = 0;
            for (const wv of p.waves) d += Math.sin((x / w) * wv.f * Math.PI * 2 + t * wv.speed + i * wv.rowShift + wv.phase);
            pts.push(x, y0 - Math.abs(d / p.waves.length) * amp * env * reveal);
          }
          const lift = Math.sin(k * Math.PI);
          out.push({
            paths: [pts],
            h: hues[0] + (hues[1] - hues[0]) * k,
            l: p.full ? 0.6 + 0.06 * lift : 0.7 + 0.12 * lift,
            c: 0.15,
            a: p.full ? 0.7 : 0.85,
            w: width,
            fill: true,
          });
        }
        return out;
      },
    };
  },
};
