# Timeline density — ideas for taming the "wall of album cards"

**Status:** Thinking notes — 2026-06-27 (session `build-1`). Not a plan; idea fuel for later.

## The problem, stated
The proportional timeline stacks same-year albums into vertical lanes. The golden run
(1955–1964) is genuinely dense — 1964 alone has 11 albums — so those years become a tall
"wall" of cards (~2,000px), which (a) forces vertical scrolling that competes with the
horizontal time-travel metaphor, and (b) reads as overwhelming, against the spec's
"never overwhelming / progressive disclosure" principle (§5.1).

The density is also *the story* — the post-bop explosion really did happen there. The goal
isn't to hide it; it's to present it so it feels rich, not like a spreadsheet.

---

## Idea catalog

### A. Semantic zoom (level-of-detail)
Far view = tiny tokens (cover thumbnails, dots, or LP "spines"); zoom/hover promotes a token
to a full card. The timeline reads as a dense, beautiful field at a glance; detail on demand.
- Pro: keeps everything visible *and* uncluttered; scales as the canon grows past 100.
- Con: more interaction states to build; needs a zoom control or scroll-to-zoom.

### B. Record-shelf spines ★ (on-theme)
Render albums as thin vertical **spines packed like LPs on a shelf**; hover/focus pops the
cover + title. Dense years become a fat, satisfying run of spines instead of stacked cards.
- Pro: thematically perfect for jazz; enormous space savings; the density looks *good*.
- Con: covers (the best part) are hidden until hover — mitigate with a peeking sliver of art.

### C. Genre swimlanes ★★ (also fixes the era-band/genre tension)
Make the **vertical axis meaningful**: horizontal rows per stream (Cool / Hard Bop / Soul
Jazz / Modal / Post-Bop); place each album at (year × its genre row). Vertical position now
*means* something instead of being arbitrary collision-avoidance.
- Pro: caps stacking (only same year *and* same genre collide — far rarer than 11);
  turns the wall into a readable time×genre chart; **directly resolves the
  [[era-bands-vs-genre-labels-tension]]** by making genre a spatial axis (the bands become
  the lanes). Two problems, one move.
- Con: biggest departure from the current single-band layout; an album with multiple genres
  needs a primary-genre rule (we have `style_primary`, so this is fine).

### D. Cluster-and-expand
Dense years collapse to one "stack" tile ("1964 · 11 albums") that fans out / opens a small
year sheet on click. Overview stays calm; depth on engagement.
- Pro: bounded height by default; strong progressive disclosure.
- Con: hides covers behind a click; the fan-out animation is the make-or-break.

### E. Capped lanes + "+k more"
Show top N lanes (e.g. 3–4); a "+7 more" chip opens that year/region in a focused grid.
- Pro: simple, predictable height. Con: arbitrary which cards win the top lanes.

### F. Density ribbon as navigator
The timeline itself becomes a compact **density ribbon/histogram** (taller = denser years —
the 1958–64 peak pops as information). Click a span to reveal its albums in a focused panel.
- Pro: the problem becomes the feature; tiny overview, rich on demand.
- Con: demotes the cover-art browse that people love into a second step.

### G. Sub-year horizontal spread
Let same-year cards fan slightly along x within the year (cosmetic jitter) instead of stacking
vertically — keeps it a horizontal ribbon.
- Pro: cheap; preserves the horizontal feel. Con: implies sub-year precision we don't have;
  only buys a little before it overlaps the next year.

---

## Where my head is leaning (for discussion, not decision)
**C (genre swimlanes) is the standout** because it's the only idea that solves *two* logged
problems at once — the wall *and* the genre/year-range tension — and it makes the vertical
dimension earn its space. Pair it with a touch of **A or B** (compact tokens that bloom to
cards) and dense lanes stop being a wall and become a legible, browsable field.

A lighter, faster path if we want minimal change: **E (capped lanes + "+more")** now, swimlanes
later.

## Open questions for John (later)
1. Is the **vertical axis allowed to mean genre** (swimlanes), or must it stay a single time
   ribbon with era bands purely as backdrop?
2. How precious is **always-visible cover art** vs. reveal-on-hover? (Decides A/B vs. D/F.)
3. Is **scroll-to-zoom** acceptable as a primary interaction, or keep it drag-to-scroll only?
4. Growth: should the layout assume the canon stays ~100, or scale gracefully to 200+?
