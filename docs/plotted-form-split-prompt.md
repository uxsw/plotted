# Prompt: Split add plant form + inline editing on detail page

## What we're doing
Two things in one task:

1. **Short add form** — strip the add-plant form down to minimal fields only
2. **Inline editing on the detail page** — all fields editable in place, enrichment fields added here

This is a structural and interaction change. Do not restyle any components or change the visual design of any inputs. Use existing components throughout.

---

## Short add form — fields

Keep only these fields on the add plant page:
- Photo (upload, optional)
- Species (required)
- Cultivar (optional)
- Common name (optional)
- Sun needs (optional)

Remove all other fields from this form entirely. Do not leave them hidden or commented out — they move to the detail page.

On successful save: navigate to the newly created plant's detail page, as already implemented.

---

## Plant detail page — inline editing

All fields on the plant detail page (both existing and enrichment) should be editable inline. There is no separate edit form or edit page — the detail page is the only editing surface.

### Interaction model
- Fields with existing values display as read-only text. Tapping/clicking a value switches that field into an editable state (input or select).
- Empty fields display as a subtle tap-to-add prompt (e.g. "+ Add flowering season" in a muted style) — not a formal empty state, just a lightweight placeholder that communicates the field exists and is optional.
- **Save behaviour:** save on blur (user taps/clicks away) for simple text fields. No per-field save button needed.
- **Cancel behaviour:** pressing Escape reverts the field to its previous value without saving.
- **Error behaviour:** if a save fails, show a subtle red border and short error message inline below the field. Do not navigate away.
- Only one field should be in edit state at a time. Clicking into a new field should blur/save the previous one first.

### Enrichment fields to add
These fields already exist in the plants schema — this is a UI change only:
- Date planted (month + year — two selects treated as a single unit)
- Flowering season (From month / To month — two selects treated as a single unit, no wrap-around validation required, user is trusted to enter correct values)
- Eventual height (cm — number input)
- Eventual spread (cm — number input)
- Purchased from (text)
- Notes (textarea)

### Existing fields
Species, cultivar, common name, and sun needs should also follow the inline edit pattern for consistency — the user should be able to tap any of these on the detail page to edit them, not just the enrichment fields.

### Photo
Photo upload/replace behaviour should follow whatever pattern is already in place — do not change it.

### Implementation order
1. Implement and test the inline edit pattern on one simple text field first (e.g. common name) before rolling it across all fields.
2. Flowering season (two linked selects as one inline unit) should be implemented last once the pattern is established on simpler fields.

---

## What not to change
- Do not restyle any inputs, buttons, or layout
- Do not change the post-save navigation on the short add form
- Do not add any new components — use what exists

---

## Effort level
Medium. The form split is low effort but the inline editing pattern on the detail page needs care — build incrementally, pattern first then roll out.
