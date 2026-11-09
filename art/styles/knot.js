// Torus knots and 3D Lissajous knots turning in space, nearer strands brighter.

import { between, choose, gcd, intBetween } from "../rng.js";
import { depthBands, turn } from "./space.js";

const TRACE = 5;
const POINTS = 1600;

export default {
  id: "knot",
  name: "Knot",
  pattern: "free",
  params(rand) {
    const torus = rand() < 0.6;
    let a, b;
    do {
      a = intBetween(rand, 2, 5);
      b = intBetween(rand, 3, 9);
    } while (a === b || gcd(a, b) !== 1);
    return {
      torus,
      a,
      b,
      tube: between(rand, 0.35, 0.5),
      lis: [choose(rand, [2, 3, 4, 5]), choose(rand, [3, 5, 7]), choose(rand, [2, 4, 6, 7])],
      phase: [rand() * 6, rand() * 6, rand() * 6],
      wx: between(rand, 0.05, 0.15),
      wy: between(rand, 0.04, 0.12),
    };
  },
  scene(p, { w, h, hues }) {
    const scale = Math.min(w, h);
    const width = Math.max(1, scale * 0.0022);
    const base = [];
    for (let i = 0; i <= POINTS; i++) {
      const s = (i / POINTS) * Math.PI * 2;
      if (p.torus) {
        const rr = 1 + p.tube * Math.cos(p.b * s);
        base.push([(rr * Math.cos(p.a * s)) / (1 + p.tube), (rr * Math.sin(p.a * s)) / (1 + p.tube), (p.tube * Math.sin(p.b * s)) / (1 + p.tube)]);
      } else {
        base.push([Math.sin(p.lis[0] * s + p.phase[0]) * 0.8, Math.sin(p.lis[1] * s + p.phase[1]) * 0.8, Math.sin(p.lis[2] * s + p.phase[2]) * 0.8]);
      }
    }
    let t = 0;
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const moved = base.map((q) => turn(q, t * p.wx + 0.6, t * p.wy));
        const count = Math.max(2, Math.floor(moved.length * Math.min(1, t / TRACE)));
        const bands = depthBands(moved, count, w / 2, h / 2, scale * 0.3);
        return bands.map((paths, i) => ({ paths, h: hues[0] + ((hues[1] - hues[0]) * i) / 3, l: 0.55 + i * 0.09, c: 0.15, a: 0.45 + i * 0.17, w: width }));
      },
    };
  },
};
