// Saves a still frame of every style, for looking at them by eye:
//   node tools/preview.mjs <out-dir> [full|card]
import { chromium, serve } from "./serve.mjs";

const [out = "preview", mode = "full"] = process.argv.slice(2);
const server = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${server.url}/tools/scan.html`);
await page.waitForFunction(() => window.STYLE_IDS);
for (const style of await page.evaluate(() => window.STYLE_IDS)) {
  for (const seed of ["one", "two"]) {
    await page.evaluate((o) => window.still(o), { style, seed, mode });
    await page.screenshot({ path: `${out}/${style}-${seed}.png` });
  }
}
await browser.close();
server.close();
