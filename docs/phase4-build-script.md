# Phase 4 — Build Script (test-first, gate-by-gate)

**Status:** Ready to execute — 2026-06-27 (session `build-1`)
**Expands:** `docs/implementation-plan-v1.md` §7, Phase 4 (lines 319–337)
**Binding spec:** `docs/app-spec-v1.md` §5.3
**Builds on:** Phase 3 (musician names already call `selectMusician(name_slug)`)

> **Phase 4 goal, one sentence:** Clicking a musician name opens a D3 force-directed
> Personnel Network **scoped to that musician** — a legible star: the musician centered,
> their canon albums radiating out, and the co-personnel who share those albums as
> secondary nodes — where clicking an album opens its Deep Dive and clicking a secondary
> musician re-scopes the graph (the "follow the Paul Chambers thread" move).

## Data (from network.json, surveyed 2026-06-27)
- `musicians[]` (305): `{ person_id, canonical_name, name_slug, instruments[], album_ids[] }`
- `albums[]` (100): `{ album_id, title, year }`
- `edges[]` (209): `{ person_a, person_b, shared_albums }` (musician↔musician, shared≥2)
- Paul Chambers: 13 albums — the canonical hub for sanity-checking.

## Scoped graph model (spec §5.3)
For a center musician M (by `name_slug`):
- **Album nodes** = M's `album_ids` (resolve title/year from `albums`). Larger nodes.
- **Secondary musician nodes** = every *other* musician whose `album_ids` intersect M's.
- **Links** = musician→album ("played on") for each musician node × each album node they're on.
- Node ids are namespaced (`m:{slug}` / `a:{album_id}`) so musicians and albums never collide.

### Visual encodings — what we CAN do faithfully from this data
- **Secondary musician node size ∝ shared-album count with the center** (how many of M's
  albums they appear on). Center node largest.
- **Album node size ∝ how many of the graph's musicians play on it.**
- Instrument shown on hover for musician nodes.

### ⚠️ Known gap — epistemic on edges (spec §5.3) is DEFERRED
The spec wants edges styled solid/dashed/dotted by epistemic. `network.json` carries **no
per-link epistemic** (it's musician↔album adjacency only). We will NOT fake it (epistemic
honesty rule). Edges render uniform ("played on") in this phase. Faithful epistemic edges
require an `export.py` change to emit per-(musician,album) epistemic into the network export
— logged as a Phase 5 / data-pipeline item. The Deep Dive (Phase 3) still carries epistemic
faithfully, so no information is laundered; the network just omits an encoding rather than
inventing one.

## Dependencies (D3 — pre-approved as non-negotiable in CLAUDE.md/spec)
Install only the submodules needed, to keep the bundle lean (per the plan):
`d3-force`, `d3-selection`, `d3-drag`, `d3-zoom`. (Scales computed by hand — no `d3-scale`.)

## Files this phase adds/changes
```
src/lib/data/network.js              NEW  getNetwork() + buildScopedGraph(slug) [pure-ish]
src/lib/data/network.test.js         NEW  TDD the scoping
src/lib/graph/force.js               NEW  D3 force simulation over {nodes,links} (isolated)
src/lib/stores/ui.js                 EDIT add clearMusician()
src/lib/components/PersonnelNetwork.svelte  NEW  owns its <svg>; D3 lives ONLY here
src/routes/+page.svelte              EDIT mount <PersonnelNetwork/> (shows when a musician is selected)
```
**Lane discipline (the key architecture):** Svelte owns app state + when the panel shows;
D3 owns the force sim + drawing inside one `<svg>` it fully controls. They meet only at
`PersonnelNetwork.svelte`. D3 never touches DOM that Svelte manages.

## Gate 1 — Scoped graph, test-first (RED → GREEN)
`network.test.js` against the real data:
- `buildScopedGraph('paul-chambers')` → exactly one center node (`isCenter`), 13 album nodes,
  ≥1 secondary musician; center node id is `m:paul-chambers`.
- Every link connects a musician node to an album node (never musician→musician or
  album→album), and only to albums in that musician's `album_ids`.
- Every secondary musician shares ≥1 album with the center.
- Unknown slug throws.
Then write `network.js`. `npm run test` green.

✋ **STOP — scoping logic green before any D3.**

## Gate 2 — D3 force + the component
- `npm i -D d3-force d3-selection d3-drag d3-zoom`.
- `graph/force.js`: a pure function that, given `{nodes, links}` and a size, configures a
  `forceSimulation` (link + charge + center + collision) and returns it (caller owns ticks).
- `PersonnelNetwork.svelte`: creates one `<svg>`; on mount/selection builds the scoped graph,
  starts the sim, draws nodes+links, updates positions on tick; drag + zoom/pan via D3;
  cleans up the sim on destroy/re-scope. Star topology, not a hairball.

✋ **STOP — component compiles; `svelte-check` clean; `npm run build` ok.**

## Gate 3 — Interactions + wire-in
- Store: add `clearMusician()`.
- Panel shows when `$selectedMusician` is set (overlay; timeline/deep-dive behind).
- **Click album node** → `selectAlbum(album_id)` + `clearMusician()` → its Deep Dive opens.
- **Click secondary musician node** → `selectMusician(slug)` → graph re-scopes.
- Dismiss (button + Esc) → `clearMusician()` → back to timeline (or deep dive if still open).
- Mount `<PersonnelNetwork/>` in `+page.svelte`.

**Headless CLI verification:** `npm run check` 0/0 · `npm run test` green (incl. scoping) ·
`npm run build` ok. (Graph is canvas/SVG client-rendered — interactive proof = John on Mac.)

✋ **STOP — John reviews on the Mac (`http://vps8-core:5173`):** open a Deep Dive → click a
musician (try Paul Chambers) → legible star; drag/zoom work; click an album node → its Deep
Dive opens; click a secondary musician → re-scopes; dismiss returns cleanly.

## Gate 4 — Lock in
`check` 0/0 · `test` green · `build` ok. Commit is John's.

**Phase 4 DoD:**
- [ ] Musician click opens a force graph scoped to that musician (star, legible)
- [ ] Album nodes larger; secondary-musician size ∝ shared albums with center; instrument on hover
- [ ] Album-node click → Deep Dive; secondary-musician click → re-scope; dismiss → timeline
- [ ] D3 isolated to force.js + PersonnelNetwork.svelte; check/test/build green; light theme
- [ ] Epistemic-on-edges explicitly deferred (documented), not faked

## Out of scope (guardrails)
No full-network "show everything" view (deferred, hairball). No epistemic edge styling yet
(needs export.py change). No new timeline/panel features.
