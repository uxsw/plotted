# Plant detail page — layout redesign

## Why

The plant detail page currently reads as a flat list of label/value pairs with
equal visual weight throughout. Nothing distinguishes identity from growing
conditions from garden history, and the page doesn't reuse the colour-coded
iconography already established on the plant listing card (sun needs badge,
flowering season chips). This spec restructures the page to group related
fields, reuse existing visual systems instead of inventing new ones, and let
the hero image carry more presence — without adding any new data fields or
features.

This is a styling/layout pass, not a feature addition. No new fields, no new
data collection.

## Layout structure (top to bottom)

1. **Hero image** — full-bleed, 4:3 ratio (per earlier spec), 8px corner
   radius matching the global card radius. No text overlay on the image
   itself (rejected direction — risks legibility against pale flowers or
   bright backgrounds; keep image clean).
   - Small photo-count pill, bottom-left of image (e.g. "1 photo"), and a
     circular "add photo" button, top-right. Both are purely cosmetic
     pre-seeding for the future multi-photo feature — they should be
     present in the UI now but the add-photo button can point at existing
     single-photo-replace behaviour for now (confirm current upload flow
     and wire accordingly; do not build new multi-photo logic as part of
     this task).

2. **Plant name block** — directly below the image, using the `PlantName`
   component/pattern already specced separately (species/cultivar in
   Fraunces, common name secondary, muted).

3. **Badge row** — two pill-shaped badges directly below the name:
   - **Sun needs badge** — icon + label (e.g. sun icon + "Full sun").
     **Must reuse the exact colour token/class already used for the sun
     needs badge on the plant listing card.** Do not introduce a new
     colour — locate wherever that mapping is defined (component, token
     file, or constants) and reference it directly so the two surfaces
     stay in sync if the palette changes later.
   - **Flowering season badge** — icon + the actual flowering range (e.g.
     "Jun–Aug"), not the single midpoint band label used elsewhere. Pull
     from `flowering_season_from` / `flowering_season_to` and format as a
     short month-range string. **Must reuse the exact colour token/class
     already used for flowering season chips on the listing card.**
   - Only two badges for now. A third (e.g. height, spread, common name
     count) was considered and deliberately deferred — nothing earned the
     slot yet. Don't add a third badge just to round out the row; revisit
     only if a genuinely useful at-a-glance value emerges.
   - Rejected direction: an earlier draft used a solid moss-green strip
     with three stats (sun / flowering / plant age). Dropped because (a)
     it was visually too heavy for the content it carried, and (b) "plant
     age" is misleading — a `plants` record can represent a variety with
     multiple specimens in the garden at different ages, so "planted X
     months ago" implies false precision. Replaced with a plain "planted
     on [date]" elsewhere on the page (see Garden history below).

4. **Identity section** — labelled section ("Identity"), species + cultivar
   shown side by side, styling per the existing `PlantName` spec.

5. **Common names section** — chips, NOT boxed in the same grey field-cluster
   style as Growing conditions below. Sits directly on the page background
   with no container, since it's a list of tags rather than a field/value
   pair. Reuses the always-visible delete icon and "+ Add name" styling
   from the earlier common-names cleanup spec.

6. **Growing conditions section** — labelled section, height and spread
   shown as a bordered field list inside a single `paper-dark` toned
   container (rounded, 8px radius). Each row gets a small leading icon
   (e.g. vertical arrows for height, horizontal arrows for spread).

7. **Garden history section** ("In your garden") — single card, visually
   distinct from the grey field-clusters above it: clay-toned background,
   circular icon badge (seedling icon), "Planted" label + date (e.g.
   "October 2025"). No age calculation — just the date as stored.
   - This is the one new accent colour on the page (clay, alongside the
     existing moss/sand palette). Confirm clay isn't already reserved for
     a different meaning elsewhere in the design system before
     implementing — if it conflicts, fall back to the same `paper-dark`
     treatment used in Growing conditions, just with the seedling icon,
     and treat this as a plain section rather than a signature moment.

## Explicitly out of scope

- Multi-photo upload/storage logic (UI pre-seeds for it; functionality is a
  separate future task)
- Any new data fields (no plant age tracking, no new metadata)
- A third badge in the badge row
- Companion planting or AI-driven content on this page

## Open question for implementation

Confirm the exact colour tokens/classes used for sun-needs and
flowering-season on the listing card before building the badges here — do
not eyeball or approximate the colours from this spec's prose; reference the
source definition directly.
