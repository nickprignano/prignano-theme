// A grid of tiles, each holding two quarter circles that join the middles of
// its sides, so the arcs link up into long winding paths (a Truchet pattern).
// Now and then one tile turns slowly to rewire the paths.

import { between, mulberry32 } from "../rng.js";

const TURN = 6; // seconds for a tile to make its quarter turn
const DRAW = 4;

export default {
  id: "meander",
  name: "Meander",
  pattern: "periodic",
  params: (rand) => ({ across: between(rand, 6, 8), sim: Math.floor(rand() * 2 ** 32), gap: between(rand, 1, 3) }),
  scene(p, { w, h, hues, mode }) {
    const full = mode === "full";
    // Arcs in one tile come within (sqrt 2 - 1) of a tile of each other, so
    // tiles are big enough to keep that over 4% of the height.
    const size = Math.max(Math.min(w, h) / p.across, (h * 0.042) / (Math.SQRT2 - 1));
    const cols = Math.ceil(w / size) + 1;
    const rows = Math.ceil(h / size) + 1;
    const ox = (w - cols * size) / 2, oy = (h - rows * size) / 2;
    const rand = mulberry32(p.sim);
    const flip = Array.from({ length: cols * rows }, () => (rand() < 0.5 ? 0 : 1));
    const width = Math.min(Math.max(1, Math.min(w, h) * 0.0018), h * 0.003);
    let t = 0;
    let turning = null; // { tile, from, start }
    let nextTurn = DRAW + p.gap;
    return {
      repeat: size * (Math.SQRT2 - 1),
      // A turning tile's arcs reach about 0.71 of a tile from its centre.
      maxSpeed: (size * Math.SQRT1_2 * (Math.PI / 2)) / TURN,
      advance(dt) {
        t += dt;
        if (turning && t - turning.start >= TURN) {
          flip[turning.tile] = 1 - flip[turning.tile];
          turning = null;
          nextTurn = t + p.gap;
        }
        if (!turning && t >= nextTurn) turning = { tile: Math.floor(rand() * flip.length), start: t };
      },
      lines() {
        const part = Math.min(1, t / DRAW);
        const paths = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const k = r * cols + c;
            const cx = ox + (c + 0.5) * size, cy = oy + (r + 0.5) * size;
            let rot = flip[k] * (Math.PI / 2);
            if (turning?.tile === k) rot += ((t - turning.start) / TURN) * (Math.PI / 2);
            // Two arcs of radius half a tile, centred on opposite corners,
            // turned with the tile about its centre.
            const ca = Math.cos(rot), sa = Math.sin(rot);
            const steps = Math.round(10 * part);
            for (const [kx, ky, from] of [[-1, -1, 0], [1, 1, Math.PI]]) {
              if (steps < 1) continue;
              const pts = [];
              for (let i = 0; i <= steps; i++) {
                const th = from + (i / 10) * (Math.PI / 2);
                const x = (kx * size) / 2 + (size / 2) * Math.cos(th);
                const y = (ky * size) / 2 + (size / 2) * Math.sin(th);
                pts.push(cx + x * ca - y * sa, cy + x * sa + y * ca);
              }
              paths.push(pts);
            }
          }
        return [{ paths, h: hues[0], l: full ? 0.6 : 0.76, c: 0.14, a: full ? 0.7 : 0.85, w: width }];
      },
    };
  },
};
