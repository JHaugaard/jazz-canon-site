# Phase 3 — Build Script (test-first, gate-by-gate)

**Status:** Ready to execute — 2026-06-27 (session `build-1`)
**Expands:** `docs/implementation-plan-v1.md` §7, Phase 3 (lines 299–317)
**Binding spec:** `docs/app-spec-v1.md` §5.2 (+ §3 epistemic rules)
**Builds on:** Phase 2 (timeline; card click already sets `selectedAlbumId`)

> **Phase 3 goal, one sentence:** Clicking a timeline card slides in a right-hand Album
> Deep Dive panel (timeline stays put behind it) showing header, optional Apple Music
> out-link, optional editorial description, recording info, the full tracklist with
> per-track personnel, and a collapsed full-personnel list — every personnel fact carrying
> a **visually distinct epistemic label** (obs / inf / unk).

## Data facts (surveyed 2026-06-27, drives the null-handling)
- Epistemic in data: `obs` (618) + `unk` (9). **No `inf` yet** — badge still supports all 3.
- **0 albums have a description** → the editorial-note block is built but dormant (conditional).
- 4 albums have no studios; 3 have no `apple_album_id` → both degrade gracefully.
- Deep-dive shape per `data/album/{slug}.json`: header (+`studios[]`), `personnel[]`,
  `tracks[]` each with its own `personnel[]`. Performer = `{person_id, canonical_name,
  name_slug, instrument, epistemic}`.

## Epistemic treatment (spec §3 — non-negotiable, single source of truth)
- `obs` — normal weight (subtle tag).
- `inf` — muted / italic.
- `unk` — visually distinct + `?` marker.
One module owns the mapping so it can never drift: `src/lib/epistemic.js` →
`epistemicMeta(code)` returns `{ code, short, title, cls }`. `EpistemicBadge.svelte` and the
personnel rows both consume it.

## Files this phase adds/changes
```
src/lib/epistemic.js                     NEW  obs/inf/unk → {short,title,cls} (single source)
src/lib/epistemic.test.js                NEW  TDD the mapping incl. unknown→unk fallback
src/lib/data/albums.js                   EDIT add loadAlbum(slug) lazy loader + AlbumDetail typedef
src/lib/data/album-load.test.js          NEW  TDD loadAlbum (Kind of Blue) + unknown-slug reject
src/lib/stores/ui.js                     EDIT add clearSelection(); selectMusician() stub (Phase 4)
src/lib/components/EpistemicBadge.svelte NEW  the obs/inf/unk visual, one place
src/lib/components/AppleMusicLink.svelte NEW  v1 out-link; future MusicKit mount point
src/lib/components/PersonnelList.svelte  NEW  de-duped full personnel, collapsed (<details>)
src/lib/components/Tracklist.svelte      NEW  tracks + per-track personnel, badges, clickable names
src/lib/components/DeepDivePanel.svelte  NEW  slide-in; lazy-loads on selection; dismiss
src/routes/+page.svelte                  EDIT mount <DeepDivePanel/> alongside <Timeline/>
```

## Gate 1 — Pure logic, test-first (RED → GREEN)
- `epistemic.test.js`: obs/inf/unk each give a distinct `cls` and a non-empty `title`;
  an unrecognized code falls back to the `unk` treatment. → write `epistemic.js`.
- `album-load.test.js`: `loadAlbum('miles-davis-kind-of-blue-1959')` resolves to an object
  with `title === 'Kind of Blue'` and non-empty `tracks`, each track with `personnel`;
  `loadAlbum('does-not-exist')` rejects. → add `loadAlbum` (via `import.meta.glob` over
  `data/album/*.json`, lazy per-album chunks). 
- `npm run test` all green.

✋ **STOP — logic green before any panel UI.**

## Gate 2 — Leaf components
`EpistemicBadge`, `AppleMusicLink` (renders nothing when no `apple_album_id`), `PersonnelList`
(de-dupe by `person_id`+`instrument`, `<details>` collapsed by default). `svelte-check` clean.

## Gate 3 — Tracklist
Each track: number · title · `duration_text` (if any). Under it, its personnel as
`name — instrument` + `EpistemicBadge`; `inf` names italic/muted, `unk` distinct. Musician
names are **buttons** calling `selectMusician(name_slug)` (a Phase-4 stub now). `svelte-check` clean.

## Gate 4 — DeepDivePanel + wire-in
Subscribes to `selectedAlbumId`; on change, `loadAlbum(slug)` with loading + error states;
slides in from the right over the timeline (fixed, high z-index, backdrop optional); dismiss
(button + Esc) calls `clearSelection()`. Renders: header (cover, title, artist,
year·label·catalog, style) → `AppleMusicLink` → description **labeled "Editorial note"**
(only if present) → recording dates + studios (graceful when missing) → `Tracklist` →
`PersonnelList`. Mount in `+page.svelte`.

**Headless CLI verification:**
```bash
npm run check          # 0/0
npm run test           # all green incl. loadAlbum
npm run build          # static build ok
# Panel content is client-rendered on click, so it won't be in prerendered HTML;
# the loadAlbum test is the data proof. Interactive proof = John on the Mac.
```

✋ **STOP — John reviews on the Mac (`npm run dev`):** click a card → panel slides in over
the timeline; epistemic labels visibly differ; missing studio/apple/description degrade
cleanly; dismiss returns to the timeline with position kept; clicking a musician name
doesn't error (no-op until Phase 4).

## Gate 5 — Lock in
`check` 0/0 · `test` green · `build` green. Commit is John's.

**Phase 3 DoD:**
- [ ] Card click → right slide-in panel; timeline stays put behind; dismiss restores
- [ ] Header, recording info, full tracklist w/ per-track personnel, collapsed full personnel
- [ ] Epistemic obs/inf/unk visually distinct everywhere personnel appear (one source)
- [ ] Apple Music out-link only when id present; description only when present (labeled editorial)
- [ ] Musician names clickable (stub) ready for Phase 4; check/test/build green; light theme

## Out of scope (guardrails)
No D3 / Personnel Network (Phase 4) — musician click is a stub. No MusicKit playback (out-link
only). No search, no instrument filter.
