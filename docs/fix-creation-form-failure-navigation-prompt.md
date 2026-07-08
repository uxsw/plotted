Fix: scheme creation form doesn't navigate to the landing page on
generation failure

Reference spec: docs/specs/scheme-generation-failure-handling.md

CONTEXT
The failed-scheme card on the landing page (stage 3) and the retry
endpoint (stage 2) both work correctly when tested directly, but the
scheme creation form itself was never updated to route to them. Today,
when the AI call fails:

- The `schemes` row is correctly created and marked `status =
  'failed'` (this part works).
- But the creation form stays on the preferences step, shows a local
  "Generation failed" message, and leaves "Generate scheme" clickable.
- Clicking "Generate scheme" again re-submits the whole form, calling
  the generate endpoint again — creating a SECOND new `schemes` row
  rather than retrying the first failed one. Repeated attempts leave a
  trail of orphaned failed rows, only one of which the user will ever
  see surfaced anywhere.

PRE-FLIGHT CHECKS (do before editing, report back)
1. Locate the scheme creation form component and find where it calls
   the generate endpoint and handles the response.
2. Confirm what currently happens on SUCCESS — does it navigate to
   `/schemes/[id]` or `/schemes`, or does it also just show inline
   state? (Need to know this so the failure path can be brought in
   line with whatever the success path already does.)
3. Confirm whether the "Generation failed" text and disabled/enabled
   state of the "Generate scheme" button is local component state, and
   whether resubmitting currently has any guard at all against firing
   a duplicate request.

CHANGES
1. On generation failure, navigate the user to the scheme landing page
   (`/schemes`) rather than leaving them on the form. The failed
   scheme they just attempted should now appear there as a failed
   card (already built in stage 3), where they can retry or dismiss it
   using the existing mechanisms.
2. Remove (or repurpose) the inline "Generation failed" message and
   the resubmit-via-"Generate scheme" behaviour on failure, since
   retry now has a dedicated, correct path (the `/retry` endpoint,
   triggered from the landing page's failed card) that reuses the
   existing scheme row instead of creating a new one.
3. Confirm the success path still works as before — this fix is only
   about what happens after a failure, don't change success-path
   navigation unless step 2 of pre-flight reveals it's also
   inconsistent with expectations.
4. Double check for a loading/pending state while the initial
   generation call is in flight, so the user isn't tempted to click
   "Generate scheme" multiple times before the first request even
   resolves (this may already exist — confirm, don't assume).

DO NOT
- Change the retry endpoint, the failed-card UI, or any landing page
  behaviour — those are already correct and tested.
- Change anything about how the scheme row is created or marked
  failed — that part already works correctly.

EFFORT ESTIMATE
Small — this is a navigation/UI fix in the creation form only, no new
backend logic needed. The main risk is only in making sure the success
path isn't accidentally disturbed.

DELIVERABLE
Show the diff before considering this done. Manually test: force a
failure (e.g. temporarily invalidate the AI key or throw in
runAndPersistGeneration as before), submit the form, and confirm you
land on /schemes with a failed card showing — not stuck on the form.
Then confirm a normal successful generation still behaves exactly as
before.
