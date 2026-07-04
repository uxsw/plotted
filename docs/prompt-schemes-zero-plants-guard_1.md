# Prompt for Claude Code: Planting schemes zero-plants guard state

## Context
When a user has no plants in their garden, the Planting schemes tab currently shows a bare, unstyled zero-plants message ("Add a few plants to your garden first — then Plotted can suggest companions for them" + a moss "+ Add a plant" button) rather than the styled ghost-card CTA pattern used elsewhere. This was added as a sensible guard (you can't create a scheme with no plants to choose from) but wasn't part of the original spec, so it's landed unstyled and inconsistent with the rest of the app.

Note: an audit confirmed there is only one add-plant form/route (`/plants/new`, via `components/PlantForm.tsx`), and the schemes flow already links to it correctly via `components/SchemeNewForm.tsx:120`. The "rougher" impression was caused by two unrelated styling leftovers in the add-plant form itself, not a routing issue:
- `app/(app)/plants/new/page.tsx:13` — backlink uses hardcoded `text-gray-500` instead of an `ink-soft` design token
- `components/PlantForm.tsx:159,197` — error states use hardcoded `text-red-600 bg-red-50` instead of clay/clay-tint tokens

Please fix those two styling leftovers as part of this same commit (or a preceding small one) so the add-plant form is fully on-token before this guard card links to it — no routing changes needed, just the token swap.

## Goal
Replace the current bare zero-plants message with a proper explanatory card:

1. A single card (not the ghost-card CTA used when plants already exist) containing:
   - A small icon (seedling/sprout style)
   - Title: "Add a plant to get started"
   - Body copy: "Companion suggestions are based on what's already growing in your garden. Add a plant or two, and Plotted will show you what pairs well alongside them."
   - A clay-accented button: "+ Add a plant"
2. This card should use clay as its accent (consistent with the rest of the Planting schemes section), with a softer background tint (e.g. a light clay tint) rather than the stronger bordered treatment used for the primary ghost-card CTA — this is an explanatory state, not the primary action card.
3. The "+ Add a plant" button should continue navigating to `/plants/new` — this is already correct and needs no change.
4. This guard state should only show when the user has zero plants. As soon as they have at least one plant, the Planting schemes empty state should show the existing ghost-card CTA pattern ("Create your first scheme" + faded placeholder scheme cards) instead.

## Do not touch
- The ghost-card CTA pattern shown when the user already has plants — that's working correctly and shouldn't change.
- The My plants tab or its empty state.
- The actual add-plant form/flow itself, beyond the two specific token swaps noted above (backlink colour, error state colours). No structural or logic changes to `PlantForm.tsx` or `upsertPlant()`.
- Scheme creation logic, plant selection flow, or AI suggestion logic.

## Implementation notes
- This is a conditional render based on plant count — find where that "no plants" check happens for this guard state and update the markup/styling there.
- Reuse the clay accent token introduced in the previous Planting schemes empty-state work, don't hardcode a new value.
- Copy should match exactly as written above.

## Effort estimate
Please give an effort estimate before making changes — this should be small and scoped to one conditional view.

## Commit
Separate commit, e.g. `fix: style zero-plants guard card in Planting schemes`.
