# Logo concepts — preserved work & handoff

**Created:** 2026-06-28 (session `build-1`, spur-of-the-moment logo pass)
**Status:** Concepts delivered & approved-in-spirit ("top notch"). Refinement DEFERRED
until the site design spec lands (expected 2026-06-29) so the logo converges with the
chosen palette + typefaces.

## Why this exists
John uses the source mark (`docs/logo.png`) for all his photography work and asked for a
riff for jazzcanon.com. These are the result. They are **not final** — the full site design
spec (colors, typefaces, the Blue Note / Prestige / Columbia album-art vibe) arrives next
and the logo will be refined to match it.

## Source mark (`../logo.png`)
A multi-element **lens cross-section** (optical/camera-lens schematic) in steel-navy, with a
**play triangle** seated in a slot on the left barrel. The two carried-through cues:
the **lens train** and the **play triangle**.

## Colors used (provisional — will reconcile with the coming spec)
- Navy `#314a7d` (sampled from the source mark)
- Jazz-brass accent `#c0883c` (first non-navy note; ties to the site's brass `--accent`)

## The three concepts
| File | Name | Idea |
|------|------|------|
| `concept-1-sound-lens.svg` | **Sound Lens** | Same optical train + play triangle; the final lens element resolves into a **vinyl record** (grooves + brass spindle). Closest riff, lowest risk. John's + my lead. |
| `concept-2-canon-shelf.svg` | **Canon Shelf** | Optical elements re-read as **LP spines on a shelf** (the canon as a collection); varying widths echo the app's variable-width years; one brass "key" spine. |
| `concept-3-wordmark.svg` | **Wordmark lockup** | Compact barrel→record mark + "A JAZZ CANON" serif + "1949 — 1972" tagline. The site-header version. Pairs with the Concept 1 mark. |

`index.html` is the preview gallery (shows each on paper/white/dark + 16/32px favicon tests).

## Refinement TODO (after the design spec)
- [ ] Reconcile navy/brass with the spec's actual palette (Blue Note/Prestige/Columbia era).
- [ ] Wordmark: replace web-serif (Georgia) with the spec's chosen typeface, then **outline
      the type to paths** so the SVG is font-independent.
- [ ] Produce a **reversed/white variant** for dark surfaces (navy-on-dark doesn't read).
- [ ] Export a **favicon** (replace `src/lib/assets/favicon.svg`) and wire OG/social image.
- [ ] Decide final direction (or a mix: Concept 1 mark + Concept 3 wordmark).

## Re-launch the preview (it's an ephemeral server, not kept across sessions)
```bash
cd /home/john/dev/active/jazz-canon-site
python3 -m http.server 8080 --bind 0.0.0.0 --directory docs
# then on the Mac: http://vps8-core:8080/logo-concepts/
```

## Note on persistence
These files persist on disk at `docs/logo-concepts/`. They are **not committed to git** yet
(commits are John's call) — committing would harden them against accidental loss.
