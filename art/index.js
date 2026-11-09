// The shared line-art library: prignano.ai's cards and Vibes both draw from it.
// Each style turns a seed into parameters, the parameters into polylines, and
// this file strokes them. No CSS, header or DOM dependency beyond a canvas.

import { hash, mulberry32 } from "./rng.js";
import { hexToHue, oklch } from "./color.js";
import flowTrails from "./styles/flow-trails.js";
import waveLines from "./styles/wave-lines.js";
import harmonograph from "./styles/harmonograph.js";
import gearCurves from "./styles/gear-curves.js";
import rose from "./styles/rose.js";
import knot from "./styles/knot.js";
import wireSolids from "./styles/wire-solids.js";
import attractor from "./styles/attractor.js";
import timesTables from "./styles/times-tables.js";
import starPolygons from "./styles/star-polygons.js";
import circleLattice from "./styles/circle-lattice.js";
import starTiling from "./styles/star-tiling.js";
import rhombTiling from "./styles/rhomb-tiling.js";
import hyperbolic from "./styles/hyperbolic.js";
import voronoi from "./styles/voronoi.js";
import fractalCurves from "./styles/fractal-curves.js";
import meander from "./styles/meander.js";
import epicycles from "./styles/epicycles.js";

export const STYLES = [
  flowTrails,
  waveLines,
  harmonograph,
  gearCurves,
  rose,
  knot,
  wireSolids,
  attractor,
  timesTables,
  starPolygons,
  circleLattice,
  starTiling,
  rhombTiling,
  hyperbolic,
  voronoi,
  fractalCurves,
  meander,
  epicycles,
];

// A piece grows in over this long in a live loop, and its still frame is the
// piece this many seconds in.
export const GROW_SECONDS = 3;
export const SETTLE_SECONDS = 10;

export const styleById = (id) => STYLES.find((s) => s.id === id);

// The style a seed gets on its own: a hash, so a project always looks the same.
export function styleFor(seed) {
  const cards = STYLES.filter((s) => s.card !== false);
  return cards[hash(`${seed}#style`) % cards.length].id;
}

// Styles for a list of cards in order: each seed's own style, moved on to the
// next style when it would match the card before it.
export function pick(seeds) {
  const cards = STYLES.filter((s) => s.card !== false).map((s) => s.id);
  const out = [];
  for (const seed of seeds) {
    let id = styleFor(seed);
    if (out.length && out[out.length - 1] === id) id = cards[(cards.indexOf(id) + 1) % cards.length];
    out.push(id);
  }
  return out;
}

// The palette a seed gets: hues around the language color (or a random one) and
// a very dark two-stop background.
export function palette(rand, color) {
  const base = color ? hexToHue(color) : rand() * 360;
  const spread = 25 + rand() * 45;
  return {
    hues: [base, base + spread, base - spread, base + 180 + (rand() - 0.5) * 40],
    bg: [
      [0.14, 0.02, base + 200],
      [0.2, 0.04, base],
    ],
    angle: rand() * Math.PI * 2,
  };
}

// Builds a piece on a canvas sized by the caller (backing store in pixels).
// mode "card" keeps the work light for small canvases; "full" applies the
// full-screen safety limits. grow: true starts from nothing and grows in;
// otherwise the piece starts at its settled still frame.
export function createPiece(canvas, { seed, color = null, style, mode = "card", grow = false, calm = false }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width: w, height: h } = canvas;
  const rand = mulberry32(hash(seed));
  const pal = palette(rand, color);
  const def = styleById(style ?? styleFor(seed)) ?? STYLES[0];
  const params = def.params(rand, mode);
  const scene = def.scene(params, { w, h, hues: pal.hues, mode });
  const speed = calm ? 0.5 : 1;
  const fade = calm ? 0.75 : 1;
  let age = 0;
  let hueShift = 0;

  const stop = ([l, c, hue]) => oklch(l, c, hue + hueShift);

  const draw = () => {
    const grad = ctx.createLinearGradient(
      w / 2 - (Math.cos(pal.angle) * w) / 2,
      h / 2 - (Math.sin(pal.angle) * h) / 2,
      w / 2 + (Math.cos(pal.angle) * w) / 2,
      h / 2 + (Math.sin(pal.angle) * h) / 2,
    );
    grad.addColorStop(0, stop(pal.bg[0]));
    grad.addColorStop(1, stop(pal.bg[1]));
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const reveal = grow ? Math.min(1, age / GROW_SECONDS) : 1;
    stroke(ctx, scene.lines(reveal), { h, hueShift, fade, bg: grad });
  };
  if (!grow) for (let t = 0; t < SETTLE_SECONDS; t += 1 / 30) scene.advance(1 / 30);

  return {
    style: def.id,
    // Advances the piece by dt seconds and draws it.
    step(dt) {
      age += dt;
      if (dt > 0) scene.advance(dt * speed);
      draw();
    },
    // Turns every hue by this many degrees (Vibes' slow color drift).
    setHueShift(deg) {
      hueShift = deg;
    },
  };
}

// Strokes a style's lines. A line is { paths, h, l, c, a, w } plus optional
// fill (cover what's below each path with the background first, so nearer
// lines hide farther ones), add (glow by adding light) and closed.
export function stroke(ctx, lines, { h, hueShift = 0, fade = 1, bg }) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const line of lines) {
    if (!line.paths.length) continue;
    ctx.globalCompositeOperation = line.add ? "lighter" : "source-over";
    const path = new Path2D();
    for (const pts of line.paths) {
      if (pts.length < 4) continue;
      path.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i], pts[i + 1]);
      if (line.closed) path.closePath();
    }
    if (line.fill) {
      const under = new Path2D();
      for (const pts of line.paths) {
        if (pts.length < 4) continue;
        under.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) under.lineTo(pts[i], pts[i + 1]);
        under.lineTo(pts[pts.length - 2], h);
        under.lineTo(pts[0], h);
        under.closePath();
      }
      ctx.fillStyle = bg;
      ctx.fill(under);
    }
    ctx.lineWidth = line.w;
    ctx.strokeStyle = oklch(line.l, line.c ?? 0.15, line.h + hueShift, line.a * fade);
    ctx.stroke(path);
  }
  ctx.globalCompositeOperation = "source-over";
}
