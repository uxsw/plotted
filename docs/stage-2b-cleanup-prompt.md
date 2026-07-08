STAGE 2b of 4 — Cleanup: completion ordering and concurrent retry guard

Reference spec: docs/specs/scheme-generation-failure-handling.md
Prerequisite: Stage 2 is merged (runAndPersistGeneration exists in
app/api/schemes/_lib.ts, retry route exists at
app/api/schemes/[id]/retry/route.ts).

CONTEXT
Stage 2 flagged two known gaps. Both are narrow edge cases, not
urgent, but worth closing before stage 3 builds UI on top of this
flow.

GAP 1 — scheme can end up "complete" with no suggestions
Today, `runAndPersistGeneration` updates the scheme to `status =
'complete'` and inserts `scheme_suggestions` as two separate calls
(Supabase's REST API doesn't support multi-statement transactions).
If the suggestions insert fails after the scheme update succeeds, the
scheme is left `complete` with zero suggestions — a broken-looking
result that LOOKS successful.

FIX
Reorder so the suggestions insert happens first, and only update the
scheme to `status = 'complete'` once that insert has succeeded. If the
suggestions insert fails, fall through to the existing failure path
(`status = 'failed'`) exactly as if AI generation itself had failed —
from the user's perspective these should be indistinguishable failure
states. Do not attempt to build a real cross-table transaction or
introduce a Postgres RPC for this — the reordering alone closes the
practical gap and matches the existing failure-handling pattern
already in place.

GAP 2 — concurrent retry requests aren't guarded
Two rapid POSTs to `/api/schemes/[id]/retry` (e.g. a user double-
clicking) could both pass the `status = 'failed'` check before either
has updated the row, and both would proceed to call AI generation.

FIX
In the retry route, when resetting the scheme to `status =
'generating'`, make the update conditional on the row still being
`status = 'failed'` at that moment (i.e. include `.eq('status',
'failed')` on the update itself, not just as an earlier SELECT check).
If the update affects zero rows, treat this as "already being
retried" — return a 409 with a clear message, rather than proceeding
to call AI generation. This mirrors the pattern already used for the
rename PATCH guard in stage 2 (conditional update + check affected row
count), so it should be a small, consistent addition rather than new
machinery.

DO NOT
- Introduce a Postgres function/RPC or any new transaction mechanism.
- Change the landing page (stage 3) or plant deletion behaviour
  (stage 4).
- Change the shape of any API response beyond what's needed for the
  409 case in gap 2.

EFFORT ESTIMATE
Small — both fixes are small, targeted changes to existing logic
already written in stage 2, using a pattern (conditional update, check
affected rows) already established in this codebase.

DELIVERABLE
Show the diff before considering this done. Confirm both fixes with a
quick manual test if practical (e.g. temporarily forcing the
suggestions insert to fail, to confirm the scheme correctly ends up
`failed` rather than `complete`).
