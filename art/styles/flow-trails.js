// Particles drift through a slowly shifting vector field, each trailing a line
// that fades out behind it. Ported from prignano.ai's card art.

import { between, mulberry32 } from "../rng.js";

const TAIL = 40;

export default {
  id: "flow-trails",
  name: "Flow trails",
  pattern: "free",
  params: (rand) => ({
    f1: between(rand, 1.2, 3.7),
    f2: between(rand, 1.2, 3.7),
    p1: rand() * 100,
    p2: rand() * 100,
    twist: between(rand, 1, 3),
    drift: between(rand, 0.05, 0.15),
    speed: between(rand, 0.12, 0.22),
    sim: Math.floor(rand() * 2 ** 32),
    t0: rand() * 100,
  }),
  scene(p, { w, h, hues, mode }) {
    const rand = mulberry32(p.sim);
    const scale = Math.min(w, h);
    const f1 = p.f1 / scale;
    const f2 = p.f2 / scale;
    const speed = scale * p.speed;
    const field = (x, y, t) =>
      (Math.sin(x * f1 + p.p1 + t * p.drift) + Math.cos(y * f2 + p.p2 - t * p.drift * 0.7) + Math.sin((x + y) * f1 * 0.5 + t * p.drift * 0.5)) * p.twist;
    const count = Math.min(mode === "full" ? 2400 : 900, Math.round((w * h) / 1800));
    const spawn = () => ({ xs: [rand() * w], ys: [rand() * h], life: 2 + rand() * 6, band: Math.floor(rand() * hues.length) });
    const particles = Array.from({ length: count }, spawn);
    let t = p.t0;
    const width = Math.max(1, scale * 0.0022);

    return {
      advance(dt) {
        t += dt;
        for (let i = 0; i < particles.length; i++) {
          const q = particles[i];
          const x = q.xs[q.xs.length - 1];
          const y = q.ys[q.ys.length - 1];
          const a = field(x, y, t);
          const nx = x + Math.cos(a) * speed * dt;
          const ny = y + Math.sin(a) * speed * dt;
          q.life -= dt;
          if (q.life <= 0 || nx < 0 || ny < 0 || nx > w || ny > h) {
            // Let the tail run out before respawning, so lines don't vanish at once.
            q.xs.shift();
            q.ys.shift();
            if (q.xs.length === 0) particles[i] = spawn();
            continue;
          }
          q.xs.push(nx);
          q.ys.push(ny);
          if (q.xs.length > TAIL) {
            q.xs.shift();
            q.ys.shift();
          }
        }
      },
      // Each tail in three segments, faint at the back and bright at the head,
      // batched by color and segment.
      lines() {
        const out = [];
        for (let band = 0; band < hues.length; band++) {
          for (let seg = 0; seg < 3; seg++) {
            const paths = [];
            for (const q of particles) {
              if (q.band !== band) continue;
              const n = q.xs.length;
              const from = Math.floor((n * seg) / 3);
              const to = Math.min(n - 1, Math.floor((n * (seg + 1)) / 3));
              if (to <= from) continue;
              const pts = [];
              for (let k = from; k <= to; k++) pts.push(q.xs[k], q.ys[k]);
              paths.push(pts);
            }
            out.push({ paths, h: hues[band], l: 0.64 + seg * 0.08, c: 0.17, a: 0.15 + seg * 0.3, w: width });
          }
        }
        return out;
      },
    };
  },
};
