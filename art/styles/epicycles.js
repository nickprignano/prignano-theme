// A chain of spinning circles, each riding on the rim of the one before (a
// Fourier series), whose last point draws a closed shape: the site's own wave
// icon, a star, a trefoil or a figure eight.

import { between, choose } from "../rng.js";

const SAMPLES = 256;
const TERMS = 40;

// Each shape as points around one loop, in a box from -1 to 1.
const SHAPES = {
  // The site icon's wave stroke, out and back, so it closes.
  wave(n) {
    const bez = [[[-1, 0.25], [-0.5, 0.25], [-0.5, -0.25], [0, -0.25]], [[0, -0.25], [0.5, -0.25], [0.5, 0.375], [0.5, 0.375]], [[0.5, 0.375], [0.75, 0.375], [0.75, -0.375], [1, -0.375]]];
    const out = [];
    for (let i = 0; i < n; i++) {
      let u = (i / n) * 2;
      if (u > 1) u = 2 - u; // and back
      const seg = Math.min(2, Math.floor(u * 3));
      const s = u * 3 - seg;
      const [p0, p1, p2, p3] = bez[seg];
      const k = [(1 - s) ** 3, 3 * (1 - s) ** 2 * s, 3 * (1 - s) * s * s, s ** 3];
      out.push([k[0] * p0[0] + k[1] * p1[0] + k[2] * p2[0] + k[3] * p3[0], k[0] * p0[1] + k[1] * p1[1] + k[2] * p2[1] + k[3] * p3[1]]);
    }
    return out;
  },
  star(n) {
    return Array.from({ length: n }, (_, i) => {
      const s = (i / n) * 5;
      const a0 = (Math.floor(s) * 4 * Math.PI) / 5 - Math.PI / 2;
      const a1 = ((Math.floor(s) + 1) * 4 * Math.PI) / 5 - Math.PI / 2;
      const f = s - Math.floor(s);
      return [Math.cos(a0) * (1 - f) + Math.cos(a1) * f, Math.sin(a0) * (1 - f) + Math.sin(a1) * f];
    });
  },
  trefoil(n) {
    return Array.from({ length: n }, (_, i) => {
      const s = (i / n) * Math.PI * 2;
      return [(Math.sin(s) + 2 * Math.sin(2 * s)) / 3, (Math.cos(s) - 2 * Math.cos(2 * s)) / 3];
    });
  },
  eight(n) {
    return Array.from({ length: n }, (_, i) => {
      const s = (i / n) * Math.PI * 2;
      return [Math.sin(s), Math.sin(2 * s) / 2];
    });
  },
};

// The strongest Fourier terms of a closed loop: frequency, size and phase.
export function series(points, terms = TERMS) {
  const n = points.length;
  const out = [];
  for (let k = -n / 2; k < n / 2; k++) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j++) {
      const a = (-2 * Math.PI * k * j) / n;
      re += points[j][0] * Math.cos(a) - points[j][1] * Math.sin(a);
      im += points[j][0] * Math.sin(a) + points[j][1] * Math.cos(a);
    }
    out.push({ k, r: Math.hypot(re, im) / n, phase: Math.atan2(im, re) });
  }
  return out.sort((a, b) => b.r - a.r).slice(0, terms);
}

export default {
  id: "epicycles",
  name: "Epicycles",
  pattern: "free",
  params: (rand) => ({ shape: choose(rand, Object.keys(SHAPES)), period: between(rand, 8, 12), tilt: rand() * Math.PI * 2 }),
  scene(p, { w, h, hues }) {
    const scale = Math.min(w, h);
    const R = scale * 0.42;
    const terms = series(SHAPES[p.shape](SAMPLES));
    const width = Math.max(1, scale * 0.0018);
    let t = 0;
    // The chain's points at time s (in loops); the last one is the pen.
    const chain = (s) => {
      let x = 0, y = 0;
      const out = [[x, y]];
      for (const { k, r, phase } of terms) {
        const a = 2 * Math.PI * k * s + phase + p.tilt;
        x += r * Math.cos(a);
        y += r * Math.sin(a);
        out.push([x, y]);
      }
      return out;
    };
    const at = ([x, y]) => [w / 2 + x * R, h / 2 + y * R];
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const loops = t / p.period;
        // The pen's trail: the whole loop once it has gone round once.
        const trail = [];
        const from = Math.max(0, loops - 1);
        for (let i = 0; i <= 400; i++) trail.push(...at(chain(from + ((loops - from) * i) / 400).at(-1)));
        const links = chain(loops);
        const arms = links.flatMap((q) => at(q));
        const rings = links.slice(0, -1).map((c, i) => {
          const rr = terms[i].r * R;
          if (rr < 2) return [];
          const [cx, cy] = at(c);
          const pts = [];
          for (let j = 0; j <= 48; j++) pts.push(cx + rr * Math.cos((j / 48) * Math.PI * 2), cy + rr * Math.sin((j / 48) * Math.PI * 2));
          return pts;
        });
        return [
          { paths: rings, h: hues[1], l: 0.62, c: 0.12, a: 0.22, w: width },
          { paths: [arms], h: hues[1], l: 0.72, c: 0.13, a: 0.5, w: width },
          { paths: [trail], h: hues[0], l: 0.8, c: 0.16, a: 0.9, w: width * 1.3 },
        ];
      },
    };
  },
};
