# Plotted — Plant List / Grid Page

## Context
First real page built on the design foundation (tokens + primitives already implemented and verified at `/design-check`). Uses the `Card` and `EmptyState` components as-is — this task is about data wiring, layout, and sort, not new visual components.

**Suggested effort level: low.** Routine page assembly on top of already-built primitives; the only logic of note is sort and the display-name fallback, both of which are simple.

---

## Route & data
- Route: plant list/grid page (root or `/plants` — match whatever convention the rest of the routing already uses)
- Server component fetch from Supabase: `status = 'active'` only (exclude soft-deleted)
- No pagination — fetch the full active set in one query. Fine at personal-portfolio scale; revisit only if this becomes a real bottleneck.

## Sort
- Two options: **Date planted** (default, newest first) and **Name** (A–Z, using the same display-name logic below)
- Implement as a **client-side re-sort of the already-fetched array** — a simple toggle/select that re-orders state, not a server round-trip or URL search param. Don't add routing/query-string complexity for this.
- Persisting the chosen sort across visits is a nice-to-have, not required for MVP — skip unless trivial.

## Display name (per card)
Reuse the existing fallback logic (already built as part of the genus/species/cultivar sanitization work) rather than re-implementing:
- Title: `common_name` if set, else formatted scientific name
- Subtitle: formatted scientific name shown whenever `common_name` is set (so the card always surfaces the botanical name, per the Card component's existing title/subtitle slots) — omit the subtitle entirely if there's no `common_name` (don't show the same string twice as both title and subtitle)

## Card edge cases to verify
- No `photo_url` → illustrated placeholder (already handled by `Card`, just confirm it's wired through)
- No `flowering_season_from`/`_to` → omit the season tag entirely, don't render an empty pill
- Long `common_name` → should wrap/clamp gracefully (2 lines, ellipsis), not break card layout
- Long scientific name (genus + species + cultivar) → allow wrap, don't clamp — botanical names matter more here than tidy single-line truncation

## Empty state
- Zero active plants → render the existing `EmptyState` component, "Nothing planted yet" copy + CTA to the add-plant flow (reuse, don't fork a new copy of the component)

## Layout
- **MVP is mobile-first only.** Cap page content width at ~500px, centered, regardless of viewport size — don't design or test desktop/tablet breakpoints at this stage. This applies to the page shell generally, not just this view, so the constraint likely belongs at a layout level (e.g. root or shared layout wrapper) rather than re-applied per page.
- Within that ~500px constraint, grid using the `Card` component's natural width — `auto-fill`/`minmax` is still the right approach (no need to hardcode a column count), it'll just resolve to one column most of the time at this width, which is expected and fine.

## Loading state
- Simple `loading.tsx` with a lightweight skeleton (a handful of muted placeholder card shapes is enough) — don't over-build this for a single-user app with a small dataset; it'll rarely be visible

## Non-goals (explicitly out of scope here)
- Search/filter (confirmed deferred)
- Pagination
- Sort persistence across sessions
- Any location/sun/zone filtering — all deferred per existing scope decisions
- Desktop/tablet-specific layouts (MVP is mobile-first only — see Layout section)

## Acceptance check
Compare the rendered grid against the design reference for card spacing/sizing. Confirm sort toggle visually matches the button/control style from the design foundation rather than introducing a new control style.