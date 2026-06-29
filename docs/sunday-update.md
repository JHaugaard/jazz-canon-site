---
type: reference
status: draft
tags: jazz-canon, sunday-update, epistemics, design, prompts
---

# Sunday Update — Jazz Canon Build
Prepared 2026-06-28 by Hermes.

Three items: (1) proposed design spec revision dialing back epistemic design
infrastructure, (2) assessment of whether CC/Kimi build prompts need epistemic
adjustment, (3) prompt for CC on mccoy-tyner to fix the track-level `inf` data
gap in the export pipeline.

---

## 1. Design Spec Revision — Epistemic Treatment (Proposed)

### Context

The design spec v1 (`_inbox/design-spec-v1.md`) dedicates significant
infrastructure to epistemic visual treatment: a dedicated accent color
(`--accent-red`) reserved exclusively for `unk`, a full section on epistemic
badge styling, an anti-pattern warning, and edge styling guidance for the
Personnel Network.

After tracing the actual data from database to UI, the reality is:

- 98.5% of performance records are `obs` — directly observed
- 9 performances out of 618 are `unk` (3 early Cool Jazz albums)
- 0 performances are `inf` at the performance level
- 56 tracks have `epistemic_track = inf` but this field does not currently
  propagate into the exported JSON (see item 3 below)
- A typical visitor may encounter zero or one `unk` badge in an entire session

The epistemic system is architecturally correct and should remain in place.
But the design infrastructure is disproportionate to its visibility. This
revision dials it back without removing the architecture.

### What changes

**Remove: `--accent-red` as a dedicated accent color.**

The current spec reserves a Columbia/Miles red exclusively for `unk` and states
it appears "nowhere else in the UI." This is over-engineered for a state that
appears 9 times across 3 albums. Instead:

- `unk` uses the same warm amber as `inf` but with bold weight and a `?` marker
- The visual distinction between `inf` and `unk` becomes weight + marker, not
  a separate color
- Red is freed from the epistemic system entirely (use it nowhere, or reserve
  it for future error states if needed)

**Simplify: Epistemic badge treatment.**

Revised treatment — two color families, distinguished by weight and style:

```
obs — observed (sourced fact):
  Color: --muted (the standard secondary text color)
  Background: transparent
  Font weight: 400 (normal)
  Font style: normal
  Mood: quiet default. Sourced facts don't shout.

inf — inferred:
  Color: --impulse-amber (#c4862a)
  Background: rgba(196, 134, 42, 0.08)
  Font weight: 400
  Font style: italic
  Mood: warm, human. The editorial register.

unk — uncertain:
  Color: --impulse-amber (#c4862a) — same family as inf
  Background: rgba(196, 134, 42, 0.12) — slightly stronger
  Font weight: 700 (bold)
  Font style: normal
  Text: unk? (with question mark)
  Mood: same warm family, but bold and questioned. Distinct from inf
  by weight and marker, not by jumping to a different hue.
```

**Keep: The anti-pattern note.** No traffic-light palette (green/amber/red).
This remains correct and worth stating. The revised treatment above avoids it
by using one color family with weight/marker differentiation.

**Keep: Single source of truth.** EpistemicBadge as one component remains
architecturally correct. No change.

**Keep: Edge styling deferral.** The recommendation to ignore epistemic on
network edges for v1 stands. No change.

**Reduce: Section prominence.** In the design spec, the epistemic treatment
section shrinks from a full accent color system + detailed badge specs + edge
guidance to: a badge treatment table, the anti-pattern note, and one sentence
on edge deferral. It becomes a subsection of the color/typography chapter,
not a standalone chapter.

### What stays unchanged

- The EpistemicBadge component architecture (single source of truth)
- The principle that obs/inf/unk must be visually distinct
- The principle that editorial content uses serif italic, sourced facts use
  sans-serif (this is typography, not epistemic badge, and it serves the same
  goal at a different level)
- The edge styling deferral for v1

### Summary of the revision

One color family (amber) for both `inf` and `unk`, distinguished by weight and
marker. No dedicated red accent. Same architecture, same single-source-of-truth
component, same anti-pattern guardrail. Less design infrastructure for a feature
that surfaces in 1.5% of the data. Ready to fold into design-spec-v2 when we
revise.

---

## 2. Build Prompts for CC and Kimi — Epistemic Adjustment Assessment

### My read: no adjustment needed.

The epistemic system is already implemented correctly in both repos:

**CC (jazz-canon-site):**
- `EpistemicBadge.svelte` — single source of truth, used in Tracklist and
  PersonnelList ✓
