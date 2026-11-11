// Overlapping equal circles on a hexagonal grid, at most three rings of them
// around the middle, with the six-pointed stars and hexagons they imply drawn
// over them. A tiling, so it keeps to the stripe limits and turns very slowly.

import { between, intBetween } from "../rng.js";

const TRACE = 5;

export default {
  id: "circle-lattice",
  name: "Circle lattice",
  pattern: "periodic",
  params: (rand) => ({
    rings: intBetween(rand, 2, 3),
    spin: between(rand, 0.008, 0.02) * (rand() < 0.5 ? -1 : 1), // at most one turn every 5 minutes
    star: rand() < 0.7,
  }),
  scene(p, { w, h, hues, mode }) {
    const full = mode === "full";
    const scale = Math.min(w, h);
    // Circles reach rings + 1 radii from the middle.
    const r = (scale * 0.47) / (p.rings + 1);
    const width = Math.min(Math.max(1, scale * 0.0018), h * 0.003);
    const centers = [];
    for (let q = -p.rings; q <= p.rings; q++)
      for (let s = -p.rings; s <= p.rings; s++) {
        if (Math.abs(q + s) > p.rings) continue;
        centers.push([r * (q + s / 2), r * s * (Math.sqrt(3) / 2)]);
      }
    let t = 0;
    const place = (x, y, a) => [w / 2 + x * Math.cos(a) - y * Math.sin(a), h / 2 + x * Math.sin(a) + y * Math.cos(a)];
    const polygon = (n, radius, offset, a) => {
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(...place(radius * Math.cos(offset + (i / n) * Math.PI * 2), radius * Math.sin(offset + (i / n) * Math.PI * 2), a));
      return pts;
    };
    return {
      repeat: r,
      maxSpeed: Math.abs(p.spin) * scale * 0.5,
      advance(dt) {
        t += dt;
      },
      lines() {
        const a = t * p.spin;
        const part = Math.min(1, t / TRACE);
        const circles = centers.map(([cx, cy]) => {
          const pts = [];
          const n = Math.max(2, Math.round(72 * part));
          for (let i = 0; i <= n; i++) {
            const th = (i / 72) * Math.PI * 2;
            pts.push(...place(cx + r * Math.cos(th), cy + r * Math.sin(th), a));
          }
          return pts;
        });
        const outer = r * (p.rings + 1);
        const overlay = [polygon(6, outer, Math.PI / 6, a)];
        if (p.star) overlay.push(polygon(3, outer, Math.PI / 2, a), polygon(3, outer, -Math.PI / 2, a));
        return [
          { paths: circles, h: hues[0], l: full ? 0.6 : 0.74, c: 0.14, a: full ? 0.7 : 0.8, w: width },
          { paths: part < 1 ? [] : overlay, h: hues[1], l: full ? 0.58 : 0.7, c: 0.14, a: (full ? 0.6 : 0.7) * Math.min(1, Math.max(0, t - TRACE)), w: width },
        ];
      },
    };
  },
};
