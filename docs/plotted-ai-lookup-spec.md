# Plotted — AI Plant Data Lookup: Full Spec (Revised)
*Spec for Claude Code — medium effort*
*Supersedes: plotted-common-names-backend-spec.md and plotted-common-names-ui-spec.md*

---

## Overview

Extend the existing AI common name lookup to cover sun needs, flowering season, height, and spread. The lookup now runs automatically and synchronously on plant creation — when the user lands on the plant detail page, AI-suggested values are already populated. All fields remain editable. A manual re-lookup option remains available on the detail page for common names.

---

## Schema

No new migrations required. All target columns already exist:

| Column | Type | Notes |
|---|---|---|
| `common_names` | `text[]` | Already added |
| `sun_needs` | `text` | Existing field, check constraint on values |
| `flowering_season_from` | `integer` | Month as number 1–12 |
| `flowering_season_to` | `integer` | Month as number 1–12 |
| `height_cm` | `text` | Verify exact column name in schema |
| `spread_cm` | `text` | Verify exact column name in schema |

Claude Code should verify exact column names for height and spread against the actual schema before implementing.

---

## Lookup endpoint changes

### `POST /api/plants/[id]/lookup-common-names` → rename/extend

Rename or extend the existing endpoint to `POST /api/plants/[id]/lookup` to reflect its broader scope.

**Auth and feature flag check remain unchanged** — valid session + `ai_lookup_enabled = true` required.

**Updated Claude prompt:**
```
You are a botanical reference assistant with knowledge of UK growing conditions.

Given a plant's scientific species name and optional cultivar, return the following data as a JSON object. Base all values on typical UK conditions.

Species: {species}
Cultivar: {cultivar} (may be empty — if so, base values on the species)

Return ONLY a valid JSON object, no preamble, no markdown, no explanation.

{
  "common_names": string[],        // Common names used in the UK. Return all known names. Empty array if none known.
  "sun_needs": string | null,      // One of exactly: "full sun", "partial shade", "full shade", "full sun / partial shade". Null if unknown.
  "flowering_season_from": number | null,  // Month number 1–12 for typical UK flowering start. Null if unknown or doesn't flower.
  "flowering_season_to": number | null,    // Month number 1–12 for typical UK flowering end. Null if unknown or doesn't flower.
  "height_cm": string | null,      // Mature height in cm as a range string e.g. "60–90". Null if unknown.
  "spread_cm": string | null       // Mature spread in cm as a range string e.g. "30–60". Null if unknown.
}
```

**Response shape:**
```ts
// 200
{
  common_names: string[],
  sun_needs: string | null,
  flowering_season_from: number | null,
  flowering_season_to: number | null,
  height_cm: string | null,
  spread_cm: string | null
}

// 403
{ error: "Feature not available" }

// 404
{ error: "Plant not found" }

// 500
{ error: "Lookup failed" }
```

---

## Automatic lookup on plant creation

### Flow

1. User submits the short add-plant form
2. Server creates the plant record as normal
3. If the creating user has `ai_lookup_enabled = true` in `user_flags`, immediately call the lookup logic (same logic as the endpoint, not an HTTP call to itself)
4. If lookup succeeds, update the plant record with all returned non-null values before responding
5. If lookup fails for any reason, log the error but still return success — the plant saves regardless
6. Respond to the client with the newly created plant ID
7. Client navigates to the plant detail page as normal

**The user sees:** a brief "Saving…" state on the submit button, then lands on a fully populated detail page.

**Do not** run the lookup if `ai_lookup_enabled` is false — plain save, no lookup attempt.

### Button loading state

On the short form, change the submit button label to "Saving…" and disable it while the request is in flight. Revert on error.

---

## Detail page changes

### AI-populated fields

All AI-suggested values are pre-populated in their existing editable fields — no special treatment needed beyond what's already there. Users can edit any value as normal.

### Common names — updated behaviour

Remove the chip-selection step. Return all common name results and save them all directly. Display as chips with the existing delete affordance (✕ on hover/focus).

The "Get common names" / re-lookup button remains on the detail page for cases where:
- The initial lookup returned no common names
- The user wants to retry after adding or correcting species/cultivar

Re-lookup overwrites `common_names` with the new result set (all returned names saved directly, same as on creation).

### Re-lookup button states

- **Idle:** "Get common names" (if empty) or small refresh icon button (if names exist)
- **Loading:** button disabled, label "Looking up…"
- **Error:** inline message "Lookup failed — please try again" (clay, Fraunces italic 14px), button returns to idle

### Feature flag

If `ai_lookup_enabled` is false, the re-lookup button is hidden. Common names chips (if any exist) still display and are still deletable. Manual "+ Add name" entry still available.

---

## sun_needs valid values (for prompt validation)

The `sun_needs` check constraint accepts exactly:
- `"full sun"`
- `"partial shade"`
- `"full shade"`
- `"full sun / partial shade"`

If the AI returns anything outside these values, treat it as null and leave the field empty rather than saving an invalid value.

---

## Notes

- Extract the lookup logic into a shared utility function (e.g. `lib/plant-lookup.ts`) so it can be called from both the creation flow and the API endpoint without duplication
- All fields updated by lookup should go through the existing server-side validation and sanitization
- Height and spread are stored as text — save the range string directly (e.g. "60–90"), no parsing needed
- Flowering season months are stored as integers — ensure the AI response values are cast to `number` before saving, and validated as 1–12
- Commit schema-related changes, utility function, and route changes separately where practical
