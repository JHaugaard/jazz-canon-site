---
type: reference
status: draft
tags: jazz-canon, design, spec, visual
---

# A Jazz Canon — Visual Design Spec v1

**Status:** Draft — 2026-06-28 · revised 2026-06-29 (epistemic treatment dialed
back per `docs/sunday-update.md` §1: red retired, epistemic folded into §2.4)
**Companion to:** `docs/app-spec-v1.md` and timeline redesign prompts
**Purpose:** Design layer applied on top of existing structural work. Defines
color, typography, epistemic treatment, and layout principles derived from the
visual language of 1950s–1970s jazz album covers.

---

## 1. Design Philosophy

The visual language is drawn from the album cover design of the era the canon
covers — primarily Blue Note Records (Reid Miles / Francis Wolff), Impulse!
Records (Pete Turner), and Columbia Records. Four principles repeat across all
labels and styles in the collection:

1. **Bold condensed sans-serif for titles.** Always uppercase, always heavy,
   always confident.
2. **Limited palettes.** Rarely more than three colors, often just two plus
   black and white.
3. **Single accent against neutral base.** One color carries the emotional
   weight; everything else is structure.
4. **Photography forward, typography respectful.** Text complements the image
   asymmetrically; it does not compete with it.

The site should feel like it belongs to the same world as the covers it
displays — not a museum recreation, but a contemporary tool that carries the
design DNA.

---

## 2. Color Palette

### Base surfaces (existing — keep)

```
--bg: #faf8f3            /* warm paper — evokes vinyl sleeve and liner note stock */
--surface: #ffffff        /* cards, panels */
--ink: #1c1a17            /* near-black, warm — primary text */
--muted: #6b6358          /* secondary text */
--line: #e6e0d6           /* borders, dividers */
```

### Accent system (new — derived from album cover analysis)

Two accents, each mapped to a specific role in the site's information
architecture:

```
--bn-blue: #2b5f7a        /* Blue Note deep teal-blue — PRIMARY accent */
                         /* links, timeline, UI chrome, era labels, active states */

--bn-blue-light: #4a7c95   /* lighter variant — hover, secondary, focus rings */

--impulse-amber: #c4862a  /* Impulse! warm brass — EDITORIAL accent */
                         /* editorial notes, section headers, inf/unk epistemic states */
```

**Design logic:** Blue Note blue is the brand accent — it carries the site's
identity in the same way the Blue Note label carried theirs. Impulse! amber is
the voice of editorial content — warm, human, distinct from sourced facts — and
it also carries the `inf`/`unk` epistemic states (see §2.4).

**No red.** The palette deliberately contains no red. (An earlier draft reserved
a Columbia/Miles red exclusively for the `unk` epistemic state; that proved
disproportionate to a state that appears in roughly 1.5% of the data — see §2.4.)
Red appears nowhere in v1. Reserve it for future error states only if a genuine
need arises.

### Era band colors (recalibrated)

Low-saturation tints that harmonize with the cover art palette:

```
--era-cool:    rgba(43, 95, 122, 0.18)    /* Blue Note blue family */
--era-hardbop: rgba(196, 134, 42, 0.18)   /* Impulse! amber family */
--era-modal:   rgba(74, 124, 107, 0.18)   /* muted sage — modal = contemplative */
--era-postbop:  rgba(122, 82, 140, 0.18)   /* deep violet — post-bop = searching */
--era-ink: #5a5249                          /* era label text */
```

### 2.4 Epistemic color treatment

This is where the design language and the site's core principle (app-spec §3)
meet. The `obs` / `inf` / `unk` labels must be visually distinct everywhere they
appear — but the treatment is deliberately quiet. In the actual data, 98.5% of
performance records are `obs`, and `unk` surfaces only ~9 times across the whole
dataset; a typical visitor encounters zero or one `unk` badge in a session. So a
single color family (amber) carries both `inf` and `unk`; they differ by **weight
and marker, not hue.**

Single source of truth: one component (`EpistemicBadge.svelte`). All three states
share the same structural treatment (small badge, uppercase, `cursor: help`) and
differ only as below:

| State | Color | Background | Weight | Style | Text | Title attribute |
|-------|-------|------------|--------|-------|------|-----------------|
| `obs` | `--muted` | transparent | 400 | normal | `obs` | "Directly observed (liner notes or primary source)" |
| `inf` | `--impulse-amber` | `rgba(196, 134, 42, 0.08)` | 400 | italic | `inf` | "Inferred from session lists or cross-references" |
| `unk` | `--impulse-amber` | `rgba(196, 134, 42, 0.12)` | 700 | normal | `unk?` | "Uncertain attribution" |

- **`obs`** is the quiet default — sourced facts don't shout, so they sit in the
  standard secondary text color with no fill.
- **`inf`** is the warm editorial register; its italic echoes the serif
  treatment used for editorial notes — both are interpretation, not fact.
