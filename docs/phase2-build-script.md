# Phase 2 — Build Script (test-first, gate-by-gate)

**Status:** Ready to execute — 2026-06-27 (session `build-1`)
**Expands:** `docs/implementation-plan-v1.md` §7, Phase 2 (lines 283–297)
**Binding spec:** `docs/app-spec-v1.md` §5.1
**Builds on:** Phase 1 (loader + static pipeline, all green)

> **Phase 2 goal, one sentence:** Replace the plain `<ul>` with the spec §5.1 homepage —
> a horizontal, **proportional** year-axis timeline of all 100 albums, with the four
> overlapping era bands behind it, styled in the light theme. Clicking a card records a
> selection (the panel itself is Phase 3).

**Decided design (John, 2026-06-27):** *Proportional time axis* — cards sit at their exact
spot on a continuous year scale, so sparse stretches look sparse and 1958–61 visibly
clusters. Overlapping cards stack into vertical lanes.

---

## Layout model (the core idea)

One pure module owns all geometry so it's testable and the components stay dumb:

- `xForYear(year) = (year − AXIS_MIN) × PX_PER_YEAR` — horizontal position.
- Constants: `AXIS_MIN = 1949`, `AXIS_MAX = 1973` (pad the 1950–1972 data), `PX_PER_YEAR`,
  `CARD_W`. Total scroll width = `(AXIS_MAX − AXIS_MIN) × PX_PER_YEAR`.
- **Lane stacking:** cards whose x-ranges overlap (within `CARD_W`) get pushed to the next
  vertical lane — greedy assignment in year order. This is how dense years pile up without
  hiding each other.
- **Era bands** are positioned with the *same* `xForYear`, so bands and cards always align:
  Cool 1949–1958, Hard Bop 1955–1965, Modal 1958–1972, Post-Bop 1962–1968. Bands overlap
  on purpose (historically accurate); labels stay pinned and readable.

`style_display` on a card (incl. "Soul Jazz") is the per-album label — **not** an era band.
Soul Jazz albums sit visually within the Hard Bop era; that's correct, bands ≠ style labels.

---

## Files this phase adds/changes

```
src/app.css                         NEW  light-theme design tokens + base + era colors
src/routes/+layout.svelte           EDIT import './app.css' once, globally
src/lib/timeline.js                 NEW  pure geometry: xForYear, width, lanes, bands, ticks
src/lib/timeline.test.js            NEW  TDD for the geometry
src/lib/stores/ui.js                NEW  selection state (selectedAlbumId)
src/lib/components/EraBands.svelte  NEW  four overlapping colored bands + pinned labels
src/lib/components/AlbumCard.svelte NEW  cover (with fallback), title, artist, year badge, style
src/lib/components/Timeline.svelte  NEW  scroll container, year axis, places bands + cards
src/routes/+page.svelte             EDIT render <Timeline {albums} />
```

---

## Gate 1 — Geometry, test-first (RED → GREEN)

`src/lib/timeline.test.js` pins the math before any pixels exist:

- `xForYear(1949)` is 0; `xForYear(1959)` = `10 × PX_PER_YEAR`.
- `layout(albums)` returns one entry per album (100), each with numeric `x` and integer
  `lane ≥ 0`; two albums in the **same year** get **different lanes**; a lone album in a
  sparse year gets `lane 0`.
- `eraBands()` returns the four named bands, each with `x` and `width > 0`, ordered.

Then write `src/lib/timeline.js` to pass. `npm run test` → all green.

✋ **STOP — geometry green before drawing anything.**

## Gate 2 — Light-theme tokens

`src/app.css`: CSS custom properties (`--bg`, `--ink`, `--muted`, type scale, spacing) on a
**light** background; four era colors as low-saturation translucent tints. Imported once in
`+layout.svelte`. No component styling yet beyond base.

✋ **STOP — confirm tokens load (build succeeds, page still lists albums).**

## Gate 3 — EraBands + AlbumCard (pieces, not yet placed)

- `AlbumCard.svelte`: `<img>` cover with graceful fallback (alt + neutral box if no URL),
  title, artist, **year badge bottom-left over the art**, `style_display` label. Click →
  `ui.selectAlbum(album.id)`.
- `EraBands.svelte`: absolutely-positioned translucent bands via `xForYear`; labels pinned
  so they stay readable regardless of horizontal scroll.

✋ **STOP — components compile (svelte-check clean).**

## Gate 4 — Timeline assembly

`Timeline.svelte`: a horizontally-scrolling container `width = timelineWidth()`; `EraBands`
behind (z-index low); a thin year axis with tick labels; each album rendered as an
`AlbumCard` absolutely positioned at `left: x`, `top: lane × laneHeight`. `+page.svelte`
renders `<Timeline {albums} />`.

**Headless CLI verification** (no browser):
```bash
npm run build
PAGE=build/index.html
grep -oE "Cool Jazz|Hard Bop|Modal Jazz|Post-Bop" "$PAGE" | sort -u   # 4 band labels
grep -o 'class="album-card"' "$PAGE" | wc -l                          # ~100 cards
grep -oE 'left: ?[0-9]' "$PAGE" | head                                # cards are positioned
```

✋ **STOP — John reviews on the Mac (`npm run dev`): proportional spacing reads right,
1958–61 visibly dense, era labels readable, light theme, clicking a card logs a selection.**

## Gate 5 — Lock in

`npm run test` green · `npm run build` green · `npm run check` 0/0. Commit is John's.

**Phase 2 Definition of Done:**
- [ ] Horizontal proportional timeline of all 100 albums; dense years stack into lanes
- [ ] Four overlapping era bands behind, labels always readable
- [ ] Album cards: cover (+fallback), title, artist, year badge, style label
- [ ] Clicking a card records selection in `stores/ui.js` (panel deferred to Phase 3)
- [ ] Light theme only; `check`/`test`/`build` all green

---

## Out of scope for Phase 2 (guardrails)

No Deep Dive panel (Phase 3), no D3/Personnel Network (Phase 4), no Apple Music, no search,
no instrument filter. The click only sets state; the panel that consumes it comes next.
