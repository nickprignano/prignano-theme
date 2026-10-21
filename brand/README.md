# Brand

The brand profile for this theme, read by the brand-profile skill before it makes a page,
artifact or image in the prignano.ai look.

- `profile.json`: colors (equal to `theme.css`, checked by `test/brand.test.js`), roles, type,
  required header, voice and rules.
- `profile.schema.json`: the profile format, copied from the 2ndbrain template's
  `skills/brand-profile/`.

When the theme changes, change `theme.css` first, then the profile, and bump `release.version`
with the package version.
