# Plant identification from photo

**Status:** Draft — ready for staged implementation
**Owner:** John
**Effort:** Medium
**Related:** `species_reference` enrichment, add-plant form, shopping list

---

## Problem statement

The biggest friction point in getting users engaged with Plotted is that they don't know the names of the plants already in their garden. The current add-plant flow works well for a plant you've just bought with the label in your hand, but that is the minority case. Most users arrive with an established garden containing plants inherited with the house, plants that have self-seeded, and plants whose names they've simply forgotten — which was the original motivation for building Plotted.

Requiring a name before a plant can be added means the users with the most to gain from the product are the ones most likely to abandon it during setup. This is the feature most likely to determine whether Plotted forms a habit.

## Goals

1. A user with an established garden can populate it without knowing any plant names.
2. Identification failure is never a dead end — every path ends with a saved plant record.
3. Users can evaluate identification suggestions without botanical knowledge.
4. Photo identification is an input method within the existing add-plant journey, not a parallel journey.
5. We can measure identification quality well enough to decide whether to change provider.

## Non-goals

| Not doing | Why |
|---|---|
| Training or hosting any recognition model | No plausible advantage over existing APIs at any foreseeable scale |
| Cultivar inference from photo | No API does this reliably; cultivar stays manual and optional |
| Disease / health diagnosis | Separate feature, separate API product, separate UX |
| Batch "scan the whole garden" mode | Needs background processing and a review queue; build only if usage shows demand |
| Shopping-list identification journey | Deliberately deferred — see *Anticipated future use*. Architecture must not preclude it |
| Community "what is this plant?" | Introduces photo visibility, moderation and reporting; significant privacy shift |
| Multi-photo capture (leaf + flower + bark) | Free on the API side, but needs capture UI. First upgrade if accuracy complaints arrive |
| Displaying confidence percentages | Scores are not well calibrated; a wrong "94%" damages trust more than an unlabelled wrong guess |

---

## Provider decision

**Pl@ntNet API for v1.**

- Free for up to 500 identification requests per day; commercial use beyond that requires a paid contract.
- Returns a ranked list of species with confidence scores 0–1 — exactly the response shape the UX needs.
- Accepts 1–5 images of the same individual per request at the cost of a single credit.
- Supports `include-related-images=true`, returning representative images per candidate. **This is load-bearing for the results UI.**
- Supports regional floras via the `project` parameter.
- Does not store submitted images — held in volatile memory during identification only.
- Requires a "powered by Pl@ntNet" credit line and logo on the free tier.

**Known weakness:** Pl@ntNet's training skews toward wild flora rather than cultivated ornamentals. Plant.id (Kindwise) is the likely alternative if accuracy proves insufficient — around €0.05/credit at base volume, with a varieties model covering cultivars — but it costs money from the first request and we have no evidence yet that we need it.

**Therefore:** all provider interaction sits behind a thin adapter interface. Swapping providers must be a provider swap, not a rewrite. This is the only speculative abstraction in this spec and it is justified by an explicitly anticipated decision.

---

## User stories

1. As a user with an inherited garden, I want to photograph a plant and be shown likely matches, so that I can add it without knowing its name.
2. As a user who can't tell three Latin names apart, I want to compare reference photos, so that I can choose based on what I can actually judge.
3. As a user who's just bought a labelled plant, I want to type the name directly, so that the photo step doesn't slow me down.
4. As a user whose plant can't be identified, I want to save it anyway with its photo, so that my garden record is still complete.
5. As a user in February with a bare shrub, I want to record it now and name it later, so that I'm not blocked by the season.

---

## Journey

Single add-plant form. No branching journey.

1. User opens **Add plant**.
2. Photo field is present and prominent but **skippable** — it must not be a mandatory first step. Users who know the name proceed straight to typing.
3. Once an image exists, an **Identify from photo** action appears contextually.
4. On tap: EXIF stripped, image sent to provider, results returned.
5. User selects a candidate (or genus fallback, or "none of these").
6. Selection populates the same species field the user would have typed. Field remains editable. Cultivar left blank and editable.
7. User saves. Identification result and choice are logged.
8. On save, the user lands on the **created plant detail page** — existing behaviour, unchanged. This confirms creation while the plant is still in the user's mental focus and gives a natural review point, which matters more than usual when the name came from a machine suggestion rather than the user. The prominent **Add another** action already on that page covers the multi-add journey; no new post-save behaviour is needed.

**Key property:** identification populates a field. There is one validation, one submit handler, one `match_key` lookup, one enrichment trigger. Downstream of field population, nothing knows how the name got there.

### Results presentation

**Image-led, not name-led.** Top three candidates as image cards using provider reference imagery, with the name as secondary text. A user who doesn't know their plant cannot choose between three Latin names but can absolutely choose between three photos. This single decision likely does more for perceived accuracy than changing provider would.

