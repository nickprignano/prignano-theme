import { test } from "node:test";
import assert from "node:assert/strict";
import { headerHtml, NAV, THEME_INIT_SCRIPT } from "../index.js";

const labelsOf = (html) => [...html.matchAll(/<a href="[^"]*"(?: class="[^"]*")?( aria-current="page")?>([^<]+)<\/a>/g)];

test("sorts the shared links by label, keeps the pill last and marks the current one", () => {
  const labels = labelsOf(headerHtml({ current: "resume", bio: "Hi" }));
  assert.equal(labels.length, NAV.length);
  assert.deepEqual(labels.map((m) => m[2]), ["Blog", "Contact", "GitHub", "Projects", "Resume", "Book me to speak"]);
  assert.deepEqual(labels.filter((m) => m[1]).map((m) => m[2]), ["Resume"]);
});

test("sorts site links in with the shared ones and uses local paths for links on this site", () => {
  const html = headerHtml({ links: [{ id: "tags", label: "Tags", href: "/tags/" }, { id: "about", label: "About", href: "/about/" }], local: { blog: "/" }, current: "tags" });
  assert.deepEqual(labelsOf(html).map((m) => m[2]), ["About", "Blog", "Contact", "GitHub", "Projects", "Resume", "Tags", "Book me to speak"]);
  assert.match(html, /<a href="\/tags\/" aria-current="page">Tags<\/a>/);
  assert.match(html, /<a href="\/">Blog<\/a>/);
});

test("links Contact to the shared email address", () => {
  assert.match(headerHtml(), /<a href="mailto:nick@prignano.ai">Contact<\/a>/);
});

test("draws the speaking invitation as a pill linking to the events page", () => {
  assert.match(headerHtml(), /<a href="https:\/\/prignano.ai\/events#speak" class="ph-cta">Book me to speak<\/a><\/nav>/);
  assert.match(headerHtml({ local: { speak: "/events#speak" } }), /<a href="\/events#speak" class="ph-cta">/);
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
