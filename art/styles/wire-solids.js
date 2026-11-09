// Polyhedra in wireframe: Platonic and Archimedean solids and compounds (five
// interlocked cubes or tetrahedra, the star of two tetrahedra, a cube with its
// dual), nested two or three deep and turning on different axes.

import { between, choose, intBetween } from "../rng.js";
import { project, turn, turnAbout } from "./space.js";

const PHI = (1 + Math.sqrt(5)) / 2;
const DRAW = 4;

const signs = ([x, y, z]) => {
  const out = [];
  for (const a of x ? [x, -x] : [0]) for (const b of y ? [y, -y] : [0]) for (const c of z ? [z, -z] : [0]) out.push([a, b, c]);
  return out;
};
const even = ([x, y, z]) => [[x, y, z], [y, z, x], [z, x, y]];
const all = ([x, y, z]) => [[x, y, z], [x, z, y], [y, x, z], [y, z, x], [z, x, y], [z, y, x]];
const unique = (pts) => [...new Map(pts.map((q) => [q.map((v) => v.toFixed(4)).join(), q])).values()];

// Edges join every pair of vertices at the shortest distance.
function solid(verts) {
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  let min = Infinity;
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) min = Math.min(min, d2(verts[i], verts[j]));
  const edges = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) if (d2(verts[i], verts[j]) < min * 1.001) edges.push([verts[i], verts[j]]);
  return edges;
}

const cube = signs([1, 1, 1]);
const tetra = cube.filter(([x, y, z]) => x * y * z > 0);
// A five-fold axis of the dodecahedron above: turning by 72 degrees about it
// maps the cube onto another cube inside the same dodecahedron.
const AXIS = (() => {
  const n = Math.hypot(PHI, 1);
  return [0, PHI / n, 1 / n];
})();
const fiveOf = (edges) => [0, 1, 2, 3, 4].flatMap((k) => edges.map(([a, b]) => [turnAbout(a, AXIS, (k * 2 * Math.PI) / 5), turnAbout(b, AXIS, (k * 2 * Math.PI) / 5)]));

// Each entry is a list of edges [[x,y,z],[x,y,z]].
export const SOLIDS = {
  tetrahedron: solid(tetra),
  cube: solid(cube),
  octahedron: solid(unique(all([1, 0, 0]).flatMap(signs))),
  icosahedron: solid(unique(even([0, 1, PHI]).flatMap(signs))),
  dodecahedron: solid(unique([...cube, ...even([0, 1 / PHI, PHI]).flatMap(signs)])),
  cuboctahedron: solid(unique(all([1, 1, 0]).flatMap(signs))),
  truncatedOctahedron: solid(unique(all([0, 1, 2]).flatMap(signs))),
  icosidodecahedron: solid(unique([...all([0, 0, PHI]).flatMap(signs), ...even([0.5, PHI / 2, (PHI * PHI) / 2]).flatMap(signs)])),
  twoTetrahedra: [...solid(tetra), ...solid(cube.filter(([x, y, z]) => x * y * z < 0))],
  cubeAndOctahedron: [...solid(cube), ...solid(unique(all([2, 0, 0]).flatMap(signs)))],
  fiveCubes: fiveOf(solid(cube)),
  fiveTetrahedra: fiveOf(solid(tetra)),
};

// Scale every solid to fit the unit sphere (as copies: edges share vertices).
for (const [name, edges] of Object.entries(SOLIDS)) {
  const r = Math.max(...edges.flat().map((q) => Math.hypot(...q)));
  SOLIDS[name] = edges.map((e) => e.map((q) => q.map((v) => v / r)));
}

export default {
  id: "wire-solids",
  name: "Wire solids",
  pattern: "free",
  params(rand) {
    const names = Object.keys(SOLIDS);
    const count = intBetween(rand, 2, 3);
    return {
      shells: Array.from({ length: count }, (_, i) => ({
        solid: choose(rand, names),
        size: [1, 0.58, 0.32][i],
        wx: between(rand, 0.05, 0.16) * (rand() < 0.5 ? -1 : 1),
        wy: between(rand, 0.04, 0.14) * (rand() < 0.5 ? -1 : 1),
        a0: rand() * 6,
        b0: rand() * 6,
      })),
    };
  },
  scene(p, { w, h, hues }) {
    const scale = Math.min(w, h);
    const width = Math.max(1, scale * 0.002);
    let t = 0;
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const part = Math.min(1, t / DRAW);
        const out = [];
        p.shells.forEach((sh, i) => {
          const near = [], far = [];
          for (const [a, b] of SOLIDS[sh.solid]) {
            const A = turn(a, sh.a0 + t * sh.wx, sh.b0 + t * sh.wy);
            const B0 = turn(b, sh.a0 + t * sh.wx, sh.b0 + t * sh.wy);
            const B = A.map((v, k) => v + (B0[k] - v) * part);
            const r = scale * 0.34 * sh.size;
            const pa = project(A.map((v) => v * sh.size), w / 2, h / 2, r / sh.size);
            const pb = project(B.map((v) => v * sh.size), w / 2, h / 2, r / sh.size);
            (A[2] + B[2] > 0 ? near : far).push([pa[0], pa[1], pb[0], pb[1]]);
          }
          out.push({ paths: far, h: hues[i], l: 0.6, c: 0.14, a: 0.45, w: width });
          out.push({ paths: near, h: hues[i], l: 0.8, c: 0.15, a: 0.9, w: width });
        });
        return out;
      },
    };
  },
};
