// Shared header and theme for prignano.ai and its subdomains. Plain JavaScript
// with no dependencies, so any framework can render the header on the server
// and wire up the toggle in the browser.

export const OWNER = {
  name: "Nick Prignano",
  avatar: "https://github.com/nickprignano.png?size=112",
  email: "nick@prignano.ai",
};

/**
 * Links shown on every site. The header sorts them by label, with `cta`
 * links (drawn as a bold pill, used for the speaking invitation) last.
 * `id` marks the current site or page.
 */
export const NAV = [
  { id: "projects", label: "Projects", href: "https://prignano.ai/projects" },
  { id: "resume", label: "Resume", href: "https://prignano.ai/resume" },
  { id: "blog", label: "Blog", href: "https://blog.prignano.ai/" },
  { id: "github", label: "GitHub", href: "https://github.com/nickprignano" },
  { id: "speak", label: "Book me to speak", href: "https://prignano.ai/contact?topic=speaking", cta: true },
  { id: "contact", label: "Contact", href: "https://prignano.ai/contact" },
];

const STORAGE_KEY = "theme";
const COOKIE_DOMAIN = "prignano.ai";

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * The header's HTML. `current` is the NAV id of the page being shown. `links`
 * are extra site-specific links, sorted in with the shared ones by label. `home` is where
 * the name and avatar link to. Links on the current site can be made relative
 * with `local`, a map from NAV id to path.
 */
export function headerHtml({ current, bio, home = "https://prignano.ai/", links = [], local = {} } = {}) {
  const items = [
    ...links,
    ...NAV.map((l) => ({ ...l, href: local[l.id] ?? l.href })),
  ].sort((a, b) => Boolean(a.cta) - Boolean(b.cta) || a.label.localeCompare(b.label, "en"));
  const nav = items
    .map((l) => {
      const here = l.id !== undefined && l.id === current ? ' aria-current="page"' : "";
      const cta = l.cta ? ' class="ph-cta"' : "";
      return `<a href="${escape(l.href)}"${cta}${here}>${escape(l.label)}</a>`;
    })
    .join("");
  return (
    `<header class="ph-header">` +
    `<a class="ph-identity" href="${escape(home)}">` +
    `<img class="ph-avatar" src="${escape(OWNER.avatar)}" alt="" width="56" height="56" />` +
    `<span class="ph-identity-text"><span class="ph-name">${escape(OWNER.name)}</span>` +
    (bio ? `<span class="ph-bio">${escape(bio)}</span>` : "") +
    `</span></a>` +
    `<nav class="ph-links" aria-label="Site">` +
    `<button class="ph-theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode" title="Toggle dark mode">` +
    `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"></path></svg>` +
    `</button>${nav}</nav></header>`
  );
}

/**
 * Inline this in <head> before any styles paint. It applies the reader's saved
 * theme so dark mode doesn't flash. The choice is kept in a cookie for the
 * whole prignano.ai domain, so it follows the reader across subdomains, with
 * localStorage as a fallback.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${STORAGE_KEY}=(light|dark)/);var t=m?m[1]:localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

/** Saves the reader's theme for every *.prignano.ai site. */
export function saveTheme(theme) {
  const host = location.hostname;
  const domain = host === COOKIE_DOMAIN || host.endsWith(`.${COOKIE_DOMAIN}`) ? `; Domain=${COOKIE_DOMAIN}` : "";
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${STORAGE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${domain}${secure}`;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private windows can block storage; the cookie still carries the choice.
  }
}

/** Makes every [data-theme-toggle] button switch between light and dark. Call once in the browser. */
export function initThemeToggle() {
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const current = () => root.dataset.theme ?? (systemDark.matches ? "dark" : "light");
  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element && event.target.closest("[data-theme-toggle]");
    if (!button) return;
    const next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    saveTheme(next);
  });
}
