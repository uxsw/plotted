# Spec: Dashboard "Garden visitors" section (formerly Bird spotter)

## Context

Reworking the bird spotter section of the dashboard. Currently a vertical stack of 12 full-height cards with the "Mark as spotted" button at the bottom, no intro copy, and a plain "x/12 spotted" line. This spec covers this section only — same pass as the garden card scroller already shipped, not a rework of the underlying schema, data model, or the (already generic) `species` / `user_species_sightings` tables, which stay as-is.

Copy in this spec (section name, description line, bird descriptions) is placeholder for engineering purposes — final wording should get a pass from Natalie before shipping, particularly the intro description line.

## Pre-flight checks

- Locate the component(s) currently rendering the bird spotter section (likely `components/dashboard/BirdSpotterSection.tsx` or similar — confirm actual path).
- Reuse the scroll-snap / 80/20 peek pattern and `no-scrollbar` utility already built for `GardenCardScroller.tsx` rather than reimplementing.
- Confirm existing icon library usage (matches prior spec) for the check icon in the stamp badge and the plus/arrow icons already in use elsewhere.
- Confirm the `category` column and generic table structure aren't being narrowed or assumed bird-specific anywhere as part of this change — this pass is UI-only.
- Confirm current data shape for "spotted" state per bird (boolean / timestamp) — button state and stamp badge both key off this.

## Changes

1. **Rename section** from "Bird spotter" to "Garden visitors" (placeholder copy — confirm final wording with Natalie before ship). Add a short 1–2 line description beneath the heading, e.g. *"Birds you might spot nearby this season. Tick them off as you go."* (placeholder, needs Natalie's pass).

2. **Progress prominence** — replace the current plain "2/12 spotted" text with:
   - Larger numeral for the spotted count, smaller "of 12 spotted" alongside it.
   - A thin (~5px) horizontal progress bar beneath, filled proportionally (moss fill, sand/line-colour track).
   - No further gamification (streaks, badges, animation) at this stage.

3. **Card redesign** — reuse the `GardenCardScroller` card structure (image top, fixed-ish layout) with these differences from the plant card:
   - Image area same fixed height/crop approach as plant cards.
   - **Stamp badge**: when a bird has been spotted, overlay a small circular badge in the top-right corner of the image — check icon, slight rotation (~-8deg), paper-tone fill with a moss-dark border, evoking a field-guide/naturalist stamp rather than a plain checkmark pill. Not shown when unspotted.
   - **Name + action button share a row** directly below the image (button moves from bottom to top-right of the name row).
     - Spotted state: filled moss pill, check icon, label "Spotted".
     - Unspotted state: outline pill (moss border, transparent fill), label "Mark as spotted".
   - **Description**: collapsed by default to 2 lines (`line-clamp: 2`), with a "More" text link beneath that expands the full description in place.
     - Expanding a card grows its height independently of its neighbours in the scroll row — this is an accepted tradeoff of the expand interaction, not a bug to fix.
     - Collapsing back down (tapping "More" again, or a "Less" affordance) is a reasonable addition if trivial, but not required for v1.

4. **Layout** — horizontal scroll list, same 80/20 peek + snap-scroll + dot-progress-indicator pattern as `GardenCardScroller`, applied to the 12 bird cards. Extract shared scroll/peek/dot-indicator logic into a common pattern only if it's a trivial, low-risk refactor — otherwise duplicate for now rather than introducing a shared abstraction as part of this change.

## Do not

- Do not build the sticker-album/thumbnail-grid alternative layout discussed as a future idea — out of scope for this pass.
- Do not expand beyond birds (no new categories, no schema changes) — multi-category support stays out of scope.
- Do not add gamification beyond the progress bar (no streaks, achievements, animations, sounds).
- Do not finalize copy — treat all wording in this spec as placeholder pending Natalie's review.
- Do not refactor the existing `GardenCardScroller` component itself as part of this change beyond optional trivial extraction noted above.

## Effort estimate

Low–Medium. Mostly CSS/layout and a new expand/collapse interaction on top of an already-established scroll pattern; stamp badge is a small new visual element with no new data requirements.

## Deliverable format

Single-stage Claude Code prompt with a reviewable diff. If the expand/collapse interaction ends up touching more state management than expected, split into two stages (layout/visual pass, then expand/collapse behaviour) rather than one large diff.
