// Counts flashes the way WCAG 2.3.1 defines them, from per-cell measurements
// of each frame (see tools/flash-scan.mjs). Pure, so the tests can feed it
// known sequences.
//
// A change is a swing of at least `step` (0.1 relative luminance, or 20 on the
// red scale) within a third of a second; for luminance the darker side must be
// under 0.8. A flash is two opposing changes in the same cell within a second.
// Flashes count only when the cells flashing in the same second together cover
// more than `area` pixels (a quarter of a 10-degree field).

const WINDOW_CHANGE = 1 / 3;
const WINDOW_FLASH = 1;

function cellFlashes(series, fps, step, darkLimit) {
  const flashes = [];
  const span = Math.round(WINDOW_CHANGE * fps);
  let lastDir = 0;
  let lastAt = -Infinity;
  let anchor = 0;
  for (let f = 1; f < series.length; f++) {
    // Compare with the frame a third of a second back, so slow fades never count.
    const from = series[Math.max(anchor, f - span)];
    const to = series[f];
    const diff = to - from;
    if (Math.abs(diff) >= step && Math.min(from, to) < darkLimit) {
      const dir = Math.sign(diff);
      if (lastDir && dir !== lastDir && f - lastAt <= WINDOW_FLASH * fps) flashes.push(f);
      lastDir = dir;
      lastAt = f;
      anchor = f;
    }
  }
  return flashes;
}

// frames: [{ lum: number[], red: number[] }], one entry per cell.
export function countFlashes(frames, { fps = 60, cellArea, area }) {
  const cells = frames[0].lum.length;
  const count = (key, step, darkLimit) => {
    const events = [];
    for (let k = 0; k < cells; k++) for (const f of cellFlashes(frames.map((fr) => fr[key][k]), fps, step, darkLimit)) events.push({ f, k });
    let flashes = 0;
    for (const e of events) {
      const near = new Set(events.filter((o) => Math.abs(o.f - e.f) <= fps * WINDOW_FLASH).map((o) => o.k));
      if (near.size * cellArea > area) flashes++;
    }
    return flashes;
  };
  return { general: count("lum", 0.1, 0.8), red: count("red", 20, Infinity) };
}

// A quarter of WCAG's 10-degree field (341 x 256 px at 1024 x 768), scaled to
// a screen of w x h.
export const flashArea = (w, h) => (0.25 * 341 * 256 * (w * h)) / (1024 * 768);
