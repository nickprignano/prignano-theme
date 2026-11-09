import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { STYLES, SETTLE_SECONDS, palette, pick, styleFor } from "../art/index.js";
import { LIMITS, SIZES, closestParallel, density, lineContrast, maxShift } from "../art/limits.js";
import { countFlashes, flashArea } from "../art/flash.js";
import { hash, mulberry32 } from "../art/rng.js";

// A style's scene for a seed and screen size, as the library builds it.
function build(style, seed, w, h, mode = "full") {
  const rand = mulberry32(hash(seed));
  const pal = palette(rand, null);
  return { scene: style.scene(style.params(rand, mode), { w, h, hues: pal.hues, mode }), pal };
}
const run = (scene, seconds) => {
  for (let t = 0; t < seconds; t += 1 / 30) scene.advance(1 / 30);
};
const drawnLength = (lines) => {
  let n = 0;
  for (const l of lines) for (const p of l.paths) for (let i = 0; i + 3 < p.length; i += 2) n += Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]);
  return n;
};
const seeds = (n) => Array.from({ length: n }, (_, i) => `seed-${i}`);

test("every style has a unique id, a name and a pattern class", () => {
  assert.equal(new Set(STYLES.map((s) => s.id)).size, STYLES.length);
  for (const s of STYLES) {
    assert.ok(s.name, s.id);
    assert.ok(["free", "periodic"].includes(s.pattern), s.id);
  }
});

test("the same style and seed give the same parameters and the same frame", () => {
  for (const s of STYLES) {
    const a = mulberry32(hash("same"));
    const b = mulberry32(hash("same"));
    assert.deepEqual(s.params(a, "full"), s.params(b, "full"), s.id);
    const one = build(s, "same", 800, 600).scene;
    const two = build(s, "same", 800, 600).scene;
    run(one, 2);
    run(two, 2);
    assert.deepEqual(one.lines(1), two.lines(1), s.id);
  }
});

test("still frames are never blank, in either mode", () => {
  for (const s of STYLES)
    for (const mode of ["card", "full"])
      for (const seed of seeds(10)) {
        const { scene } = build(s, seed, 640, 360, mode);
        run(scene, SETTLE_SECONDS);
        // At least twice the short side's worth of line.
        assert.ok(drawnLength(scene.lines(1)) > 2 * 360, `${s.id} ${mode} ${seed}`);
      }
});

// Periodic styles, and free ones with families of parallel lines, follow the stripe limits.
const striped = STYLES.filter((x) => x.pattern === "periodic" || x.stripes);

test("striped styles keep their repeat, line width and contrast inside the limits", () => {
  for (const s of striped)
    for (const [w, h] of SIZES)
      for (const seed of seeds(1000)) {
        const { scene, pal } = build(s, seed, w, h);
        assert.ok(scene.repeat >= LIMITS.repeat * h, `${s.id} ${seed} ${w}x${h} repeat ${scene.repeat}`);
        if (seed !== "seed-0" && w !== 1280) continue;
        for (const line of scene.lines(1)) {
          assert.ok(line.w <= LIMITS.width * h, `${s.id} width`);
          // At every hue the slow color drift can reach, over the darker background stop.
          for (let hue = 0; hue < 360; hue += 10) assert.ok(lineContrast(line, hue, pal.bg[0]) <= LIMITS.contrast, `${s.id} contrast at ${hue}`);
        }
      }
});

test("straight-line tilings and curves draw nothing closer than their stated repeat", () => {
  for (const id of ["star-tiling", "fractal-curves", "rhomb-tiling"])
    for (const [w, h] of SIZES.slice(0, 2))
      for (const seed of seeds(12)) {
        const { scene } = build(STYLES.find((s) => s.id === id), seed, w, h);
        run(scene, 40);
        const gap = closestParallel(scene.lines(1));
        assert.ok(gap >= scene.repeat * 0.98, `${id} ${seed} ${w}x${h}: lines ${gap.toFixed(1)} px apart, repeat ${scene.repeat.toFixed(1)}`);
      }
});

