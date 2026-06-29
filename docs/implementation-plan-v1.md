# The Jazz Canon — v1 Implementation Plan

**Status:** Draft for review — 2026-06-27
**Companion to:** `docs/app-spec-v1.md` (the binding *what*; this is the proposed *how*)
**Mode:** Architecture decided and Phase 0 (data export + validation) **complete**. No UI
built yet — Phases 1+ await your go. No blockers remaining; `data/` ready to commit.

> **A note on altitude.** This is a *decision-and-structure* plan, written so you can
> study each choice and learn from it. Every open decision from spec §7 is made here
> with its rationale and the alternatives I rejected. The build is broken into verifiable
> phases rather than line-by-line code steps. Once you approve the stack, I can expand
> any single phase into a literal, test-first task script before we build it.

---

## 1. The one-sentence version

> Build a static, no-server Svelte site that reads four pre-exported JSON files and
> renders a scrollable timeline of the canon, a slide-in album deep-dive, and a
> D3 force-directed Personnel Network — deployed as static files to Cloudflare Pages.

---

## 2. The open decisions (spec §7), decided

You asked me to treat §7 as a clean slate and make each call with my best judgment.
Here they are, each with the reasoning so the choice is learnable, not just stated.

### Decision 1 — Serving model: **Static JSON export** (spec Option B)

**The choice:** A build-time Python script reads the database once and writes four JSON
files into the repo. The live website never touches the database. To update the site
after the canon grows, you re-run the script and redeploy.

**Why this and not PostgREST (Option A):**

| Consideration | Static JSON | PostgREST (live API) |
|---|---|---|
| Runtime dependency | None — pure files | A server process + the DB must both be up |
| Attack surface | Nothing to attack; no DB exposed to the internet | DB reachable from the web; needs auth, firewall, RLS care |
| Cost / ops | Free, nothing to maintain | A process to run, monitor, patch |
| Speed | Files on a CDN; instant | A network round-trip per query |
| Live queries / search | No — data is a snapshot | Yes |
| Fits v1's needs? | **Yes** | Overkill |

The deciding fact: **v1 has no dynamic features.** There is no search box (the timeline
*is* the navigation), no filtering, no user input — and the dataset is 100 albums that
change only when you deliberately grow the canon (a rare, offline event). A live query
engine solves problems v1 doesn't have, while adding a server you'd have to keep alive.
Static JSON is the simplest thing that fully satisfies the spec.

This also keeps a clean upgrade path: the database *views* remain the contract, so if a
future feature genuinely needs live queries, PostgREST can be added later without
redesigning the app. We're not closing the door; we're just not building the door yet.

**Good news from the code:** `scripts/export.py` already exists and already implements
this — 317 lines, querying the real `_jazzcanon` tables. We refine it, not write it.

### Decision 2 — Framework: **Svelte (via SvelteKit, static mode) + D3 for the graph**

**The choice:** SvelteKit configured with `adapter-static` (it compiles to plain static
HTML/CSS/JS — no Node server at runtime). D3's force module owns *only* the Personnel
Network's physics and SVG; Svelte owns everything else.

**Why Svelte over the alternatives:**

- **vs. vanilla JS + D3:** This app has three coordinated panels (timeline / deep-dive /
  network) whose state must stay in sync — open which panel, which album is selected,
  which musician the graph is centered on. Hand-managing that with raw DOM updates is
  exactly the kind of bug-prone bookkeeping that frameworks exist to remove. Vanilla is
  too low-level here.
- **vs. React:** React would work, but it ships a runtime library to every visitor and
  carries more boilerplate. For a personal, data-driven static site, that's weight
  without payoff.
- **Svelte** compiles your components *away* into small vanilla JS at build time — tiny
  bundles, no framework runtime, and a reactivity model that's genuinely easy to read,
  which matters for a learning solo maintainer.

