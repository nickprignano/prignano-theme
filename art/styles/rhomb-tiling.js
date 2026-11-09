// An aperiodic tiling of thin and thick rhombs that never repeats, zooming in
// forever. It is built by splitting golden triangles again and again; as the
// zoom makes tiles bigger, the next split's edges fade in, so nothing pops.
// Edges come in five directions, so it follows the stripe limits too.

import { between } from "../rng.js";

const PHI = (1 + Math.sqrt(5)) / 2;

export default {
  id: "rhomb-tiling",
  name: "Rhomb tiling",
  pattern: "free",
  stripes: true,
  params: (rand) => ({
    double: between(rand, 45, 70), // seconds for the zoom to double
    turn: rand() * Math.PI * 2,
    focus: [between(rand, -0.2, 0.2), between(rand, -0.2, 0.2)],
  }),
  scene(p, { w, h, hues, mode }) {
    const full = mode === "full";
    const scale = Math.min(w, h);
    // Thin rhombs' parallel sides are edge x sin 36 degrees apart, so edges stay
    // long enough to keep that gap over 4% of the height.
    const minEdge = (h * 0.042) / Math.sin(Math.PI / 5);
    const reach = Math.hypot(w, h) / 2;
    const width = Math.min(Math.max(1, scale * 0.0018), h * 0.003);
    let t = 0;
    let fade = 0;

    // Starting wheel of ten triangles around the focus point.
    const start = [];
    for (let i = 0; i < 10; i++) {
      let b = [Math.cos(((2 * i - 1) * Math.PI) / 10), Math.sin(((2 * i - 1) * Math.PI) / 10)];
      let c = [Math.cos(((2 * i + 1) * Math.PI) / 10), Math.sin(((2 * i + 1) * Math.PI) / 10)];
      if (i % 2 === 0) [b, c] = [c, b];
      start.push([0, [0, 0], b, c]);
    }
    const split = ([kind, a, b, c]) => {
      if (kind === 0) {
        const q = [a[0] + (b[0] - a[0]) / PHI, a[1] + (b[1] - a[1]) / PHI];
        return [[0, c, q, b], [1, q, c, a]];
      }
      const q = [b[0] + (a[0] - b[0]) / PHI, b[1] + (a[1] - b[1]) / PHI];
      const r = [b[0] + (c[0] - b[0]) / PHI, b[1] + (c[1] - b[1]) / PHI];
      return [[1, r, c, a], [1, q, r, b], [0, r, q, a]];
    };

    return {
      // Every drawn edge, faint ones included, is at least minEdge long.
      repeat: minEdge * Math.sin(Math.PI / 5),
      // Zooming moves the screen corners fastest.
      maxSpeed: (reach * Math.LN2) / p.double,
      advance(dt) {
        t += dt;
        fade = Math.min(1, t / 3);
      },
      lines() {
        const zoom = 2 ** (t / p.double);
        const size = reach * 1.6 * zoom; // the wheel's radius on screen
        const ca = Math.cos(p.turn), sa = Math.sin(p.turn);
        const fx = p.focus[0] * reach * zoom, fy = p.focus[1] * reach * zoom;
        const toScreen = ([x, y]) => [w / 2 - fx + (x * ca - y * sa) * size, h / 2 - fy + (x * sa + y * ca) * size];
        const solid = [];
        const faint = [];
        let tris = start;
        let edge = size; // side length of the current level's triangles, in pixels
        // Split while the level after next would still be long enough (that one
        // fades in), dropping triangles that are off screen.
        while (edge / PHI / PHI >= minEdge) {
          tris = tris.flatMap(split).filter(([, a, b, c]) => {
            const pts = [a, b, c].map(toScreen);
            return !(Math.max(...pts.map((q) => q[0])) < 0 || Math.min(...pts.map((q) => q[0])) > w || Math.max(...pts.map((q) => q[1])) < 0 || Math.min(...pts.map((q) => q[1])) > h);
          });
          edge /= PHI;
        }
        // The next split's edges fade in as the zoom brings them up to length.
        const next = Math.min(1, Math.max(0, (edge / PHI - minEdge) / (minEdge * PHI - minEdge)));
        for (const tri of tris) {
          const [, a, b, c] = tri.map((v, i) => (i ? toScreen(v) : v));
          solid.push([c[0], c[1], a[0], a[1], b[0], b[1]]);
          if (next > 0)
            for (const [, a2, b2, c2] of split(tri)) {
              const [A, B, C] = [a2, b2, c2].map(toScreen);
              faint.push([C[0], C[1], A[0], A[1], B[0], B[1]]);
            }
        }
        const l = full ? 0.6 : 0.74;
        const a = (full ? 0.7 : 0.85) * fade;
        return [
          { paths: faint, h: hues[1], l, c: 0.14, a: a * next, w: width },
          { paths: solid, h: hues[0], l, c: 0.14, a, w: width },
        ];
      },
    };
  },
};
