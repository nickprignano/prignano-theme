// Star polygons ({7/2}, {9/4}, {12/5} and so on) in at most three rings, well
// apart, each drawn as a double band and turning slowly the same way.

import { between, intBetween } from "../rng.js";
import { gcd } from "../rng.js";

const DRAW = 4;
const RADII = [0.44, 0.27, 0.1];

export default {
  id: "star-polygons",
  name: "Star polygons",
  pattern: "free",
  params(rand) {
    const way = rand() < 0.5 ? -1 : 1;
    return {
      rings: Array.from({ length: intBetween(rand, 2, 3) }, () => {
        const n = intBetween(rand, 5, 16);
        return { n, k: intBetween(rand, 2, Math.floor((n - 1) / 2)), spin: between(rand, 0.01, 0.04) * way, a0: rand() * Math.PI };
      }),
    };
  },
  scene(p, { w, h, hues }) {
    const scale = Math.min(w, h);
    const width = Math.max(1, scale * 0.0018);
    let t = 0;
    // The closed paths of {n/k}: gcd(n, k) separate polygons when they share a factor.
    const star = ({ n, k }, radius, rot, part) => {
      const g = gcd(n, k);
      const paths = [];
      for (let start = 0; start < g; start++) {
        const pts = [];
        const steps = n / g;
        const shown = steps * part;
        for (let j = 0; j <= Math.ceil(shown); j++) {
          const s = Math.min(j, shown);
          const a0 = ((start + Math.floor(s) * k) / n) * Math.PI * 2 + rot;
          const a1 = ((start + (Math.floor(s) + 1) * k) / n) * Math.PI * 2 + rot;
          const f = s - Math.floor(s);
          const x = Math.cos(a0) * (1 - f) + Math.cos(a1) * f;
          const y = Math.sin(a0) * (1 - f) + Math.sin(a1) * f;
          pts.push(w / 2 + x * radius, h / 2 + y * radius);
        }
        paths.push(pts);
      }
      return paths;
    };
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const part = Math.min(1, t / DRAW);
        const out = [];
        p.rings.forEach((ring, i) => {
          const radius = scale * RADII[i];
          const rot = ring.a0 + t * ring.spin;
          out.push({ paths: [...star(ring, radius, rot, part), ...star(ring, radius * 0.94, rot, part)], h: hues[i], l: 0.78, c: 0.15, a: 0.85, w: width });
          out.push({ paths: star({ n: ring.n, k: 1 }, radius, rot, part), h: hues[i], l: 0.68, c: 0.12, a: 0.3, w: width });
        });
        return out;
      },
    };
  },
};
