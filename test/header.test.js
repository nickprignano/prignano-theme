import { test } from "node:test";
import assert from "node:assert/strict";
import { headerHtml, NAV, THEME_INIT_SCRIPT } from "../index.js";

test("lists the shared links in order and marks the current one", () => {
  const html = headerHtml({ current: "resume", bio: "Hi" });
  const labels = [...html.matchAll(/<a href="[^"]*"( aria-current="page")?>([^<]+)<\/a>/g)];
  assert.deepEqual(labels.map((m) => m[2]), NAV.map((l) => l.label));
  assert.deepEqual(labels.filter((m) => m[1]).map((m) => m[2]), ["Resume"]);
});

test("puts site links first and uses local paths for links on this site", () => {
  const html = headerHtml({ links: [{ id: "tags", label: "Tags", href: "/tags/" }], local: { blog: "/" }, current: "tags" });
  assert.match(html, /<nav[^>]*><a href="\/tags\/" aria-current="page">Tags<\/a><a href="https:\/\/prignano.ai\/">Projects/);
  assert.match(html, /<a href="\/">Blog<\/a>/);
});

test("links Contact to the shared email address", () => {
  assert.match(headerHtml(), /<a href="mailto:nick@prignano.ai">Contact<\/a><button/);
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
