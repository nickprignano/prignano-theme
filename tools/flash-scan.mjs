// Plays every style, and transitions between them, frame by frame at 1280x720
// and counts flashes with art/flash.js. Run before any pull request that adds
// or changes a style; it must report zero:
//   node tools/flash-scan.mjs [seconds per run, default 20]
import { chromium, serve } from "./serve.mjs";

const seconds = Number(process.argv[2] ?? 20);
const server = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${server.url}/tools/scan.html`);
await page.waitForFunction(() => window.STYLE_IDS);
const { ids, periodic } = await page.evaluate(() => ({ ids: window.STYLE_IDS, periodic: window.PERIODIC }));

const runs = [];
for (const style of ids) for (const seed of ["scan-a", "scan-b", "scan-c"]) runs.push({ style, seed });
// Transitions: each style into the next one in the list, and every periodic
// style into every periodic style (those fade through the background).
ids.forEach((style, i) => runs.push({ style, seed: "scan-t", next: ids[(i + 1) % ids.length], periodicPair: periodic.includes(style) && periodic.includes(ids[(i + 1) % ids.length]) }));
for (const a of periodic) for (const b of periodic) runs.push({ style: a, seed: "scan-p", next: b, periodicPair: true });

// Runs share out across a few pages at once. Transitions run 8 seconds: one
// second before the hand-over, the hand-over, and the new piece settling.
const pages = [page, ...(await Promise.all(Array.from({ length: 3 }, () => browser.newPage({ viewport: { width: 1280, height: 720 } }))))];
for (const p of pages.slice(1)) {
  await p.goto(`${server.url}/tools/scan.html`);
  await p.waitForFunction(() => window.STYLE_IDS);
}
let bad = 0;
const queue = [...runs];
await Promise.all(
  pages.map(async (p) => {
    for (let run = queue.shift(); run; run = queue.shift()) {
      const r = await p.evaluate((o) => window.scan(o), { ...run, seconds: run.next ? 8 : seconds, cols: 32, rows: 18 });
      const label = run.next ? `${run.style} -> ${run.next}` : `${run.style} ${run.seed}`;
      console.log(`${label.padEnd(36)} flashes ${r.general}, red ${r.red}, brightest cell ${r.peak.toFixed(3)}`);
      if (r.general || r.red) bad++;
    }
  }),
);
await browser.close();
server.close();
console.log(bad ? `${bad} runs flashed` : `No flashes in ${runs.length} runs`);
process.exit(bad ? 1 : 0);