- Top result visually emphasised and pre-selected.
- Always show three. **No conditional single-result mode** — thresholds we can't calibrate, two UI paths, and a false impression of certainty.
- Confidence score drives copy register only ("Most likely" vs "Best guess"), never UI structure and never displayed numerically.
- **Genus fallback:** where the top candidates share a genus, offer a fourth explicitly selectable option — e.g. "Hydrangea — species uncertain". Cheap to compute; turns the worst-case output into a useful one.
- **"None of these"** always present, falling through to manual entry or to saving unidentified.
- Hedging consistent with the existing `AiNoticePanel` pattern.

---

## Data model

### Plant record changes

Add `identification_status` — **text with a CHECK constraint**, not a Postgres enum. Enum values are painful to remove or rename, and migrations here are applied manually.

Permitted values for v1, and only these two:

- `identified` (default)
- `unidentified`

Additional states (`genus_only`, `community_asked`) are anticipated but **must not be added until the features exist**. Choosing a status column rather than a boolean is precisely what makes that deferral safe.

Species identity becomes nullable.

**Constraint:** `identification_status = 'unidentified'` implies null species. This closes the drift failure mode at database level and lets any "needs attention" query trust the flag alone.

**No index yet.** At beta scale this is dozens of rows per user. Trivial to add a partial index later if a list view ever feels slow.

### Enrichment

The provider returns a scientific name with authorship (e.g. `Ajuga genevensis L.`). Normalise: strip the authorship suffix, map to `match_key` format, then hand to the **existing** `species_reference` pipeline unchanged — cache hit returns immediately, miss creates a pending row and triggers background enrichment via `after()`.

No new enrichment pipeline. The only new logic is name normalisation.

### Choice logging

Two columns, no UI. Record which candidate was selected versus which ranked first, and every "none of these".

This is not a feedback loop and must not become one in v1. It is the cheapest possible way to answer "is Pl@ntNet good enough, or is Plant.id worth paying for?" — a decision currently resting on vendor marketing claims.

---

## Requirements

### P0 — must have

- [ ] Photo capture/upload within the existing add-plant form; skippable, not gating
- [ ] **EXIF stripped server-side on upload, unconditionally.** Phone photos carry precise home coordinates
- [ ] API route → provider adapter → Pl@ntNet, with `include-related-images=true`
- [ ] Regional flora set via the `project` parameter, derived from the location captured at onboarding — one query parameter, real accuracy gain, easy to never get round to
- [ ] Image-led results UI, top three, top pre-selected, confidence-driven copy only
- [ ] Genus fallback option where candidates share a genus
- [ ] "None of these" → manual entry
- [ ] Scientific name (lowercased) → canonical `match_key` → **existing** enrichment pipeline, unchanged. Identification must not create records by any other route
- [ ] User's original input retained in its own column on the plant record, and used for display where it differs from the canonical name
- [ ] Blank-cultivar `match_key` format identical whether produced by photo identification or by manual entry with an empty cultivar
- [ ] Pl@ntNet attribution on the identification results screen only — not on plant detail pages
- [ ] `identification_status` column with CHECK constraint and consistency constraint
- [ ] Unidentified plants saveable with photo and no name
- [ ] User photo saved to Supabase Storage as the plant's image
- [ ] Plant cards expose `data-identification-status="<value>"` in garden list and dashboard, so presentation can be targeted in CSS without markup changes
- [ ] Choice logging
- [ ] Per-user daily identification counter (simple count — not a quota system, credit balance or billing tier)

### Acceptance criteria

- Given a user has entered a species name manually, when they run identification and select a result, then the field is overwritten and remains editable, **with no confirmation dialogue**
- Given identification returns no usable result, when the user chooses "none of these", then they can still save the plant with photo only and `identification_status = 'unidentified'`
- Given a user uploads a photo containing GPS EXIF data, when it is stored, then no location metadata is retained
- Given the top three candidates share a genus, when results are displayed, then a genus-level option is offered as selectable
- Given a plant is saved as unidentified, when it appears in the garden list, then it presents as a deliberate "to identify" state, not as a broken or incomplete record
- Given identification succeeds, when the species is new to `species_reference`, then a pending row is created and background enrichment triggered — no user-facing wait

### P1 — likely fast follows

- Seasonal re-prompt for unidentified plants ("it's July — try again on that shrub?"). Probably the most habit-forming idea in this feature, but it needs the unidentified state to exist and real data on how many people accumulate them
- Multi-photo capture (free on the API side; cost is capture UI only)
- Capture guidance refinement based on observed failure patterns

### P2 — architectural insurance only

- Shopping-list identification journey
- Community identification
- Batch garden-walk mode
- Provider swap to Plant.id

---

## Anticipated future use: shopping list

