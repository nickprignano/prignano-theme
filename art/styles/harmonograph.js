// Interlocking looping curves, like a pendulum drawing machine, whose phases
// drift so the figure slowly turns and morphs. Ported from prignano.ai's card art.

import { between, choose } from "../rng.js";

const TURNS = 60;

export default {
  id: "harmonograph",
  name: "Harmonograph",
  pattern: "free",
  params(rand) {
    const pick = () => choose(rand, [1, 2, 3, 4, 5]) + (rand() - 0.5) * 0.02;
    return {
      curves: [0, 1].map((c) => ({
        fx: pick(),
        fy: pick(),
        fx2: pick(),
        fy2: pick(),
        px: rand() * Math.PI * 2,
        py: rand() * Math.PI * 2,
        drift: between(rand, 0.08, 0.2) * (c ? -1 : 1),
      })),
      decay: between(rand, 0.012, 0.022),
      t0: rand() * 100,
    };
  },
  scene(p, { w, h, hues, mode }) {
    const scale = Math.min(w, h);
    const r = scale * 0.42;
    const points = mode === "full" ? 3600 : 2400;
    const width = Math.max(1, scale * 0.0018);
    let t = p.t0;
    return {
      advance(dt) {
        t += dt;
      },
      lines(reveal = 1) {
        const n = Math.round(points * reveal);
        return p.curves.map((c, ci) => {
          const pts = [];
          for (let i = 0; i <= n; i++) {
            const s = (i / points) * TURNS;
            const e = Math.exp(-p.decay * s);
            const x = (Math.sin(c.fx * s + c.px + t * c.drift) + Math.sin(c.fx2 * s + c.py)) * 0.5 * e;
            const y = (Math.sin(c.fy * s + c.py + t * c.drift * 0.6) + Math.sin(c.fy2 * s + c.px)) * 0.5 * e;
            pts.push(w / 2 + x * r, h / 2 + y * r);
          }
          return { paths: [pts], h: hues[ci], l: 0.76, c: 0.16, a: 0.55, w: width, add: true };
        });
      },
    };
  },
};
