# prignano-theme

The shared look for prignano.ai and every site under it (blog.prignano.ai and any future `*.prignano.ai` site): colors, dark mode, the header with the avatar, name, bio, shared links and theme toggle, and the generative line art drawn on the cards and in Vibes.

It's plain CSS and JavaScript with no dependencies and no build step, so it works in Next.js, Astro or a static page.

## What's in it

- `theme.css`: color tokens for light and dark (`--bg`, `--fg`, `--muted`, `--card`, `--border`, `--accent`, `--active`, `--chip`, `--chip-fg`, `--code-bg`, `--art-bg`, `--font`), base body and link styles, and the header styles (`.ph-*`).
- `headerHtml(options)`: the header's HTML, for rendering on the server.
- `THEME_INIT_SCRIPT`: a one-line script to inline in `<head>` so a saved theme applies before the first paint.
- `initThemeToggle()`: wires up the toggle in the browser.
- `art/`: the line-art library (below). It has no CSS or header dependency.
- `NAV` and `OWNER`: the shared links (Blog, Contact, Games, GitHub, Projects, Resume, and the Book me to speak pill) and the name, avatar and contact email. Contact goes to the contact page on prignano.ai, which lists Nick's socials and has the message form; Book me to speak opens the same form with the speaking topic picked.

Dark mode follows the system setting until the reader picks one. The choice is saved in a cookie for the whole `prignano.ai` domain, so it follows them from site to site, with `localStorage` as a fallback.

## Using it

Install a tagged version straight from GitHub:

```bash
npm install https://codeload.github.com/nickprignano/prignano-theme/tar.gz/refs/tags/v0.2.0
```

The tarball URL needs no git or SSH key, so it installs the same way in Cloudflare's build image as it does locally.

Then, in the site's layout:

1. Import `prignano-theme/theme.css` before the site's own styles.
2. Inline `THEME_INIT_SCRIPT` in `<head>`.
3. Render `headerHtml({ current, bio, links, local })` at the top of the page.
4. Call `initThemeToggle()` once in the browser.
5. Optionally set `--ph-width` so the header lines up with the page's content.

`headerHtml` options:

| Option | Purpose |
| --- | --- |
| `current` | Id of the link for the page being shown (`projects`, `resume`, `blog`, `github`, `speak`, `contact`, or one of `links`) |
| `bio` | Short line under the name |
| `home` | Where the name and avatar link to (default `https://prignano.ai/`) |
| `links` | Site-specific links (`{ id, label, href, cta }`). All links are sorted A to Z by label, with `cta: true` links drawn as a pill and placed last |
| `local` | Relative paths for shared links that live on the current site, e.g. `{ blog: "/" }` on the blog |

### Next.js

```tsx
import { headerHtml, THEME_INIT_SCRIPT } from "prignano-theme";
import "prignano-theme/theme.css";

<head><script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /></head>
<div dangerouslySetInnerHTML={{ __html: headerHtml({ current: "projects", local: { projects: "/projects", resume: "/resume" } }) }} />
```

Call `initThemeToggle()` from a small client component's `useEffect`.

### Astro

```astro
---
import { headerHtml, THEME_INIT_SCRIPT } from "prignano-theme";
import "prignano-theme/theme.css";
---
<script is:inline set:html={THEME_INIT_SCRIPT} />
<Fragment set:html={headerHtml({ current: "blog", local: { blog: "/" } })} />
<script>
  import { initThemeToggle } from "prignano-theme";
  initThemeToggle();
</script>
```

## Line art

`art/index.js` draws generative line art on a canvas: the project and event cards on
prignano.ai and every piece in Vibes come from it. Each style turns a seed into parameters,
the parameters into polylines (both pure, tested in Node), and the library strokes them on a
dark background.

```js
import { createPiece, pick } from "prignano-theme/art/index.js";

const styles = pick(repos.map((r) => r.name)); // per card, no two neighbours alike
const piece = createPiece(canvas, { seed: repo.name, color: languageColor, style: styles[i] });
piece.step(0); // still frame; call step(dt) each animation frame to animate
```

- `mode: "full"` applies the full-screen safety limits (fewer, fainter, slower stripes), `"card"`
  keeps the work light for small canvases. `grow: true` starts from nothing and grows in over
  3 seconds; otherwise the piece starts at its settled still frame. `calm: true` halves the
  speed and fades the lines.
- 18 styles: flow trails, wave lines and harmonograph (from the original cards), gear curves,
  rose, knot, wire solids, attractor, times tables, star polygons, circle lattice, star tiling,
  rhomb tiling, hyperbolic, Voronoi, fractal curves, meander and epicycles. Each is one file in
  `art/styles/`, marked `periodic` (a repeating grid or tiling) or `free`.
- Stripes: periodic styles, and free ones with families of parallel lines (`stripes: true`),
  state their `repeat` (the closest gap between parallel lines) and, when their lines are rebuilt
  each frame, their `maxSpeed`.
- Safety: `art/limits.js` holds the pattern limits (stripe repeat, width, contrast at every hue,
  motion, line density) and the tests check every style against them. `art/flash.js` counts
  flashes as WCAG 2.3.1 defines them. Before a pull request that adds or changes a style, run
  `node tools/flash-scan.mjs` (needs Playwright with Chromium): it plays every style and
  transition frame by frame and must report no flashes. `node tools/preview.mjs <dir>` saves a
  still of each style.

## Changing the theme

1. Change it here through a pull request, bump `version` in `package.json`, and tag the merge commit (`v0.3.0`).
2. In each site, run the install command above with the new tag, in its own pull request.

Sites stay on the version they pin until they're updated, so a theme change never breaks a site by surprise.

## Tests

```bash
npm test
```

## License

MIT
