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
| `js/cg-metadata.js` | Fills the status metadata — browser support, the progress bar, the usage-guidance tables — from [cg-spec-metadata](https://github.com/w3c/cg-spec-metadata). |
| `mockups/` | Sample specifications using these assets, deployed through GitHub Pages. See [`mockups/README.md`](mockups/README.md). |
| `demo/` | The same samples, wired to the live metadata endpoint. See [`demo/README.md`](demo/README.md). |

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
<script src="BASE/js/cg-metadata.js" defer></script>
```

Notes on that markup:

- The dark sheet **must** carry `media="(prefers-color-scheme: dark)"`, so that a
  reader without JavaScript gets a palette that matches their system. `dark.js`
  takes over the media list once it runs.
- `class="dark-mode"` is how `dark.js` finds the sheet to drive from the theme
  toggle. A URL ending in `dark.css` is also recognised, but the class is
  explicit and survives renaming.
- Load `cg-fixup.js` before `dark.js`.
- `cg-metadata.js` **must** be `defer`: that scripts fills the  *Usage guidance*
  section at the foot. See [Status metadata](#status-metadata).

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


## Status metadata

`js/cg-metadata.js` fills the collected status metadata from
[cg-spec-metadata](https://github.com/w3c/cg-spec-metadata), reading
`https://w3c.github.io/cg-spec-metadata/specs/<shortname>.json`. A living specification and a
snapshot both load it, and it behaves differently according to what the document says it is.

### What the document has to declare

```html
<meta name="cg-spec-type" content="living">          <!-- or "snapshot" -->
<meta name="cg-spec-shortname" content="scheduling-apis">
<meta name="cg-spec-maturity" content="draft">       <!-- or transferred | unmaintained -->
```

These come from native config properties in bikeshed and ReSpec; nothing here is meant to be
hand-written. `cg-spec-maturity` is a **build input** — the script never reads it. The maturity
stage changes the markup rather than a value (a different notice box, a different number of list
items, no progress bar at all), so it has to be chosen when the document is generated.

If `cg-spec-type` is missing, unrecognised, or given twice with different values, the script builds
**nothing**, records `data-cg-metadata="unknown-type"`, and says so in every region. Failing closed
is deliberate: showing live status on an archival document is a correctness problem, while a living
specification that cannot load its status says as much where the status would have been.

A snapshot is allowed only the `living-spec` region — the address and last-edited date of the
*living* document it points at. Everything the generator already knows stays in the markup: the
snapshot's own publication date and address, and the link to the snapshots index. Any other region
is refused even if the container is present, and says why, so a copy-paste or a generator bug
cannot put live status on a snapshot.

One consequence worth writing down: **a browser "Save as HTML" is not a way to make a snapshot.**
ReSpec's exporter clones the live DOM and keeps both the `<meta>` and the script, so the saved file
would keep calling itself a living specification and would keep refreshing. Build a snapshot with
`cg-spec-type: snapshot` in its source metadata.

### What the script builds

The script does not fill values into markup the generator wrote — it **builds the blocks**. Nothing
that claims to be current status is ever in the document, so it can never be stale. The generator
leaves an empty container where each block goes:

| `data-cg-region` | what the script puts there | living | snapshot |
| --- | --- | --- | --- |
| `progress` | the four-step progress bar | ✓ | — |
| `browser-support` | the browser-support summary in the header box | ✓ | — |
| `usage-guidance` | the "collected on" line and the four usage-guidance tables | ✓ | — |
| `living-spec` | "This living specification: `<url>` (last edited: `<date>`)" | ✓ | ✓ |

Put a `<noscript>` inside a container for the no-JavaScript case — the script leaves it alone.
Nothing else may go in one; anything else is removed when the region is built.

The section around a region stays in the document, because it is structure rather than status: the
`<h2 id="usage-guidance">` (which the table of contents and the header box both link to), the
*Get involved* section, and the closing copyright disclaimer.

**A region is never silently empty.** If the fetch fails, the spec is absent from the endpoint, or
the document does not say what it is, every region says so. A value the collectors do not have is
rendered as *Not available* in place rather than dropped, so a reader can tell "nobody knows" from
"nothing to report". Both use `.cg-metadata-unavailable` / `.cg-metadata-missing` in
`css/cg-spec.css`.

### Staleness

The generator marks the root element `data-cg-metadata="static"`; the script sets `fresh`, `stale`
or `unknown-type`. There is no static fallback to reveal or hide, so these are for CSS and
debugging rather than for the reader — what the reader sees is the message in the region itself.
