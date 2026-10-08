# Shopping list: manual add and lightweight lookup

Status: Phases 1–3 built. Section 3 rewritten 2026-10-07 to match what shipped (resolve first, then verify).
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
| `lookup_status` | text, nullable | check in (`'pending'`, `'complete'`, `'not_found'`, `'failed'`). Null for scheme items, and for a manual item no lookup has been started for yet. |
| `lookup_requested_at` | timestamptz, nullable | Set when a lookup starts, alongside `pending`. For the stale-pending timeout, and as the claim token a lookup must still hold to write its result. |
| `lookup_candidates` | jsonb, nullable | **Migration 036.** Up to 3 plausible plants awaiting the user's choice. Null otherwise. |

Changes to existing columns:
- `species` becomes nullable. Add a check that `species IS NOT NULL OR entered_name IS NOT NULL`.
- **`species` means different things by source.** Scheme items store the full binomial (`Verbena bonariensis`). Manual items store the epithet only (`bonariensis`, `×martini`), with the genus in `genus`; null for a genus-level match. Every reader goes through `shoppingItemLatinName` / `manualItemNames` / `plantNameFromShoppingItem` in `lib/shopping-list.ts`; do not read `species` directly.
- `scheme_id` stays nullable. A null `scheme_id` means "scheme deleted" only when `source = 'scheme'`.

Display name rule, in one shared helper used by every card (`shoppingItemDisplayName`): a resolved manual item goes by the name its card leads with (see Section 3, "What the user sees"); otherwise `entered_name`, then `common_names[0]`, then the Latin name.

Existing RLS policies are per-user and cover the new columns. Lookup writes happen inside `after()`. They do not use the service role: the request's access token is used to build a bearer-token client (`userClientForBackground`), so the writes run as the user under the same RLS. A cookie-based client is not used there because `after()` in a Server Component may not touch the cookie store.

## 2. Phase 1: capture

- **Server action** `createManualShoppingListItem`:
  - Validate: trim `entered_name` (required, max 120); `where_to_buy` max 200; `notes` max 1000.
  - Insert with `source = 'manual'`. Leave `lookup_status` and `lookup_requested_at` null: capture does not start a lookup, and a null status renders as a normal item.
  - Return the created row immediately.
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

Runs after the item is created, in `after()`. Capture never waits for it. Code: `lib/shopping-lookup/` (resolver, verify, summary, lookup, run), actions in `app/actions/shopping-list.ts`.

**Why resolve first.** The main use is noting a plant heard in a podcast or read in a book, where usually only the Latin name is given, and it is often typed or dictated phonetically ("echinaysha purpyoorea", "the bina ben orients"). The entered text is a noisy guess, not a query, so fetching Wikipedia for it first mostly misses. The model resolves the text to candidate plants; Wikipedia then verifies the candidates and grounds the summary.

