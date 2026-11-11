// A tiling of the hyperbolic plane in the Poincare disc: regular p-gons, q at
// every corner, gliding slowly through the plane. Tiles shrink toward the rim;
// edges too short for the stripe limits are dropped before they crowd.

import { between, choose } from "../rng.js";

const TYPES = [[7, 3], [5, 4], [4, 5], [3, 7], [6, 4], [8, 3]];

// Complex numbers as [re, im].
const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const div = (a, b) => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
// Moves the disc so that 0 goes to a (a hyperbolic translation).
const glide = (z, a) => div([z[0] + a[0], z[1] + a[1]], [1 + a[0] * z[0] + a[1] * z[1], a[0] * z[1] - a[1] * z[0]]);

// Reflects z across the geodesic through a and b.
function reflect(z, a, b) {
  const cross = a[0] * b[1] - a[1] * b[0];
  if (Math.abs(cross) < 1e-12) {
    // A diameter: an ordinary mirror line through the middle.
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || Math.hypot(a[0], a[1]);
    const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
    const d = z[0] * ux + z[1] * uy;
    return [2 * d * ux - z[0], 2 * d * uy - z[1]];
  }
  const c = circle(a, b);
  const dx = z[0] - c[0], dy = z[1] - c[1];
  const k = (c[2] * c[2]) / (dx * dx + dy * dy);
  return [c[0] + dx * k, c[1] + dy * k];
}

// The circle (centre and radius) that meets the rim at right angles and passes
// through a and b.
function circle(a, b) {
  const a2 = (a[0] ** 2 + a[1] ** 2 + 1) / 2;
  const b2 = (b[0] ** 2 + b[1] ** 2 + 1) / 2;
  const det = a[0] * b[1] - a[1] * b[0];
  const cx = (a2 * b[1] - b2 * a[1]) / det;
  const cy = (a[0] * b2 - b[0] * a2) / det;
  return [cx, cy, Math.sqrt(cx * cx + cy * cy - 1)];
}

// Points along the geodesic from a to b.
function arc(a, b, n = 10) {
  const cross = a[0] * b[1] - a[1] * b[0];
  const pts = [];
  if (Math.abs(cross) < 1e-9 * Math.hypot(a[0] - b[0], a[1] - b[1]) + 1e-12) {
    for (let i = 0; i <= n; i++) pts.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
    return pts;
  }
  const [cx, cy, r] = circle(a, b);
  const t0 = Math.atan2(a[1] - cy, a[0] - cx);
  let t1 = Math.atan2(b[1] - cy, b[0] - cx);
  while (t1 - t0 > Math.PI) t1 -= 2 * Math.PI;
  while (t0 - t1 > Math.PI) t1 += 2 * Math.PI;
  for (let i = 0; i <= n; i++) {
    const th = t0 + ((t1 - t0) * i) / n;
    pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
  }
  return pts;
}

// Every edge of a {p,q} tiling whose corners lie within radius `limit`.
export function tiling(p, q, limit = 0.995, cap = 6000) {
  const d = Math.sqrt(Math.cos(Math.PI / p + Math.PI / q) / Math.cos(Math.PI / p - Math.PI / q));
  const first = Array.from({ length: p }, (_, i) => [d * Math.cos((2 * Math.PI * i) / p), d * Math.sin((2 * Math.PI * i) / p)]);
  const key = (z) => `${z[0].toFixed(5)},${z[1].toFixed(5)}`;
  const centre = (poly) => [poly.reduce((s, z) => s + z[0], 0) / p, poly.reduce((s, z) => s + z[1], 0) / p];
  const seen = new Set([key(centre(first))]);
  const edges = new Map();
  const queue = [first];
  while (queue.length && edges.size < cap) {
    const poly = queue.shift();
    for (let i = 0; i < p; i++) {
      const a = poly[i], b = poly[(i + 1) % p];
      const ek = [key(a), key(b)].sort().join("|");
      if (!edges.has(ek)) edges.set(ek, [a, b]);
      const next = poly.map((z) => reflect(z, a, b));
      if (next.some((z) => Math.hypot(z[0], z[1]) > limit)) continue;
      const ck = key(centre(next));
      if (seen.has(ck)) continue;
      seen.add(ck);
      queue.push(next);
    }
  }
  return [...edges.values()];
}

const cache = new Map();

export default {
  id: "hyperbolic",
  name: "Hyperbolic",
  pattern: "free",
  stripes: true,
  params: (rand) => ({
    type: choose(rand, TYPES),
    heading: rand() * Math.PI * 2,
    speed: between(rand, 0.012, 0.02), // glide, in disc units a second near the middle
  }),
  scene(p, { w, h, hues, mode }) {
    const full = mode === "full";
    const scale = Math.min(w, h);
    const R = scale * 0.47;
    const minEdge = h * 0.045;
    const width = Math.min(Math.max(1, scale * 0.0018), h * 0.003);
    const name = p.type.join(",");
    if (!cache.has(name)) cache.set(name, tiling(...p.type));
    const edges = cache.get(name);
    let t = 0;
    return {
      repeat: minEdge * 0.9,
      // A glide moves the middle fastest: speed x R a second.
      maxSpeed: p.speed * R,
      advance(dt) {
        t += dt;
      },
      lines() {
        // Glide along one heading, a little further each second. tanh keeps the
        // offset inside the disc however long it runs.
        const dist = Math.tanh(t * p.speed);
        const a = [Math.cos(p.heading) * dist, Math.sin(p.heading) * dist];
        const fade = Math.min(1, t / 3);
        const strong = [];
        const weak = [];
        for (const [e0, e1] of edges) {
          const g0 = glide(e0, a), g1 = glide(e1, a);
          const len = Math.hypot(g0[0] - g1[0], g0[1] - g1[1]) * R;
          if (len < minEdge) continue;
          const pts = arc(g0, g1).flatMap(([x, y]) => [w / 2 + x * R, h / 2 + y * R]);
          (len < minEdge * 1.5 ? weak : strong).push(pts);
        }
        const rim = [];
        for (let i = 0; i <= 120; i++) rim.push(w / 2 + R * Math.cos((i / 120) * Math.PI * 2), h / 2 + R * Math.sin((i / 120) * Math.PI * 2));
        const l = full ? 0.6 : 0.74;
        const al = (full ? 0.7 : 0.85) * fade;
        return [
          { paths: [rim], h: hues[1], l, c: 0.12, a: al * 0.5, w: width },
          { paths: weak, h: hues[0], l, c: 0.14, a: al * 0.4, w: width },
          { paths: strong, h: hues[0], l, c: 0.14, a: al, w: width },
        ];
      },
    };
  },
};