- `epistemic.js` — metadata mapping for obs/inf/unk ✓
- `PersonnelNetwork.svelte` — edge epistemic encoding (solid/dashed/dotted) ✓
  (CC implemented this; it was on the punch list as "missing" but CC has since
  added it)

**Kimi (jazz-canon-site-kc):**
- `EpistemicBadge.svelte` — present, used in tracklist and personnel ✓
- Color scheme needs revision (traffic-light → amber family) — already on
  punch list ✓
- Edge epistemic not implemented — acceptable for v1 per the deferred decision ✓

### What to do (or not do)

**Do not add epistemic instructions to the timeline redesign prompts.** The
timeline redesign is about visual layout and interaction — swim lanes,
proportional axis, card grid. Epistemics don't surface there and shouldn't be
introduced.

**The punch list items already cover what needs attention:**
- Kimi's EpistemicBadge color scheme → already on `punchlist-kimi.md` item 2
- Edge epistemic styling → already addressed in the shared item (deferred for v1)

**The only follow-up** is the design spec revision above. When the revised
badge treatment (amber family, no red) is finalized in design-spec-v2, that
becomes a one-line addition to each agent's punch list:

> Update EpistemicBadge to use the revised color treatment: both `inf` and
> `unk` use the amber family (--impulse-amber), distinguished by font weight
> and `?` marker. No red anywhere in the epistemic system. See design-spec-v2
> §4 for exact values.

But that's a refinement pass item, not a build instruction. The current
implementations are structurally correct and can ship as-is for v1.

### Bottom line

No prompt changes needed for CC or Kimi on epistemics. The architecture is
right, the components are in place, the punch list items cover the remaining
refinements. We should stop refining the epistemic system and let it do its
quiet work. Shift conversational energy to the timeline redesign and the data
pipeline fix below.

---

## 3. Prompt for CC on mccoy-tyner — Track-Level Epistemic Gap

### The gap

The `track` table carries an `epistemic_track` field (obs/inf/unk) that
indicates whether the personnel listing for a track is directly observed,
inferred, or uncertain. Current distribution:

- 528 tracks: `obs`
- 56 tracks: `inf` (e.g., tracks on *Blue Train*, *A Night at Birdland*,
  *A New Perspective* — albums where liner notes list album personnel but
  don't specify who plays on which track)
- 7 tracks: `unk`

The export script (`scripts/export.py`) builds track personnel in the album
detail JSON with an `epistemic` field per person — but that field comes from
the `performance` table (individual musician credits), not from
`epistemic_track` (the track-level personnel listing certainty). The result:
the 56 `inf` tracks show their musicians as `obs` in the JSON, which is
technically correct at the performance level but loses the track-level
inference information.

### The prompt

> In `scripts/export.py`, the track objects in `data/album/{slug}.json` are
> missing the track-level epistemic field. The `track` table has
> `epistemic_track` (obs/inf/unk) which indicates whether the personnel
> listing for that track is directly observed, inferred, or uncertain. This is
> distinct from the per-performance `epistemic` field that already exports
> correctly.
>
> **What to do:**
>
> 1. Add `epistemic_track` as a field on each track object in the album detail
>    JSON export. Values: `obs`, `inf`, `unk`.
>
> 2. Do NOT change the per-person `epistemic` field on track personnel — that
>    comes from the `performance` table and is correct as-is.
>
> 3. The JSON shape for a track becomes:
>    ```json
>    {
>      "track_id": "uuid",
>      "title": "So What",
>      "track_number": 1,
>      "side": "A",
>      "duration_text": "9:22",
>      "apple_track_id": null,
>      "epistemic_track": "obs",
>      "personnel": [ ... ]
>    }
>    ```
>
> 4. Re-run `export.py` and verify that the 56 tracks with
>    `epistemic_track = 'inf'` now carry that value in the JSON. Spot-check
>    *Blue Train* (several inf tracks) and *A New Perspective* (5 inf tracks).
>
> 5. Do NOT change the UI to display this yet — this is a data pipeline fix
>    only. The UI implications (how to show "this track's personnel is
>    inferred" at the track level vs. per-musician level) will be addressed
>    separately.
>
> **Why:** The track-level epistemic is genuine information — it tells the
> user "we know who played on this album, but we're not certain which
> musicians are on this specific track." Losing it in the export makes the
> data look more certain than it is. This is a data integrity fix, not a
> feature addition.

---

*End of Sunday Update. Three items: design spec revision (review when ready),
build prompt assessment (no changes needed), data pipeline prompt (dispatch to
CC on mccoy-tyner).*
