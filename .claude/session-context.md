# Session Context

## Status (2026-06-30)
**jazz-canon-site** — public discovery app for *A Jazz Canon* (100 albums, 1949–1972).
Static SvelteKit + adapter-static, plain JS+JSDoc, D3 graph, Cloudflare Pages target.
v1 is functionally complete: Phases 0–4 built, timeline redesigned, design spec applied,
and **Apple Music fully integrated** (previews for everyone + full-album playback for
subscribers). John is now on the **logo & typeface** pass — "getting close to something
showable." Build/DB work is parked clean.

## Apple Music integration — DONE (Steps 1–3, committed + pushed)
- **Step 1 — previews data:** `scripts/apple_previews.py` signs an ES256 dev token from the
  `.p8`, fetches each album from the Apple catalog API, title-matches tracks (robust to
  reorder / featuring-credits / remaster suffixes; coverage sanity-net), and bakes
  `preview_url` (+ backfills `apple_track_id`) into `data/album/*.json`. Decoupled from
  `export.py` (previews are volatile cache, re-run AFTER export).
- **Step 2 — per-track previews:** ▶ button per track (`PreviewButton.svelte` +
  `stores/preview.js`, single-active, 7 tests). **Graceful: never a dead button** — no
  `preview_url` → no button; runtime failure → button self-removes.
- **Step 3 — full playback:** `src/lib/apple/musickit.js` lazy-loads MusicKit v3, configures
  with the baked `PUBLIC_APPLE_DEV_TOKEN`, authorizes, `setQueue({album})` + play.
  `AppleFullPlayback.svelte` = visible player (prev/play-pause/next, progress, time,
  now-playing) in the Deep Dive. Detects the 30s-preview fallback and explains why.
- **Coverage: 640/666 tracks** have previews. The rest are expected gaps: Lee Konitz
  *Subconscious-Lee* (13, not in Apple catalog), MJQ *Django* (8, no standalone album → NULL),
  ~5 genuine bonus tracks.
- **⚠️ Full (DRM) playback needs a secure context (https/localhost).** Over the plain-http dev
  URL it serves 30s previews by design — UNVERIFIED end-to-end until tested over HTTPS
  (e.g. `tailscale serve`, or the prod deploy). Subscriber account also required.
- **Token rotation (the recurring chore):** `PUBLIC_APPLE_DEV_TOKEN` baked at build, **expires
  2026-12-27**. Rotate with `scripts/gen_dev_token.py --write`; runbook in
  **`docs/apple-token-rotation.md`** (linked from the SOP); runtime console warning at ≤14 days.
  Prod must set `PUBLIC_APPLE_DEV_TOKEN` in the host build env.

## Data SSOT — settled
- **Canonical data is authored ONLY in mccoy-tyner** (the `_jazzcanon` Postgres DB is the SSOT).
  jazz-canon-site is a **read-only consumer** of committed JSON. Repo naming: local dir
  `mccoy-tyner` = GitHub `mccoy-tyner-project`. **If asked to edit a fact in the site repo,
  PAUSE and redirect to mccoy-tyner.** See [[data-changes-go-through-mccoy-tyner]].
- `export.py` (DB → site JSON) physically still lives in `site/scripts/`; the move to
  mccoy-tyner is decided but not yet executed. Flow order: `export.py` → `apple_previews.py`
  (export wipes `preview_url`). Both are OK to run in the site (they consume/cache the SSOT).
- **5 problem albums resolved (DB + site JSON match):** Ahmad Jamal `1445769114`, Jackie McLean
  `1442859687`, Gerry Mulligan `1460621783`; Konitz + Django correctly NULL.
- **Bill Evans *Waltz for Debby*:** apple_album_id points to expanded edition — confirmed 6/6
  title-match (canonical tracks all have previews), no action needed. Link-out lands on
  remaster with bonus takes, which is a cosmetic non-issue.

## The app (Phases 0–4)
- **Data** (`data/`): albums.json (100), album/{slug}.json (100, lazy via `import.meta.glob`),
  network.json (bipartite musician graph, per-link `album_refs` epistemic), musicians.json.
