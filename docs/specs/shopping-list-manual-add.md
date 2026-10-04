# Shopping list: manual add and lightweight lookup

Status: Draft, 2026-10-04
Location: `docs/specs/shopping-list-manual-add.md`
Builds on: `docs/specs/shopping-list.md` (this is the deferred item "Additional entry points to add items to the shopping list")

## Overview

The shopping list is currently populated only from planting schemes (`/schemes/[id]`). This feature lets a user add a plant to the list manually, so the list becomes a general "plants I want" record that can hold items from several sources over time.

The main use case is quick capture: hearing about an unusual plant (a podcast, a conversation) and noting its name plus where it can be bought, often only available from a specialist. Capture must be instant and must never depend on the network. A lightweight background lookup then adds a one-line summary and, where possible, an image, to help recall the plant later. Rare and specialist plants will often have no usable lookup data, so "nothing found" is a normal, designed state.

## Goals

- Add a plant to the shopping list by typing a name (phone dictation works in the text field, with no extra code).
- Optionally record where to buy it (free text, may be a URL) and ad-hoc notes.
- Background lookup of a one-line summary and an image, with a strong designed fallback.
- A data model that supports further sources (`source`) and later filtering and sorting.
- Fix purchase so a purchased item gets the same lookup and enrichment as a plant added to the garden (long-standing oversight).

## Non-goals

- Looking up where to buy a plant. "Where to buy" is user-entered only.
- A dedicated microphone button or spoken-sentence parsing (deferred, see the end).
- Filtering, sorting, grouping, place autocomplete (deferred).
- Merging duplicates (deferred).
- Changing the live `/plant-scheme` conversational feature.
- Writing manual items into `species_reference`, or changing `performLookup`.

## Decisions already made

1. Free text goes in a new `entered_name` column. `species` is not reused for it.
2. Purchase skipping lookup and enrichment is an oversight and is fixed in this work (Section 4).
3. Duplicates are allowed for manual items. No uniqueness constraint.
4. New and touched components follow the new CSS conventions. No new Tailwind; migrate touched Tailwind.

## 1. Data model (migration 035)

Add to `shopping_list_items`:

| Column | Type | Notes |
|---|---|---|
| `source` | text, not null, default `'scheme'` | check in (`'scheme'`, `'manual'`). Existing rows backfill to `scheme`. |
| `entered_name` | text, nullable | What the user typed or dictated. Never overwritten by lookup. |
| `notes` | text, nullable | |
| `where_to_buy` | text, nullable | Free text. May contain a URL. |
| `genus` | text, nullable | Resolved by lookup; null for scheme items. |
| `summary` | text, nullable | One line. |
| `summary_scope` | text, nullable | check in (`'cultivar'`, `'species'`, `'genus'`). Lets the UI frame a species-level summary honestly. |
| `lookup_confidence` | text, nullable | check in (`'high'`, `'medium'`, `'low'`). |
| `growth_type` | text, nullable | e.g. shrub, perennial, bulb, climber, annual, tree. Used for the fallback tile if cheap. |
| `lookup_status` | text, nullable | check in (`'pending'`, `'complete'`, `'not_found'`, `'failed'`). Null for scheme items. |
| `lookup_requested_at` | timestamptz, nullable | For the stale-pending timeout. |

Changes to existing columns:
- `species` becomes nullable. Add a check that `species IS NOT NULL OR entered_name IS NOT NULL`.
- `scheme_id` stays nullable. A null `scheme_id` means "scheme deleted" only when `source = 'scheme'`.

Display name rule, in one shared helper used by every card: `entered_name`, then `common_names[0]`, then `species`.

Existing RLS policies are per-user and cover the new columns. If lookup writes happen inside `after()` where the user session may not be available, use the service role as `enrichSpeciesReference` does. Claude Code to confirm which applies.

## 2. Phase 1: capture

