Fix two lint errors introduced during the scheme generation failure
handling work (stages 1-3 + 2b).

CONTEXT
`npm run lint` is failing on the branch with two errors and one stale
warning. Both need fixing before this can merge cleanly.

ERROR 1 — app/api/schemes/_lib.ts
- Line ~46: an `eslint-disable` comment for
  `@typescript-eslint/no-explicit-any` is no longer needed (the code it
  covers doesn't trigger that rule) — remove the stale directive.
- Line 48: an actual `any` type needs fixing. Look at what this value
  actually represents (likely part of the AI response parsing or the
  Wikimedia image fetch result) and give it a real, specific type or
  interface. Do not just re-add an eslint-disable to suppress it —
  the point is to have an accurate type here.

ERROR 2 — components/SchemeList.tsx (around line 332)
Current code:
  useEffect(() => {
    setSchemes(initialSchemes);
  }, [initialSchemes]);
This was added in stage 3 to keep local state in sync after
`router.refresh()` following a successful retry. The linter is
correctly flagging that calling setState synchronously in an effect
body just to mirror a prop is an anti-pattern (causes an extra render
cycle).

Before changing this, explain (report back) why SchemeList holds its
own local `schemes` state copied from `initialSchemes` in the first
place — i.e. what does local state give this component that reading
`initialSchemes` directly wouldn't? (Likely candidates: optimistic
UI updates for rename/delete, or local ordering/filtering — check the
rest of the component for where `schemes` state is set elsewhere,
e.g. handleRenamed, delete handlers.)

Once you understand that, fix it properly rather than just silencing
the lint rule. Likely approaches, in order of preference:
1. If local state is only needed for optimistic updates during
   rename/delete, and initialSchemes is the source of truth otherwise,
   consider deriving from initialSchemes directly and removing the
   local state copy entirely, with optimistic updates applied via a
   separate small piece of state (e.g. a set of "pending" ids) layered
   on top at render time, rather than a full local copy.
2. If a full local copy genuinely needs to stay in sync with
   initialSchemes on prop change, use a key prop on SchemeList from
   the parent (keyed on something that changes when the list should
   reset, e.g. the schemes array reference or a refresh counter) to
   force a remount instead of syncing via effect.
3. Only as a last resort, if neither above is practical, describe why
   before implementing any workaround — don't silence the lint rule
   without a documented reason.

DO NOT
- Suppress either lint error without a genuine type/logic fix.
- Change any other behaviour in these files beyond what's needed to
  resolve the two errors (no unrelated refactors).
- Change the retry/rename/delete logic itself — only how state syncs
  with props.

EFFORT ESTIMATE
Small — both are contained, well-understood lint fixes, though the
SchemeList one needs a little care to fix properly rather than
papering over.

DELIVERABLE
Show the diff. Confirm `npm run lint` passes clean. Manually re-test
the retry flow (fail a scheme, retry it, confirm the landing page
updates to show it as complete) to make sure the SchemeList state fix
didn't break the behaviour it was originally added for.
