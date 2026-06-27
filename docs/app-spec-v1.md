# The Jazz Canon — Public App Design Spec v1.0

**Status:** Draft — 2026-06-26  
**Author:** John Haugaard  
**Intended audience:** Implementation agent (Claude Code or Kimi K2.7)

This document is the complete specification for the v1 public discovery app. It defines
*what* to build. Stack, framework, serving model, and hosting are open decisions — each
implementation agent proposes them with rationale. The spec is binding on everything else.

---

## 1. Overview

The Jazz Canon is a curated set of ~100 canonical jazz albums (post-bebop through
pre-Fusion, ~1949–1972) with track-level personnel records for every album. The data is
fully built and lives in a Postgres database (`_jazzcanon` schema on vps8-core, port 5433).

The public app is a **personal discovery tool** — for exploring the music, the musicians,
and the web of collaboration that defined an era. It is read-only, single-user in spirit
(no logins, no user-generated content), and built to be shared.

**The core value proposition, in the owner's words:**
> *"Being able to easily find the Paul Chambers nugget is just what I want to be able to do."*

Paul Chambers was the bassist on more canonical sessions than almost anyone. The app should
make that kind of hidden-connective-tissue discovery feel natural, even inevitable.

---

## 2. Scope Guardrails

**In scope:** Cool Jazz, Hard Bop, Soul Jazz, Modal Jazz, Post-Bop. Roughly 1949–1972,
but the governing test is spirit, not year: *does it swing with structure, post-bebop,
and pre-Fusion?*

**Out of scope:** Pre-1949 bebop, Free Jazz (Ornette Coleman, late Coltrane post-1965),
Fusion (Bitches Brew, 1970, is the hard marker). No contemporary jazz, no concert
listings, no transcriptions, no user accounts.

The canon is fixed at 100 albums for v1. Growth (to 130, 200, etc.) is a data-pipeline
concern, not an app-architecture concern — the app renders whatever is in the data.

---

## 3. Epistemic Rules

This is non-negotiable and must inform every design decision.

The dataset carries an `epistemic` label on every personnel fact:

| Label | Meaning | Display treatment |
|-------|---------|-------------------|
| `obs` | Directly observed (liner notes, primary source) | Normal weight |
| `inf` | Inferred (session lists, cross-references) | Italicized or muted |
| `unk` | Uncertain | Visually distinct, possibly with a `?` marker |

**Two categories of information must never look the same:**

1. **Sourced facts** (who played what, on which track, on which date, at which studio)
   — these carry epistemic labels and are the project's primary asset.
2. **Editorial interpretation** (mood tags, "influence" lineage, "key track" designations)
   — clearly labeled as editorial, visually distinct from sourced facts.

The Personnel Network (§5.3) is sourced. An Influence Tree would be editorial.
Never let tidy presentation launder opinion into fact.

---

## 4. Feature Plan

### v1 — Ships first
- Horizontal timeline homepage
- Era bands (visual context layer behind the timeline)
- Album Deep Dive panel (slide-in)
- Personnel Network panel (triggered by musician click)
- Apple Music links (per album and per track where IDs exist)

### v2 — After v1 is stable
- Venue Map (geocoded studios, Van Gelder as supernode)
- Comparison Matrix (side-by-side album attributes, shared-personnel highlight)
- Instrument filter (faceted browse by instrument family or specific instrument)
- Sideman search (musician-first entry point)

### v3 — When the data and editorial layer are ready
- Influence Tree (lineage dendrogram — requires explicit editorial tagging, clearly
  labeled as interpretation not sourced fact)

---

## 5. v1 Screens

### 5.1 Timeline Homepage

**This is the primary entry point and the main navigation metaphor.**

The user travels through time. Albums appear at their recording year. The UI is never
overwhelming because the viewport shows only what is temporally nearby.

**Layout:**
- Full-width horizontal timeline. Year axis spanning ~1949–1972.
- Album cards anchored to their recording year (`album.year`). Cards cluster at
  years with multiple recordings (1958–1961 will be visibly dense).
- Behind the timeline: overlapping colored era bands. Four bands:
  - Cool Jazz (~1949–1958)
  - Hard Bop (~1955–1965)
  - Modal Jazz (~1958–1972)
  - Post-Bop (~1962–1968)
  - Bands overlap where the eras genuinely coexist — that overlap is historically
    accurate and should be visible, not resolved.
- Era band labels are always readable regardless of scroll position.

**Album card (minimal):**
- Cover art (primary image from `album_art` table, `is_primary = true`)
- Title
- Artist name
- Year badge overlaid on the cover art (bottom-left)
- Primary style label (e.g. "Hard Bop", "Modal Jazz")

**Interaction:**
- Horizontal scroll/drag to move through time. Smooth, not paginated.
- Click an album card → opens Album Deep Dive panel (§5.2). Timeline stays in place.
- No default search box. The timeline IS the browse mechanism.

**Progressive disclosure principle:**
As the user is in the early 1950s, musicians who are active only in the late 1960s
(e.g. Keith Jarrett) should not appear anywhere in the UI. By 1970, musicians whose
careers peaked in the mid-1950s (e.g. Paul Chambers, d. 1969) recede naturally.
This is not a filter — it is the natural consequence of a time-anchored view.

