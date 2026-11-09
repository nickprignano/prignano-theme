// Shared 3D helpers for the styles that turn shapes in space.

// Rotates [x, y, z] about the x axis by a, then the y axis by b.
export function turn([x, y, z], a, b) {
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const y1 = y * ca - z * sa;
  const z1 = y * sa + z * ca;
  return [x * cb + z1 * sb, y1, -x * sb + z1 * cb];
}

// Rotates a point about a unit axis by angle a (Rodrigues).
export function turnAbout([x, y, z], [ux, uy, uz], a) {
  const c = Math.cos(a), s = Math.sin(a), d = (ux * x + uy * y + uz * z) * (1 - c);
  return [
    x * c + (uy * z - uz * y) * s + ux * d,
    y * c + (uz * x - ux * z) * s + uy * d,
    z * c + (ux * y - uy * x) * s + uz * d,
  ];
}

const CAMERA = 3.2;

// Perspective projection of a point within the unit sphere to the screen.
export const project = ([x, y, z], cx, cy, r) => {
  const s = CAMERA / (CAMERA - z);
  return [cx + x * s * r, cy + y * s * r];
};

// Splits a run of 3D points into depth bands: nearer bands are drawn brighter.
// Returns one list of 2D paths per band, far to near.
export function depthBands(points3, count, cx, cy, r, bands = 4) {
  const out = Array.from({ length: bands }, () => []);
  let current = -1;
  let path = null;
  for (let i = 0; i < count; i++) {
    const p = points3[i];
    const q = points3[Math.min(i + 1, count - 1)];
    const band = Math.min(bands - 1, Math.max(0, Math.floor((((p[2] + q[2]) / 2 + 1) / 2) * bands)));
    const [sx, sy] = project(p, cx, cy, r);
    if (band !== current) {
      if (path) path.push(sx, sy);
      path = [sx, sy];
      out[band].push(path);
      current = band;
    } else path.push(sx, sy);
  }
  return out;
}
