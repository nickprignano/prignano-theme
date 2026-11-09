// Cell walls between slowly drifting points (each wall is equally far from two
// points), with the matching triangle mesh joining neighbours as a fainter layer.

import { between, intBetween, mulberry32 } from "../rng.js";

export default {
  id: "voronoi",
  name: "Voronoi",
  pattern: "free",
  params: (rand) => ({ sites: intBetween(rand, 60, 150), drift: between(rand, 0.012, 0.03), sim: Math.floor(rand() * 2 ** 32), mesh: rand() < 0.7 }),
  scene(p, { w, h, hues, mode }) {
    const scale = Math.min(w, h);
    // Mean cell at least 5% of the short side across.
    const n = Math.min(p.sites, Math.floor((w * h) / (scale * 0.05) ** 2), mode === "card" ? 60 : 150);
    const rand = mulberry32(p.sim);
    const speed = p.drift * scale;
    const pts = Array.from({ length: n }, () => {
      const a = rand() * Math.PI * 2;
      return { x: rand() * w, y: rand() * h, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
    });
    const width = Math.max(1, scale * 0.0016);
    let t = 0;

    // A point's cell: the screen, cut by the half-plane nearer to it than to
    // each other point. Also records which points share a wall with it.
    function cell(i) {
      let poly = [[0, 0], [w, 0], [w, h], [0, h]];
      const near = new Set();
      const a = pts[i];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const b = pts[j];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nx = b.x - a.x, ny = b.y - a.y;
        const side = (q) => (q[0] - mx) * nx + (q[1] - my) * ny; // > 0 means nearer b
        if (poly.every((q) => side(q) <= 0)) continue;
        const out = [];
        for (let k = 0; k < poly.length; k++) {
          const p0 = poly[k], p1 = poly[(k + 1) % poly.length];
          const s0 = side(p0), s1 = side(p1);
          if (s0 <= 0) out.push(p0);
          if ((s0 <= 0) !== (s1 <= 0)) {
            const f = s0 / (s0 - s1);
            out.push([p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f]);
          }
        }
        poly = out;
        near.add(j);
        if (poly.length < 3) break;
      }
      // Keep only neighbours whose wall survived.
      const shared = [...near].filter((j) => {
        const b = pts[j];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        return poly.some((q, k) => {
          const r = poly[(k + 1) % poly.length];
          const c = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2];
          return Math.abs((c[0] - mx) * (b.x - a.x) + (c[1] - my) * (b.y - a.y)) < 1e-6 * scale * scale;
        });
      });
      return { poly, shared };
    }

    return {
      advance(dt) {
        t += dt;
        for (const q of pts) {
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          if (q.x < 0 || q.x > w) q.vx *= -1;
          if (q.y < 0 || q.y > h) q.vy *= -1;
          q.x = Math.min(w, Math.max(0, q.x));
          q.y = Math.min(h, Math.max(0, q.y));
        }
      },
      lines() {
        const fade = Math.min(1, t / 3);
        const walls = [];
        const mesh = [];
        for (let i = 0; i < n; i++) {
          const { poly, shared } = cell(i);
          if (poly.length >= 3) walls.push([...poly.flat(), poly[0][0], poly[0][1]]);
          if (p.mesh) for (const j of shared) if (j > i) mesh.push([pts[i].x, pts[i].y, pts[j].x, pts[j].y]);
        }
        return [
          { paths: mesh, h: hues[1], l: 0.66, c: 0.13, a: 0.3 * fade, w: width },
          { paths: walls, h: hues[0], l: 0.78, c: 0.15, a: 0.8 * fade, w: width },
        ];
      },
    };
  },
};
