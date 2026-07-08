STAGE 3 of 4 — Landing page failed-scheme card and retry action

Reference spec: docs/specs/scheme-generation-failure-handling.md
(read this first — this prompt covers "Landing page changes")

Prerequisite: Stages 1 and 2 are already merged (schemes.status exists;
generation flow creates a row upfront and updates it to complete/failed;
a retry function/action exists to re-trigger generation for a failed
scheme).

CONTEXT
The scheme landing page currently queries and renders schemes assuming
every row is complete. We now need it to also handle `status =
'failed'` rows with a distinct card and a retry action.

PRE-FLIGHT CHECKS (do before editing, report back)
1. Locate the scheme landing page component and its current data
   query. Confirm whether it needs to change to include
   `status = 'failed'` rows (and continue excluding `status =
   'generating'`, unless stage 2 already decided those should show
   too — check what stage 2 actually implemented).
2. Look at the current scheme card component to understand its layout
   so the failed variant can reuse as much structure as possible
   (image area, padding, etc.) rather than being a one-off.

CHANGES
1. Update the landing page query to include failed schemes alongside
   complete ones.
2. Add a failed-card variant:
   - No scheme name shown (none was generated for failed attempts).
   - Message along the lines of "This scheme couldn't be generated.
     Try again?" — match existing app copy voice/conventions (check
     other error copy in the app, e.g. the plant lookup error state,
     for tone consistency).
   - A retry button that calls the retry action from stage 2. While
     retry is in progress, show a loading state on the card (don't
     leave it looking static/unresponsive).
   - On retry success, the card should update to reflect the new
     complete state (or the page should refetch) without requiring a
     manual page refresh.
   - On retry failure again, the card should return to the failed
     state without erroring the whole page.
3. Allow a failed card to be dismissed/deleted from the landing page
   (delete the `schemes` row and its `scheme_source_plants` rows).
   This is the only way to clear a failed attempt that the user
   doesn't want to retry.

DO NOT
- Change plant deletion behaviour (stage 4).
- Change the generation flow itself (stage 2 territory) beyond calling
  the existing retry action.
- Change the complete-scheme card's existing appearance or behaviour.

EFFORT ESTIMATE
Small–medium — one new card variant, a query change, and wiring up
retry/dismiss actions with basic loading states.

DELIVERABLE
Show the diff before considering this done. Flag any assumptions made
about copy wording or where the dismiss action should live in the UI
(e.g. a small "x" on the card vs. a text link).