Identifying a plant seen in someone else's garden and adding it to the shopping list is a genuine second use case — and notably the only version of this feature used *away from home*, which is a different and more frequent trigger than anything else in Plotted.

**Not in scope. One architectural requirement:**

The identification unit — API route plus results component — takes a photo and returns a chosen species. It does not know or care what happens next. The destination is passed in. The add-plant form *consumes* this unit; it does not *contain* it.

Specced this way, the shopping-list journey later is a new entry point and a new destination, not a refactor. This costs nothing extra now.

Two notes for whoever picks it up:

- The shopping list already handles copy-image → insert-plant → delete-item and items already carry an image. Confirm nothing there assumes the image originated from the species reference rather than the user.
- The unidentified state is arguably more useful here than in the garden: an unnamed photo on a shopping list is directly usable — you show it to someone at the garden centre. That's a thing people already do badly with their camera roll.

---

## Design questions

**How an unidentified plant presents in the garden list and on the dashboard** is undecided and will be resolved directly in CSS by John.

This is the load-bearing design problem in the feature. If an unidentified plant looks like a broken record, users will avoid creating them and the "identification failure is never a dead end" premise collapses. It needs to read as a deliberate *to identify* state, not an incomplete one.

**Implementation requirement:** plant cards in the garden list and dashboard must carry `data-identification-status="<value>"` reflecting the record's status. Use the attribute value rather than a boolean hook such as `is-unidentified` — this mirrors the status-column decision, so future states need only a new CSS rule, not a markup change. No specific visual treatment is required from implementation beyond the record rendering without errors.

**Deferred.** Whether photo identification eventually becomes the primary add-plant entry point with search as fallback. Not a v1 decision.

---

## Styling and implementation constraints

Plotted is mid-migration from Tailwind to BEM + CSS Modules, but the convention has not settled — the pilot left open contradictions and `CLAUDE.md` is deliberately not yet updated. Asking implementation to author BEM/CSS Modules would mean inventing conventions that then have to be unpicked.

**Therefore, for this feature only: use Tailwind CSS for new UI.** John will convert manually once the convention settles.

Constraints on that:

- **Do not introduce Tailwind into already-migrated components.** The results cards should compose the existing `<Card>` primitive (`o-card`) and `Button` **as they are**. Adding utility classes to migrated components to make new layout work silently reverses the pilot and is not acceptable.
- **`globals.css` is read-only.** Consult it to understand layout behaviour across pages and components. Any change to it is a scope addition — flag it, don't make it.
- **Semantic markup with meaningful class hooks alongside the utilities.** If the DOM structure is sound and every Tailwind class is purely presentational, conversion later is a class-attribute swap rather than a restructure.
- **UI does not need to be perfect.** Basic functionality and sound structure are what matter. Do not spend effort on visual polish; do not guess at design decisions. Uncertainty about layout behaviour should be flagged in the deliverable rather than resolved by invention.

## Relationship to the existing add-plant pipeline

### What Pl@ntNet provides — and doesn't

Pl@ntNet returns **names only**: scientific name with authorship, genus, family, common names, a confidence score, and reference images.

It returns **no horticultural data** — no size, spread, flowering season, aspect, soil preference or care information. It is a taxonomic identification service, not a plant database.

Photo identification therefore **cannot** populate a plant record, and must not attempt to. Its entire output is a name.

### The existing text path is the only path

Current flow, unchanged:

1. User enters species (and optionally cultivar)
2. `match_key` lookup against `species_reference`
3. **Hit** — cached record populates the plant detail
4. **Miss** — a pending row is created and AI enrichment is triggered in the background via `after()`. The plant record is created immediately; horticultural detail fills in shortly after

Photo identification joins this at step 1. Selecting a candidate on the results screen populates the species field and triggers the same lookup. Everything downstream is untouched.

**Consequence:** record quality is identical regardless of entry method. There is no second-class photo-sourced record and no parallel enrichment path.

### Attribution placement

Pl@ntNet attribution belongs **on the identification results screen only** — the point at which its contribution is actually being used, and where it usefully signals where the suggestions came from.

It should **not** persist on plant detail pages. Once a name is selected, the record comes from Plotted's own database via the existing pipeline; Pl@ntNet's involvement has ended.

*Check before launch:* Pl@ntNet's free-tier terms are loosely worded on whether the acknowledgement sentence and logo are required or merely encouraged. Results-screen attribution is defensible either way, but confirm against the current terms.

## Naming and `match_key` decision

`match_key` currently holds species and cultivar in the format `|species|cultivar`.

**There is no foreign key between plant records and `species_reference`** — confirmed by querying `information_schema`, which returned no rows. The join is computed at read time from the plant record's `species` and `cultivar` text fields. This is why plant records created before `species_reference` existed continue to work: they were never linked, they simply began resolving once the table was populated.

