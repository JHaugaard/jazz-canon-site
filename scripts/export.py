#!/usr/bin/env python3
"""
Export _jazzcanon DB to static JSON files for the jazz-canon-site.

Reads JAZZCANON_DB_URL from .env.local or environment.
Run from the repo root: python3 scripts/export.py

Writes:
  data/albums.json          — lightweight list for the timeline
  data/album/{slug}.json    — full deep dive record per album (lazy-loaded)
  data/network.json         — bipartite personnel graph for the network view
  data/musicians.json       — person index
"""

import os
import json
import argparse
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor


def load_env(path=".env.local"):
    if not Path(path).exists():
        return
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())


def connect():
    url = os.environ.get("JAZZCANON_DB_URL")
    if not url:
        raise RuntimeError("JAZZCANON_DB_URL not set. Check .env.local.")
    return psycopg2.connect(url, cursor_factory=RealDictCursor)


# ---------------------------------------------------------------------------
# albums.json — lightweight timeline list
# ---------------------------------------------------------------------------
def export_albums(cur, out_dir):
    cur.execute("""
        SELECT
            a.id,
            a.title,
            a.artist_name,
            a.year,
            s.code          AS style_primary,
            s.display_name  AS style_display,
            l.name          AS label,
            a.catalog_number,
            aa.source_url   AS cover_art_url,
            a.apple_album_id
        FROM _jazzcanon.album a
        JOIN _jazzcanon.album_collection ac
            ON ac.album_id = a.id
        JOIN _jazzcanon.collection c
            ON c.id = ac.collection_id AND c.slug = 'the-jazz-canon'
        LEFT JOIN _jazzcanon.style s     ON s.id  = a.style_primary_id
        LEFT JOIN _jazzcanon.label l     ON l.id  = a.label_id
        LEFT JOIN _jazzcanon.album_art aa
            ON aa.album_id = a.id AND aa.is_primary
        ORDER BY a.year, a.title
    """)
    albums = [dict(r) for r in cur.fetchall()]
    (out_dir / "albums.json").write_text(json.dumps(albums, indent=2, default=str))
    print(f"  albums.json          — {len(albums)} albums")
    return albums


# ---------------------------------------------------------------------------
# data/album/{slug}.json — full deep dive per album
# ---------------------------------------------------------------------------
def export_album_detail(cur, out_dir, albums):
    album_dir = out_dir / "album"
    album_dir.mkdir(exist_ok=True)

    for album in albums:
        slug = album["id"]

        # Header
        cur.execute("""
            SELECT
                a.*,
                l.name          AS label_name,
                s.display_name  AS style_display,
                s.code          AS style_primary,
                lead.canonical_name AS leader_name,
                aa.source_url   AS cover_art_url
            FROM _jazzcanon.album a
            LEFT JOIN _jazzcanon.label l
                ON l.id = a.label_id
            LEFT JOIN _jazzcanon.style s
                ON s.id = a.style_primary_id
            LEFT JOIN _jazzcanon.person lead
                ON lead.id = a.leader_person_id
            LEFT JOIN _jazzcanon.album_art aa
                ON aa.album_id = a.id AND aa.is_primary
            WHERE a.id = %s
        """, (slug,))
        d = dict(cur.fetchone())

        # Studios
        cur.execute("""
            SELECT DISTINCT st.name, st.city
            FROM _jazzcanon.session se
            JOIN _jazzcanon.studio st ON st.id = se.studio_id
            WHERE se.album_id = %s
            ORDER BY st.name
        """, (slug,))
        studios = [
            f"{r['name']}, {r['city']}" if r["city"] else r["name"]
            for r in cur.fetchall()
        ]

        # Album-level personnel
        cur.execute("""
            SELECT
                pe.id::text     AS person_id,
                pe.canonical_name,
                pe.name_slug,
                i.name          AS instrument,
                p.epistemic::text
            FROM _jazzcanon.performance p
            JOIN _jazzcanon.person pe     ON pe.id = p.person_id
            JOIN _jazzcanon.instrument i  ON i.id  = p.instrument_id
            WHERE p.album_id = %s
            ORDER BY pe.sort_name
        """, (slug,))
        personnel = [dict(r) for r in cur.fetchall()]

        # Tracks
        cur.execute("""
            SELECT
                t.id::text      AS track_id,
                t.title,
                t.track_number,
                t.side,
                t.duration_text,
                t.apple_track_id
            FROM _jazzcanon.track t
            WHERE t.album_id = %s
            ORDER BY t.track_number
        """, (slug,))
        tracks = [dict(r) for r in cur.fetchall()]

        # Per-track personnel
        for track in tracks:
            cur.execute("""
                SELECT
                    pe.id::text     AS person_id,
                    pe.canonical_name,
                    pe.name_slug,
                    i.name          AS instrument,
                    p.epistemic::text
                FROM _jazzcanon.performance p
                JOIN _jazzcanon.person pe     ON pe.id = p.person_id
                JOIN _jazzcanon.instrument i  ON i.id  = p.instrument_id
                WHERE p.album_id = %s
                  AND (
                      p.scope = 'all-tracks'
                      OR EXISTS (
                          SELECT 1 FROM _jazzcanon.performance_track pt
                          WHERE pt.performance_id = p.id
                            AND pt.track_id = %s::uuid
                      )
                  )
                ORDER BY pe.sort_name
            """, (slug, track["track_id"]))
            track["personnel"] = [dict(r) for r in cur.fetchall()]

        record = {
            "id":                  slug,
            "title":               d["title"],
            "artist_name":         d["artist_name"],
            "year":                d["year"],
            "label":               d.get("label_name"),
            "catalog_number":      d.get("catalog_number"),
            "recording_dates_text": d.get("recording_dates_text"),
            "description":         d.get("description"),
            "style_primary":       d.get("style_primary"),
            "style_display":       d.get("style_display"),
            "cover_art_url":       d.get("cover_art_url"),
            "apple_album_id":      d.get("apple_album_id"),
            "studios":             studios,
            "personnel":           personnel,
            "tracks":              tracks,
        }

        (album_dir / f"{slug}.json").write_text(
            json.dumps(record, indent=2, default=str)
        )

    print(f"  data/album/*.json    — {len(albums)} files")


