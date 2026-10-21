import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const profile = JSON.parse(readFileSync(new URL("../brand/profile.json", import.meta.url), "utf8"));
const css = readFileSync(new URL("../theme.css", import.meta.url), "utf8");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const tokens = (block) => Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const light = tokens(css.split("@media (prefers-color-scheme: dark)")[0]);
const dark = tokens(css.split(':root[data-theme="dark"]')[1].split("}")[0]);

test("the profile's colors match theme.css in both themes", () => {
  for (const [name, value] of Object.entries(profile.colors)) {
    assert.equal(value.light, light[name], `${name} light`);
    assert.equal(value.dark, dark[name], `${name} dark`);
  }
  for (const name of Object.keys(dark)) assert.ok(profile.colors[name], `${name} is missing from the profile`);
});

test("every role names a color, every asset exists, and the release matches the package", () => {
  for (const token of Object.values(profile.roles)) assert.ok(profile.colors[token], token);
  for (const asset of profile.assets) assert.ok(existsSync(new URL(`../${asset.file}`, import.meta.url)), asset.file);
  assert.equal(profile.release.version, pkg.version);
});
