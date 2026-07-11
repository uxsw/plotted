# Scheme Generation Waiting Carousel

## Context

Planting scheme generation currently takes >30 seconds and blocks the search
submission request until it's done. This prompt makes generation
non-blocking and adds a dedicated waiting page with a photo carousel, so the
user isn't staring at a blank/frozen screen.

The scheme row is already created with `status: "generating"` before
generation runs, and `runAndPersistGeneration` (in
`app/api/schemes/_lib.ts`) already transitions that row to `status:
"complete"` on success or `status: "failed"` on any error path. No schema
changes are needed — this is a control-flow change (stop awaiting
generation inline) plus two new/changed routes and one new page.

Two stages:

- **Stage 1 — Backend.** Make generation fire-and-forget via `waitUntil`,
  add a status-polling endpoint.
- **Stage 2 — Frontend.** Waiting page with message states + static photo
  carousel, and update the search-submission flow to redirect there.

Each stage should be delivered as its own diff for review before moving to
the next.

---

## Stage 1 — Backend: non-blocking generation + status endpoint

### Pre-flight checks

Before making changes, confirm:

1. `@vercel/functions` is already a dependency, or can be added (`waitUntil`
   is exported from it). If the project is on an older `next`/`vercel`
   pairing where `waitUntil` isn't available from `@vercel/functions`,
   check whether it's available from `next/server` instead — API has moved
   between versions.
2. The exact path of the scheme search-submission route (referred to below
   as `app/api/schemes/route.ts` — confirm this matches).
3. Whether an existing `GET` handler already exists at
   `app/api/schemes/[id]/route.ts` (or similar) that might conflict with
   the new status endpoint.
4. The `schemes` table's actual status column values (we've seen
   `"generating"`, `"complete"`, `"failed"` in `_lib.ts` — confirm there
   isn't a fourth value in play, e.g. a default/initial state distinct from
   `"generating"`).

### Changes

**1. `app/api/schemes/route.ts`**

- Import `waitUntil` from `@vercel/functions`.
- After building `sourcePlants`, stop `await`-ing
  `runAndPersistGeneration`. Instead, pass it to `waitUntil(...)`, with a
  `.then()` that logs (but does not throw) on failure — the row update
  inside `_lib.ts` already persists failure state, so nothing further is
  needed here.
- Change the final response to return immediately after kicking off
  generation: `NextResponse.json({ scheme_id: scheme.id, status:
  "generating" })`.
- Remove the `if (!result.ok)` branch that currently inspects the
  generation result directly in the route — that result is no longer
  awaited here, so this branch becomes dead code once the above is in place.

**2. New file: `app/api/schemes/[id]/status/route.ts`**

- `GET` handler, authenticated (same `supabase.auth.getUser()` pattern as
  the existing route).
- Selects `status` (and nothing else — this endpoint should be cheap and
  frequent) from `schemes` where `id = params.id` and `user_id = user.id`.
- Returns `404` if no matching row (covers both "doesn't exist" and
  "belongs to someone else" — don't leak existence across users).
- Returns `{ status: "generating" | "complete" | "failed" }` on success.

### Do not

- Do not add a job queue, websocket, or SSE mechanism. Polling is the
  agreed approach.
- Do not change anything in `_lib.ts` — its status-handling is already
  correct and this stage should not touch it.
- Do not remove or alter the `scheme_source_plants` insert or the
  plant-validation logic earlier in the route — only the generation
  call and response at the end change.
- Do not add retry/backoff logic to the status endpoint itself; that's a
  frontend polling concern (Stage 2).

### Effort estimate

**Low.** Small, contained change to one existing route plus one small new
route. No schema or `_lib.ts` changes.

### Deliverable format

Diff of `app/api/schemes/route.ts` and the new
`app/api/schemes/[id]/status/route.ts`, with a one-line note confirming
which `waitUntil` import path was used.

---

## Stage 2 — Frontend: waiting page + carousel

Do not start this stage until Stage 1 is reviewed and confirmed working
(i.e. a submitted search returns immediately and the scheme completes in
the background, verifiable via the status endpoint or DB).

### Pre-flight checks

Before making changes, confirm:

1. Where the search-submission response is currently handled client-side
   (which component calls the `POST /api/schemes` route and what it
   currently does with the response — presumably navigates to the scheme
   page).
2. The URL pattern used for the actual scheme results page (needed for the
   "View now" / card-click destination once status is `"complete"`).
3. Confirm there's no existing carousel component/library already in the
   app to reuse before adding new carousel logic.
4. Confirm the `public/` directory structure so the 10 supplied images have
   an obvious home (e.g. `public/images/scheme-loading/`).

### Changes

**1. Image assets**

- Add the 10 supplied images to a new `public/images/scheme-loading/`
  directory (or existing convention if one applies).
- Simple filename list, no metadata/config needed for MVP — hardcode the
  array of paths in the carousel component.

**2. New page: `app/schemes/[id]/generating/page.tsx`** (adjust path to
   match existing route conventions)

- Client component (needs polling + interval state).
- On mount, and every 3–5s thereafter, calls `GET
  /api/schemes/:id/status`.
- Three message states, rendered in an `aria-live="polite"` region so
  screen readers announce the transition:
  - `generating` → "Planting scheme being generated" + loading spinner
  - `complete` → "Your planting scheme is ready. View now" — entire
    message card becomes a clickable link to the scheme results page
    (confirmed preference: whole card clickable, not just inline text)
  - `failed` → "Planting scheme couldn't be generated" + "View details"
    link to the scheme listing page (per your existing pattern, the failed
    scheme's card will be top of that list for retry)
- Stop polling once status is `complete` or `failed` (clear the interval —
  don't keep polling a settled scheme).
- Below the message: static photo carousel using the images from
  `public/images/scheme-loading/`. Load all 10, no selection logic (agreed
  MVP scope — deferred: random/rotating subset once the image library
  grows beyond what looks good shown in full).
- Carousel should support keyboard navigation and not autoplay in a way
  that traps focus or can't be paused — matches existing accessibility
  bar.

**3. Update search-submission handling**

- Wherever the client currently handles the `POST /api/schemes` response,
  change the navigation target to `/schemes/:id/generating` (using the
  `scheme_id` from the response) instead of the scheme results page
  directly.

### Do not

- Do not fetch carousel images from Supabase Storage — static assets in
  `public/`, per the decision to keep this decorative content simple to
  manage and free of runtime fetches on a page whose job is to feel fast.
- Do not build any image-selection/rotation logic yet — load all 10.
- Do not build a generic "loading state" system for reuse elsewhere in the
  app. This page is scoped to scheme generation only.
- Do not add exponential backoff or a max-retry cap to the polling loop
  for MVP — a fixed interval is sufficient at this scale.
- Do not touch the error-card design/messaging used elsewhere in the app
  (scheme listing page, etc.) beyond confirming the failed scheme sorts to
  the top — that's separately-tracked polish work.

### Effort estimate

**Medium.** New page, new client-side polling logic, new component
(carousel), plus a small update to existing navigation logic. No new
infra or dependencies unless a carousel primitive needs adding, in which
case check for zero-dependency options first given the small scope (10
static images, one page).

### Deliverable format

Diff/new files for the generating page, carousel component, and the
updated navigation call site. Flag if a carousel dependency was added and
why a hand-rolled version wasn't sufficient.
