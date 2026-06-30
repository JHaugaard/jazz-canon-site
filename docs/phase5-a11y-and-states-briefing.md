# Phase 5 — Accessibility & empty-state briefing

**For:** John, to get up to speed before we implement. **Status:** briefing only — nothing
changed yet. Written 2026-06-29.

This is the "make it trustworthy and usable for everyone" pass. Two halves: **(A)
accessibility** (works with keyboard + screen readers, not just mouse) and **(B) empty/
missing-field states** (the data has real holes — the UI must degrade gracefully). Each item
below: *what it is · why it matters · where this app stands · what to do · effort.*

---

## A. Accessibility (a11y)

### A1. Focus management for the two panels (Deep Dive, Constellation) — **highest value**
- **What:** when a panel/modal opens, keyboard focus should move *into* it; Tab should stay
  *trapped* inside while it's open; Esc closes; and on close, focus returns to the element
  that opened it (the album card / musician name).
- **Why:** without it, a keyboard user opens the panel but their "cursor" is still behind it,
  and screen readers keep reading the timeline underneath.
- **Status:** Esc-to-close works; backdrop is a real button. **Missing:** focus move-in, focus
  trap, focus restore, and dialog semantics (`role="dialog"`, `aria-modal="true"`,
  `aria-labelledby` pointing at the title).
- **To do:** add the dialog roles + a small focus-trap (or a tiny library) to `DeepDivePanel`
  and `PersonnelNetwork`. **Effort:** medium (the most code of the a11y items, but well-trodden).

### A2. Visible focus indicator
- **What:** a clear ring on whatever is keyboard-focused, via `:focus-visible`.
- **Why:** keyboard users must see where they are. Design passes often strip outlines.
- **Status:** needs an audit — our buttons (cards, musician names, close) may have no visible
  focus style. **To do:** one global `:focus-visible` rule in `app.css` (bn-blue ring).
  **Effort:** low.

### A3. The Constellation graph is mouse-only — **the hard one**
- **What:** the D3 force graph's nodes are SVG drawn for the mouse (click/drag/hover). There's
  no keyboard way to move between nodes or activate them.
- **Why:** a keyboard/screen-reader user can't "follow the thread."
- **Status:** genuinely inaccessible by keyboard. Full keyboard graph nav is a big lift.
- **To do (pragmatic v1):** (1) ensure the *Deep Dive* remains the keyboard path — its
  personnel lists are real buttons, so a keyboard user can still reach every musician/album
  there; (2) add an accessible text fallback inside the modal — a visually-muted but
  screen-reader-available list of "albums in this view / musicians in this view" as links that
  do the same thing as clicking nodes. **Effort:** medium; full canvas keyboard-nav = defer.
  **Decision needed from you:** fallback-list now, or accept "graph is a mouse enhancement, Deep
  Dive is the accessible equivalent" and document it.

### A4. Landmarks + skip link
- **What:** wrap regions in `<header>`/`<main>`/`<nav>`; add a "skip to timeline" link.
- **Why:** lets assistive tech jump straight to content.
- **Status:** homepage has `<header>`; timeline isn't in a `<main>`. **To do:** add `<main>` +
  a skip link. **Effort:** low.

### A5. Reduced motion
- **What:** honor `@media (prefers-reduced-motion: reduce)` — tone down the panel slide-in and
  (ideally) settle the graph quickly instead of a long animated jiggle.
- **Why:** motion can cause real discomfort/vestibular issues.
- **Status:** not handled. **To do:** a media query that disables/》shortens transitions; for D3,
  reduce/skip the alpha animation. **Effort:** low–medium.

### A6. Color contrast audit
- **What:** verify text/background pairs meet WCAG AA (4.5:1 normal, 3:1 large).
- **Why:** low-contrast text excludes low-vision users; also just good craft.
- **Status:** unknown — the new palette (muted greys, amber epistemic, bn-blue links on paper)
  needs checking. **To do:** run the key pairs through a contrast checker; nudge tokens if any
  fail. **Effort:** low (checking) + small token tweaks.

### A7. Images & control labels
- **Status:** cover `<img>` have `alt`; close buttons have `aria-label`. Mostly good.
  **To do:** quick sweep for any unlabeled icon-only control. **Effort:** low.

---

## B. Empty / missing-field states (against the real data)

The export survey found real holes; the UI must never show an empty label or a broken element.

### B1. Apple Music — 3 of 100 albums have no `apple_album_id`
- **Status:** `AppleMusicLink` already renders nothing when the id is absent. **To do:** confirm
  on one of the 3 (e.g., open it and verify no stray "Listen" affordance). **Effort:** trivial (verify).

### B2. Studios — 4 albums have none
- **Status:** Deep Dive only renders the studio line when present. **To do:** verify the
  "Recorded/Studio" block doesn't show an empty label or dangling separator. **Effort:** trivial.

### B3. Descriptions — currently 0 albums have one
- **Status:** the "Editorial note" block is conditional (dormant). **To do:** nothing now;
  re-check when descriptions get written. **Effort:** none.

### B4. Cover art — 0 null in `albums.json`, but the loader/detail could still hit null
- **Status:** `AlbumCard` has a hatched title-text fallback. **To do:** keep it; it's the safety net.

### B5. Other nullable fields
- `recording_dates_text`, `catalog_number`, `label`, `duration_text`, `side` can be null.
- **To do:** audit Deep Dive + Tracklist so each is wrapped in `{#if …}` and never prints an
  empty "·" or label. **Effort:** low.

### B6. Graph edge cases
- A musician on only one album (degree 1) → tiny star; a musician with no co-personnel.
- **Status:** `buildScopedGraph` returns center + albums even with no secondary musicians.
  **To do:** verify the smallest case (e.g., a one-album sideman) renders sensibly, not blank.
  **Effort:** low (verify).

### B7. Loading / error (already done)
- Deep Dive shows "Loading…" / "No data for {slug}" / "Couldn't load…". Keep.

---

## Suggested order (when we build it)
1. **B1–B7 verification sweep** (fast, low-risk, catches real holes) + the easy a11y wins
   (A2 focus ring, A4 landmarks/skip, A5 reduced-motion, A6 contrast).
2. **A1 panel focus management + dialog semantics** (the meatier, high-value piece).
3. **A3 graph fallback** — after your decision on fallback-list vs documented-limitation.

## Decisions I need from you
- **A3:** build the accessible text-fallback list inside the Constellation modal, or accept
  "graph = mouse enhancement, Deep Dive = the accessible equivalent" and just document it?
- **Scope:** target **WCAG 2.1 AA** as the bar, or a lighter "reasonable keyboard + contrast"
  pass for v1?
