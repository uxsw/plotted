# Spec: Dashboard "your garden" card scroller

## Context

The dashboard's plant card row currently has a redundant "Your garden" title, a top-right "View all" link, inconsistent card heights (cards vary based on presence of an image and title length), and a mismatched empty-state placeholder (generic person-silhouette icon). This spec covers reworking that row only — not the rest of the dashboard (frost warning, bird spotter, schemes CTA, weekly narrative line are separate, later work).

This is an explicitly short-term layout. The long-term plan is a bigger hero card + ~5 smaller cards with personalized/dynamic copy leading the section — do not build toward that now, just don't make decisions here that make it harder later (e.g. keep card content in a simple array/map so re-templating later is cheap).

## Pre-flight checks

- Locate the component(s) currently rendering the "Your garden" section on the dashboard.
- Review the existing "Planting schemes" scroller implementation — reuse its 80/20 scroll pattern and any shared scroll-snap CSS/utility rather than reimplementing.
- Confirm the icon library already in use in the codebase (e.g. lucide-react) so the empty-state botanical icon and "+" / arrow icons in the action row match existing usage rather than introducing a new one.
- Confirm the plant detail route pattern (e.g. `/plants/[id]`) for wrapping cards as tappable links.
- Confirm current semantic token names for the moss/clay palette so the action button and link use existing tokens, not new hardcoded values.

## Changes

1. **Remove the "Your garden" title** and the top-right "View all" link entirely. No replacement copy for now — leave the gap; the personalized narrative line is separate future work.

2. **Card scroller layout**
   - Match the existing planting-scheme scroller's 80/20 peek pattern: each card `flex: 0 0 80%` of the scroll container, producing a ~20% peek of the next card.
   - Fixed card height, same for every card regardless of content (image presence, title length).
   - Image area: fixed height, `object-fit: cover` for a consistent crop across cards.
   - Text area: vertically centered within its remaining space so 1-line and 2-line titles/common-names sit at consistent visual weight.
   - Long species/common names truncate (ellipsis / line-clamp) rather than expanding the card.
   - Add `scroll-snap-type: x mandatory` on the container and `scroll-snap-align: start` on each card.
   - Replace the current default browser scrollbar look with a subtle dash/dot progress indicator reflecting scroll position (visual only, no page logic needed beyond scroll position tracking).

3. **Empty-state placeholder** — for cards with no plant image, replace the current generic person-silhouette icon with a simple botanical/line-drawn plant icon from the existing icon set, in the clay accent tone.

4. **Whole card tap target** — wrap each card in a link to its plant detail page. No nested interactive elements inside the card for this stage, so no gesture-conflict handling is needed.

5. **Action row below the scroller** — replaces the old top-right "View all":
   - "View all" as a secondary text link, left-aligned, with a trailing arrow icon.
   - "Add plant" as a primary filled button (moss), right-aligned, with a leading "+" icon, linking to the add-plant flow.
   - This left/right order is deliberate — matches reading-order convention (dialog button placement) rather than being arbitrary.

## Do not

- Do not build the future hero + 5-small-card layout — that's a separate, later spec.
- Do not build the dynamic/personalized narrative copy line — out of scope here.
- Do not add per-card quick actions (favorite, edit, delete) or any swipe gestures beyond the horizontal scroll.
- Do not touch the planting-scheme scroller component itself, beyond extracting a shared scroll-snap pattern if that's trivial — don't refactor it as part of this change.
- Do not change dashboard data-fetching logic; this is presentational only.

## Effort estimate

Low. Primarily CSS/layout restructuring of an existing component plus reuse of an established scroll pattern, no new data or routes.

## Deliverable format

Single-stage Claude Code prompt with a reviewable diff (scope is small enough not to need multiple stages).
