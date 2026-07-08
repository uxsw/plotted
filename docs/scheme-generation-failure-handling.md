# Scheme generation failure handling + plant deletion safety

## Problem

Today, a `schemes` row is only inserted after AI generation succeeds
(`name`, `narrative_intro`, `narrative_body` are all `NOT NULL`). If
generation fails or times out partway through, nothing is persisted —
no record of the scheme attempt, and no record of which plants the
user selected. This means:

- A failed generation has no visible trace for the user to return to.
- There's no way to retry, since the original plant selection isn't
  stored anywhere until generation already succeeded.

Separately, `scheme_source_plants.plant_id` has a foreign key to
`plants.id` with no `ON DELETE` action specified (defaults to
`NO ACTION`/restrict in Postgres). `plants` already has a `status`
column (`active` / `removed`) suggesting deletion was designed to be
soft — but this needs confirming, since if plant deletion is currently
a hard `DELETE`, it will fail outright for any plant referenced by a
saved scheme.

## Goals

1. Persist a scheme attempt (and the user's plant selection) before
   generation runs, so failures are recoverable and retryable.
2. Show a clear failure state on the scheme landing page for failed
   attempts, with a retry action.
3. Ensure deleting a plant never breaks a saved scheme or silently
   fails at the DB level.

## Non-goals

- No changes to the AI generation logic/prompt itself — this is purely
  about persistence and surrounding UX.
- No changes to the plant detail page's gold notice panel (already
  shipped) or the scheme detail page's gold notice panel (already
  shipped).
- No admin tooling for managing failed schemes.

## Schema changes

### `schemes` table

- Add `status text NOT NULL DEFAULT 'generating' CHECK (status = ANY
  (ARRAY['generating', 'complete', 'failed']))`.
- Relax `NOT NULL` on `name`, `narrative_intro`, `narrative_body` —
  these are only populated on successful generation. Confirm current
  app code doesn't rely on these being non-null anywhere (e.g.
  TypeScript types, display fallbacks) before dropping the constraint.
- `space`, `successional`, `edible` stay `NOT NULL` — these are user
  inputs captured at submission time, before generation runs.

### `scheme_source_plants` → `plants` foreign key

- Change to `ON DELETE SET NULL`. This is a safety net only — the
  primary fix (below) should mean this rarely triggers, but it ensures
  a hard delete never fails ungracefully or blocks the user.
- Confirm `plant_id` can safely be nullable at the app level (i.e.
  nothing assumes it's always present when reading source plants for
  retry — see Retry flow below for how to handle a null plant_id).

### `plants` table — no schema change, but verify behaviour

- Confirm whether the current "delete plant" action performs a hard
  `DELETE` or sets `status = 'removed'`. If hard delete: change it to a
  soft delete. If already soft delete: no change needed here, but
  audit every plant list/query in the app (`My Plants`, plant picker,
  etc.) to confirm they filter `WHERE status = 'active'` so removed
  plants don't reappear anywhere the user didn't expect.

## Generation flow changes

**Today**: user submits selection → AI generation runs → on success, a
single `schemes` row (with narrative fields) plus `scheme_suggestions`
rows are inserted together.

**New flow**:

1. On submission, immediately insert:
   - A `schemes` row with `status = 'generating'`, and the user-supplied
     fields (`space`, `successional`, `edible`) populated. Leave `name`,
     `narrative_intro`, `narrative_body`, `summary` null.
   - `scheme_source_plants` rows for each selected plant, referencing
     this scheme's `id`.
2. Kick off AI generation using the newly-created scheme's `id` as the
   handle.
3. On success: update the same `schemes` row with `name`,
   `narrative_intro`, `narrative_body`, `summary`, set
   `status = 'complete'`, and insert `scheme_suggestions` rows.
4. On failure (exception, timeout, or invalid AI response): update the
   same row with `status = 'failed'`. Leave `scheme_source_plants`
   untouched — this is what makes retry possible.
5. The scheme detail page should only ever be reachable/rendered for
   `status = 'complete'` schemes. Decide (and confirm with product
   owner if unsure) whether an in-progress `generating` scheme should
   redirect back to the landing page or show a loading state if the
   user navigates to its URL directly mid-generation.

## Landing page changes

- Scheme landing page query should include schemes with
  `status IN ('complete', 'failed')` — exclude `generating` unless
  there's a reason to show an in-progress card too (check with product
  owner; out of scope to design that state here unless trivial).
- For `status = 'failed'` schemes, render a card variant:
  - No scheme name (none was generated).
  - Message: something like "This scheme couldn't be generated. Try
    again?" — match existing app copy voice.
  - A retry action that re-triggers generation using the existing
    `scheme_source_plants` rows for that scheme (join to `plants` for
    genus/species/cultivar, skipping any row where `plant_id` is now
    null — see below).
  - Consider whether a failed scheme can be dismissed/deleted from the
    landing page (likely yes — otherwise failed attempts accumulate
    with no way to clear them). Confirm with product owner if unsure;
    reasonable default is to allow delete on a failed card only.

## Retry behaviour with a null `plant_id`

If a source plant was hard-deleted (however that happened before the
soft-delete fix lands) and `scheme_source_plants.plant_id` is null:

- Skip that plant silently when reassembling the retry input — don't
  block the retry entirely for one missing plant.
- If this causes the source plant count to drop to zero, show a
  message explaining the scheme can't be retried because the original
  plants are no longer available, rather than attempting generation
  with an empty input.

## Effort estimate

Medium — spans a migration, changes to the generation flow (likely
touching a server action or route), a new card variant on the landing
page, and a plant-deletion behaviour check/fix. Recommend Claude Code
implement this in stages rather than one large diff:

1. Migration + relax constraints.
2. Generation flow: create-then-update pattern, failure handling.
3. Landing page failed-card + retry.
4. Plant deletion audit/fix + FK change.

Each stage should get its own diff review before moving to the next.
