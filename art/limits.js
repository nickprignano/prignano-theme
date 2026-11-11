// The full-screen pattern limits from the Vibes spec, as numbers and pure
// checks the tests run against every style. Card versions are small, so the
// limits apply in "full" mode only.

import { luminance, oklchToLinear } from "./color.js";

export const LIMITS = {
  repeat: 0.04, // periodic repeat, at least this share of the screen height
  width: 0.003, // periodic line width, at most this share of the height
  contrast: 4, // periodic line against the background, at most this ratio at any hue
  motion: 0.5, // periodic patterns move less than this many repeats a second
  density: { cell: 0.025, passes: 16, share: 0.06 }, // free styles: see density()
};

// Screen sizes the tests check: phone, laptop and 4K.
export const SIZES = [
  [390, 844],
  [1280, 720],
  [3840, 2160],
];

const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

// Contrast of a line drawn at alpha a over a background color, blended the way
// canvas blends (in encoded sRGB).
export function lineContrast({ l, c = 0.15, a }, hue, [bl, bc, bh]) {
  const line = oklchToLinear(l, c, hue).map(encode);
  const bg = oklchToLinear(bl, bc, bh).map(encode);
  const mixed = line.map((v, i) => decode(v * a + bg[i] * (1 - a)));
  const yBg = luminance(bg.map(decode));
  return (luminance(mixed) + 0.05) / (yBg + 0.05);
}

// The share of grid cells (cell = share of the short side) that more than
// `passes` separate line passes cross. High means lace dense enough to shimmer.
export function density(lines, w, h, { cell, passes } = LIMITS.density) {
  const size = Math.min(w, h) * cell;
  const cols = Math.ceil(w / size);
  const rows = Math.ceil(h / size);
  const count = new Uint16Array(cols * rows);
  for (const line of lines) {
    for (const pts of line.paths) {
      let last = -1;
      for (let i = 0; i + 3 < pts.length; i += 2) {
        const x0 = pts[i], y0 = pts[i + 1], x1 = pts[i + 2], y1 = pts[i + 3];
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (size / 2)));
        for (let s = 0; s <= steps; s++) {
          const x = x0 + ((x1 - x0) * s) / steps;
          const y = y0 + ((y1 - y0) * s) / steps;
          if (x < 0 || y < 0 || x >= w || y >= h) {
            last = -1;
            continue;
          }
          const k = Math.floor(y / size) * cols + Math.floor(x / size);
          if (k !== last) count[k]++;
          last = k;
        }
      }
    }
  }
  let hot = 0;
  for (const n of count) if (n > passes) hot++;
  return hot / count.length;
}

// The largest distance any point moved between two frames of the same style.
export function maxShift(before, after) {
  let max = 0;
  before.forEach((line, i) =>
    line.paths.forEach((pts, j) => {
      const next = after[i]?.paths[j];
      if (!next || next.length !== pts.length) return;
      for (let k = 0; k < pts.length; k += 2) max = Math.max(max, Math.hypot(next[k] - pts[k], next[k + 1] - pts[k + 1]));
    }),
  );
  return max;
}

// The smallest gap between two straight segments that run side by side
// (nearly parallel and overlapping along their length), for checking a style's
// stated repeat against what it really draws. Segments that touch are skipped.
export function closestParallel(lines, { minLength = 4, tolerance = 0.05 } = {}) {
  const segs = [];
  for (const line of lines)
    for (const pts of line.paths)
      for (let i = 0; i + 3 < pts.length; i += 2) {
        const [x0, y0, x1, y1] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
        const len = Math.hypot(x1 - x0, y1 - y0);
        if (len >= minLength) segs.push({ x0, y0, len, ux: (x1 - x0) / len, uy: (y1 - y0) / len });
      }
  let min = Infinity;
  for (let i = 0; i < segs.length; i++)
    for (let j = i + 1; j < segs.length; j++) {
      const a = segs[i], b = segs[j];
      if (Math.abs(a.ux * b.uy - a.uy * b.ux) > tolerance) continue;
      const dx = b.x0 - a.x0, dy = b.y0 - a.y0;
      const gap = Math.abs(dx * -a.uy + dy * a.ux);
      if (gap < 0.5 || gap >= min) continue;
      // Overlap along a's direction.
      const s0 = dx * a.ux + dy * a.uy;
      const s1 = s0 + b.len * (b.ux * a.ux + b.uy * a.uy);
      if (Math.max(s0, s1) <= 0.5 || Math.min(s0, s1) >= a.len - 0.5) continue;
      min = gap;
    }
  return min;
}
