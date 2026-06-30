#!/usr/bin/env python3
"""
Enrich album JSON with Apple Music 30-second preview URLs.

For each data/album/{slug}.json that has an apple_album_id, this fetches the
album from the Apple Music catalog API, matches each of our tracks to Apple's
track list, and writes a `preview_url` (and backfills `apple_track_id`) onto
each track. Everyone — no login — can then play the 30s clip from a plain
<audio> element. Full-album playback (subscribers) is a later, separate step.

This is a CACHE step, deliberately decoupled from export.py: Apple preview URLs
are volatile mzstatic CDN links, not source-of-truth data. Re-running export.py
regenerates the JSON from the DB and drops preview_url, so run this AFTER export.

Credentials come from .env.local (gitignored):
  APPLE_MUSIC_TEAM_ID         your 10-char Apple Developer Team ID
  APPLE_MUSIC_KEY_ID          the MusicKit key id (from the AuthKey_<id>.p8 name)
  APPLE_MUSIC_PRIVATE_KEY_PATH path to the .p8 private key (e.g. secrets/...)
  APPLE_MUSIC_STOREFRONT      storefront code, e.g. "us"

The developer token (a short-lived ES256 JWT) is generated in-memory at build
time and never written to disk, logged, or shipped to the browser.

Usage (run from repo root, in the venv):
  .venv/bin/python3 scripts/apple_previews.py --dry-run     # show matches, write nothing
  .venv/bin/python3 scripts/apple_previews.py --limit 3     # only first 3 albums
  .venv/bin/python3 scripts/apple_previews.py               # enrich all
  .venv/bin/python3 scripts/apple_previews.py --album black-fire
"""

import os
import re
import sys
import json
import time
import difflib
import argparse
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import jwt  # PyJWT[crypto]


API_BASE = "https://api.music.apple.com/v1/catalog"
TOKEN_TTL_SECONDS = 60 * 60  # 1 hour — only needs to outlive this run


# ---------------------------------------------------------------------------
# Config / credentials
# ---------------------------------------------------------------------------

def load_env(path=".env.local"):
    """Mirror export.py: shallow .env.local loader, environment wins."""
    if not Path(path).exists():
        return
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())


def make_developer_token(now):
    """Build a short-lived ES256 JWT from the .p8 private key.

    `now` is passed in (Unix seconds) so the function stays pure/testable.
    """
    team_id = os.environ.get("APPLE_MUSIC_TEAM_ID")
    key_id = os.environ.get("APPLE_MUSIC_KEY_ID")
    p8_path = os.environ.get("APPLE_MUSIC_PRIVATE_KEY_PATH")
    missing = [n for n, v in [
        ("APPLE_MUSIC_TEAM_ID", team_id),
        ("APPLE_MUSIC_KEY_ID", key_id),
        ("APPLE_MUSIC_PRIVATE_KEY_PATH", p8_path),
    ] if not v]
    if missing:
        raise RuntimeError(f"Missing in .env.local: {', '.join(missing)}")
    if not Path(p8_path).exists():
        raise RuntimeError(f"Private key not found at {p8_path}")

    private_key = Path(p8_path).read_text()
    return jwt.encode(
        {"iss": team_id, "iat": now, "exp": now + TOKEN_TTL_SECONDS},
        private_key,
        algorithm="ES256",
        headers={"alg": "ES256", "kid": key_id},
    )


# ---------------------------------------------------------------------------
# Apple Music catalog API
# ---------------------------------------------------------------------------

def fetch_album(token, storefront, album_id, retries=3):
    """Return Apple's track list for an album, or None on a 404.

    Each returned dict: {id, name, disc, num, preview}.
    """
    url = (
        f"{API_BASE}/{storefront}/albums/{urllib.parse.quote(str(album_id))}"
        f"?include=tracks"
    )
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (401, 403):
                raise RuntimeError(
                    f"Apple rejected the developer token (HTTP {e.code}). "
                    "Check Team ID / Key ID / .p8 and that the key has MusicKit "
                    "enabled."
                ) from e
            if e.code == 429 and attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise
        except urllib.error.URLError:
            if attempt < retries - 1:
                time.sleep(1 * (attempt + 1))
                continue
            raise

    data = payload.get("data") or []
    if not data:
        return None
    tracks = (data[0].get("relationships", {}).get("tracks", {}).get("data")) or []
    out = []
    for t in tracks:
        attrs = t.get("attributes", {})
        previews = attrs.get("previews") or []
        out.append({
            "id": t.get("id"),
            "name": attrs.get("name", ""),
            "disc": attrs.get("discNumber") or 1,
            "num": attrs.get("trackNumber") or 0,
            "preview": (previews[0].get("url") if previews else None),
        })
    return out