### Decision (provisional, review in two weeks)

There is not yet enough data in `species_reference` to make an informed call, so this is a deliberate educated guess taken on the basis that the cost of being wrong is currently low.

1. **Scientific name, lowercased, is the canonical species value** — written to both `species_reference` and to plant records. Scientific names are unique and stable; common names are neither. Pl@ntNet returns the scientific name directly, and Plotted would migrate this way regardless.
2. **The user's original input is retained in its own column.** One field. It is the material any future dedupe needs, and it is what should be displayed back to a user who typed "bugle" and won't recognise "ajuga reptans".
3. **The blank-cultivar key format must be fixed explicitly.** Photo identification always produces a species with an empty cultivar, so it generates keys such as `|ajuga reptans|`. Manual entry with an empty cultivar must produce the byte-identical string — no `null`, no trailing-pipe variant. A mismatch here means every photo-sourced plant misses the cache even when the species is already known.

### Why this is safe to guess

The risk is fragmentation: `|bugle|` and `|ajuga reptans|` existing as separate rows for one plant, producing duplicate enrichment runs and companion-planting logic that can't tell they're the same plant.

Because nothing holds a foreign key, remedying that later is a normalisation script plus a one-off dedupe: delete the losing `species_reference` row, and run a matching `UPDATE` on plant records so the computed lookup still resolves. Two statements across two small tables. At private-beta volume this is an afternoon.

**Explicitly not doing now:** adding a foreign key between plant records and `species_reference`. It is the tidier design and will probably be right eventually, but it requires backfilling every existing plant record — including all pre-`species_reference` ones — and commits to a canonical form that hasn't been validated. The computed join works. Revisit once naming has settled and there is a reason to change.

### Review trigger

Two weeks after launch, or once `species_reference` holds enough rows to inspect. Look for near-duplicates:

```sql
select match_key, created_at
from species_reference
order by match_key;
```

Scan for pairs such as `|bugle|` beside `|ajuga reptans|`, or `|hydrangea|` beside `|hydrangea macrophylla|`.

## Open questions

### Non-blocking — resolve during implementation

**Enrichment of genus-level records.** If a user selects "Hydrangea — species uncertain", enrichment is being asked to describe a genus rather than a species, and will either produce very wide ranges or hedge into uselessness.

Two options:
1. Trigger enrichment with the prompt aware the subject is genus-level, so hedging is appropriate and explicit. A hedged "1–3m, summer flowering" is still useful. **Preferred.**
2. Skip enrichment and treat genus records closer to unidentified.

## Known limitations to accept, not solve

**The cultivar ceiling.** A user photographs their hydrangea; the API returns *Hydrangea macrophylla* at high confidence. Correct, and useless to someone who wants to know whether it's 'Annabelle'. No API resolves cultivar reliably from a photo. Identification lands at species; cultivar stays optional and manual. This is consistent with the premise — these are users who don't know what they have.

**Photo purpose tension.** The best photo *of your plant* (whole shrub in its border) and the best photo *for identification* (close-up of one leaf) are often different pictures. Accept this for MVP; let capture guidance nudge toward a reasonably close shot, which serves both adequately. Separate "record photo" and "ID photo" would double the storage and UI model — v2 problem if it's a problem at all.

**Seasonality.** Bare woody stems in winter identify poorly. This is what the unidentified state and the P1 seasonal re-prompt exist for.

---

## Suggested staging

1. Migration: `identification_status`, nullable species, constraints
2. Provider adapter + API route + EXIF stripping (verifiable via logs before any UI)
3. Name normalisation → `match_key` → existing enrichment
4. Results UI (largest single piece of work)
5. Unidentified save path + `data-identification-status` on garden list and dashboard cards
6. Choice logging, attribution, daily counter

Each stage reviewable as a single diff.

## Pre-flight checks for implementation

- Confirm whether the add-plant form already handles photo upload to Supabase Storage. If it does, no second capture step or duplicate upload path is needed and the effort estimate holds at Medium
- Confirm current validation rules on the add-plant form — what currently blocks submission without a species
- Confirm the shape and location of the onboarding location data for deriving the flora parameter
- Locate `AiNoticePanel` and confirm the hedging pattern to match
- Locate where `match_key` is constructed in application code — it is built at read time from the plant record's `species` and `cultivar` fields, not stored as a link. Reuse this; do not write a second construction path
- Confirm whether a column already exists for the user's original species input before adding one
- Confirm existing Storage deletion behaviour when a plant is deleted
- Confirm the existing post-save redirect to the plant detail page and the "Add another" action already present there — neither should be modified
- Locate the plant card component(s) used by the garden list and dashboard before adding the data attribute; confirm whether they share one implementation or two

## Copy

All copy in this spec is placeholder pending Natalie's review.
