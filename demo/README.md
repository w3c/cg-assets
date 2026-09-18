# Demo

Working demonstrations of the status-metadata script, [`js/cg-metadata.js`](../js/cg-metadata.js).
They read their metadata live from
[cg-spec-metadata](https://github.com/w3c/cg-spec-metadata) at
<https://w3c.github.io/cg-spec-metadata/specs/scheduling-apis.json>, so what they show is whatever
the collectors last found. All four are the same specification, Prioritized Task Scheduling, in the
four shapes a CG specification can take.

| Type | Maturity | | |
| --- | --- | --- | --- |
| Living specification | Draft | <https://w3c.github.io/cg-assets/demo/scheduling-apis/living.html> | the full set |
| Living specification | Transferred | <https://w3c.github.io/cg-assets/demo/scheduling-apis/transferred.html> | pointer only |
| Living specification | Unmaintained | <https://w3c.github.io/cg-assets/demo/scheduling-apis/unmaintained.html> | pointer only |
| Snapshot | Draft | <https://w3c.github.io/cg-assets/demo/scheduling-apis/snapshot.html> | pointer only |

## What to look for

- **The draft builds much more than the other three.** The progress bar, the browser-support table
  and the whole usage-guidance section exist only because the script built them. The other three
  get one region between them: the address and last-edited date of the *living* document they
  point at.
- **Transferred and unmaintained are living specifications, not snapshots.** They carry
  `cg-spec-type: living`, and the work has simply stopped, so there is no progress to report and no
  usage guidance to give. The script has no opinion about this — a document is served whatever
  regions it emits, and these two emit one. What differs is generator-static: the maturity tag in
  the title, the notice box (`box--warning` for unmaintained), and whether *Get involved* appears
  at all.
- **The snapshot is archival**, so even if a region for live status were present the script would
  refuse it. Its own publication date and address are its own facts and stay in the markup.
- **Failure.** Block the request to `w3c.github.io/cg-spec-metadata` and every region says the
  status data could not be loaded. Nothing is left silently empty, and nothing stale is shown,
  because there was never anything there to go stale.

## Reading the state

`js/cg-metadata.js` records what happened on the root element:

| `data-cg-metadata` | meaning |
| --- | --- |
| `static` | no script ran — the generator's default; the `<noscript>` in each region explains what is missing |
| `fresh` | the regions were built from the endpoint |
| `stale` | the fetch failed; every region says so |
| `unknown-type` | the document does not say whether it is a living specification or a snapshot, so nothing was built |

