# Data Pipeline SOP — jazz-canon-site

How the static JSON in `data/` gets produced and enriched, who owns each step,
and the order they must run in. Keep this current — it's the operating manual.

## The one-liner

`export.py` rebuilds the album JSON from the Postgres DB; `apple_previews.py`
then layers 30-second Apple Music preview URLs on top. The site serves the
resulting committed JSON as static assets — no database at runtime.

## Script ownership

| Script | Owner / home | Produces | Status |
|--------|--------------|----------|--------|
| `export.py` | **mccoy-tyner** (the data platform) is the SSOT *target* | `data/albums.json`, `data/album/*.json`, `data/network.json`, `data/musicians.json` | ⚠️ Still physically lives in `jazz-canon-site/scripts/`. Migration to mccoy-tyner is decided but not yet executed. |
| `apple_previews.py` | **jazz-canon-site** | adds `preview_url` (+ backfills `apple_track_id`) to `data/album/*.json` | In place |

Why split: album/personnel facts are source-of-truth and belong to the data
platform. Apple preview URLs are volatile `mzstatic` CDN links — a **cache**,
not a fact — so enrichment is a separate, re-runnable step owned by the site.

## Run order (this matters)

`export.py` regenerates the album JSON **from scratch**, which **wipes
`preview_url`**. So always:

```
1. .venv/bin/python3 scripts/export.py            # rebuild data/ from the DB
2. .venv/bin/python3 scripts/apple_previews.py     # re-add preview URLs
```

If you only edited the DB and re-ran export, you MUST re-run apple_previews or
every play button disappears. If you only want to refresh previews (e.g. a
stale CDN link), step 2 alone is fine.

### Useful flags for `apple_previews.py`

```
--dry-run            # show matches + coverage, write nothing (always do this first)
--album <slug>       # just one album, e.g. --album andrew-hill-black-fire
--limit N            # first N albums only
```

## Secrets

- Apple credentials live in `.env.local` (gitignored): `APPLE_MUSIC_TEAM_ID`,
  `APPLE_MUSIC_KEY_ID`, `APPLE_MUSIC_PRIVATE_KEY_PATH`, `APPLE_MUSIC_STOREFRONT`.
- The MusicKit private key is `secrets/AuthKey_<KEYID>.p8` — **never committed**
  (`secrets/` and `*.p8` are gitignored). If it ever leaks, revoke the key in
  the Apple Developer portal and generate a new one.
- The developer token used by `apple_previews.py` is a short-lived (~1 h) ES256
  JWT generated **in memory at run time** — never written to disk or shipped to
  the browser. Nothing to rotate for this step.
- (Future, Step 3 full playback) the *client-side* developer token has a 6-month
  max lifetime and will need periodic regeneration.

## Known data gaps (fix in the DB, then re-run the pipeline)

These are data problems, not script bugs. `apple_previews.py` flags them.

| Album | Problem |
|-------|---------|
| Ahmad Jamal — *At the Pershing: But Not for Me* | missing `apple_album_id` |
| Jackie McLean — *Destination Out* | missing `apple_album_id` |
| Lee Konitz — *Subconscious-Lee* | missing `apple_album_id` |
| Gerry Mulligan Quartet 1952 | **wrong** `apple_album_id` (returns different songs) |
| Modern Jazz Quartet — *Django* | **wrong** `apple_album_id` (returns a 1-track single) |

Current coverage: **621 / 666 tracks** have previews. Closing the 5 above (plus
genuine bonus tracks Apple doesn't carry) is the remaining ceiling.

## Playback UX contract

The site **never renders a dead play button**:
- no `preview_url` → no button (aligned empty slot, not a broken control)
- a `preview_url` that fails at runtime → the button removes itself after the
  failed click (see `src/lib/stores/preview.js` → `brokenPreviews`)
