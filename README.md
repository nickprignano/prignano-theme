# prignano-theme

The shared look for prignano.ai and every site under it (blog.prignano.ai and any future `*.prignano.ai` site): colours, dark mode, and the header with the avatar, name, bio, shared links and theme toggle.

It's plain CSS and JavaScript with no dependencies and no build step, so it works in Next.js, Astro or a static page.

## What's in it

- `theme.css`: colour tokens for light and dark (`--bg`, `--fg`, `--muted`, `--card`, `--border`, `--accent`, `--active`, `--chip`, `--chip-fg`, `--code-bg`, `--art-bg`, `--font`), base body and link styles, and the header styles (`.ph-*`).
- `headerHtml(options)`: the header's HTML, for rendering on the server.
- `THEME_INIT_SCRIPT`: a one-line script to inline in `<head>` so a saved theme applies before the first paint.
- `initThemeToggle()`: wires up the toggle in the browser.
- `NAV` and `OWNER`: the shared links (Projects, Resume, Blog, GitHub) and the name and avatar.

Dark mode follows the system setting until the reader picks one. The choice is saved in a cookie for the whole `prignano.ai` domain, so it follows them from site to site, with `localStorage` as a fallback.

## Using it

Install a tagged version straight from GitHub:

```bash
npm install https://codeload.github.com/nickprignano/prignano-theme/tar.gz/refs/tags/v0.1.0
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
| `current` | Id of the link for the page being shown (`projects`, `resume`, `blog`, `github`, or one of `links`) |
| `bio` | Short line under the name |
| `home` | Where the name and avatar link to (default `https://prignano.ai/`) |
| `links` | Site-specific links (`{ id, label, href }`) placed before the shared ones |
| `local` | Relative paths for shared links that live on the current site, e.g. `{ blog: "/" }` on the blog |

### Next.js

```tsx
import { headerHtml, THEME_INIT_SCRIPT } from "prignano-theme";
import "prignano-theme/theme.css";

<head><script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /></head>
<div dangerouslySetInnerHTML={{ __html: headerHtml({ current: "projects", local: { projects: "/", resume: "/resume" } }) }} />
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

1. Change it here through a pull request, bump `version` in `package.json`, and tag the merge commit (`v0.2.0`).
2. In each site, run the install command above with the new tag, in its own pull request.

Sites stay on the version they pin until they're updated, so a theme change never breaks a site by surprise.

## Tests

```bash
npm test
```

## License

MIT