- **Server action** `createManualShoppingListItem`:
  - Validate: trim `entered_name` (required, max 120); `where_to_buy` max 200; `notes` max 1000.
  - Insert with `source = 'manual'`, `lookup_status = 'pending'`, `lookup_requested_at = now()`.
  - Return the created row immediately. Do not await the lookup.
  - Duplicates allowed (no check).
- **Add form** on `/shopping-list`:
  - Name field is always visible and is the only required field. Use plain text input attributes that do not interfere with keyboard dictation (no aggressive autocorrect or autocomplete behaviour).
  - "Add details" expands where-to-buy and notes.
  - Submit adds optimistically, then reconciles with the server result.
- **State resync fix:** `useState(initialItems)` in `ShoppingList.tsx` does not pick up new items. Fix as part of this phase.
- **Cards are source-aware:**
  - Manual item: show the display name (not italic Latin), where-to-buy, notes.
  - If `where_to_buy` parses as an http(s) URL, render it as a link with `rel="noopener noreferrer"`. Never render other schemes as links.
  - Scheme item: unchanged, except the "scheme deleted" message applies only when `source = 'scheme'`.
- **Fallback tile:** reuse the idea behind `SpecimenPlate` (framed card, monogram). It needs a plate number from the caller (use list position). Adapt it so a free-text name is not styled as a Latin binomial. Treat this as the primary no-image design, not a placeholder.
- **Components and CSS:** migrate `ShoppingList.tsx` off Tailwind to the new conventions as a separate first commit with no behavioural change, so the behavioural diff is reviewable. New components follow `docs/styleguide/naming-convention.md` (`o-*` / `c-*`, BEM, `clsx`).
- **Tests** (Vitest; none exist for the shopping list today): action validation, the display-name helper, URL link detection.

## 3. Phase 2: lookup

Runs after the item is created, in `after()`. Capture never waits for it.

