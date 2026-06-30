# Session Context

## Status (2026-06-29)
**jazz-canon-site** — public discovery app for *A Jazz Canon* (100 albums, 1949–1972).
Static SvelteKit + adapter-static, plain JS+JSDoc, D3 graph, Cloudflare Pages target.
v1 is functionally built (Phases 0–4), the timeline was redesigned, and the design spec is
now applied in code. A **design / look-and-feel pass is wrapping**; John is starting a
**build session** next for structural/logic work.

- **Uncommitted:** everything since the GitHub push (head `a911a2b`) is local working-tree
  only — the whole design pass + timeline redesign. Consider committing early in the build session.
- **Running:** app dev server on vps8 `:5173` (`npm run dev -- --host`) → Mac at
  `http://vps8-core:5173`. (Logo-preview `:8080` was stopped.)

## Monday-evening design round (2026-06-29 PM) — from `docs/design-monday-evening.md`
Done (check 0/0 · tests 24 · build green; both servers up — app :5173, logo gallery :8080):
- **Personnel Network edges FLATTENED** — removed epistemic dash styling; plain lines (spec
  defers edge-epistemic for v1). `dashFor` removed.
- **"More ↓" pill fixed** — was firing on every rows≥2 year even when fully visible (see
  `more-pill-1956.png`). Now gated by a real **IntersectionObserver below-the-fold check**
  (bottom sentinel per block) AND rows≥2 — appears only when the block truly runs off-screen.
- **Timeline COLS_MAX 4→3** — compacts the L→R spread (canon grows rightward); more years
  become genuinely tall. (maxRows now 4 → taller card area; John accepts the verticality.)
- **Logo refined → `concept-4b-shelf-record.svg`** (original 4 preserved): spines 12→10,
  regrouped 4 left / 5 right, lean 18°→15° (gap 65→54, geometry preserved), play triangle
  moved to the right group's first spine. Blind-computed geometry — **needs John's eye**.
  Compare at `http://vps8-core:8080/logo-concepts/concept-4b.html`.
- **Phase 5 briefing written** — `docs/phase5-a11y-and-states-briefing.md` (point-by-point;
  2 decisions pending: A3 graph fallback approach; WCAG 2.1 AA vs lighter bar).

PENDING John's decision (NOT changed): **export.py SSOT** — my take is in chat; recommend the
data-platform (`mccoy-tyner`) becomes the single home, site repos consume committed JSON.
Do NOT do the edge-epistemic best-vs-cautious flip until the SSOT home is settled (the
`album_refs` change currently lives ONLY in the site copy; `-kc` copy has diverged).

## The app (Phases 0–4)
- **Data** (`data/`): albums.json (100), album/{slug}.json (100, lazy via `import.meta.glob`),
  network.json (305 musicians / 209 edges, per-link `album_refs` epistemic), musicians.json.
- **Timeline** (`Timeline`/`EraBands`/`YearAxis`/`YearStack`/`AlbumCard`, geometry in pure
  `timeline-layout.js` w/ tests): **year-block strip** — each year's width = its 4-wide card
  grid; cards on a proportional axis; one horizontal scroll. **Full-height years** (no cap);
  multi-row years show a top-right **"More ↓"** badge. Three layers: swim-lane era bands
  (sliding labels) · year axis (large numerals) · album cards (~200px covers).
- **Deep Dive** (`DeepDivePanel` + `Tracklist`/`PersonnelList`/`AppleMusicLink`/`EpistemicBadge`):
  slide-in; per-track personnel; epistemic obs/inf/unk single-sourced in `epistemic.js`.
- **Hero graph** (`PersonnelNetwork` + `graph/force.js`), branded **"Constellation"**: D3
  force graph scoped to a musician; album-node → Deep Dive; musician-node → re-scope.

## Design pass — done (2026-06-29)
- Design spec reconciled into `docs/design-spec-v1.md` (retired `--accent-red`; epistemic →
  §2.4 amber family, weight+marker not hue) and **applied in code**: fonts (Archivo Narrow /
  Inter / Lora), tokens `--bn-blue / --bn-blue-light / --impulse-amber / --sp-5`, era-band
  palette, EpistemicBadge amber.
- Timeline: opacity fade **removed** (covers 100%); **full-height** years + **"More ↓"** badge;
  year-axis numerals **2×**; removed the confusing "·count" by the date.
- Personnel Network: removed "Personnel Network" kicker; **"Constellation"** label (singular)
  top-left of the field, enlarged **~2×** (signature concept); modal enlarged; labels always on.
- **About page** stubbed at `/about` + header "About" link.
- Logo **concept 4 "Shelf & Record"** designed (`docs/logo-concepts/concept-4*`), "being lived with".

## → NEXT: build session (what John is doing now)
- **Edge-epistemic semantics** — confirm "best/most-certain credit wins" (current) vs
  "most-cautious"; one-line flip in `export.py` (`min`↔`max` rank) + re-run export.
- **Personnel Network edges** — spec defers edge-epistemic for v1 (weight only); decide
  whether to flatten the faint obs/inf/unk dashes to plain lines.
- **Phase 5 logic polish** — accessibility (keyboard/focus for panels + graph); empty/missing
  states vs real nulls (4 albums no studio, 3 no apple_id).
- **Commit** the uncommitted design + build work when ready.

## Open design follow-ups (for the later logo/header pass)
- **Logo + header** (John returning to this): wordmark lockup (A JAZZ CANON, Archivo Narrow),
  simplified favicon glyph, reversed/white variant; concept-4 levers — spine 11px / lean 16° /
  gap 3px. See [[logo-concept-4-shelf-record]].
- "Listen on Apple Music" — filled button → blue **text link** (spec) pending John's preference.
- **Meta description** still says "Personnel Network" → update when the name is locked
  (Constellation vs Constellations; currently singular).
- [[era-bands-vs-genre-labels-tension]] still unresolved.

## Repo / ops
- GitHub `github.com/JHaugaard/jazz-canon-site`, branch `main` (head `a911a2b`). Future: plain
  `git push`; branch off `main` for features; commits/pushes on John's say-so.
- **Secrets clean:** `.env.local` ignored; `.env.example` placeholders only; Apple Team ID
  fully scrubbed from history + local clone. Real secret (`.p8`) never in repo.

## Dev workflow + gotchas ([[vps8-dev-server-workflow]])
`npm run dev -- --host` on vps8 → `http://vps8-core:5173`. Don't run `check`/`build` while the
dev server runs (svelte-kit sync → reload loop). After `npm install`, `rm -rf node_modules/.vite`
if the server hangs. Relaunch logo gallery: `python3 -m http.server 8080 --bind 0.0.0.0
--directory docs` → `/logo-concepts/`.

## Memories
[[site-design-direction]] · [[logo-concept-4-shelf-record]] · [[era-bands-vs-genre-labels-tension]] · [[vps8-dev-server-workflow]]
