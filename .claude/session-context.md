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