# ---------------------------------------------------------------------------
# Track matching (pure — the part most worth eyeballing in --dry-run)
# ---------------------------------------------------------------------------

# Parenthetical/bracketed groups that are reissue NOISE, not real subtitles —
# e.g. "(Remastered 2014)", "[Mono]", "(2004 Stereo Mix)", "(Take 3)". We strip
# only these, keeping meaningful subtitles like "Una Mas (One More Time)".
_NOISE_GROUP = re.compile(
    r"[\(\[][^)\]]*\b(remaster|remastered|mono|stereo|version|edit|mix|bonus|"
    r"alternate|alt|take|outtake|live|reissue|with|feat|featuring|ft|\d{4})"
    r"\b[^)\]]*[\)\]]",
    re.IGNORECASE,
)


def normalize_title(s):
    """Lowercase, drop reissue-noise parentheticals, then strip punctuation.

    Deliberately does NOT strip album-name prefixes or meaningful subtitles —
    difflib's ratio tolerates extra tokens, and over-stripping was emptying
    title-track names (e.g. "JuJu" on the album *Juju*).
    """
    s = (s or "").lower()
    s = _NOISE_GROUP.sub(" ", s)
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


# Minimum title similarity (0..1) to accept a match. Below this we leave the
# track without a preview rather than risk attaching the wrong clip.
MATCH_THRESHOLD = 0.55


def match_tracks(our_tracks, apple_tracks):
    """Pair our tracks with Apple tracks by TITLE similarity, not position.

    Position is unreliable: Apple editions reorder tracks (see Chet Baker Sings)
    even when the count matches. We score every (our, apple) pair on normalized-
    title similarity and assign greedily, best score first, one-to-one, refusing
    any pairing below MATCH_THRESHOLD.

    Returns list of (our_track, apple_track_or_None) preserving our input order.
    """
    candidates = []  # (score, our_idx, apple_idx)
    for i, ot in enumerate(our_tracks):
        a = normalize_title(ot.get("title"))
        for j, at in enumerate(apple_tracks):
            b = normalize_title(at.get("name"))
            if a and b:
                score = difflib.SequenceMatcher(None, a, b).ratio()
                # One title being a prefix of the other = same track with an
                # appended subtitle ("Show Me" / "Show Me (Instrumental)").
                # Strong signal that the ratio alone can miss on short titles.
                if min(len(a), len(b)) >= 4 and (a.startswith(b) or b.startswith(a)):
                    score = max(score, 0.95)
            else:
                score = 0.0
            candidates.append((score, i, j))
    candidates.sort(key=lambda c: c[0], reverse=True)

    used_our, used_apple, assigned = set(), set(), {}
    for score, i, j in candidates:
        if score < MATCH_THRESHOLD:
            break
        if i in used_our or j in used_apple:
            continue
        assigned[i] = j
        used_our.add(i)
        used_apple.add(j)

    return [(ot, apple_tracks[assigned[i]] if i in assigned else None)
            for i, ot in enumerate(our_tracks)]


# ---------------------------------------------------------------------------
# JSON enrichment
# ---------------------------------------------------------------------------

def apply_to_track(track, apple):
    """Return a new track dict with preview_url (and backfilled apple_track_id)
    inserted in a stable position, for minimal diffs."""
    out = {}
    inserted = False
    for k, v in track.items():
        if k == "preview_url":
            continue  # re-inserted canonically below
        if k == "apple_track_id":
            out["apple_track_id"] = (apple["id"] if apple and apple.get("id") else v)
            out["preview_url"] = (apple["preview"] if apple else None)
            inserted = True
            continue
        out[k] = v
    if not inserted:
        out["apple_track_id"] = apple["id"] if apple and apple.get("id") else None
        out["preview_url"] = apple["preview"] if apple else None
    return out


