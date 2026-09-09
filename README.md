# cg-assets

Style sheets and scripts for W3C **Community Group specifications**.

This is the CG counterpart to [w3c/tr-design](https://github.com/w3c/tr-design),
which holds the assets for W3C Technical Reports. The design implemented here was
developed and agreed in [w3c/cg-program](https://github.com/w3c/cg-program) — see
[`proposals/spec-lifecycle.md`](https://github.com/w3c/cg-program/blob/main/proposals/spec-lifecycle.md)
and [`beta-2026/cg-redesign-overview.md`](https://github.com/w3c/cg-program/blob/main/beta-2026/cg-redesign-overview.md)
— and prototyped as the `spec-mockups/v12` mockups.

## Files

| File | What it is |
| ---- | ---------- |
| `css/base.css` | The W3C TR base style sheet, with the CG design bits. |
| `css/cg-spec.css` | The CG component layer: the header box, status notices, progress bar, usage-guidance tables, buttons and icons. |
| `css/dark.css` | The W3C TR dark overlay. |
| `js/cg-fixup.js` | Table of contents (sidebar toggle, jump link), amendment diff toggling, wide-table wrapping. |
| `js/dark.js` | The light / dark / auto theme toggle, and the code that drives the dark style sheet. |
| `mockups/` | Sample specifications using these assets, deployed through GitHub Pages. See [`mockups/README.md`](mockups/README.md). |

## How a specification uses these

**The order matters.** `base.css`, `cg-spec.css` and `dark.css` all set the same
`:root` custom properties at equal specificity, so a document that loads them out
of order gets the wrong colours.

```html
<link rel="stylesheet" href="BASE/css/base.css">
<link rel="stylesheet" href="BASE/css/cg-spec.css">
<link rel="stylesheet" class="dark-mode" media="(prefers-color-scheme: dark)"
      href="BASE/css/dark.css">
<script src="BASE/js/cg-fixup.js"></script>
<script src="BASE/js/dark.js"></script>
```

Notes on that markup:

- The dark sheet **must** carry `media="(prefers-color-scheme: dark)"`, so that a
  reader without JavaScript gets a palette that matches their system. `dark.js`
  takes over the media list once it runs.
- `class="dark-mode"` is how `dark.js` finds the sheet to drive from the theme
  toggle. A URL ending in `dark.css` is also recognised, but the class is
  explicit and survives renaming.
- Load `cg-fixup.js` before `dark.js`.

`BASE` is not fixed yet. CG specifications are to be published on
`incubation.w3.org` (see the redesign overview).

## What the design covers

Two document kinds and three maturity stages, per the
[CG specification lifecycle](https://github.com/w3c/cg-program/blob/main/proposals/spec-lifecycle.md):

- **Living specifications** — updated in place. Header box with the maturity tag,
  a four-state progress bar towards standardization (`.progress-list`), a browser
  support summary, and a usage-guidance section at the foot of the document.
- **Snapshots** — archival. Same header box, no progress bar, and a notice
  pointing at the living specification.
- Maturity stages **Draft**, **Transferred** and **Unmaintained**, the last of
  which uses the red `.box--warning` variant.

