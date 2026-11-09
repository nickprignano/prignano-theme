# prignano-theme

The shared look for prignano.ai and every site under it (blog.prignano.ai and any future `*.prignano.ai` site): colors, dark mode, one page width for every page, the header with the avatar, name, bio, shared links and theme toggle, and the footer.

It's plain CSS and JavaScript with no dependencies and no build step, so it works in Next.js, Astro or a static page.

## What's in it

- `theme.css`: color tokens for light and dark (`--bg`, `--fg`, `--muted`, `--card`, `--border`, `--accent`, `--active`, `--chip`, `--chip-fg`, `--code-bg`, `--art-bg`, `--font`), base body and link styles, the layout tokens (`--page-width`, `--page-max`, `--page-gutter`, `--measure`) with a `.ph-page` container, and the header and footer styles (`.ph-*`).
- `headerHtml(options)`: the header's HTML, for rendering on the server.
- `footerHtml(options)`: the footer's HTML: the copyright line, an optional site note, then GitHub, LinkedIn and the site's own links.
- `THEME_INIT_SCRIPT`: a one-line script to inline in `<head>` so a saved theme applies before the first paint.
- `initThemeToggle()`: wires up the toggle in the browser.
- `NAV` and `OWNER`: the shared links (Blog, Contact, Games, Projects, Resume, and the Book me to speak pill) and the name, avatar and contact email. Contact goes to the contact page on prignano.ai, which lists Nick's socials and has the message form; Book me to speak opens the same form with the speaking topic picked.

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
5. Give page content the shared width with `class="ph-page"` (or `width: var(--page-width); margin: 0 auto`), and render `footerHtml()` at the bottom.

### Page width

Every page on every site is `--page-width` wide: up to 1080px, with 24px from the window edges (16px below 720px). The header and footer use it too, so the name, headings, notes, cards and grids all share one left and right edge, and nothing jumps when you move between pages or sites. Don't give a whole page or section its own narrower `max-width`. For long prose, cap just the text at `var(--measure)` (72ch). `--ph-width` still overrides the header and footer width if a page really needs it.

`headerHtml` options:

| Option | Purpose |
| --- | --- |
| `current` | Id of the link for the page being shown (`projects`, `resume`, `games`, `blog`, `speak`, `contact`, or one of `links`) |
| `bio` | Short line under the name |
| `home` | Where the name and avatar link to (default `https://prignano.ai/`) |
| `links` | Site-specific links (`{ id, label, href, cta }`). All links are sorted A to Z by label, with `cta: true` links drawn as a pill and placed last |
| `local` | Relative paths for shared links that live on the current site, e.g. `{ blog: "/" }` on the blog |

`footerHtml` options:

| Option | Purpose |
| --- | --- |
| `note` | HTML after the copyright line, such as a license note. Written by the site, not escaped |
| `links` | Site-specific links (`{ label, href }`), after GitHub and LinkedIn |
| `year` | Copyright year (default: this year) |

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
