# Fast Redirect to Generating Page

## Context

Stage 1 of the scheme-generation carousel work moved `runAndPersistGeneration`
into a background `after()` call so the route responds without waiting for
AI generation. However, `enrichPlants` (the flowering-season lookup) still
runs and is `await`ed *before* the response is sent. This means the route
still takes a couple of seconds to respond, during which the old
`GenerationLoading` component (shown while `submitting === true` in
`SchemeNewForm.tsx`) is visible. Once the response finally arrives and the
client redirects to `/schemes/:id/generating`, the user sees a second,
distinct page change right after the first — reading as two stacked
transitions rather than one clean redirect.

Goal: get the `POST /api/schemes/generate` response down to near-instant
(just the two DB writes it needs before background work can start), so the
redirect to the generating page fires immediately with nothing visible in
between.

## Pre-flight checks

Before making changes, confirm:

1. The current shape of `app/api/schemes/generate/route.ts` post-Stage-1 —
   specifically the exact sequence of `enrichPlants` → `toSourcePlantInputs`
   → `after(runAndPersistGeneration(...))` — to confirm nothing else depends
   on `enrichPlants`'s result before the response is returned.
2. Whether `enrichPlants` has any failure mode that the route currently
   surfaces to the client (e.g. does a lookup failure need to block scheme
   creation, or does it already degrade gracefully per-plant as implemented
   in `_lib.ts`?). Confirm it degrades gracefully (existing `try/catch`
   per-plant in `enrichPlants` returns the original plant unchanged on
   failure) — this matters because once it's backgrounded, the route can no
   longer report an `enrichPlants` failure to the client at all.
3. Where `GenerationLoading` is rendered in `SchemeNewForm.tsx` and what
   `submitting` state controls it, to decide whether to remove or replace it.

## Changes

**1. `app/api/schemes/generate/route.ts`**

- Move `enrichPlants(plantRows)` and `toSourcePlantInputs(enriched)` inside
  the `after(...)` block, ahead of `runAndPersistGeneration`, so the whole
  sequence — enrichment, then generation — runs in the background as one
  chain.
- The route should return `{ scheme_id: scheme.id, status: "generating" }`
  immediately after the `scheme_source_plants` insert succeeds, with no
  further `await`s before the response.

**2. `components/SchemeNewForm.tsx`** (confirm actual filename/path)

- Remove the `GenerationLoading` component and the `submitting`-driven
  render branch that shows it, since the response is now fast enough that
  it's not needed. Replace with a minimal disabled-button/inline-spinner
  state on the submit button itself (standard "request in flight" pattern)
  so double-clicks are still prevented, without a full loading-state
  component that duplicates what the generating page now does.

## Do not

- Do not add a timeout, loading skeleton, or intermediate state to mask the
  route's response time — the goal is to make the response actually fast,
  not to paper over a slow one.
- Do not change anything inside `enrichPlants` itself or its per-plant
  error handling — only its position in the call sequence changes.
- Do not touch `runAndPersistGeneration` or `_lib.ts` — this prompt only
  changes what's backgrounded and when the response fires.
- Do not remove the `submitting` state entirely if other logic in
  `SchemeNewForm.tsx` depends on it (e.g. disabling the submit button) —
  only remove the `GenerationLoading` visual component itself.

## Effort estimate

**Low.** Reordering an existing sequence into an existing background block,
plus removing one now-unnecessary loading component.

## Deliverable format

Diff of `app/api/schemes/generate/route.ts` and `SchemeNewForm.tsx`. Flag
if `GenerationLoading` is used anywhere else in the app before removing it
outright (if so, leave the component itself intact and just stop rendering
it here).