- **Timeline** (`Timeline`/`EraBands`/`YearAxis`/`YearStack`/`AlbumCard`, geometry in pure
  `timeline-layout.js` w/ tests): **year-block strip** (each year's width = its 3-wide card
  grid), proportional axis, one horizontal scroll. **Full-height years**; multi-row years show a
  top-right **"More ↓"** badge gated by an IntersectionObserver below-fold check. Swim-lane era
  bands · large year numerals · ~200px album covers.
- **Deep Dive** (`DeepDivePanel` + `Tracklist`/`PersonnelList`/`AppleMusicLink`/
  `AppleFullPlayback`/`PreviewButton`/`EpistemicBadge`): slide-in; per-track personnel + ▶
  previews; epistemic obs/inf/unk single-sourced in `epistemic.js`; Apple link + full player.
- **Hero graph** (`PersonnelNetwork` + `graph/force.js`), branded **"Constellation"**: D3 force
  graph scoped to a musician; album-node → Deep Dive; musician-node → re-scope. Edges flattened
  (edge-epistemic deferred for v1).

## Design — logo locked, typeface/header IN PROGRESS (John's current focus)
- **Logo FINALIZED & LOCKED** (`d2b651d`): concept-4b "Shelf & Record" — 8px spines, 4 left/5
  right, 8° amber leaner, 6 grooves, record flush to oval. Brand assets in **`docs/brand/`**
  (mark, favicon, h/v lockups, `index.html`). **Light-only, no dark variants.** See
  [[logo-concept-4-shelf-record]].
- Fonts in code: Archivo Narrow (display) / Inter (body) / Lora (serif). John is refining the
  **typeface** choice now (`docs/type-specimen.html` is his scratch); plus wordmark lockup,
  favicon export + wiring into the app, OG image — all in this design pass.
- Tokens: `--bn-blue / --bn-blue-light / --impulse-amber`, era-band palette, amber epistemic.

## Repo / ops
- GitHub `github.com/JHaugaard/jazz-canon-site`, branch `main`, **in sync with origin**
  (head `f6403c6`). Recent: Step 3 playback, data-fix flow (3 ids + preview restore), SOP.
- **Uncommitted = John's live design work only** (`app.css`, `+page.svelte`, `about/+page.svelte`,
  `docs/brand/*`, `docs/type-specimen.html`, this file). Build/DB tree is clean.
- **Secrets clean:** `.env.local` ignored; `secrets/` + `*.p8` ignored; the MusicKit `.p8` lives
  in `secrets/AuthKey_64D3G9K5N8.p8` (never committed); Apple Team ID scrubbed from history.

## Dev workflow + gotchas ([[vps8-dev-server-workflow]])
- `npm run dev -- --host --port 5173` on vps8 → `http://vps8-core:5173` (HMR live for design).
- **Don't launch the dev server with a trailing `&`** from the Bash tool — it hangs the call.
  Use the tool's background mode instead.
- Don't run `check`/`build` while the dev server runs (svelte-kit sync → reload loop).
  After `npm install`, `rm -rf node_modules/.vite` if it hangs.
- John works from his Mac over Tailscale; he may also commit in this same repo dir concurrently
  — stage only specific files (never `git add -A`) to avoid sweeping in his in-progress work.

## Open items (post-design, before/at v1 ship)
- **Verify full playback over HTTPS** (secure context) — the one Apple piece untested e2e.
- **Per-track full play** — currently album-level only; per-track full playback is a deferred
  enhancement.
- **Meta description** still says "Personnel Network" → update to "Constellation".
- **Phase 5 a11y polish** — `docs/phase5-a11y-and-states-briefing.md` (keyboard/focus for panels
  + graph; empty/missing states); 2 decisions pending (graph fallback; WCAG 2.1 AA vs lighter).
- **Hosting** not finalized (Cloudflare Pages leaning; baked token is host-agnostic). On deploy,
  set `PUBLIC_APPLE_DEV_TOKEN` in the host build env.
- "Listen on Apple Music" filled button → blue text link (spec) pending John's preference.
- [[era-bands-vs-genre-labels-tension]] still unresolved.

## Memories
[[data-changes-go-through-mccoy-tyner]] · [[logo-concept-4-shelf-record]] · [[site-design-direction]] ·
[[era-bands-vs-genre-labels-tension]] · [[vps8-dev-server-workflow]]
