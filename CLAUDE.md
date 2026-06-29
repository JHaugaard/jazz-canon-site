## Project Configuration

- **Language**: JavaScript (JSDoc)
- **Package Manager**: npm
- **Add-ons**: vitest, sveltekit-adapter, prettier

---

# jazz-canon-site

Public discovery app for A Jazz Canon — ~100 and growing canonical jazz albums (post-bebop
through pre-Fusion) with track-level personnel records and a force-directed
Personnel Network as the hero feature.

<intent>
Objective: Build a personal jazz discovery site — curated canon, track-level
personnel, interactive Personnel Network graph.
Outcomes: (1) Horizontal timeline as homepage hero; (2) Album Deep Dive panel
with full track-level personnel; (3) Triggered Personnel Network (force-directed
graph scoped to a musician click); (4) Apple Music integration.
Data: Read from _jazzcanon Postgres schema via static JSON export (preferred)
or PostgREST — implementation agent proposes the serving model.
</intent>

<data>
- Database: _jazzcanon schema, vps8-core:5433, read-only role _jazzcanon_ro
- Connection string: JAZZCANON_DB_URL in .env.local
- Export script: scripts/export.py — run to regenerate data/*.json from DB
- JSON files: data/albums.json, data/album/{slug}.json, data/network.json,
  data/musicians.json — committed to repo, served as static assets
- Cover art: URLs from DB (source_url in album_art table) — no local image files
- Schema reference: /home/john/dev/active/mccoy-tyner/data/schema.sql
</data>

<spec>
Full design spec: docs/app-spec-v1.md
UI reference (Disco screenshots + notes): research/ui-reference/disco/notes.md
Screenshot originals: /home/john/dev/active/mccoy-tyner/research/ui-reference/disco/
Genre scope rules: docs/genre-definitions.md
</spec>

<stack>
- Framework: TBD — implementation agent proposes (Svelte recommended)
- Serving model: TBD — static JSON (preferred) or PostgREST
- Hosting: TBD — Cloudflare Pages, Fly.io, or vps2
- D3.js: required for Personnel Network force simulation (non-negotiable)
</stack>

<gotchas>
- Epistemic labels (obs/inf/unk) must be visually distinct in all personnel displays.
  Never let tidy presentation launder inference into fact.
- The Personnel Network is always scoped to a selection (musician or album click).
  A full-network "show everything" view is explicitly out of scope for v1.
- Cover art: use source_url from the DB (populated in albums.json). No local
  image files in this repo.
- Progressive disclosure: the timeline is the nav mechanism. No search box in v1.
- Apple Music: apple_album_id is in albums.json. MusicKit JS is a script tag.
  Defer full MusicKit setup until the core app is running.
- Scope: post-bebop, pre-Fusion only. Test question in genre-definitions.md.
</gotchas>

<v1-scope>
IN:  Timeline homepage + era bands, Album Deep Dive panel, Personnel Network
     (triggered), Apple Music links
OUT: Venue Map, Comparison Matrix, Instrument filter, Sideman search,
     Influence Tree, full-network graph view, user accounts, search box
</v1-scope>