def enrich_file(path, token, storefront, sleep, dry_run):
    """Enrich one album file. Returns a stats dict."""
    rec = json.loads(Path(path).read_text())
    slug = Path(path).stem
    album_id = rec.get("apple_album_id")
    tracks = rec.get("tracks") or []
    stats = {"slug": slug, "album_id": album_id, "tracks": len(tracks),
             "matched": 0, "with_preview": 0, "status": ""}

    if not album_id:
        stats["status"] = "no apple_album_id"
        return stats

    apple_tracks = fetch_album(token, storefront, album_id)
    if sleep:
        time.sleep(sleep)
    if apple_tracks is None:
        stats["status"] = "album not found (404)"
        return stats

    pairs = match_tracks(tracks, apple_tracks)
    new_tracks = []
    for ot, at in pairs:
        if at:
            stats["matched"] += 1
            if at.get("preview"):
                stats["with_preview"] += 1
        new_tracks.append(apply_to_track(ot, at))

    # Sanity guard: matches are already title-verified, so the remaining risk is
    # a wrong apple_album_id that yields few/no matches. If coverage is poor,
    # write nothing for this album and flag it for review.
    if tracks and (stats["matched"] / len(tracks)) < 0.5:
        stats["status"] = "LOW coverage — check apple_album_id"
        return stats

    stats["status"] = "ok"
    if not dry_run:
        rec["tracks"] = new_tracks
        Path(path).write_text(json.dumps(rec, indent=2, default=str))
    return stats


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Add Apple Music preview URLs to album JSON.")
    ap.add_argument("--dry-run", action="store_true", help="show matches, write nothing")
    ap.add_argument("--limit", type=int, default=0, help="only process the first N albums")
    ap.add_argument("--album", default=None, help="only this slug (filename without .json)")
    ap.add_argument("--data-dir", default="data/album", help="album JSON directory")
    ap.add_argument("--sleep", type=float, default=0.15, help="seconds between API calls")
    args = ap.parse_args()

    load_env()

    files = sorted(Path(args.data_dir).glob("*.json"))
    if args.album:
        files = [f for f in files if f.stem == args.album]
        if not files:
            print(f"No album JSON matching slug '{args.album}'", file=sys.stderr)
            return 1
    if args.limit:
        files = files[: args.limit]

    # iat is read once here (the one impure spot) and passed into the token.
    token = make_developer_token(int(time.time()))
    print(f"Developer token generated (ES256, ~1h). Storefront: "
          f"{os.environ.get('APPLE_MUSIC_STOREFRONT', 'us')}.")
    storefront = os.environ.get("APPLE_MUSIC_STOREFRONT", "us")

    mode = "DRY RUN — no files written" if args.dry_run else "WRITING preview_url into JSON"
    print(f"{mode}. {len(files)} album file(s).\n")

    totals = {"tracks": 0, "matched": 0, "with_preview": 0,
              "no_id": 0, "not_found": 0, "ok": 0}
    problems = []
    for f in files:
        s = enrich_file(f, token, storefront, args.sleep, args.dry_run)
        totals["tracks"] += s["tracks"]
        totals["matched"] += s["matched"]
        totals["with_preview"] += s["with_preview"]
        if s["status"] == "ok":
            totals["ok"] += 1
            flag = "" if s["matched"] == s["tracks"] else "  <-- partial match"
            print(f"  {s['slug']:<48} {s['with_preview']}/{s['tracks']} previews{flag}")
            if s["matched"] != s["tracks"]:
                problems.append(s["slug"])
        elif s["status"] == "no apple_album_id":
            totals["no_id"] += 1
            problems.append(f"{s['slug']} (no apple_album_id)")
        else:
            totals["not_found"] += 1
            problems.append(f"{s['slug']} ({s['status']})")

    print("\n" + "=" * 60)
    print(f"Albums OK: {totals['ok']}   no-id: {totals['no_id']}   "
          f"not-found: {totals['not_found']}")
    print(f"Tracks: {totals['with_preview']}/{totals['tracks']} now have a preview URL")
    if problems:
        print("\nNeeds a look:")
        for p in problems:
            print(f"  - {p}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
