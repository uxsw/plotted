# Garden Birds — MVP

## Context

Plotted's new dashboard needs at least one content tile that isn't reliant on
the user having added plants, generated schemes, or built a shopping list —
both to avoid a barren first-run dashboard and to give users a reason to come
back regularly.

Garden Birds addresses this with a fixed reference list of common British
garden birds that users can "tick off" as they spot them in their own garden.
Content is entirely static and supplied by John (images + copy), so there's
no dependency on user-generated content, other in-progress features, or
future hires. The feature also has a natural "collect them all" hook that
works well as a small, glanceable dashboard widget (e.g. "4/12 spotted").

This is explicitly scoped as MVP. Longer-term ideas (more birds, user photo
submissions, spotted-bird list views, gamification/leaderboards) are noted
under Future Considerations but are out of scope here and should not
influence MVP data modelling beyond basic extensibility.

- [x] Bird list (~12 common British garden birds) and descriptions supplied
      in `docs/specs/birds/plotted-garden-birds.md`
- [x] Images supplied in `public/birds`, 700x700px, `.webp`
- [ ] Confirm where this lives in navigation pre-dashboard (standalone route)
      vs. how it's surfaced once the dashboard exists (tile)
- [ ] Confirm this is desktop/mobile agnostic for now — no dedicated desktop
      layout work should be pulled into this spec

## Naming note: designed for future reuse (birds, insects, wildlife)

John flagged that this same format (fixed reference list + image + short
description + user tick-off) could be reused later for insects or other
garden wildlife categories. **Multi-category support is explicitly out of
scope for this MVP build** — but naming should avoid a "birds-only" ceiling
so a future extension doesn't require renaming tables, routes, or storage
paths with live user data attached.

Concretely, this means:
- Table names use a generic noun (`species`, not `birds`) with a `category`
  column (e.g. `'bird'`) rather than a bird-specific table name
- Route/component naming avoids hard-coding "birds" where a category-neutral
  term reads just as naturally (e.g. `/garden-wildlife`)
- Image storage path can stay `public/birds` for now (matches current
  supplied assets) — no need to move these into a generic path pre-emptively,
  since storage paths are cheap to reorganise later and doing so now would
  be pure speculative work

This is a naming/schema-shape decision only. No category-switcher UI,
category filtering, or insect content should be built now.

## Changes

### Data model

New migration, following existing sequential numbering convention in
`supabase/migrations/`.

**`species` table** (static reference data, not user-owned)
- `id` (uuid, pk)
- `category` (text) — e.g. `'bird'`; not used for filtering/switching in
  MVP, just future-proofs the schema per the naming note above
- `name` (text)
- `image_path` (text) — Supabase Storage path (`public/birds/...` for MVP
  content), following existing plant image conventions
- `description` (text) — single paragraph, sourced from
  `docs/specs/birds/plotted-garden-birds.md`
- `sort_order` (int) — for consistent display order
- `created_at`

Seeded once via migration or seed script with the ~12 birds (`category =
'bird'`). No admin UI required for MVP — new species added via migration
if/when the list grows.

**`user_species_sightings` table** (join table, user-owned)
- `id` (uuid, pk)
- `user_id` (uuid, fk → auth.users)
- `species_id` (uuid, fk → species)
- `spotted_at` (timestamptz)
- Unique constraint on (`user_id`, `species_id`) — a species is either
  spotted or not for MVP, no multiple-sightings tracking

RLS: standard `auth.uid() = user_id` policy on `user_species_sightings`,
consistent with other user-owned tables in the project. `species` is public
read, no RLS write policy needed (managed via migration only).

### UI

- Bird list/grid page: card per bird showing image, name, description, and
  a tick/spotted toggle
- Toggle interaction: tap to mark spotted / unmark — optimistic UI update,
  consistent with existing interaction patterns elsewhere in the app
- Dashboard tile (once dashboard exists): compact summary, e.g. "4/12
  spotted" with possibly the most recently spotted bird's thumbnail. This
  spec covers the standalone list page; dashboard tile implementation is
  covered by the dashboard spec, not duplicated here — this spec should
  just ensure the underlying data/queries make that tile trivial to build.

### API / data access

- Read: fetch all species (`category = 'bird'`) + this user's sightings in
  one query (or two parallel queries) to render tick state
- Write: insert/delete row in `user_species_sightings` on toggle (no soft
  delete needed — unmarking a sighting is just removing the record)

## Do not

- Do not build any admin UI for managing the bird list in this pass — new
  birds are added via migration
- Do not build photo upload / user-submitted sightings — fixed images only
  for MVP
- Do not build spotted-bird history/list views beyond the simple tick state
  — no timestamps shown in UI, even though `spotted_at` is stored
- Do not build gamification, streaks, or leaderboards
- Do not expand the bird list beyond the initial ~12 without a separate
  content pass
- Do not build multi-category support (insects, wildlife) — the `category`
  column exists for future-proofing only; no category switcher, filtering,
  or second category's content in this pass
- Do not build the dashboard tile itself as part of this spec — only ensure
  the data layer supports it cleanly

## Effort estimate

**Low.** Static content, one new join table, standard RLS pattern already
used elsewhere in the project, simple toggle UI with no complex state.
Comparable in scope to other small additive features already shipped
(e.g. feedback widget), rather than a multi-stage build like scheme
generation or the shopping list.

## Deliverable format

Staged, reviewable diffs via Claude Code, per usual process:
1. Migration (table + RLS + seed data placeholder — actual bird content
   supplied separately)
2. Bird list page UI + toggle interaction
3. Wire up to navigation

Each stage reviewed before proceeding. Claude Code prompt to include an
explicit "do not touch" section referencing the constraints above.

## Future considerations (out of scope for MVP)

- Expanding beyond ~12 birds
- Extending to other categories (insects, other garden wildlife) reusing
  the same `species` / `user_species_sightings` structure
- User-submitted photos per sighting
- Dedicated "my spotted birds" list/history view
- Gamification: streaks, badges, seasonal spotting challenges, leaderboards
- Possible tie-in with weather/season data for "birds you might see now"
