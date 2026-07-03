# Prompt for Claude Code: "My plants" empty state redesign

## Context
The "My plants" tab currently shows a generic empty state (centred icon, heading, subtext, button) when a user has no plants. We're replacing it with a pattern where the first "card" in the list is itself the add-plant CTA, styled to match a real plant card, followed by a few faded placeholder cards that hint at the list's future shape and rhythm.

Reference: the two visual mockups already reviewed — going with variant B ("first card is the CTA").

## Goal
Replace the current empty state on the `/plants` (My plants) page with:
1. A single tappable "card" styled like a real plant list card, containing a plus icon, "Add your first plant" as the title, and a short supporting line.
2. 2–3 faded, non-interactive placeholder cards below it, using the same card shape/dimensions as real plant cards, with muted grey blocks standing in for photo/name/detail text. Each successive card should be slightly more faded than the last (roughly opacity 0.5, 0.35, 0.2) to suggest a receding list.
3. Remove the existing centred icon / heading / subtext / button empty state entirely.
4. Remove the header-level `+ Add plant` button when the list is empty, since the CTA now lives in the card itself — only show it in the header once the user has at least one real plant.

## Do not touch
- The populated (non-empty) plant list view and its card component — reuse its styling/dimensions for the placeholder cards, but do not modify the actual `PlantCard` component's logic or props.
- The "Planting schemes" tab and its own empty/populated states.
- Any data fetching, routing, or Supabase queries — this is a presentational change only, gated on the existing "no plants" condition you'll find in the current empty state logic.

## Implementation notes
- Find the existing empty state component/markup for the My plants tab (likely near where plant list data is fetched and conditionally rendered).
- The CTA card should link/navigate the same way the current `+ Add plant` and `Add a plant` buttons do — reuse that existing handler/route, don't create a new one.
- Build the placeholder cards as a small reusable component (e.g. `PlaceholderPlantCard`) since we'll likely reuse it later for loading/skeleton states — worth a short comment noting that intended reuse.
- Match card border-radius, padding, and internal layout (thumbnail + text block) to the real `PlantCard` so the transition from empty to populated feels seamless, not like two different UIs.
- Copy:
  - CTA card title: "Add your first plant"
  - CTA card subtitle: keep this brief — one short line is enough since the ghost cards below are doing the explaining visually. Don't duplicate messaging that's already implied by the fading cards.
- Respect existing sand/paper/moss/clay palette and 8px card border-radius conventions already in the design system.

## Effort estimate
Please give an effort estimate (small/medium/large, and roughly how many files you expect to touch) before making changes, since this should be a small, contained, presentational change.

## Commit
Separate, scoped commit with a clear message, e.g. `feat: replace My plants empty state with CTA-card + ghost card pattern`.