test("striped styles move less than half a repeat a second", () => {
  for (const s of striped)
    for (const seed of seeds(100)) {
      const { scene } = build(s, seed, 1280, 720);
      // Styles whose lines are rebuilt each frame state their fastest point speed.
      if (scene.maxSpeed !== undefined) {
        assert.ok(scene.maxSpeed < LIMITS.motion * scene.repeat, `${s.id} ${seed} moves ${scene.maxSpeed.toFixed(1)} px/s`);
        continue;
      }
      for (let i = 0; i < 5; i++) {
        run(scene, 3);
        const before = scene.lines(1);
        scene.advance(1 / 60);
        const moved = maxShift(before, scene.lines(1)) * 60;
        assert.ok(moved < LIMITS.motion * scene.repeat, `${s.id} ${seed} moves ${moved.toFixed(1)} px/s`);
      }
    }
});

test("free styles stay under the line-density cap", () => {
  for (const s of STYLES.filter((x) => x.pattern === "free" && !x.stripes))
    for (const seed of seeds(40)) {
      const { scene } = build(s, seed, 1280, 720);
      for (const t of [SETTLE_SECONDS, 30]) {
        run(scene, t === SETTLE_SECONDS ? t : t - SETTLE_SECONDS);
        const share = density(scene.lines(1), 1280, 720);
        assert.ok(share <= LIMITS.density.share, `${s.id} ${seed} at ${t}s: ${share}`);
      }
    }
});

test("pick keeps each seed's own style and never repeats a neighbour", () => {
  const list = seeds(300);
  const styles = pick(list);
  assert.deepEqual(pick(list), styles);
  for (let i = 1; i < styles.length; i++) assert.notEqual(styles[i], styles[i - 1]);
  assert.equal(styles[0], styleFor(list[0]));
  assert.equal(new Set(styles).size, STYLES.length);
  assert.ok(styles.filter((s, i) => s === styleFor(list[i])).length > 250);
});

test("the flash counter catches real flashes and ignores slow changes", () => {
  const cells = 32 * 18;
  const opts = { fps: 60, cellArea: (1280 * 720) / cells, area: flashArea(1280, 720) };
  const frames = (fn) => Array.from({ length: 180 }, (_, f) => ({ lum: new Array(cells).fill(0).map((_, k) => fn(f, k)), red: new Array(cells).fill(0) }));
  assert.equal(countFlashes(frames(() => 0.05), opts).general, 0, "steady");
  assert.ok(countFlashes(frames((f) => (Math.floor(f / 8) % 2 ? 0.6 : 0.02)), opts).general > 0, "whole screen at about 4 Hz");
  assert.equal(countFlashes(frames((f) => 0.02 + 0.5 * Math.abs(Math.sin((f / 180) * Math.PI))), opts).general, 0, "slow 3 s swell");
  assert.equal(countFlashes(frames((f, k) => (k < 2 && Math.floor(f / 8) % 2 ? 0.6 : 0.02)), opts).general, 0, "flicker too small to count");
  const red = Array.from({ length: 180 }, (_, f) => ({ lum: new Array(cells).fill(0.05), red: new Array(cells).fill(Math.floor(f / 8) % 2 ? 60 : 0) }));
  assert.ok(countFlashes(red, opts).red > 0, "red flashes");
});

test("art ships in the package, needs nothing but itself, and avoids marked names", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(pkg.files.includes("art"));
  assert.equal(pkg.exports["./art/*"], "./art/*");
  const dir = new URL("../art/", import.meta.url);
  const files = [...readdirSync(dir).filter((f) => f.endsWith(".js")), ...readdirSync(new URL("styles/", dir)).map((f) => `styles/${f}`)];
  // Screensaver products, a toy trademark and marked pattern names, encoded so this file doesn't ship them either.
  const banned = ["TXlzdGlmeQ==", "QWZ0ZXIgRGFyaw==", "U3Bpcm9ncmFwaA==", "Rmxvd2VyIG9mIExpZmU=", "U2VlZCBvZiBMaWZl", "UGVucm9zZQ=="].map((b) => Buffer.from(b, "base64").toString().toLowerCase());
  for (const f of files) {
    const text = readFileSync(new URL(f, dir), "utf8");
    assert.doesNotMatch(text, /\bimport\b[^;]*from\s+["'](?!\.)/, `${f} imports a package`);
    assert.doesNotMatch(text, /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/, `${f} reaches the network`);
    for (const word of banned) assert.ok(!text.toLowerCase().includes(word), `${f} names a banned word`);
  }
});