**Steps**
1. Fetch the Wikipedia summary for `entered_name` (reusing `fetchWikimediaImage`'s underlying request). Verify that the endpoint returns a text `extract`; the current code only reads the thumbnail and page URL.
2. One Anthropic call (`claude-sonnet-4-6`, small `max_tokens`) with `entered_name` plus the extract if one was found. Structured output:
   - resolved `genus`, `species`, `cultivar` (only if it can tell)
   - `common_names`
   - one-line `summary` (target under about 140 characters)
   - `summary_scope`
   - `growth_type`
   - `lookup_confidence`
3. If confidence is high, try `fetchWikimediaImage` on the resolved Latin name first, then fall back to the entered name. Accept an image only above the confidence threshold. A wrong photo is worse than none.
4. If an image is accepted, snapshot it into the `plant-photos` bucket (`${user.id}/shopping-list/...`) as the scheme add route does, and store `wikimedia_attribution`.

**Summary fallback chain.** Cultivar-specific if there is good evidence; otherwise a species-level summary with `summary_scope = 'species'`, which the UI frames as being about the species; otherwise genus-level; otherwise no summary. A blank is better than an invented line. The model must be instructed not to guess for plants it does not recognise.

**Failure and states**
- Image or summary failure never fails the item. The item stays, with whatever succeeded.
- `complete` with no summary or image is valid and renders as a normal finished item.
- `not_found` means nothing usable came back. Also a normal finished state, with no error styling.
- `failed` means an exception. Show a quiet Retry. Do not show billing or quota details.
- Pending older than 10 minutes is treated as failed (same threshold as `species_reference`).
- The client polls like `PlantDetail` (about 5 seconds, `router.refresh()`) while an item is pending and recent. Do not rely on `revalidatePath` inside `after()`; see the CLAUDE.md dead end.

**Isolation**
- Do not read or write `species_reference`. Do not call `performLookup` or `enrichSpeciesReference` from this path. This avoids the `match_key` fragmentation (free text such as "bugle" would create a third key shape) and the open enrichment bugs.
- Cards show Wikimedia attribution when an image is present ("Image: Wikimedia Commons", matching scheme cards). This closes the existing gap where shopping list cards show none.

## 4. Phase 3: purchase carry-over

Currently `purchaseShoppingListItem` inserts a plant directly with `genus: ""` and `species` as the full name, and never calls `performLookup` or `enrichSpeciesReference`. The result is a plant that sits on "Looking up frost tolerance..." for up to 10 minutes, or forever, and that creates `species_reference` keys of the wrong shape.

This is independent of manual add and can ship first as a small PR. It also fixes scheme-sourced items.

- Do not insert directly. Extract the shared insert, lookup and enrichment sequence from the `upsertPlant` insert branch into a helper and use it from both paths.
- Split genus and species properly. For scheme items, parse the stored binomial with the existing name parser (`lib/identification/name.ts`). For manual items, use resolved `genus` and `species` if present. If the item has no resolved name, insert with `entered_name` as the name and let `performLookup` run and correct it.
- **Genus guard before enrichment.** Only call `enrichSpeciesReference` when, after any correction, the plant has a non-blank genus and a species. If genus is blank, skip enrichment and leave the plant without frost data. Do not write a `species_reference` row in that case. A missing frost value is better than a wrong key. This applies to everything the shared helper handles, so it protects the garden add path as well as purchase.
- **Why the guard matters (evidence from live data, 2026-10-04).** 27 of the 61 `species_reference` rows have a blank genus (the other 34 have well-formed keys). The 27 fall into three bad shapes:
  - common names (`|apple`, `|carrot`, `|kale`)
  - epithets with no genus (`|officinalis`, `|sativum`, `|nigra`), where two different plants could silently share one frost record
  - names split into the wrong fields (`|allium|spherocephalon` has species `allium` and cultivar `Spherocephalon`, and the spelling is also wrong)

  A normalised-key check found no exact duplicates, but same-plant pairs exist across the two shapes, e.g. `|allium|spherocephalon` (bad) and `allium|sphaerocephalon` (well-formed). The collision risk for epithet-only keys is still latent. Purchase must not add to these shapes.
- **Out of scope here.** Fixing garden manual-add (`PlantForm` sends `genus: ""`), resolving genus inside `performLookup`, and cleaning up or re-enriching the existing rows. Track these as a separate GitHub issue. Do not delete existing rows as part of this work: plants find their row by recomputing the key, so deleting removes frost data until it is re-enriched.
- Set `lookup_status`, `species_source` and `identification_status` consistently with the add-to-garden path.
- Carry notes across if `plants` has an equivalent field; otherwise add to Explicitly Deferred.
- The retry route `lookup/route.ts` never calls `enrichSpeciesReference` after applying a corrected species. That is a related residual bug, to be tracked separately unless it is trivial to fix in the same helper.
- Tests: purchase from a scheme item, purchase from a resolved manual item, purchase from an unresolved manual item, and the genus guard (blank genus after lookup means no `species_reference` write and no enrichment call).

## 5. Open points for implementation

- Confirm whether lookup writes need the service role (Section 1).
- Confirm the Wikipedia `extract` field exists in the response used (Section 3).
- Confirm how `SpecimenPlate` should accept a free-text name (Section 2).

## Explicitly deferred (GitHub issues to raise)

- Dedicated microphone button using the Web Speech API (patchy support; audio goes to the browser vendor), and parsing a spoken sentence into name, place and notes.
- Filtering and sorting (source, place, date added), and place autocomplete from previously used places.
- Merging duplicates.
- Other capture sources (e.g. adding from photo identification).
- User-attached photo on an item.
- A "bought" status. Currently purchase deletes the item.
- Retry route enrichment gap, if not fixed in Phase 3.
- `species_reference` key integrity: resolve genus in `performLookup`, fix garden manual-add sending a blank genus, then re-resolve and re-enrich the existing blank-genus rows (do not delete them first). Dedupe and `match_key` normalisation only if duplicates appear after that.