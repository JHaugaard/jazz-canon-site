# Session Context — `build-1`

**Project:** jazz-canon-site — public discovery app for *A Jazz Canon* (100 albums,
1949–1972). Static SvelteKit + adapter-static, plain JS+JSDoc, D3 for the network graph,
Cloudflare Pages target (deploy gated). Data = pre-exported JSON in `data/`.

**Status (2026-06-29):** v1 is **functionally built end-to-end and verified green**
(`npm run check` 0/0 · `npm run test` 28→25 passing · `npm run build` static output).
Session `build-1` is complete pending visual review + the design pass. A new **design
session** is being created next.

---

## What was built (Phases 0–4 + a timeline redesign)

- **Phase 0** — data export validated; `data/` = albums.json (100), album/{slug}.json (100,
  lazy-loaded), network.json (305 musicians / 209 edges, now with per-link `album_refs`
  epistemic), musicians.json.
- **Phase 1** — SvelteKit scaffold; `$data` alias → repo-root `data/`; prerender; loader
  `src/lib/data/albums.js` (TDD).
- **Phase 2 → REDESIGNED (2026-06-28)** — the timeline. Now a **year-block strip**: each
  year's width = its card grid (1–4 cols by album count; empty years thin gap), cards on a
  proportional axis, one horizontal scroll, opacity by distance from the viewport-center
  year. Three layers: **swim-lane era bands** (4 lanes, ~20% overlap, sliding labels) ·
  **proportional year axis** · **4-wide album-card grid** (cover ~200px; tall years capped
  ~560px + scroll-within). Geometry in `src/lib/timeline-layout.js` (pure, TDD); components
  `Timeline` / `EraBands` / `YearAxis` / `YearStack` / `AlbumCard`. (Old `timeline.js`
  deleted.)
- **Phase 3** — Album Deep Dive slide-in (`DeepDivePanel` + `Tracklist`, `PersonnelList`,
  `AppleMusicLink`, `EpistemicBadge`). Epistemic obs/inf/unk in one source (`epistemic.js`);
  lazy `loadAlbum` via `import.meta.glob`.
- **Phase 4** — the hero graph (provisionally **"Constellations"**, see below): D3
  force-directed, scoped to a clicked musician (star topology), drag/zoom, album-node →
  Deep Dive, musician-node → re-scope. D3 fenced to `graph/force.js` + `PersonnelNetwork.svelte`.
  Epistemic **edges** wired (solid=obs / dashed=inf / dotted=unk) + legend.

Per-phase build scripts: `docs/phase{1,2,3,4}-build-script.md`. Binding spec:
`docs/app-spec-v1.md`. Plan: `docs/implementation-plan-v1.md`.

---

## Open items / decisions pending

- **Visual review** of the timeline redesign on the Mac (sizing/opacity/lane overlap/
  sliding-label feel) — not yet confirmed.
- **Edge-epistemic semantics** — currently "best/most-certain credit on the album" wins
  (obs>inf>unk). John to confirm vs. "most-cautious." One-line flip in `export.py`.
- **Feature naming** — "Personnel Network" → too HR. **PENCILLED: "Constellations"**
  (action verb "follow the thread"; runner-up "Roll Call"). Confirm with the design spec,
  then rename in `PersonnelNetwork.svelte`.
- **Logo** — 3 concepts preserved in `docs/logo-concepts/` (+ NOTES.md, gallery). Lead =
  "Sound Lens." Refinement (palette reconcile, outlined type, reversed variant, favicon)
  waits on the design spec.
- **Not committed** — entire build + `data/*.json` are uncommitted (commits are John's).
- **Phase 5 backlog** — a11y; genre-vs-year-range tension ([[era-bands-vs-genre-labels-tension]]);
  timeline density ideas (`docs/timeline-density-ideas.md`).

---

## → NEXT: design session

John brings the **full site design spec** (colors, typefaces, everything except logo) drawn
from **Blue Note / Prestige / Columbia** album-cover-art vibe. Work: reconcile `app.css`
tokens + timeline/redesign styling + the logo to it, and lock "Constellations." Current
light-theme tokens in `app.css` are **placeholder — will be superseded.** See memory
[[site-design-direction]].

## Dev / view workflow (headless vps8 + Mac over Tailscale)
`npm run dev -- --host` on vps8 → Mac browser at `http://vps8-core:5173`. Gotchas:
don't run `check`/`build` while dev runs (reload loop); after `npm install`, `rm -rf
node_modules/.vite` if the server hangs. See [[vps8-dev-server-workflow]]. (Background dev
server from this session may be stopped during tidy-up; relaunch as above.)