- **`unk`** stays in the same amber family but goes **bold with a `?` marker**.
  It is distinct from `inf` by weight and marker, not by jumping to a different
  hue.

**Anti-pattern.** Do NOT use a traffic-light palette (green/amber/red). Green
implies "verified correct" and red implies "wrong." These are epistemically
distinct states, not quality-ranked assessments. A musician listed as `unk` is
genuinely uncertain — not incorrect. The one-color-family treatment above avoids
this trap by design.

**Edge styling in the Personnel Network (deferred).** Epistemic encoding on
network edges is deferred for v1. Edges show weight only (`shared_albums` count
as stroke-width). The epistemic treatment lives in the Deep Dive panel, where it
is meaningful (per-track, per-musician).

---

## 3. Typography

Three typefaces, each with a specific role. All available on Google Fonts
(free, no licensing).

### Font definitions

```
--font-display: 'Archivo Narrow', 'Helvetica Neue Condensed', sans-serif;
--font-body: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-serif: 'Lora', Georgia, 'Times New Roman', serif;
```

### Font loading strategy

Load via Google Fonts in `app.html` (or SvelteKit layout):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
```

Three families is the maximum. The tradeoff: Lora adds one font for editorial
content only, but it creates a visual distinction between sourced facts
(sans-serif) and editorial interpretation (serif italic) that directly serves
the epistemic principle (app-spec §3). Worth the load.

### Type hierarchy

| Element | Font | Weight | Size | Transform | Notes |
|---------|------|--------|------|----------|-------|
| Site title "A Jazz Canon" | Archivo Narrow | 700 | 2rem | uppercase | The brand |
| Tagline "1949–1972" | Inter | 400 | 0.9rem | none | letter-spacing: 0.02em |
| Era band labels | Archivo Narrow | 600 | 0.8rem | uppercase | In swim lanes |
| Year axis labels | Inter | 500 | 0.75rem | none | |
| Album card title | Archivo Narrow | 600 | 0.95rem | none | |
| Album card artist | Inter | 400 | 0.85rem | none | |
| Album card year badge | Inter | 700 | 0.7rem | none | On cover art |
| Album card style label | Inter | 400 | 0.7rem | uppercase | letter-spacing: 0.04em |
| Deep Dive header | Archivo Narrow | 700 | 1.8rem | none | Album title |
| Deep Dive subheader | Inter | 400 | 0.9rem | none | Artist · year · label |
| Tracklist track number | Inter | 500 | 0.8rem | none | |
| Tracklist track title | Inter | 500 | 0.85rem | none | |
| Tracklist duration | Inter | 400 | 0.75rem | none | --muted color |
| Personnel names | Inter | 500 | 0.85rem | none | Clickable → network |
| Personnel instrument | Inter | 400 | 0.8rem | none | --muted color |
| Editorial note label | Archivo Narrow | 600 | 0.7rem | uppercase | "Editorial note" |
| Editorial note body | Lora | 400 italic | 0.9rem | none | The serif distinction |
| Epistemic badges | Inter | 400/700 | 0.62rem | uppercase | See §2.4 |
| Personnel Network title | Archivo Narrow | 700 | 1.4rem | none | Center musician name |
| Personnel Network hint | Inter | 400 | 0.8rem | none | --muted color |
| Apple Music link | Inter | 500 | 0.85rem | none | --bn-blue color |

---

## 4. Layout Principles

Three rules derived from the album cover design tradition:

### 4.1 Asymmetry over symmetry

Album covers from this era rarely center everything. The site title, era labels,
and card layouts should feel intentionally off-balance. Text anchored to edges
and corners, not floating in the center. The site title "A Jazz Canon" sits
left-aligned in the header, not centered. Era labels in swim lanes align to the
left edge of their band, not the center.

### 4.2 Negative space is confidence

The covers breathe. The site should too. Generous padding. Elements that don't
touch the edges of their containers. The card grid should have visible space
between cards — not crowded. The Deep Dive panel should have generous internal
padding. Whitespace communicates that the content is worth room.

Recommended spacing values (existing in `app.css` — keep and extend):
```
--sp-1: 4px       /* tight: badge padding, inline gaps */
--sp-2: 8px       /* default: between related items */
--sp-3: 16px      /* comfortable: section internals */
--sp-4: 24px      /* generous: between sections, header padding */
--sp-5: 32px      /* airy: major section breaks (new) */
```

### 4.3 Photography is the hero

The album covers let the image do the work. On the site:

- Album cover art in cards is the dominant visual element. At 200–220px wide,
  the image should sit on the warm paper background like a record sleeve on a
  table — no borders, no heavy containers, no drop shadows.
- Text below the art is supporting: title, artist, year badge, style label.
  Small, clean, respectful.
- The Deep Dive panel header uses large cover art (300–400px) as the visual
  anchor. Title and metadata sit beside or below it, not on top of it.
- Graceful fallback for null `cover_art_url`: a styled placeholder with the
  album title in `--font-display`, centered on a `--line`-colored background.
  Not a broken image icon.

---

## 5. Component-Specific Notes

### Album cards

- No card border or container. The cover art sits directly on `--bg`.
- Title and artist below in tight stack: `--font-display` for title, `--font-body`
  for artist, `--muted` color.
- Year badge: small, bottom-left of cover art. Background: `--ink` at 0.7
  opacity. Text: white, `--font-body` 700, 0.7rem.
- Style label: below artist, `--font-body` 400, uppercase, 0.7rem,
  letter-spacing 0.04em, `--muted` color.
- Opacity transition on temporal distance: `transition: opacity 500ms ease`.

### Deep Dive panel

- Slides in from the right. Background: `--surface`.
- Header: large cover art (left), title + metadata (right). `--font-display` for
  album title. `--font-body` for artist, year, label, catalog.
- "Editorial note" label: `--font-display` 600, uppercase, 0.7rem,
  `--impulse-amber` color. Body text: `--font-serif` italic, 0.9rem.
- Tracklist: clean table-like layout. Track number in `--muted`. Title in
  `--ink`. Duration in `--muted`, right-aligned.
- Personnel under each track: name in `--font-body` 500, instrument in
  `--muted` 400, epistemic badge inline after instrument.
- "Listen on Apple Music" link: `--bn-blue`, `--font-body` 500. Underline on
  hover. External link icon optional.

### Personnel Network panel

- Background: `--bg` (not `--surface`). The graph sits on the same warm paper
  as the timeline — it's part of the same world.
- Center musician name: `--font-display` 700, 1.4rem.
- Hint text ("Click an album..."): `--font-body` 400, 0.8rem, `--muted`.
- Album nodes: filled with `--impulse-amber` at 0.8 opacity. This connects
  album nodes visually to the editorial accent — albums are the curated
  artifacts, not raw data.
- Center musician node: filled with `--bn-blue` at full opacity. The brand
  accent anchors the viewer's focus.
- Secondary musician nodes: filled with `--bn-blue-light` at 0.7 opacity.
  Same color family as the center, lighter — they're related but secondary.
- Edges: `--line` color (the same border/divider color used throughout).
  Stroke-width proportional to `shared_albums`.
- Node labels: `--font-body` 400, 10–11px. `--ink` color. White paint-order
  stroke for readability against the graph background.
- Close button: `--muted` color, `--font-body` 400. Large click target.

### Swim lane era bands

- Band background: era color tokens (see §2). Gradient fade at edges.
- Band label: `--font-display` 600, uppercase, 0.8rem. Color: `--era-ink`.
- Label slides with scroll, clamped to band's horizontal extent (see timeline
  redesign prompt for implementation detail).

### Year axis

- Year labels: `--font-body` 500, 0.75rem. `--muted` color.
- Axis line: 1px solid `--line`.
- Labels sit below the swim lanes, above the card grid.

---

## 6. What NOT to Do

- No dark mode. Light theme only. Standing rule.
- No traffic-light color scheme for epistemic badges (green/amber/red hierarchy).
- No borders or drop shadows around album cover art in cards.
- No centered layouts where asymmetry would be stronger.
- No more than three font families loaded.
- No red anywhere in the UI.
- No generic system fonts as the primary face (Helvetica Neue alone is too
  anonymous for this project's visual identity).

---

## 7. Implementation Notes

### For Claude Code (plain JS + CSS custom properties)

Replace `--font` in `app.css` with the three font variables above. Add the new
accent tokens to `:root` (`--bn-blue`, `--bn-blue-light`, `--impulse-amber` — no
red token). Load fonts via `<link>` in `app.html`. Update `EpistemicBadge.svelte`
color treatments per §2.4 (amber family for `inf`/`unk`, `--muted` for `obs`; no
red). Apply `--font-display` to headings and titles, `--font-body` to body text,
`--font-serif` italic to editorial notes.

### For Kimi (TypeScript + Tailwind)

Add the three Google Fonts via `<link>` in `app.html` or layout. Configure
Tailwind theme extension for the three font families. Map accent colors as
Tailwind custom colors or use inline styles for the accent system. Update
`EpistemicBadge.svelte` to use the §2.4 treatment: `--muted` for `obs`,
`--impulse-amber` for `inf` (italic) and `unk` (bold 700, `?` marker). No red
token needed. Apply `font-display` class to headings, `font-body` to text,
`font-serif italic` to editorial notes.

### Google Fonts performance

Three families at the weights specified total approximately 180KB (woff2,
gzipped). This is acceptable for a static site with no other heavy assets
(the JSON data is small). Use `display=swap` so text renders immediately in
system fallback and swaps to the loaded font without layout shift.

---

*End of design spec v1. Apply as a visual layer on top of existing structural
work. Does not change component architecture, data flow, or interaction
behavior — only visual treatment.*
