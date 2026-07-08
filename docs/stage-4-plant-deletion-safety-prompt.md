STAGE 4 of 4 — Plant deletion safety audit and fix

Reference spec: docs/specs/scheme-generation-failure-handling.md
(read this first — this prompt covers the plants.status /
deletion-behaviour portion of "Schema changes")

Prerequisite: Stage 1 is merged (scheme_source_plants.plant_id FK is
now ON DELETE SET NULL, as a safety net).

CONTEXT
`plants` already has a `status` column (`active` / `removed`),
suggesting plant deletion was designed to be a soft delete. This stage
confirms and enforces that, so deleting a plant referenced by a saved
scheme never fails at the DB level and never breaks a scheme's data.

PRE-FLIGHT CHECKS (do before editing, report back — this is the
important part of this stage)
1. Locate the current "delete plant" action (likely in My Plants or
   the plant detail page). Determine exactly what it does today: a
   hard `DELETE FROM plants`, or an update setting `status =
   'removed'`?
2. If it's already a soft delete: search the codebase for every place
   that queries the `plants` table (My Plants list, plant picker in
   scheme creation, search, any dropdown or listing) and confirm each
   one filters `WHERE status = 'active'`. List any that don't.
3. If it's currently a hard delete: note what currently happens when a
   user tries to delete a plant that's referenced by
   scheme_source_plants — does it throw an unhandled error, get
   silently swallowed, or something else? Reproduce if reasonably
   possible.

CHANGES
1. If plant deletion is currently a hard delete: change it to a soft
   delete (`status = 'removed'`) instead. Keep the UI-facing behaviour
   the same (plant disappears from the user's view) — only the
   underlying mechanism changes.
2. Update every plant query found in the pre-flight check that doesn't
   already filter `status = 'active'` to do so, so removed plants don't
   resurface anywhere unexpected (plant picker, search, etc.).
3. Confirm the scheme creation plant-picker (used when starting a new
   scheme) also filters to active plants only — a removed plant
   shouldn't be selectable for a new scheme, even though old schemes
   that already reference it are unaffected.
4. Leave the stage 1 FK change (`ON DELETE SET NULL`) in place as a
   safety net regardless of the above — don't revert it even if hard
   delete turns out not to be happening currently.

DO NOT
- Change the generation flow (stage 2) or landing page (stage 3).
- Add a "restore removed plant" feature — out of scope, note it as a
  possible future item if it comes up naturally but don't build it.
- Change how scheme_suggestions displays images — those are already
  independent of the plants table (stored directly on
  scheme_suggestions), so this stage shouldn't need to touch that.

EFFORT ESTIMATE
Small–medium — depends entirely on what the pre-flight check finds. If
deletion is already soft and every query already filters correctly,
this could be a no-op confirmation. If not, it's a moderate audit
across several query sites.

SMALL ADDENDUM (unrelated to plant deletion, bundled here since it's
trivial)
In components/SchemeResults.tsx, stage 3 added non-null assertions
(`!`) on scheme.name / narrative_intro / narrative_body, relying on
the redirect in app/(app)/schemes/[id]/page.tsx to guarantee this
component only ever receives a complete scheme. Add a short comment
at each assertion, e.g. `// safe: page.tsx redirects non-complete
schemes before this component renders` — so a future refactor of that
redirect doesn't silently invalidate these assertions without anyone
noticing. No logic change, just the comments.

DELIVERABLE
Report the pre-flight findings first, before making changes, so we can
confirm scope together if it turns out to be larger than expected.
Then show the diff.
