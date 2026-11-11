// Islamic-style star patterns, built the classic way: from the middle of every
// edge of a tiling, two rays lean inward at a contact angle and stop where they
// meet the rays from the next edge. Octagons and squares give 8-fold stars;
// dodecagons and triangles give 12-fold ones. The pattern pans slowly one way.

import { between, choose } from "../rng.js";

const DRAW = 5;

// Polygons of a tiling (each a list of [x, y] corners) covering a box, for an
// edge length of 1. 4.8.8: octagons on a square grid with squares between.
// 3.12.12: dodecagons on a triangular grid with triangles between.
function tiling(kind, box) {
  const polys = [];
  const reg = (n, cx, cy, rot) => {
    const R = 1 / (2 * Math.sin(Math.PI / n));
    return Array.from({ length: n }, (_, i) => [cx + R * Math.cos(rot + (i * 2 * Math.PI) / n), cy + R * Math.sin(rot + (i * 2 * Math.PI) / n)]);
  };
  if (kind === 8) {
    const step = 1 + Math.SQRT2;
    const span = Math.ceil(box / step) + 1;
    for (let i = -span; i <= span; i++)
      for (let j = -span; j <= span; j++) {
        polys.push(reg(8, i * step, j * step, Math.PI / 8));
        polys.push(reg(4, (i + 0.5) * step, (j + 0.5) * step, Math.PI / 4));
      }
  } else {
    const step = 2 + Math.sqrt(3); // dodecagon centre to centre
    const span = Math.ceil(box / step) + 1;
    for (let i = -span; i <= span; i++)
      for (let j = -span; j <= span; j++) {
        const cx = (i + j / 2) * step;
        const cy = j * step * (Math.sqrt(3) / 2);
        polys.push(reg(12, cx, cy, Math.PI / 12));
        // The two triangles between this dodecagon and its neighbours.
        const t = step / Math.sqrt(3);
        polys.push(reg(3, cx, cy + t, Math.PI / 2));
        polys.push(reg(3, cx, cy - t, -Math.PI / 2));
      }
  }
  return polys;
}

// The star lines inside one polygon for a contact angle (radians from the edge).
function strands(poly, angle) {
  const n = poly.length;
  const mids = poly.map((a, i) => {
    const b = poly[(i + 1) % n];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(b[1] - a[1], b[0] - a[0])];
  });
  const sign = Math.sign((poly[1][0] - poly[0][0]) * (poly[2][1] - poly[1][1]) - (poly[1][1] - poly[0][1]) * (poly[2][0] - poly[1][0]));
  const out = [];
  for (let i = 0; i < n; i++) {
    const [x1, y1, e1] = mids[i];
    const [x2, y2, e2] = mids[(i + 1) % n];
    // Ray from edge i leaning toward edge i+1, and from edge i+1 leaning back.
    const d1 = e1 + sign * angle;
    const d2 = e2 + sign * (Math.PI - angle);
    const c1 = Math.cos(d1), s1 = Math.sin(d1), c2 = Math.cos(d2), s2 = Math.sin(d2);
    const den = c1 * s2 - s1 * c2;
    if (Math.abs(den) < 1e-9) continue;
    const u = ((x2 - x1) * s2 - (y2 - y1) * c2) / den;
    out.push([x1, y1, x1 + c1 * u, y1 + s1 * u, x2, y2]);
  }
  return out;
}

export default {
  id: "star-tiling",
  name: "Star tiling",
  pattern: "periodic",
  params(rand) {
    const fold = choose(rand, [8, 12]);
    return {
      fold,
      // Contact angles (radians) that keep parallel strands well apart; some
      // angles in between bring them almost together.
      angle: choose(rand, fold === 8 ? [0.9, 0.98, 1.06] : [0.88, 0.96, 1.15, 1.25]),
      tiles: between(rand, 2.6, 3.6), // pattern repeats across the short side
      heading: rand() * Math.PI * 2,
      pan: between(rand, 0.015, 0.03), // repeats a second, one way only
    };
  },
  scene(p, { w, h, hues, mode }) {
    const full = mode === "full";
    const scale = Math.min(w, h);
    const period = p.fold === 8 ? 1 + Math.SQRT2 : 2 + Math.sqrt(3);
    // Pixels per tiling edge: the seed's size, but never so small that the
    // closest parallel strands (at least 0.38 of a period apart for these
    // angles, checked by the tests) come within 4% of the height.
    const unit = Math.max(scale / (p.tiles * period), (h * 0.042) / (0.38 * period));
    const box = Math.hypot(w, h) / unit / 2 + period * 2;
    const lines = tiling(p.fold, box).flatMap((poly) => strands(poly, p.angle));
    const width = Math.min(Math.max(1, scale * 0.0018), h * 0.003);
    let t = 0;
    return {
      repeat: unit * period * 0.38,
      maxSpeed: p.pan * unit * period,
      advance(dt) {
        t += dt;
      },
      lines() {
        // Pan, wrapped to one period so the numbers stay small (the tiling
        // repeats, so the wrap is invisible).
        const shift = (t * p.pan) % 1;
        const ox = w / 2 + Math.cos(p.heading) * shift * period * unit;
        const oy = h / 2 + Math.sin(p.heading) * shift * period * unit;
        const part = Math.min(1, t / DRAW);
        const paths = [];
        for (const [x1, y1, mx, my, x2, y2] of lines) {
          const a = [ox + x1 * unit, oy + y1 * unit];
          const m = [ox + mx * unit, oy + my * unit];
          const b = [ox + x2 * unit, oy + y2 * unit];
          if (Math.max(a[0], m[0], b[0]) < 0 || Math.min(a[0], m[0], b[0]) > w || Math.max(a[1], m[1], b[1]) < 0 || Math.min(a[1], m[1], b[1]) > h) continue;
          // Each strand grows from both edge midpoints toward the point where they meet.
          paths.push([a[0], a[1], a[0] + (m[0] - a[0]) * part, a[1] + (m[1] - a[1]) * part]);
          paths.push([b[0], b[1], b[0] + (m[0] - b[0]) * part, b[1] + (m[1] - b[1]) * part]);
        }
        return [{ paths, h: hues[0], l: full ? 0.6 : 0.75, c: 0.14, a: full ? 0.7 : 0.85, w: width }];
      },
    };
  },
};
