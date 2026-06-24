# Plotted — Inline Edit: Save/Cancel Buttons
*Spec for Claude Code — medium effort*

---

## Problem

The current blur-to-save pattern on the plant detail page creates a race condition: tapping from one editable field to another triggers blur (and an async save) on the first field, which causes a re-render that collapses the newly focused second field. The UX is broken for sequential editing.

---

## Solution

Replace blur-to-save with explicit save/cancel icon buttons. The field stays in edit state until the user consciously confirms (✓) or cancels (✕). Tapping away (blur without a button press) silently discards the change and collapses the field — identical to cancel.

---

## Behaviour

| Action | Result |
|---|---|
| Tap ✓ (save) | Persist value via existing save logic, collapse to display state |
| Tap ✕ (cancel) | Revert to original value, collapse to display state |
| Blur (tap away) | Revert to original value, collapse to display state — same as cancel |

One field in edit state at a time. Tapping a second field while one is already open discards the first (blur → cancel) and opens the second.

---

## UI

- Inline icon buttons appear to the **right** of the field, only when that field is in edit state
- Use existing icon library (check and x/close icons)
- **Save button (✓):** moss colour (`#4F6B4A`)
- **Cancel button (✕):** ink-soft colour (`#5B574A`)
- Buttons sit on the same baseline row as the input, small touch target (min 32px for mobile)
- No label text — icons only
- Buttons must not cause layout shift when appearing/disappearing — reserve the space or use absolute positioning alongside the input

---

## Implementation notes

- Each editable field should store its **original value** on entry to edit state, so blur/cancel can reliably revert
- Remove or disable any existing `onBlur` save handler — blur should now only trigger the cancel/revert path
- The save button's `onMouseDown` should call `event.preventDefault()` to prevent it from stealing focus from the input before the click is registered (common pitfall with blur + button click interactions)
- Same `preventDefault` on the cancel button for the same reason
- No other changes to field layout, typography, or the hover state pattern documented in `CLAUDE.md`

### Tab navigation (keyboard)

Save and cancel buttons must be reachable via Tab from the input — this is correct, expected keyboard behaviour and required for accessibility.

The `onBlur` handler on the input must check `event.relatedTarget` before deciding whether to discard:

```ts
onBlur={(e) => {
  if (
    e.relatedTarget === saveButtonRef.current ||
    e.relatedTarget === cancelButtonRef.current
  ) {
    return; // let the button's own click handler take over
  }
  // otherwise discard and collapse
  revert();
}}
```

- If focus moves to the save button (via Tab or click) → do nothing, save button click handler fires
- If focus moves to the cancel button (via Tab or click) → do nothing, cancel button click handler fires
- If focus moves to anything else → discard and collapse

Ensure save and cancel buttons are standard `<button>` elements so they appear in the natural tab order without any additional `tabIndex` wiring.

---

## Scope

- Plant detail page inline editable fields only
- All editable fields get the same treatment (no exceptions)
- Do not change the add plant short form — that is a standard form with its own submit action

---

## Reference

- Existing hover state pattern and padding/margin rules: `CLAUDE.md` and `plotted-design-language.html`
- Colour tokens: `tailwind.config.ts`
