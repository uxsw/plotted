STAGE 2 of 4 — Create-then-update generation flow

Reference spec: docs/specs/scheme-generation-failure-handling.md
(read this first — this prompt covers "Generation flow changes")

Prerequisite: Stage 1 (migration adding schemes.status, relaxing NOT
NULL constraints, FK change) is already merged.

CONTEXT
Currently, scheme creation inserts a single `schemes` row (with
narrative fields) only after AI generation succeeds, in the same
operation as inserting `scheme_suggestions`. We need to split this
into two steps so a scheme attempt is persisted before generation
runs, making failures visible and retryable.

PRE-FLIGHT CHECKS (do before editing, report back)
1. Locate the current scheme creation code path (likely a server
   action or route handler) and confirm exactly where the `schemes`
   insert and `scheme_suggestions` inserts currently happen relative
   to the AI generation call.
2. Confirm how the user's selected plants arrive at this function
   today (plant IDs from the request body/form, presumably) — this is
   what needs writing to `scheme_source_plants` upfront.
3. Confirm current error handling: what happens today if the AI call
   throws or returns something unusable? Does the function currently
   catch this, or does it bubble up as an unhandled error?

CHANGES
1. Split scheme creation into two phases:
   a. On submission (before calling the AI): insert a `schemes` row
      with `status = 'generating'` and the user-supplied fields
      (`space`, `successional`, `edible`) populated. Leave `name`,
      `narrative_intro`, `narrative_body`, `summary` null. Insert
      `scheme_source_plants` rows for each selected plant, referencing
      this new scheme's id.
   b. Call AI generation using this scheme's id as the handle.
2. On generation success: update the same `schemes` row — set `name`,
   `narrative_intro`, `narrative_body`, `summary`, `status =
   'complete'` — and insert `scheme_suggestions` rows. This should
   happen in a single transaction if your Supabase client setup
   supports it; otherwise sequential updates are acceptable, but flag
   this as a known gap if not transactional.
3. On generation failure (exception, timeout, malformed AI response):
   update the same row to `status = 'failed'`. Do not delete
   `scheme_source_plants` — those rows are what enable retry. Ensure
   this failure path actually gets hit, i.e. wrap the generation call
   so failures update status rather than throwing past this point.
4. Retry: expose a way to re-trigger step 1b (call AI generation)
   for an existing `status = 'failed'` scheme, reusing its existing
   `scheme_source_plants` rows (joined to `plants` for
   genus/species/cultivar — skip any row where `plant_id` is null,
   per the spec's "Retry behaviour with a null plant_id" section). If
   the joined plant list ends up empty, don't call the AI — return/set
   a state indicating retry isn't possible, per the spec.
5. Decide with a sensible default (flag if uncertain): what happens if
   a user navigates directly to a scheme's URL while it's still
   `status = 'generating'`? Reasonable default: redirect to the
   landing page, since the detail page assumes complete narrative
   data.

PRODUCT DECISION — rename UX
A scheme with `status = 'generating'` or `status = 'failed'` has no
name and represents nothing the user has created yet — from the
user's perspective, there's nothing to rename. Renaming should only
ever be possible for `status = 'complete'` schemes. Wherever this
stage touches scheme-name handling (e.g. the API response in
app/api/schemes/route.ts, or any place that reads `scheme.name` as
part of this stage's changes), don't add null-fallback rename logic —
rename gating belongs in the UI layer (stage 3, SchemeList.tsx) via a
`status === 'complete'` guard, not here. Just make sure this stage
doesn't accidentally make renaming a non-complete scheme possible via
the API/server action layer (e.g. don't let a rename action succeed
against a scheme that isn't `status = 'complete'` — add a guard at
that layer if one doesn't already exist naturally from the schema
change).

DO NOT
- Change the landing page card UI (stage 3).
- Change plant deletion behaviour (stage 4).
- Change the AI prompt/generation logic itself — only the
  persistence/lifecycle around it.

EFFORT ESTIMATE
Medium — this is the core logic change. Take time on the failure path
especially; it's the part most likely to have edge cases (timeouts vs
thrown errors vs malformed responses may all need slightly different
handling).

DELIVERABLE
Show the diff before considering this done. Flag any place you had to
guess at existing error-handling conventions, and flag if the
success-path update isn't fully transactional.