**The key architectural idea to learn here:** keep Svelte and D3 in separate lanes.
Svelte manages reactive UI and application state; D3 manages the force simulation and
draws the graph's SVG. They meet at one component boundary (`PersonnelNetwork.svelte`).
Mixing them — letting D3 manipulate DOM that Svelte also controls — is the classic way
these two libraries fight each other. We avoid that by giving D3 its own `<svg>` to own.

**Sub-choice — DECIDED (2026-06-27): SvelteKit + `adapter-static`.**
Considered against plain Svelte + Vite (a simpler single-page setup with fewer concepts).
SvelteKit wins on standard tooling, first-class Cloudflare Pages support, clean
prerendering to static files, and room to grow — at the cost of a few more concepts
(routes, load functions, adapters). This is now the locked implementation target.

**D3 is non-negotiable** for the force simulation (spec §5.3, CLAUDE.md). We use only the
modules we need (`d3-force`, `d3-selection`, `d3-drag`, `d3-zoom`, `d3-scale`), not the
whole library, to keep the bundle lean.

### Decision 3 — Hosting: **Cloudflare Pages**

**The choice:** Deploy the static build to Cloudflare Pages.

**Why:** The output is static files, and Cloudflare Pages serves static files for free
on a global CDN with git-push deploys. Your domain (`jazzcanon.com`) already lives on
Cloudflare, so DNS is one step, not a migration.

- **vs. Fly.io:** Fly is for running app *processes/containers*. There's no process here.
  Using it for static files is bringing a truck to carry a letter.
- **vs. vps2 (self-host behind Caddy):** Possible, but it puts uptime, TLS, and CDN on
  you, for a site that Cloudflare will serve faster and free.

**Boundary:** Per your global rules, deploying is a human-gated action. This plan builds
the site to a *ready-to-deploy* state and stops; the actual first deploy is a separate
step you trigger (the `deploying` skill can walk it).

### Decision 4 — Export script language: **Python** (refine the existing script)

Already decided by reality: `scripts/export.py` exists, is Python, and matches the
existing `scripts/` convention (`ingest.py`, enrich scripts). We refine it, not replace.

---

## 3. Tech stack summary

| Layer | Choice |
|---|---|
| Data export | Python 3 + `psycopg2` (existing `scripts/export.py`) |
| Data serving | Static JSON files committed to the repo |
| Framework | SvelteKit + `adapter-static` |
| Graph | D3 (`d3-force` et al.), isolated to one component |
| Styling | Plain CSS with design tokens; **light theme only** (your standing rule) |
| Hosting | Cloudflare Pages (deploy is a later, gated step) |
| Build/dev host | vps8 (CLI-first), per your infra defaults |

---

## 4. Global constraints (apply to every phase)

These are copied from the spec and your rules; every task inherits them.

- **Light color scheme only.** No dark mode unless explicitly requested.
- **Epistemic honesty is non-negotiable** (spec §3). `obs` / `inf` / `unk` must be
  *visually distinct* everywhere personnel appear. Never let clean layout make an
  inference look like a fact.
- **Sourced facts vs. editorial must look different.** Personnel/dates/studios are
  sourced; descriptions, mood, "key track" are editorial and must be labeled as such.