---

### 5.2 Album Deep Dive Panel

**Triggered by:** clicking an album card on the timeline.  
**Behavior:** slides in from the right. The timeline remains visible and interactive
on the left. No full-page navigation. The user can dismiss the panel and continue
browsing without losing their timeline position.

**Panel contents (top to bottom):**

1. **Header block**
   - Large cover art
   - Title (prominent)
   - Artist name
   - Year · Label · Catalog number
   - Primary style

2. **Apple Music CTA** (if `apple_album_id` is populated)
   - Link out to Apple Music album page
   - Label: "Listen on Apple Music"

3. **Description** (if `album.description` is populated)
   - Editorial prose note. Visually labeled "Editorial note" to distinguish from
     sourced facts.

4. **Recording info**
   - Recording dates (`recording_dates_text`)
   - Studio name(s) (from session → studio join)

5. **Full tracklist with per-track personnel**
   - Each track: track number, title, duration (if available)
   - Under each track: the musicians on that track, with instrument and epistemic label
   - Epistemic labels rendered visually (see §3)
   - If `apple_track_id` is populated: per-track Apple Music link or preview affordance
   - Musicians are **clickable** → triggers Personnel Network (§5.3) scoped to that musician

6. **Full album personnel** (collapsed by default; expand to see all performers)
   - All performers across all tracks, de-duplicated
   - Each row: musician name + instrument(s) + epistemic label
   - Musicians are clickable → triggers Personnel Network

---

### 5.3 Personnel Network Panel

**Triggered by:** clicking a musician name in the Deep Dive panel.  
**Behavior:** opens as a panel or overlay alongside or replacing the Deep Dive. The
timeline does not need to remain visible while the network is open, but the user
should be able to return to the timeline easily (back/dismiss).

**The graph:**

Force-directed node-link graph. Two node types:

- **Album nodes** (larger): the albums in the canon that this musician played on
- **Musician nodes** (smaller): the other musicians who share at least one of those albums

Edges: musician → album ("played on")

**Default state (scoped):**
On open, the graph is scoped to the **clicked musician**. This musician is the center
node. Their albums radiate outward. The musicians who shared those albums appear as
secondary nodes. This is a star or near-star topology — legible, not a hairball.

**Interaction from the scoped graph:**
- Click an album node → opens that album's Deep Dive panel (§5.2). Allows navigation
  through the network into another album.
- Click a secondary musician node → re-centers the network on that musician. The graph
  re-scopes. This is the core "follow the thread" interaction — how you find the
  Paul Chambers nugget.

**Visual encoding:**
- Node size proportional to number of shared albums (more collaborations = larger node)
- Edge weight (thickness) proportional to `shared_albums` count from `v_sideman_network`
- Instrument shown on hover/tap for musician nodes
- Epistemic label encoded on edges: solid line = `obs`, dashed = `inf`, dotted = `unk`

**The network is not a full-graph view.** It is always scoped to a selection. A
"show full network" mode is explicitly deferred to v2 or later.

---

## 6. Data Contract

The app consumes data from the `_jazzcanon` schema. Two serving options are documented
below — **the implementation agent chooses one and proposes rationale**.

The database is Postgres 16, schema `_jazzcanon`, on `vps8-core` (Tailscale hostname),
port 5433. A read-only role `_jazzcanon_ro` exists for app access.

---

### Option A — PostgREST (live queries)

PostgREST exposes the views below as REST endpoints. The app queries them directly.
This is appropriate if the implementation agent prefers server-side flexibility or
anticipates features (free-text search, dynamic filtering) that need live queries.

**Views the app consumes:**

| View | Purpose |
|------|---------|
| `v_album_card` | Timeline album cards (id, title, artist_name, year, style_primary, track_count, personnel_count) |
| `v_collection_albums` | Albums in 'the-jazz-canon' collection, ordered by position/year |
| `v_album_detail` | Deep Dive header row (full album fields + label, style, leader name) |
| `v_album_personnel` | Deep Dive personnel list (album × person × instrument × epistemic) |
| `v_track_personnel` | Deep Dive tracklist with per-track personnel |
| `v_musician_albums` | Personnel Network: musician → their albums with instruments |
| `v_sideman_network` | Personnel Network edges: person_a, person_b, shared_albums count |
| `v_album_primary_art` | Cover art path and metadata per album |

**Additional tables read directly:**
- `album` (full record for Deep Dive)
- `track` (tracklist for Deep Dive)
- `studio` (recording venue name for Deep Dive)
- `person` (musician canonical_name, name_slug for network nodes)

---

### Option B — Static JSON export

A build-time export script reads from the DB and writes JSON files into the site's
asset directory. The live site has zero database connection. The DB is only touched
when the export script is re-run (after adding new albums).

**Required JSON files and their shapes:**

#### `data/albums.json`
Lightweight list for the timeline. Loaded once on page load.

