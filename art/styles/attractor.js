// A 3D strange attractor (Lorenz, Thomas or Aizawa type) drawn as one long
// thread, turning about an axis tipped away from its lobes.

import { between, choose } from "../rng.js";
import { depthBands, turnAbout } from "./space.js";

const TRACE = 6;

const SYSTEMS = {
  lorenz: { dt: 0.005, f: ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z] },
  thomas: { dt: 0.05, f: ([x, y, z], b = 0.19) => [Math.sin(y) - b * x, Math.sin(z) - b * y, Math.sin(x) - b * z] },
  aizawa: {
    dt: 0.01,
    f: ([x, y, z]) => [(z - 0.7) * x - 3.5 * y, 3.5 * x + (z - 0.7) * y, 0.6 + 0.95 * z - z ** 3 / 3 - (x * x + y * y) * (1 + 0.25 * z) + 0.1 * z * x ** 3],
  },
};

// Fourth-order Runge-Kutta, then centred and scaled into the unit sphere.
export function trace(name, count) {
  const { dt, f } = SYSTEMS[name];
  let p = [0.1, 0, 0];
  const step = () => {
    const add = (a, b, s) => a.map((v, i) => v + b[i] * s);
    const k1 = f(p), k2 = f(add(p, k1, dt / 2)), k3 = f(add(p, k2, dt / 2)), k4 = f(add(p, k3, dt));
    p = p.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  for (let i = 0; i < 1000; i++) step();
  const pts = [];
  for (let i = 0; i < count; i++) {
    step();
    pts.push(p);
  }
  const mid = [0, 1, 2].map((k) => (Math.max(...pts.map((q) => q[k])) + Math.min(...pts.map((q) => q[k]))) / 2);
  const r = Math.max(...pts.map((q) => Math.hypot(q[0] - mid[0], q[1] - mid[1], q[2] - mid[2])));
  return pts.map((q) => q.map((v, k) => (v - mid[k]) / r));
}

export default {
  id: "attractor",
  name: "Attractor",
  pattern: "free",
  params: (rand) => ({
    system: choose(rand, Object.keys(SYSTEMS)),
    tilt: between(rand, 0.4, 1.1),
    yaw: rand() * Math.PI * 2,
    spin: between(rand, 0.05, 0.12) * (rand() < 0.5 ? -1 : 1),
  }),
  scene(p, { w, h, hues, mode }) {
    const scale = Math.min(w, h);
    const width = Math.max(1, scale * 0.0012);
    const pts = trace(p.system, mode === "full" ? 20000 : 3000);
    const axis = [Math.sin(p.tilt) * Math.cos(p.yaw), Math.cos(p.tilt), Math.sin(p.tilt) * Math.sin(p.yaw)];
    let t = 0;
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const moved = pts.map((q) => turnAbout(q, axis, t * p.spin));
        const count = Math.max(2, Math.floor(moved.length * Math.min(1, t / TRACE)));
        const bands = depthBands(moved, count, w / 2, h / 2, scale * 0.32);
        return bands.map((paths, i) => ({ paths, h: hues[0] + ((hues[3] - hues[0]) * i) / 6, l: 0.55 + i * 0.08, c: 0.15, a: 0.35 + i * 0.15, w: width }));
      },
    };
  },
};