# ---------------------------------------------------------------------------
# network.json — bipartite personnel graph
# ---------------------------------------------------------------------------
def export_network(cur, out_dir):
    # Canon album stubs
    cur.execute("""
        SELECT a.id AS album_id, a.title, a.year
        FROM _jazzcanon.album a
        JOIN _jazzcanon.album_collection ac ON ac.album_id = a.id
        JOIN _jazzcanon.collection c
            ON c.id = ac.collection_id AND c.slug = 'the-jazz-canon'
        ORDER BY a.year
    """)
    albums = [dict(r) for r in cur.fetchall()]

    # Musicians with their canon album IDs and instruments
    cur.execute("""
        SELECT
            pe.id::text         AS person_id,
            pe.canonical_name,
            pe.name_slug,
            array_agg(DISTINCT i.name  ORDER BY i.name)        AS instruments,
            array_agg(DISTINCT p.album_id ORDER BY p.album_id) AS album_ids
        FROM _jazzcanon.performance p
        JOIN _jazzcanon.person pe     ON pe.id = p.person_id
        JOIN _jazzcanon.instrument i  ON i.id  = p.instrument_id
        JOIN _jazzcanon.album_collection ac ON ac.album_id = p.album_id
        JOIN _jazzcanon.collection c
            ON c.id = ac.collection_id AND c.slug = 'the-jazz-canon'
        GROUP BY pe.id, pe.canonical_name, pe.name_slug
        ORDER BY array_length(array_agg(DISTINCT p.album_id), 1) DESC, pe.sort_name
    """)
    musicians = [dict(r) for r in cur.fetchall()]

    # Edges: musician pairs sharing ≥1 canon album, weighted by shared count
    cur.execute("""
        SELECT
            p1.person_id::text  AS person_a,
            p2.person_id::text  AS person_b,
            count(DISTINCT p1.album_id) AS shared_albums
        FROM _jazzcanon.performance p1
        JOIN _jazzcanon.performance p2
            ON p1.album_id = p2.album_id AND p1.person_id < p2.person_id
        JOIN _jazzcanon.album_collection ac ON ac.album_id = p1.album_id
        JOIN _jazzcanon.collection c
            ON c.id = ac.collection_id AND c.slug = 'the-jazz-canon'
        GROUP BY p1.person_id, p2.person_id
        ORDER BY shared_albums DESC
    """)
    edges = [dict(r) for r in cur.fetchall()]

    network = {"musicians": musicians, "albums": albums, "edges": edges}
    (out_dir / "network.json").write_text(
        json.dumps(network, indent=2, default=str)
    )
    print(f"  network.json         — {len(musicians)} musicians, {len(edges)} edges")


# ---------------------------------------------------------------------------
# musicians.json — person index
# ---------------------------------------------------------------------------
def export_musicians(cur, out_dir):
    cur.execute("""
        SELECT
            pe.id::text         AS person_id,
            pe.canonical_name,
            pe.name_slug,
            array_agg(DISTINCT i.name ORDER BY i.name) AS instruments,
            count(DISTINCT p.album_id)                 AS album_count
        FROM _jazzcanon.performance p
        JOIN _jazzcanon.person pe     ON pe.id = p.person_id
        JOIN _jazzcanon.instrument i  ON i.id  = p.instrument_id
        JOIN _jazzcanon.album_collection ac ON ac.album_id = p.album_id
        JOIN _jazzcanon.collection c
            ON c.id = ac.collection_id AND c.slug = 'the-jazz-canon'
        GROUP BY pe.id, pe.canonical_name, pe.name_slug
        ORDER BY count(DISTINCT p.album_id) DESC, pe.sort_name
    """)
    musicians = [dict(r) for r in cur.fetchall()]
    (out_dir / "musicians.json").write_text(
        json.dumps(musicians, indent=2, default=str)
    )
    print(f"  musicians.json       — {len(musicians)} musicians")


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Export _jazzcanon DB to static JSON for jazz-canon-site"
    )
    parser.add_argument(
        "--output-dir", default="data",
        help="Output directory (default: data)"
    )
    args = parser.parse_args()

    load_env()
    out_dir = Path(args.output_dir)
    out_dir.mkdir(exist_ok=True)

    print("Connecting to DB...")
    conn = connect()
    cur = conn.cursor()

    print("Exporting:")
    albums = export_albums(cur, out_dir)
    export_album_detail(cur, out_dir, albums)
    export_network(cur, out_dir)
    export_musicians(cur, out_dir)

    conn.close()
    print("\nDone. Commit data/ to deploy updated JSON.")


if __name__ == "__main__":
    main()
