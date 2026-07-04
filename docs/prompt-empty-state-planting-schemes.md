# Prompt for Claude Code: "Planting schemes" empty state redesign

## Context
The My plants empty state was recently redesigned to use a CTA-card pattern (first "card" in the list is itself the add action, styled like a real card, followed by fading placeholder cards) instead of the old centred icon/heading/subtext/button pattern. That work is done and live.

We're now applying the same pattern to the "Planting schemes" tab, with two differences:
1. Scheme cards are hero-image-led (full-width image on top, not a small square thumbnail like plant cards), so the placeholder cards should reflect that taller, image-first shape.
2. This section uses clay as its primary/accent colour instead of moss, to visually differentiate it from My plants. Global chrome (the "Plotted" wordmark, avatar circle, tab bar container) stays moss as before — only the active tab underline and primary buttons/CTAs within this section switch to clay.

## Goal
Replace the current empty state on the Planting schemes tab with:
1. A single tappable CTA card at the top of the list: plus icon, "Create your first scheme" as the title, and a short supporting line. Styled with clay as the accent (border, icon background), matching the visual weight of the moss CTA card used in My plants.
2. Two faded, non-interactive placeholder cards below it, matching the real scheme card's shape: full-width image block on top, then a title-width bar and a shorter detail-width bar underneath. Opacity roughly 0.5 and 0.3 (two cards, not three — schemes are a lower-frequency action than adding a plant, so we don't want to oversell how many will pile up).
3. Remove the existing centred icon / heading / subtext / button empty state entirely.
4. Update the "Planting schemes" tab's active-state underline colour to clay when this tab is selected (My plants tab keeps its moss underline when active).

## Do not touch
- The My plants tab, its empty state, or its `PlaceholderPlantCard` component — use it only as a structural reference, not to modify.
- Any global chrome: the "Plotted" wordmark, avatar circle, and tab bar container all stay moss. Only the active-tab underline and in-section CTAs change colour.
- The populated (non-empty) scheme list view, scheme card component, or scheme results page — reuse the real card's dimensions/shape for the placeholder, but don't modify the actual card component's logic or props.
- Any data fetching, routing, or Supabase queries — this is a presentational change only, gated on the existing "no schemes" condition.
- Any AI prompt, background job, or scheme-generation logic.

## Implementation notes
- Find the existing empty state component/markup for the Planting schemes tab.
- The CTA card should navigate to the same first step of the scheme creation flow that the current "Create your first scheme" button uses — reuse that existing handler/route.
- Build the placeholder cards as a small reusable component (e.g. `PlaceholderSchemeCard`), following the same pattern as `PlaceholderPlantCard` — image block, title bar, detail bar — since it may be reused for loading/skeleton states later.
- Introduce a clay accent token/class if one doesn't already exist from the plant detail page's clay card work, and reuse it here rather than hardcoding a new hex value.
- Copy:
  - CTA card title: "Create your first scheme"
  - CTA card subtitle: one short line, e.g. something like "Pick a few plants, get companion suggestions" — keep it brief, the ghost cards below do the rest of the explaining.
- Respect existing 8px card border-radius and spacing conventions.

## Effort estimate
Please give an effort estimate (small/medium/large, and roughly how many files you expect to touch) before making changes.

## Commit
Separate, scoped commit with a clear message, e.g. `feat: replace Planting schemes empty state with clay CTA-card pattern`.