```json
[
  {
    "id": "miles-davis-kind-of-blue-1959",
    "title": "Kind of Blue",
    "artist_name": "Miles Davis",
    "year": 1959,
    "style_primary": "modal-jazz",
    "style_display": "Modal Jazz",
    "label": "Columbia",
    "catalog_number": "CL 1355",
    "cover_art_path": "album-art/miles-davis-kind-of-blue-1959-front.jpg",
    "apple_album_id": "278229536"
  }
]
```

#### `data/album/{slug}.json`
One file per album. Lazy-loaded when the user opens a Deep Dive panel.

```json
{
  "id": "miles-davis-kind-of-blue-1959",
  "title": "Kind of Blue",
  "artist_name": "Miles Davis",
  "year": 1959,
  "label": "Columbia",
  "catalog_number": "CL 1355",
  "recording_dates_text": "March 2 and April 22, 1959",
  "description": null,
  "style_primary": "modal-jazz",
  "cover_art_path": "album-art/miles-davis-kind-of-blue-1959-front.jpg",
  "apple_album_id": "278229536",
  "studios": ["Columbia 30th Street Studio, New York City"],
  "personnel": [
    {
      "person_id": "uuid",
      "canonical_name": "Miles Davis",
      "name_slug": "miles-davis",
      "instrument": "trumpet",
      "epistemic": "obs"
    }
  ],
  "tracks": [
    {
      "track_id": "uuid",
      "title": "So What",
      "track_number": 1,
      "side": "A",
      "duration_text": "9:22",
      "apple_track_id": null,
      "personnel": [
        {
          "person_id": "uuid",
          "canonical_name": "Miles Davis",
          "name_slug": "miles-davis",
          "instrument": "trumpet",
          "epistemic": "obs"
        }
      ]
    }
  ]
}
```

#### `data/network.json`
Pre-computed bipartite graph for the Personnel Network. Loaded once.

```json
{
  "musicians": [
    {
      "person_id": "uuid",
      "canonical_name": "Paul Chambers",
      "name_slug": "paul-chambers",
      "instruments": ["double bass"],
      "album_ids": [
        "miles-davis-kind-of-blue-1959",
        "miles-davis-milestones-1958"
      ]
    }
  ],
  "albums": [
    {
      "album_id": "miles-davis-kind-of-blue-1959",
      "title": "Kind of Blue",
      "year": 1959
    }
  ],
  "edges": [
    {
      "person_a": "uuid-paul-chambers",
      "person_b": "uuid-john-coltrane",
      "shared_albums": 4
    }
  ]
}
```

#### `data/musicians.json`
Person index. Used to resolve names from IDs and for future sideman search.

```json
[
  {
    "person_id": "uuid",
    "canonical_name": "Paul Chambers",
    "name_slug": "paul-chambers",
    "instruments": ["double bass"],
    "album_count": 15
  }
]
```

**Cover art files** live at `data/album-art/{filename}` in the repo and are served as
static assets. Paths are stored in the DB (`album_art.local_path`) and written into
the JSON export.

---

## 7. Open Decisions (for the implementation agent)

The following are explicitly left open. The implementation agent must propose a choice
for each, with rationale, before or at the start of implementation.

| Decision | Options | Notes |
|----------|---------|-------|
| **Serving model** | PostgREST (Option A) or Static JSON (Option B) | Static JSON is simpler and has no runtime DB dependency; PostgREST enables future dynamic features. Either is acceptable for v1. |
| **JavaScript framework** | Svelte, React, or vanilla JS + D3 | D3.js is required for the Personnel Network regardless of framework choice. Svelte is lightweight and well-suited to data-driven UIs. |
| **Hosting** | Cloudflare Pages, Fly.io, or vps2 | If static: Cloudflare Pages or Fly.io static deploy. If server-side: Fly.io. |
| **Export script** | (if Option B chosen) | A script that reads from `_jazzcanon` and writes the JSON files in §6 Option B. Language is implementation agent's choice (Python preferred for consistency with existing scripts in `scripts/`). |

---

## 8. Out of Scope (v1)

- User accounts, logins, or personalization
- Search box or free-text query (the timeline IS the navigation)
- Comparison Matrix
- Venue Map
- Instrument filter facet
- Sideman search
- Influence Tree
- Transcriptions or "learn the music" features
- Contemporary jazz or anything post-Fusion
- Concert listings, upcoming events
- Full-network ("show everything") graph view
- Admin interface (handled separately via Hermes Agent profile)

---

## 9. Reference

**Database:** `_jazzcanon` schema, `vps8-core:5433`  
**Read-only role:** `_jazzcanon_ro`  
**Schema DDL:** `data/schema.sql`  
**Canon source JSON:** `data/canon-draft.json` (100 active albums)  
**Cover art files:** `data/album-art/`  
**Existing scripts:** `scripts/` (ingest.py, enrich scripts — reference for DB connection pattern)  
**Genre definitions / scope rules:** `docs/genre-definitions.md`  
**UI reference screenshots:** `research/ui-reference/disco/` + `research/ui-reference/disco/notes.md`  
**Phase plan:** `docs/phase5-and-beyond.md`
