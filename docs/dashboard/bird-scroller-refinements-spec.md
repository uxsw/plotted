# Spec: Bird card scroller refinements

## Context

Follow-up refinements to `BirdCardScroller.tsx` (already shipped): square product images, reordered card sequence (spotted birds grouped first, unspotted grouped second), a default scroll position on the boundary between the two groups, and a switch from the 80/20 peek layout to a 20/60/20 layout to signal the row scrolls in both directions.

This intentionally diverges from the 80/20 pattern used in `GardenCardScroller` and elsewhere — that's a deliberate signal (80/20 = "more to the right"; 20/60/20 = "more both ways"), not something to reconcile back to a single shared pattern.

## Pre-flight checks

- Confirm current data shape/query for bird list ordering, and where sorting should happen (client-side on the fetched list vs. server-side query) — client-side is likely simplest since ordering is presentational and session-scoped.
- Confirm how `BirdCardScroller` currently determines/consumes the "spotted" boolean per bird, to key the partition off the same source used for the pill button and stamp badge.
- Review the existing dot-progress-indicator's scroll-position → active-index logic to confirm it derives purely from scroll offset (not a hardcoded index math) — needed since cards are now variable-width (20/60/20) and the list doesn't start scrolled to position 0.

## Changes

1. **Square images** — change the fixed-height image container to `aspect-ratio: 1 / 1` with `object-fit: cover`. Stamp badge overlay positioning is unaffected.

2. **Ordering** — on mount, partition the bird list into two groups: spotted first, unspotted second. Preserve each group's existing relative order (no additional sort key) — just partition, don't re-sort within groups.

3. **Default scroll position** — on initial render, scroll instantly (no animation, no visible jump) to center the first unspotted bird's card — i.e. the boundary between the two groups. If every bird is already spotted (no unspotted group exists), default to the start of the list instead.
   - Compute the target position from the actual rendered card's position (e.g. via ref + `offsetLeft` or `scrollIntoView({inline: 'center', behavior: 'instant'})`), not a hardcoded `index × width` calculation, since card widths vary in the 20/60/20 layout.

4. **Frozen ordering for the session** — the spotted/unspotted partition and the default scroll position are computed once, on mount/load. When a user marks a bird spotted (or un-spots one) mid-session, its card stays in its current position in the row — do not re-sort or animate it into the other group. The list only re-partitions on the next full mount (e.g. navigating back to the dashboard, or a hard refresh).

5. **20/60/20 layout** — replace the 80/20 peek with a centered layout: active/center card at ~60% width, ~20% peek visible on each side.
   - Snap behaviour: `scroll-snap-align: center` on cards, with `scroll-padding-inline` on the container set to the peek width so the first and last cards can still reach center.
   - At 60% width, check that the name + pill button row doesn't wrap awkwardly — shorten the unspotted button label (e.g. icon-only, or "Spot it") if "Mark as spotted" doesn't comfortably fit; use judgment during implementation rather than treating this as a hard requirement.

## Do not

- Do not change the 80/20 layout used by `GardenCardScroller` or the schemes scroller — this pattern change is scoped to birds only.
- Do not animate or otherwise call attention to a card moving groups — ordering is frozen for the session per point 4.
- Do not add persistence of scroll position across sessions/reloads beyond the default-position behaviour described above.
- Do not touch `WildlifeGrid` or the standalone `/garden-wildlife` page.

## Effort estimate

Low–Medium. Mostly layout/CSS plus a scroll-position calculation on mount; no data model or query changes expected if ordering is handled client-side.

## Deliverable format

Single-stage Claude Code prompt with a reviewable diff.
