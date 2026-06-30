# Phase 5 and Beyond — The Jazz Canon
# Runbook / Session Guide

**Status as of 2026-06-25**
Phase 4 data platform: complete. 100 albums, 534 persons, 627 performances live in `_jazzcanon` on vps8-core.
This document covers everything from here to a shippable public app.

---

## Phase 4 Cleanup (before Phase 5)

These are finishing items on the data platform. Do them in order — cover art depends on MBIDs being clean.

### C1. Kimi Gap-Fill
14 kimi-only records are in the DB with NULL stubs for MBID, Apple ID, studio, engineer, and cover art URLs.
Dispatch `jazz-personnel-researcher` in batches of ~10. Then run UPDATE queries against `_jazzcanon.album`.

**Session estimate:** 2 sessions (dispatch + review/update)

### C2. MusicBrainz MBID Re-Fetch
65 records have null `musicbrainz_release_group_mbid` from TLS failures during Segment B.
Script hits MusicBrainz API (rate-limited at 1 req/s), matches by artist + title + year, writes MBIDs back.

**Session estimate:** 1 session

### C3. Cover Art Fetch (D5)
Once MBIDs are populated: fetch front cover from Cover Art Archive (primary) → iTunes (fallback).
Write image files to `data/album-art/`. UPDATE `album_art` rows with `local_path`, dimensions, sha256.

**Session estimate:** 1 session

### C4. Catalog Number Gap-Fill
86 Claude/both records have empty `catalog_number`. Single Discogs research pass to fill them.

**Session estimate:** 1 session (can batch with another session)

### C5. Embeddings
`nomic-embed-text` (768-dim) via Ollama on vps4. Populate `album.embedding` and `person.embedding`.
Build HNSW indexes after. Enables semantic similarity ("albums like X", "musicians like Y").

**Session estimate:** 1 session

---

## Data Quality Sweep

Run this before app launch. Defer until the data is otherwise stable.

### Q1. Person Identity Resolution
Full pass over 534 persons for name-variant duplicates beyond the known Cannonball Adderley case.
Agent compares canonical names against variants, flags borderline merges to John.
Fix: SQL merge script (UPDATE foreign keys → INSERT name_variant → DELETE duplicate row).

### Q2. Adderley Fix (known)
`Cannonball Adderley` and `Julian 'Cannonball' Adderley` are two rows, one person.
Merge to canonical `Cannonball Adderley`. Add `Julian 'Cannonball' Adderley` as a `person_name_variant`.

### Q3. Date Anomaly
`june-christy-something-cool-1955` has `recording_dates` entry `"1953-08/19"` (malformed).
One UPDATE: correct to `1953-08-19`.

---

## Phase 5 — The App

GATE — stack decision required before any Phase 5 build work begins.

### 5A. Stack Decision Session

Two front ends are planned. They have different requirements and can be different stacks.

**Admin front end (for John only):**
Personal research tool. Needs CRUD for notes and writing, gap-fill UI, ad hoc query interface.
Does not need to be beautiful. PostgREST + simple HTML/JS is sufficient.
Auth: bearer token (single-user).

**Public app (the shareable product):**
The "wow" experience. Core features listed below. Needs the Personnel Network (force-directed graph),
which has a JavaScript weight requirement. Stack candidates to evaluate at the decision session:
Svelte (recommended starting point — lightweight, excellent for data-driven UIs), React, or static HTML + D3.
Hosting: static site (Cloudflare Pages or vps2) with PostgREST as a read-only live backend.

The stack decision session reviews the UI reference material in `research/ui-reference/` and makes the call.
John decides the stack; implementation follows.

**Session estimate:** 1 session (decision only)

### 5B. Admin Front End
Build the admin interface. Key screens:
- Album list with inline edit (gap-fill, notes, corrections)
- Person list with merge tool (for identity resolution)
- Raw query interface (talk to PostgREST directly)
- Notes/writing editor per album and per artist

**Session estimate:** 2-3 sessions

### 5C. Public App — Core
Album Grid → Album Deep Dive → Sideman Search.
These three views cover the basic discovery experience. Driven by static JSON export.

**Session estimate:** 2-3 sessions

### 5D. Personnel Network (the hero feature)
Force-directed graph: nodes are musicians, edges are shared albums, weight is number of collaborations.
Built on D3.js force simulation. Driven by `v_sideman_network` data, precomputed and exported.
The Paul Chambers query from 2026-06-25 is the prototype of what this makes visual.

**Session estimate:** 1-2 sessions

### 5E. MusicKit / Apple Music Integration
`apple_album_id` is already in the schema (gap-fill dependent).
MusicKit JS: 30-second previews, direct Apple Music links, optional embedded player.
One script tag. Self-contained bolt-on to the public app.

**Session estimate:** 1 session

### 5F. Venue Map
Studio geocoordinates: populate `lat`/`lon` on the `studio` table (~12-15 studios, manually curated).
Van Gelder Studio (Hackensack and Englewood Cliffs) will be the supernode.
Map rendered in the public app. Leaflet.js or Mapbox depending on stack decision.

**Session estimate:** 1 session

### 5G. PostgREST Serving Layer
Single binary on vps8. `db-schemas = "_jazzcanon"`, `db-anon-role = "_jazzcanon_ro"`.
Set up when the public app first needs live queries (Personnel Network, free-text search).
Preceded by: create `_jazzcanon_role` and `_jazzcanon_ro` DB roles, add passwords to vault.

**Session estimate:** 1 session (setup + smoke test)

---

## Phase 6 — Growth

No timeline. These open when Phase 5 is stable.

### 6A. Notes and Writing Schema
New tables: `album_note`, `artist_note` (or a unified `note` with a polymorphic FK).
User-written content — not source-grounded like personnel data. Additive migration (INSERT, no schema changes to existing tables).
Admin front end is the edit interface. Public app renders editorial notes on Deep Dive pages.

### 6B. Next-Batch Albums (v2 Research)
19 albums queued in `canon-draft.json` with `include: false`. Dispatch specialists for another round when ready.
New albums join `the-jazz-canon` collection via INSERT — no migration.

### 6C. Vocal Sub-Collection Decision
June Christy (Something Cool), Mel Tormé (Mel Tormé and the Marty Paich Dek-Tette), Shelly Manne (My Fair Lady)
are in the active 100 but flagged. Decide: keep in main canon, move to a vocal sub-collection, or exclude.
A sub-collection is one new row in `collection` + three new rows in `album_collection`. Zero cost.

### 6D. MCP Server
Agent-facing interface over `_jazzcanon` views + `fn_degrees_between` + vector search.
Lets Claude query the canon directly in any future session. Build per `mcp-building` skill when wanted.

---

## Reference

- Live DB: `_jazzcanon` schema on vps8-core, port 5433
- Source of truth: `data/canon-draft.json` (100 active albums)
- Known issues tracker: `docs/todo.md`
- Schema: `data/schema.sql`
- Ingest script (idempotent): `scripts/ingest.py`
- UI reference: `research/ui-reference/`
