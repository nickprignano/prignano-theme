import { test } from "node:test";
import assert from "node:assert/strict";
import { footerHtml, headerHtml, NAV, THEME_INIT_SCRIPT } from "../index.js";

const labelsOf = (html) => [...html.matchAll(/<a href="[^"]*"(?: class="[^"]*")?( aria-current="page")?>([^<]+)<\/a>/g)];

test("sorts the shared links by label, keeps the pill last and marks the current one", () => {
  const labels = labelsOf(headerHtml({ current: "resume", bio: "Hi" }));
  assert.equal(labels.length, NAV.length);
  assert.deepEqual(labels.map((m) => m[2]), ["Blog", "Contact", "Games", "Projects", "Resume", "Book me to speak"]);
  assert.deepEqual(labels.filter((m) => m[1]).map((m) => m[2]), ["Resume"]);
});

test("sorts site links in with the shared ones and uses local paths for links on this site", () => {
  const html = headerHtml({ links: [{ id: "tags", label: "Tags", href: "/tags/" }, { id: "about", label: "About", href: "/about/" }], local: { blog: "/" }, current: "tags" });
  assert.deepEqual(labelsOf(html).map((m) => m[2]), ["About", "Blog", "Contact", "Games", "Projects", "Resume", "Tags", "Book me to speak"]);
  assert.match(html, /<a href="\/tags\/" aria-current="page">Tags<\/a>/);
  assert.match(html, /<a href="\/">Blog<\/a>/);
});

test("links Contact to the contact page on prignano.ai", () => {
  assert.match(headerHtml(), /<a href="https:\/\/prignano.ai\/contact">Contact<\/a>/);
  assert.match(headerHtml({ local: { contact: "/contact" } }), /<a href="\/contact">Contact<\/a>/);
});

test("draws the speaking invitation as a pill linking to the contact form", () => {
  assert.match(headerHtml(), /<a href="https:\/\/prignano.ai\/contact\?topic=speaking" class="ph-cta">Book me to speak<\/a><\/nav>/);
  assert.match(headerHtml({ local: { speak: "/contact?topic=speaking" } }), /<a href="\/contact\?topic=speaking" class="ph-cta">/);
});

test("puts the dark mode button before the links", () => {
  assert.match(headerHtml(), /<nav[^>]*><button class="ph-theme-toggle"[\s\S]*?<\/button><a /);
});

test("escapes the bio and omits it when empty", () => {
  assert.match(headerHtml({ bio: `<b>"x"</b>` }), /&lt;b&gt;&quot;x&quot;&lt;\/b&gt;/);
  assert.doesNotMatch(headerHtml(), /ph-bio/);
});

test("init script reads the cookie before localStorage", () => {
  const set = {};
  const run = (cookie, stored) => {
    const ctx = { document: { cookie, documentElement: { dataset: set } }, localStorage: { getItem: () => stored } };
    new Function("document", "localStorage", THEME_INIT_SCRIPT)(ctx.document, ctx.localStorage);
    return set.theme;
  };
  assert.equal(run("a=1; theme=dark", "light"), "dark");
  delete set.theme;
  assert.equal(run("", "light"), "light");
  delete set.theme;
  assert.equal(run("theme=purple", null), undefined);
});

test("links Projects to the projects page on prignano.ai", () => {
  assert.match(headerHtml(), /<a href="https:\/\/prignano.ai\/projects">Projects<\/a>/);
});

test("leaves GitHub out of the header", () => {
  assert.doesNotMatch(headerHtml(), /GitHub/);
});

test("footer has the copyright, the site note, then shared and site links", () => {
  const html = footerHtml({ year: 2026, note: 'Posts are <a href="/l">CC BY</a>.', links: [{ label: "RSS", href: "/rss.xml" }] });
  assert.match(html, /^<footer class="ph-footer"><p>© 2026 Nick Prignano\. Posts are <a href="\/l">CC BY<\/a>\.<\/p>/);
  assert.deepEqual([...html.matchAll(/ph-footer-links|>([^<]+)<\/a>/g)].map((m) => m[1] ?? "|").join(" "), "CC BY | GitHub LinkedIn RSS");
  assert.match(footerHtml({ year: 2026 }), /<p>© 2026 Nick Prignano\.<\/p>/);
});
