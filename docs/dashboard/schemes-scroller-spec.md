# Spec: Dashboard planting schemes scroller

## Context

Currently the dashboard likely reuses (or will reuse) the full planting-scheme card design as seen on the schemes list page — full-bleed blurred hero image, overlapping circular plant thumbnails, title, date, description, suggestion-count badge, and a three-dot overflow menu. This spec covers a compact dashboard version: capped at 4 schemes, horizontally scrollable, with trimmed card content. It does not cover the schemes list page itself, which keeps its current full card design.

The existing card's blurred-hero + overlapping-circle-cluster treatment is already a distinct visual identity relative to the plant and bird cards — this spec compresses that treatment for a preview context, it does not redesign it.

This section sits alongside a separately planned "schemes discovery CTA" component (not built yet). This spec includes its own "New scheme" action in the meantime; if/when the discovery CTA component is built, revisit whether both actions are still needed to avoid two competing "create a scheme" prompts on the same page.

## Pre-flight checks

- Locate the current schemes list card component to confirm what's reused vs. rebuilt for the compact version (image/circle-cluster markup in particular).
- Confirm the query/data source for a user's schemes, and add a limit of 4 with `ORDER BY` on whatever field represents recency (the screenshot suggests date-created ordering — confirm this is correct rather than assuming).
- Reuse the scroll-snap / 80/20 peek / dot-indicator pattern from `GardenCardScroller.tsx` (not the birds' 20/60/20 layout — schemes don't need bidirectional signaling).
- Confirm the route for "View all" (likely the existing Planting schemes tab) and for "New scheme" (existing scheme-creation flow).
- Check whether a 0-scheme empty state already exists or is expected to be handled by the separate discovery CTA component — if the discovery CTA isn't built yet, decide a minimal fallback (e.g. section doesn't render, or a simple prompt) rather than leaving a broken empty state. Flag this back if it's ambiguous rather than guessing.

## Changes

1. **Cap to 4 schemes**, most recent first, in a horizontal scroller matching the plants section's 80/20 peek + snap-scroll + dot-indicator pattern.

2. **Trim card content** for the compact/dashboard context:
   - Shrink the hero (blurred image + overlapping circle cluster) to a fixed height matching the other dashboard scroller cards (~110–150px) — keep the existing visual treatment, just smaller.
   - Remove the three-dot overflow menu — scheme management actions belong on the full schemes list, not this preview.
   - Truncate the description to a single line (ellipsis) or drop it entirely if it doesn't fit comfortably at the reduced card size — use judgment on which reads better once built.
   - Keep: title, date, suggestion-count badge.
   - Whole card wrapped as a link to the scheme detail page (same tappable-card pattern as the other scrollers).

3. **Title** — no title change specified here; if you want to drop "Planting schemes" as a heading (matching the pattern used for "Your garden") that's a trivial addition to this change, but treat as optional/your call rather than assumed.

4. **Action row below the scroller** — same left/right convention as the plants section:
   - "View all" as a secondary text link, left-aligned, trailing arrow icon, linking to the full schemes list.
   - "New scheme" as a primary filled moss button, right-aligned, leading plus icon, linking to the scheme-creation flow.

## Do not

- Do not redesign the scheme card's visual identity (hero/circle-cluster treatment) — compress it, don't replace it.
- Do not build the separate "schemes discovery CTA" component as part of this change.
- Do not touch the full schemes list page or its card design.
- Do not build a bidirectional/reordering layout like the birds section — schemes don't have the spotted/unspotted split that motivated that pattern.

## Effort estimate

Low–Medium. Mostly reuse of the existing scroll pattern plus a trimmed-down variant of an existing card component; no new data model needed if scheme ordering/limiting can be done at the query level.

## Deliverable format

Single-stage Claude Code prompt with a reviewable diff.
