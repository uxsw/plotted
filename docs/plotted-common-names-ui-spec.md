# Plotted — AI Common Name Lookup: UI
*Spec for Claude Code — medium effort*
*Implement after backend spec is verified working*

---

## Overview

Add a common names section to the plant detail page. Replaces the existing `common_name` text field (if present). Supports AI lookup, chip-based multi-select, manual entry, and re-lookup.

---

## Placement

Directly after the species/cultivar fields in the plant detail page, before the enrichment fields block (date planted, flowering season, height etc).

---

## States

The section has three distinct states based on whether names have been saved.

---

### State 1 — No common names saved

Display a single "Get common names" button.

- Label: "Get common names"
- Style: secondary button (existing `Button` component, secondary variant)
- Only visible if `ai_lookup_enabled` flag is true for the current user — if false, render nothing (common names section is hidden entirely for non-flagged users)
- On tap: call `POST /api/plants/[id]/lookup-common-names`, show inline loading state on the button

**Loading state:**
- Button label changes to "Looking up…" and is disabled
- No spinner needed — label change is sufficient

**On success — results returned:**
Results appear inline below the button as selectable chips. The button remains visible above them.

- Each result is a chip (see chip design below) in unselected state
- "Select all" text link to the right of the section label (small, moss, Fraunces italic)
- A "Save selected" confirm button (primary, moss) appears below the chips — disabled until at least one chip is selected
- Tapping a chip toggles its selected state
- Tapping "Save selected" calls `PATCH /api/plants/[id]` with the selected names array, then transitions to State 2

**On success — empty array returned:**
- Inline message: "No common names found for this plant" (Fraunces italic, ink-soft, 14px)
- Small "try again" text link below (moss, Fraunces italic)
- "+ Add name" text link to allow manual entry (see manual entry below)

**On error:**
- Inline message: "Lookup failed — please try again" (clay, Fraunces italic, 14px)
- Button returns to default state

---

### State 2 — Common names saved

Display saved names as chips, always visible. Softly editable without an explicit edit mode.

- Each chip has an ✕ icon on hover/focus — tapping removes that name immediately (calls PATCH with updated array)
- "+ Add name" text link below the chips (moss, Fraunces italic, small) — tapping opens an inline text input for manual entry (see manual entry below)
- "Refresh" icon button to the right of the section label (small, ink-soft) — re-runs the lookup and shows new results as selectable chips below existing ones, allowing the user to add more. Does not remove existing saved names.

---

### State 3 — Lookup feature not enabled

Render nothing. The common names section is hidden entirely for users without `ai_lookup_enabled`.

---

## Manual name entry

Triggered by "+ Add name" link in State 1 (empty result) or State 2.

- Inline text input appears below existing chips (underline-only style, consistent with other fields)
- Fraunces italic, same size as other enrichment fields
- Save/cancel icon buttons (✓ / ✕) consistent with the inline edit pattern used elsewhere on the detail page
- On save: appends the new name to `common_names` array via PATCH, input collapses, new chip appears
- On cancel or blur (not to save/cancel buttons): input collapses, no change

---

## Chip design

Consistent with existing `Tag` component if applicable, otherwise:

- Background: `moss-tint` (`#E2EADD`)
- Text: `ink` (`#2B2A24`), Inter, 13px
- Border-radius: 999px (pill)
- Padding: `4px 10px`
- **Selected state** (during lookup result selection only): background `moss` (`#4F6B4A`), text `paper` (`#FAF6EC`)
- **Delete affordance** (State 2): ✕ icon appears on hover/focus, ink-soft colour, 10px, sits inside the chip to the right of the label

---

## Section label

- Label: "Common names" — Fraunces italic 15px, ink-soft (consistent with other field labels on the detail page)

---

## Notes

- Remove `common_name` (singular) from the detail page if it exists as a plain text editable field — this section replaces it entirely
- Do not add common names to the short add-plant form — enrichment only
- Chip remove (✕) and manual entry save should both call the existing `PATCH /api/plants/[id]` route with the full updated `common_names` array
- All async actions (lookup, save, remove) should handle errors gracefully with inline messaging — no toast library needed, inline text is sufficient and consistent with the existing error pattern
- Feature flag (`ai_lookup_enabled`) should be fetched server-side on the detail page and passed as a prop — do not fetch client-side to avoid flash of hidden content
