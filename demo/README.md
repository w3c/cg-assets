# Demo

Working demonstrations of the status-metadata script, [`js/cg-metadata.js`](../js/cg-metadata.js).
Unlike the [mockups](../mockups), these read their metadata live from
[cg-spec-metadata](https://github.com/w3c/cg-spec-metadata) at
<https://w3c.github.io/cg-spec-metadata/specs/scheduling-apis.json>, so what they show is whatever
the collectors last found.

| Document type | | |
| --- | --- | --- |
| Living specification | Prioritized Task Scheduling | <https://w3c.github.io/cg-assets/demo/scheduling-apis/living.html> |
| Snapshot | Prioritized Task Scheduling | <https://w3c.github.io/cg-assets/demo/scheduling-apis/snapshot.html> |

## What to look for

- **The living specification builds much more than the snapshot.** The progress bar, the
  browser-support table and the whole usage-guidance section exist only because the script built
  them. The snapshot is archival, so it gets one region: the address and last-edited date of the
  *living* document it points at. Its own publication date and address are its own facts and stay
  in the markup.
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
