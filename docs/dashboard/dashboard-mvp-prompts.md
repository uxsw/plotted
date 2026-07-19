# Dashboard MVP — Staged Claude Code Prompts

Source spec: `docs/specs/dashboard/dashboard-mvp.md`

Run in order. Each stage should produce a reviewable diff before moving to the next.

---

## Stage 1 — Section-array shell

```
Create the dashboard page shell using a static section-array architecture,
per docs/specs/dashboard/dashboard-mvp.md.

Structure:
- A fixed, ordered array of section definitions: garden, birds, weather,
  schemes, shopping list (in that order).
- Each section is its own component, responsible for its own data-fetch and
  its own decision on whether to render (return null if its condition isn't
  met). The shell itself contains no per-section conditional logic — it just
  renders the array in order and lets each component decide for itself.
- For this stage, stub each section component as a minimal placeholder
  (e.g. a labeled box) so the shell and composition can be reviewed before
  any real section is built.

Match the existing app structure/routing conventions for where a dashboard
page currently lives or should live (check app/(app)/ for the convention
used by similar top-level pages).

No data fetching, no real UI in this stage — just the composition shell and
placeholder components. Show me the diff.
```

**Effort:** Low
**Review focus:** each section genuinely owns its own render-or-not decision (not centralized in the shell), order matches garden → birds → weather → schemes → shopping list, follows existing routing conventions rather than inventing a new pattern.

---

## Stage 2 — Garden section

```
Build the garden section for the dashboard, per
docs/specs/dashboard/dashboard-mvp.md.

Layout: 1 hero plant card + 5 smaller plant cards, horizontally scrolling.
Selection: ~6 most recently added plants for the current user, with the
single most recent as the hero.

Include a "View all" link/button pointing to the existing full garden view
(same route used elsewhere in the app — find and reuse it, don't create a
new route).

Empty state: if the user has zero plants, reuse the existing empty-state
card component already used elsewhere in the app (find it — don't build a
new empty-state pattern for this).

This section always renders (no data-hiding condition) — it's either
populated or in its empty state.

Show me the diff.
```

**Effort:** Medium
**Review focus:** actually reuses the existing empty-state component rather than building a new one, hero/smaller-card visual distinction is clear, horizontal scroll behaves reasonably on mobile widths, "view all" points at the real existing route.

---

## Stage 3 — Bird spotter + weather section wiring

```
Wire the existing bird spotter feature and existing weather forecast
display into the dashboard as sections, per
docs/specs/dashboard/dashboard-mvp.md.

Both sections always render (no conditional data-hiding) — reuse the
existing components/logic as-is, just placed into the dashboard's section
array in their existing form. Do not modify the underlying bird spotter or
weather components themselves in this stage — this is placement/wiring
only.

If either component needs a wrapper to fit the dashboard section layout
(e.g. consistent section spacing/heading treatment with the garden
section), add a thin wrapper rather than modifying the original component.

Show me the diff.
```

**Effort:** Low
**Review focus:** genuinely no changes to the underlying bird spotter/weather components, just placement — if the diff touches their internals, that's scope creep worth pushing back on.

---

## Stage 4 — Schemes section

```
Build the planting schemes section for the dashboard, per
docs/specs/dashboard/dashboard-mvp.md.

Render condition (compound): only render if the current user has ≥1 plant
AND ≥1 scheme. If either condition fails, render nothing (return null) —
no empty state for this section, it simply doesn't appear.

Reuse existing schemes data-fetching logic rather than writing a new query
pattern. Reuse existing scheme card/list UI where possible rather than
building new presentation for this section — check how schemes are
displayed elsewhere in the app first.

Show me the diff.
```

**Effort:** Low–Medium
**Review focus:** the compound condition is actually two checks (plants AND schemes), not just one; confirms it queried existing schemes logic rather than duplicating it.

---

## Stage 5 — Shopping list section

```
Build the shopping list section for the dashboard, per
docs/specs/dashboard/dashboard-mvp.md.

Layout: horizontally scrolling, 2–3 rows.

Render condition (compound): only render if the current user has ≥1 plant
AND the shopping list has ≥1 item. If either condition fails, render
nothing (return null) — no empty state for this section.

Reuse existing shopping list data-fetching logic rather than writing a new
query pattern.

Show me the diff.
```

**Effort:** Low–Medium
**Review focus:** same compound-condition check as Stage 4, 2–3 row horizontal scroll layout is distinct from the garden section's single-row scroll (don't just copy-paste the garden section's layout wholesale — the row count differs).

---

## Notes for all stages

- Each stage should be run and reviewed independently.
- Order in the array (garden → birds → weather → schemes → shopping list) is a first pass and expected to change once you have engagement data — don't let Claude Code treat it as load-bearing or hardcode assumptions elsewhere that depend on this exact order.
- Frost warning and the "this week in your garden" narrative line are explicitly out of scope for all of these stages.
- Desktop-specific layout is a separate, later pass — these stages target your current build layout only.