- **The Personnel Network is always scoped** to a selected musician. No full-network
  "show everything" view in v1 (it's a hairball — deferred).
- **The timeline is the navigation.** No search box in v1.
- **Progressive disclosure** is a *consequence of the time-anchored view*, not a filter
  toggle: the viewport shows only what's temporally nearby.
- **Cover art = remote URLs** from the DB (`album_art.source_url`). No local image files
  in the repo. Render with graceful fallback when a URL is missing.
- **NULL-tolerant by design.** Some records have missing Apple IDs, studios, cover art
  (the 14 gap-fill records). The UI degrades gracefully; data is fixed on an ongoing
  basis, not as a blocker.
- **MusicKit is coming soon.** v1 ships simple out-links to Apple Music. Architect the
  Apple Music touchpoint as one swappable component so MusicKit JS slots in later
  without a rewrite.

---

## 5. File structure

What gets created, and what each piece is responsible for. (`scripts/export.py` and
`data/` already exist; everything under `src/` is new.)

```
jazz-canon-site/
├── scripts/
│   └── export.py                 # EXISTS — refine: add edge threshold, run, validate
├── data/                         # generated JSON, committed (this is the "API")
│   ├── albums.json               #   timeline list (lightweight)
│   ├── album/{slug}.json         #   one deep-dive record per album (lazy-loaded)
│   ├── network.json              #   bipartite personnel graph
│   └── musicians.json            #   person index
├── src/
│   ├── app.html                  # page shell
│   ├── app.css                   # global light-theme tokens + base styles
│   ├── routes/
│   │   ├── +layout.js            # export const prerender = true  (static build)
│   │   └── +page.svelte          # the single page; orchestrates the three panels
│   └── lib/
│       ├── data/
│       │   ├── albums.js         # load albums.json / album/{slug}.json
│       │   └── network.js        # load network.json; build a scoped sub-graph
│       ├── stores/
│       │   └── ui.js             # selection state: open panel, album, musician
│       ├── components/
│       │   ├── Timeline.svelte         # horizontal scroller, year axis
│       │   ├── EraBands.svelte         # overlapping colored era backdrop
│       │   ├── AlbumCard.svelte        # cover, title, artist, year badge, style
│       │   ├── DeepDivePanel.svelte    # slide-in album detail
│       │   ├── Tracklist.svelte        # tracks + per-track personnel
│       │   ├── PersonnelList.svelte    # de-duped full album personnel (collapsed)
│       │   ├── EpistemicBadge.svelte   # the obs/inf/unk visual treatment (one source of truth)
│       │   ├── AppleMusicLink.svelte   # v1: out-link; later: MusicKit host
│       │   └── PersonnelNetwork.svelte # D3 force sim lives here, and only here
│       └── graph/
│           └── force.js          # pure-ish D3 force setup, given nodes+links
├── static/                       # favicon, etc.
├── svelte.config.js              # adapter-static config
├── vite.config.js
└── package.json
```

**Why this shape:** files that change together live together; each component has one
job; the epistemic treatment lives in exactly one place (`EpistemicBadge.svelte`) so the
"never launder inference into fact" rule can't drift across the app; and D3 is fenced
into `graph/force.js` + `PersonnelNetwork.svelte` so it never collides with Svelte's DOM.

---

## 6. The data contract is already written

The most important thing to understand: **`scripts/export.py` already defines the exact
shape of the data**, and it queries the real tables. Reading it tells us the contract:

- `albums.json` rows: `id, title, artist_name, year, style_primary, style_display,
  label, catalog_number, cover_art_url, apple_album_id`
- `album/{slug}.json`: full header + `studios[]` + `personnel[]` + `tracks[]` (each track
  carries its own `personnel[]`). `cover_art_url` comes from `album_art.source_url` where
  `is_primary`. Track personnel correctly unions "all-tracks" performers with
  track-specific ones.
- `network.json`: `{ musicians[], albums[], edges[] }`; each musician has
  `instruments[]` and `album_ids[]`; edges are `{person_a, person_b, shared_albums}`.
- `musicians.json`: person index with `album_count`, ordered by connectedness.

The `id` field doubles as the URL-safe slug (e.g. `miles-davis-kind-of-blue-1959`), so
deep-dive files are addressable directly.

**Gap found and fixed in code (2026-06-27):** spec §6 mandates exporting only edges where
`shared_albums >= 2` via a named constant `EDGE_MIN_SHARED = 2`. The original
`export_network()` emitted *all* edges. `EDGE_MIN_SHARED = 2` and the filter are now in
`export.py`. Validation showed this drops the full edge set from **1923 → 209** (1714 of
the edges were one-off `shared==1` coincidences). ⚠️ The code is in place but the data
re-run is **blocked on a DB credential failure** (see Phase 0) — `data/network.json` on
disk still reflects the pre-threshold run until one successful re-export.

---

## 7. Build phases

Each phase ends in something you can run and see. Phases are ordered so the data is
proven before any UI is built, and the hero feature comes after its supporting pieces.

### Phase 0 — Validate the data contract — ✅ COMPLETE (2026-06-27)

**Goal:** Prove the export produces correct, complete JSON before a line of UI exists.

**Environment set up:** created `.venv` + `requirements.txt` (`psycopg2-binary`); the
export's only dependency. Run with `.venv/bin/python3 scripts/export.py`.

**Validation results (first successful run):**
- ✅ `albums.json` = **100** albums; 100 detail files; spot-check *Kind of Blue* (1959,
  modal-jazz, Columbia, cover URL + apple id) correct.
- ✅ **Cannonball Adderley dedup already fixed in the DB** — only `Cannonball Adderley`
  and `Nat Adderley` (his brother) remain; the phantom `Julian Cannonball Adderley` is
  gone. No build-side action needed.
- ✅ **Cover art: 0/100 missing** — every album has a `source_url`.
- ⚠️ **Apple Music IDs: 3/100 missing** — design the out-link's graceful fallback against
  these (Phase 3).
- ✅ label / catalog / style: 0 missing. `year` range **1950–1972**, none missing
  (recording-year anchor for the timeline holds).
- ✅ `EDGE_MIN_SHARED = 2` threshold added to `export.py`; validated to cut the full edge
  set 1923 → 209.

**Credential note (resolved):** `_jazzcanon_ro` was rotated mid-session; `.env.local`
updated and re-export succeeded. Final `network.json` = **209 edges, `min shared = 2`**,
no `shared==1` survive. Top pair Ron Carter ↔ Herbie Hancock = 7 (sanity ✓).

**Deliverable:** four JSON files in `data/`, ready to commit (John handles the commit).

### Phase 1 — Project scaffold + data flows end to end

**Goal:** A SvelteKit app that builds to static files and proves it can read the real data.

- Initialize SvelteKit with `adapter-static`; set `prerender = true`.
- Add `app.css` with light-theme design tokens (color, type scale, spacing).
- Add `lib/data/albums.js` to load `albums.json`.
- Render a bare unstyled list of all album titles + years on the page.

**Deliverable:** `npm run dev` shows 100 real album titles; `npm run build` emits static
files. No styling yet — this phase only proves the pipeline.
**Verify:** dev server lists real albums; build output is static HTML/JS.

### Phase 2 — Timeline homepage (the hero navigation)

**Goal:** The spec §5.1 timeline: horizontal, year-anchored, era bands behind it.

- `EraBands.svelte`: four overlapping colored bands (Cool / Hard Bop / Modal / Post-Bop)
  with always-readable labels; overlaps are intentional and visible.
- `AlbumCard.svelte`: cover art (with fallback for null URL), title, artist, year badge
  bottom-left, primary style label.
- `Timeline.svelte`: horizontal scroll/drag, year axis ~1949–1972, cards anchored to
  `year`, clustering where years are dense (1958–61).
- Clicking a card sets the selected album in `stores/ui.js` (panel wired in Phase 3).

**Deliverable:** a scrollable, styled timeline of the real canon with era context.
**Verify:** scroll works; cards sit at correct years; era labels stay readable; clicking
records a selection.

### Phase 3 — Album Deep Dive panel

**Goal:** Spec §5.2 — slide-in detail; timeline stays put behind it.

- `EpistemicBadge.svelte` first (single source of truth for obs/inf/unk styling).
- `DeepDivePanel.svelte`: slides in from the right; header (cover, title, artist,
  year·label·catalog, style); editorial description *labeled as editorial*; recording
  dates + studios.
- `Tracklist.svelte`: each track with number/title/duration and its per-track personnel,
  each musician carrying an epistemic badge; musician names are clickable (wired to the
  network in Phase 4).
- `PersonnelList.svelte`: full de-duped album personnel, collapsed by default.
- `AppleMusicLink.svelte`: v1 = out-link to the Apple Music album page when
  `apple_album_id` exists; structured as the future MusicKit mount point.
- `lib/data/albums.js`: add lazy load of `album/{slug}.json` on panel open.

**Deliverable:** click any card → panel slides in with full, correctly-labeled detail.
**Verify:** panel opens/closes without losing timeline position; epistemic labels are
visually distinct; missing fields (null studio/apple/art) degrade gracefully.

### Phase 4 — Personnel Network (the hero feature)

**Goal:** Spec §5.3 — D3 force-directed graph, always scoped to a clicked musician.

- `lib/data/network.js`: load `network.json`; given a musician id, build the scoped
  sub-graph (that musician centered, their albums as nodes, co-personnel as secondary
  nodes).
- `graph/force.js`: D3 force simulation (link/charge/center) over the scoped nodes+links.
- `PersonnelNetwork.svelte`: owns its own `<svg>`; renders the sim; encodings per spec —
  node size ∝ shared-album count, edge thickness ∝ `shared_albums`, instrument on
  hover, **epistemic on edges (solid=obs, dashed=inf, dotted=unk)**.
- Interactions: click an album node → opens that album's Deep Dive; click a secondary
  musician → re-scopes the graph to them (the "follow the Paul Chambers thread" move).
- Triggered by clicking a musician name in the Deep Dive (wiring the Phase 3 handles).

**Deliverable:** the core "find the hidden connection" experience works end to end.
**Verify:** opening on a musician shows a legible star topology (not a hairball);
re-centering works; album nodes route back into Deep Dive; epistemic edge styles read
correctly.

### Phase 5 — Polish & honesty pass

**Goal:** Make it trustworthy and pleasant.

- An epistemic **legend** so visitors can decode obs/inf/unk.
- Empty/loading/missing-data states reviewed against the real nulls found in Phase 0.
- Responsive behavior and basic keyboard/accessibility for panels and the graph.
- Performance sanity check on the full network JSON.

**Deliverable:** a coherent, defensible v1.
**Verify:** the four global-constraint rules (epistemic distinctness, sourced-vs-editorial,
scoped-only graph, light theme) all hold under a deliberate review.

### Phase 6 — Deploy *(gated — your call, not mine)*

Build, then deploy the static output to Cloudflare Pages and point `jazzcanon.com`.
Handled via the `deploying` skill when you decide it's ready.

### Later (not v1) — MusicKit

Swap `AppleMusicLink.svelte`'s out-link for MusicKit JS (per-track previews/playback).
The component boundary set in Phase 3 is what makes this a drop-in, not a rewrite.

---

## 8. Testing approach (so you know what "tested" means here)

- **Export script:** a small `pytest` check that the emitted JSON matches the contract
  shapes and the album count is 100 — run after Phase 0 and any export change.
- **Components:** Vitest + Svelte Testing Library for logic-bearing pieces — especially
  `network.js` scoping (correct sub-graph for a given musician) and `EpistemicBadge`
  (right treatment per label). Pure-visual layout isn't unit-tested; it's verified by eye.
- **The honesty rules** (epistemic distinctness, sourced vs. editorial) get an explicit
  manual review checkpoint in Phase 5 — they're judgment calls, not assertions.

---

## 9. What I am *not* doing in v1 (guarding scope)

Straight from spec §8, restated so we don't drift: no search box, no Venue Map, no
Comparison Matrix, no instrument filter, no sideman search, no Influence Tree, no
full-network view, no user accounts, no admin UI (that's Hermes), nothing post-Fusion.

---

## 10. Status of prior open questions

1. ✅ **SvelteKit vs. plain Svelte** — DECIDED: **SvelteKit + adapter-static** (2026-06-27).
2. ✅ **Phase 0** — RUN. Data validated; one re-export remains, blocked on the DB
   credential issue above.
3. **Still worth your study:** anything in §2's reasoning you want to push on — the three
   architecture calls are the part most worth a learning read.

**The only thing standing between this plan and Phase 1 is the `_jazzcanon_ro` credential
re-run.** Everything else is decided and ready.

---

*End of plan. Plan only — no code written. Awaiting your study and direction.*