**Steps**
1. **Resolve.** One Anthropic call (`claude-sonnet-4-6`, temperature 0, `max_tokens` 500, forced tool call, instructions prompt-cached). Input: `entered_name`, plus up to 50 of the user's own garden plant and shopping list names as weak priors. The prompt says the text may be a phonetic or misheard dictation of a Latin name by a UK English speaker, a misspelling, a cultivar, a common name, a description, or nonsense; that word counts differ, a leading "the"/"a" may be stray or part of the name, capitalisation is unreliable, and both genus and epithet can be mangled. `entered_name` and the priors are passed as JSON-encoded data and the prompt says never to follow instructions in them. Text with fewer than three letters is not sent at all.
   Output, validated in code (anything malformed is dropped): `sounds_like` (the model's scratch line, written first; never stored, logged or displayed) and up to 3 candidates, each with `genus`, `species` (epithet only), `cultivar`, `unmatched_text`, `common_names`, `confidence` (high, medium, low) and `growth_type`. No candidates is a valid answer. A hybrid epithet that just repeats the cultivar is dropped.
2. **Verify.** For each candidate the model rated medium or high, fetch the Wikipedia summary for `Genus species` (or `Genus`, retrying `Genus (plant)` if that is a disambiguation page). A page counts as verifying the candidate when it is a standard page, reads as a plant, names the genus, and names the epithet. A binomial that redirects to a genus page is also accepted when that page says the genus is monotypic (Fascicularia bicolor). Otherwise a species title that lands on its genus page is not verification.
3. **Decide the final confidence** (`finalConfidence`, `lib/shopping-lookup/verify.ts`):

   | Model | Wikipedia | Final |
   |---|---|---|
   | high | verified | high |
   | high | no matching page | medium |
   | high | could not be reached | high (no image) |
   | medium | verified, and it is the only candidate, and it names a species | high |
   | medium | anything else | medium |
   | low | any | low |

   Two caps apply first and nothing overrides them: a candidate that **names a cultivar** is medium at most (Wikipedia can only vouch for the species or genus), and so is a candidate that **leaves part of the note unexplained** (`unmatched_text`). Revisit the cultivar cap with real usage.
4. **Summarise and fetch the image**, only for a single high-confidence match, or for a candidate the user accepts. A second small call (`max_tokens` 120) writes the one-line summary from the resolved name and the Wikipedia extract. The image comes only from a verified page, is snapshotted into `plant-photos` (`${user.id}/shopping-list/...`), and its page URL is stored in `wikimedia_attribution`.

**Summary fallback chain.** Cultivar-specific if the model knows what distinguishes the cultivar; otherwise species-level with `summary_scope = 'species'`; otherwise genus-level; otherwise none. One line, target under about 140 characters (hard cap 160). The scope can never be more specific than the name. A blank is better than an invented line: the model is told not to guess for a plant it does not recognise.

**What the user sees**
- **High** (one confident match): `genus`, `species`, `cultivar`, `common_names`, `growth_type`, `summary`, `summary_scope` and the image are written. The card leads with the italic Latin name (cultivar upright in quotes), common names beneath, and "Noted as: …" with the original text whenever it differs. If the user typed one of the plant's common names, that stays the headline (upright) with the Latin beneath. A species- or genus-level summary under a more specific name is prefixed "About the species:" / "About the genus:".
- **Medium** (including every cultivar, every partial match, and two confident answers at once): candidates are stored in `lookup_candidates` and nothing else is written. The card stays as typed and shows "Not sure about this one. It might be:" with **Keep as typed** first, then a button per candidate. Any words of the user's own note the candidate does not account for are shown on its button as `"…" not recognised` (an unrecognised cultivar, for example). Accepting is an explicit action: it writes that candidate's fields, clears the candidates, and fetches its summary and image in the background. Keep as typed clears the candidates.
- **Low, or no candidates**: the card stays as typed with the fallback tile. No suggestion, no error styling.
- `entered_name` is never changed by a lookup. Only the user's own rename changes it.
- `unmatched_text` shown to the user is restricted in code to words that appear in their note, in the note's order. Model commentary is never displayed.

**States**
- `lookup_status` is null until a lookup starts. Starting one is an atomic claim: `pending` and `lookup_requested_at` are set only where the status is still null, so two requests cannot both start it. `lookup_requested_at` is then the claim token: a result is written only if the row is still pending with that same value, so a result that arrives after a rename, retry, purchase or delete is dropped (and its image removed).
- `complete`: finished. Valid with no summary or image, with suggestions waiting, or with only low-confidence guesses (nothing shown).
- `not_found`: no candidates. A normal finished state.
- `failed`: an exception. The card shows a quiet "Couldn't look this one up. Retry". No billing or quota details.
- Pending for more than 10 minutes is reported to the UI as failed (`isStalePending`), and Retry applies to it.
- Image or summary failure never fails the item. It completes with whatever succeeded.

**Picking up items with no lookup yet.** `source = 'manual'` with a null status means "not looked up yet": everything captured before this phase, anything queued behind the concurrency cap, and anything whose `after()` never ran. The shopping list page claims up to the cap of these on load, oldest first, and runs them in `after()`. No backfill script.

**Polling.** While any manual item is pending or waiting, the list calls `router.refresh()` every 5 seconds, as `PlantDetail` does. The poll stops when nothing is in flight, and after 10 minutes regardless. `revalidatePath` inside `after()` is not relied on for live updates; see the CLAUDE.md dead end.

**Edit and retry.** "Edit name" on a manual card replaces the name with a text field. Saving a changed name clears everything the old name resolved to (names, summary, image, suggestions) and runs the lookup again from the new text. Retry does the same from the existing text, for failed and stale lookups only. Where-to-buy and notes are not editable yet.

**Limits**
- At most 3 lookups in flight per user. The rest keep a null status and are picked up as slots free.
- Each Anthropic call: 20 s timeout, one retry. Each Wikipedia request: 8 s timeout, one retry. The image fetch: 8 s.
- One whole lookup (resolve, verify, summarise, image fetch) is held to a 40 s budget; what is unfinished when it runs out is abandoned (an unfinished resolve fails the lookup; anything later is left blank). With the upload and final write, the worst case is about 45 s. `app/(app)/shopping-list/page.tsx` sets `maxDuration = 90`, which covers the page and the Server Actions called from it.

**Isolation**
- This path does not read or write `species_reference`, and does not call `performLookup` or `enrichSpeciesReference`. This avoids the `match_key` fragmentation (free text such as "bugle" would create a third key shape) and the open enrichment bugs. A test asserts it.
- Cards show "Image: Wikimedia Commons" whenever an image is present, on scheme cards too. This closes the gap where shopping list cards showed none.
- All Wikimedia requests send a descriptive `User-Agent`.

**Evals.** `scripts/eval-shopping-lookup.ts` runs the resolver and verification over `scripts/eval-shopping-lookup.fixture.json` (clean Latin, phonetic, real dictations, cultivars, hybrids, common names, traps, junk and injection, priors) against the live model, and reports where the expected plant landed, paired-run disagreements, latency and cost. Run it after any change to the prompt or the confidence rules. Known misses as of 2026-10-07: "secular area bu colour" (Fascicularia bicolor) finds nothing, and "clematis glyco failure" (Clematis glaucophylla) suggests Clematis 'Gypsy Queen'.

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
- **Out of scope here, done since (issues #97 and #98).** Fixing garden manual-add, resolving genus inside `performLookup`, and cleaning up the existing rows were tracked separately and are now built: see "Genus resolution and the genus guard" in CLAUDE.md. In short: the guard applies on every enrichment path with no opt-out (the `requireGenus` option is gone); `PlantForm` sends no genus and `performLookup` resolves one from the typed name in its existing call, applied only at high confidence; an unresolved manual item bought from the shopping list gets the same resolution. Existing blank-genus plants are corrected with `scripts/cleanup-blank-genus.ts`, which never deletes `species_reference` rows: plants find their row by recomputing the key, so deleting removes frost data until it is re-enriched.
- Set `lookup_status`, `species_source` and `identification_status` consistently with the add-to-garden path.
- Carry notes across if `plants` has an equivalent field; otherwise add to Explicitly Deferred.
- The retry route `lookup/route.ts` used to stop after applying a corrected species. It now enriches in `after()` with the post-correction name, under the genus guard, through the same `applyLookupResult` as plant creation (issue #98).
- Tests: purchase from a scheme item, purchase from a resolved manual item, purchase from an unresolved manual item, and the genus guard (blank genus after lookup means no `species_reference` write and no enrichment call).

## 5. Open points for implementation

All resolved:
- Lookup writes do not need the service role; they use a bearer-token client as the user (Section 1).
- The Wikipedia summary response does include a text `extract`, plus `type` and `description` (Section 3).
- `SpecimenPlate` takes a free-text name through `variant="plain"` (Section 2).

## Explicitly deferred (GitHub issues to raise)

- Dedicated microphone button using the Web Speech API (patchy support; audio goes to the browser vendor), and parsing a spoken sentence into name, place and notes.
- Filtering and sorting (source, place, date added), and place autocomplete from previously used places.
- Merging duplicates.
- Other capture sources (e.g. adding from photo identification).
- User-attached photo on an item.
- A "bought" status. Currently purchase deletes the item.
- Inline edit (`updatePlantField`) does not run the plant lookup, so it gets no genus resolution or spelling correction. (The retry route enrichment gap is fixed.)
- `species_reference` key integrity: resolve genus in `performLookup`, fix garden manual-add sending a blank genus, then re-resolve and re-enrich the existing blank-genus rows (do not delete them first). Dedupe and `match_key` normalisation only if duplicates appear after that.