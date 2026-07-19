# Dashboard MVP — Card Array v1

**Status:** Draft for review

## Goal

Ship a first working dashboard using features that already exist: garden list, weather, schemes, shopping list, bird spotter. Frost warning is explicitly out of scope for this pass (seasonal — revisit in autumn).

## Architecture

Static section array for this phase, per the agreed direction: a fixed, ordered list of feature sections rendered top-to-bottom. Each section independently decides whether to render (some are conditional on data existing) or is always shown. No personalization/reordering logic yet — that's the "becomes dynamic over time" phase, deliberately deferred.

Each section is its own component with its own data-fetch, so sections can be built and reviewed independently and the array itself stays a thin composition layer. A section may internally render multiple cards (e.g. the garden section is one section containing several plant cards).

## Sections in scope

| Order | Section | Layout | Condition to render | Data source |
|---|---|---|---|---|
| 1 | Your garden | 1 hero plant card + 5 smaller cards, horizontally scrolling | Always | Curated selection of plants (~6) + "view all" link. Empty state: reuse existing empty-state cards |
| 2 | Bird spotter | Existing layout | Always, no seasonal framing | Existing bird spotter feature |
| 3 | Weather | Existing layout | Always (user has location from onboarding) | Existing weather forecast display, per user location |
| 4 | Planting schemes | Existing layout | Only if user has ≥1 plant AND ≥1 scheme | Existing schemes data |
| 5 | Shopping list | Horizontally scrolling, 2–3 rows | Only if user has ≥1 plant AND list has ≥1 item | Existing shopping list |

Order is a first pass, expected to change once you have real engagement data to inform it — not something to treat as fixed/final.

**Remaining assumptions to confirm:**
- **Garden section hero selection** — with 1 hero + 5 smaller cards, what determines which plant is the hero? Suggested default: most recently added plant. Flag if you had something else in mind (e.g. a plant needing attention, or a rotating/random pick).
- **Schemes/shopping list gating** — confirmed compound condition: both sections stay fully hidden until the user has at least one plant. Once they have plants, each section then independently checks its own data (≥1 scheme, ≥1 shopping item) before rendering — matching the original "if any exist" / "if it has items" behaviour, just gated behind "has plants" first.
- **"View all" link on garden section** — assuming this points to the existing full garden view (same one used elsewhere), not a new page.

## Non-goals (this spec)

- Frost warning section — deferred, seasonal
- "This week in your garden" narrative line — deferred, needs brand-voice input from Natalie, not part of this pass
- Any personalization, reordering, or dynamic section selection logic
- Desktop-specific layout (tracked separately per your existing "on the horizon" list) — this spec targets the layout you're currently building for, and desktop gets its own pass
- New empty-state illustration/copy work beyond what's needed for the garden section (reusing existing empty-state cards, per your steer)

## Do not

- Do not fetch data for sections that won't render (e.g. don't query schemes just to discover there are none and skip — check existence cheaply first, or structure each section's own fetch to bail early)
- Do not couple section components to each other — each should be independently buildable/testable, consistent with the staged-prompt workflow
- Do not build any reordering/personalization scaffolding now — the array being "static for now, dynamic later" means literally a fixed order in code, not a placeholder sorting system nobody's using yet

## Effort estimate

| Piece | Effort |
|---|---|
| Section-array shell/composition | Low |
| Garden section (hero + 5 cards, horizontal scroll, empty state) | Medium |
| Bird spotter section wiring | Low |
| Weather section wiring (display exists, needs dashboard placement) | Low |
| Schemes section (with has-plants gating) | Low–Medium |
| Shopping list section (horizontal scroll, with has-plants gating) | Low–Medium |

## Deliverable format

Staged Claude Code prompts, one per section plus one for the shell, each independently reviewable — matching the pattern used for species-reference.
