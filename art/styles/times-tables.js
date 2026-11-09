// Chords join point n to point n times k around a circle. k creeps up, so
// cardioids, nephroids and star webs morph into each other.

import { between, intBetween } from "../rng.js";

const DRAW = 4;

export default {
  id: "times-tables",
  name: "Times tables",
  pattern: "free",
  params: (rand) => ({
    points: intBetween(rand, 90, 120),
    k0: between(rand, 2, 30),
    rate: between(rand, 0.004, 0.01),
    spin: between(rand, 0.01, 0.03) * (rand() < 0.5 ? -1 : 1),
  }),
  scene(p, { w, h, hues }) {
    const scale = Math.min(w, h);
    const r = scale * 0.44;
    const width = Math.max(1, scale * 0.0014);
    let t = 0;
    const at = (i, rot) => {
      const a = (i / p.points) * Math.PI * 2 + rot;
      return [w / 2 + r * Math.cos(a), h / 2 + r * Math.sin(a)];
    };
    return {
      advance(dt) {
        t += dt;
      },
      lines() {
        const k = p.k0 + t * p.rate;
        const rot = t * p.spin;
        const shown = Math.floor(p.points * Math.min(1, t / DRAW));
        const bands = [[], [], [], []];
        for (let i = 0; i < shown; i++) bands[Math.floor((i / p.points) * 4)].push([...at(i, rot), ...at(i * k, rot)]);
        const ring = [];
        for (let i = 0; i <= 240; i++) ring.push(...at((i / 240) * p.points, rot));
        return [
          { paths: [ring], h: hues[0], l: 0.7, c: 0.12, a: 0.25, w: width },
          ...bands.map((paths, i) => ({ paths, h: hues[0] + ((hues[1] - hues[0]) * i) / 3, l: 0.8, c: 0.15, a: 0.4, w: width })),
        ];
      },
    };
  },
};
