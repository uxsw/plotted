# Spec: Elevated add plant form

## Context
The add plant form has been stripped to five fields (photo, species, cultivar, common name, sun needs). This task replaces the existing form styling with an elevated, design-language-consistent treatment. The form structure and validation logic are already correct — this is a visual/interaction redesign only.

The visual reference is the mockup produced in chat (plotted_add_plant_form_v3). Match it closely.

**Effort level: medium.** Several new interaction patterns (underline inputs, animated focus state, segmented sun control) that need care to implement consistently.

---

## Typography

Field labels use **Fraunces italic, 15px, weight 400, ink-soft colour**. This applies to all five field labels and the sun needs label. Not uppercase, not small-caps — lowercase italic Fraunces only.

Field values:
- Species and cultivar inputs: Fraunces italic, 18px
- Common name input: Inter, 18px
- Sun option labels: Inter 500, 11px

---

## Input style — underline only

All text inputs (species, cultivar, common name) use an underline-only style. No border box, no background colour, no border-radius on the input itself.

```css
border: none;
border-bottom: 1px solid var(--sand-line);
border-radius: 0;
background: transparent;
outline: none;
padding: 10px 0 12px;
width: 100%;
```

**Focus state:** on focus, replace the bottom border with a 2px moss-coloured line that animates in from left to right:

```css
/* on the field wrapper, not the input itself */
.field::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0; right: 0; height: 2px;
  background: var(--moss);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 200ms ease;
}
.field:focus-within::after {
  transform: scaleX(1);
}
.field:focus-within {
  border-bottom-color: transparent;
}
```

Apply this pattern to all three text inputs. The field wrapper needs `position: relative` for the pseudo-element to work.

---

## Field grouping

Species and cultivar are visually grouped — no divider between them, they share a continuous underline rhythm.

A **20px gap** (not a visible line, just space) separates:
- The species/cultivar group from common name
- Common name from sun needs

This grouping is the only visual separator needed. Do not add section headings or additional dividers.

---

## Photo zone

Full width, 172px tall, border-radius 16px.
Background: `var(--moss-tint)`.
Border: `1.5px dashed var(--moss)`.

Contents centred:
- The existing botanical sprout SVG illustration (reuse from existing EmptyState or placeholder — same motif)
- Below it: "add a photo" in Fraunces italic 15px, `var(--moss-deep)` at 70% opacity

Tapping the zone opens the existing file/camera picker — wire to the existing photo upload logic unchanged.

---

## Sun needs — segmented grid

Replace the existing sun needs `<select>` with a 2×2 grid of tappable option tiles.

Options (in order, left-to-right, top-to-bottom):
1. Full sun
2. Full sun / partial shade
3. Partial shade
4. Full shade

Each tile:
```css
border: 1.5px solid var(--sand-line);
border-radius: 12px;
background: white;
padding: 14px 8px;
display: flex; flex-direction: column; align-items: center; gap: 8px;
```

Selected state:
```css
border: 2px solid var(--moss);
background: var(--moss-tint);
```
Selected label colour: `var(--moss-deep)`.

Each tile has a small SVG icon (22×22) above the label. Use simple sun/shade icons consistent with the existing design language — single stroke weight, moss colour when selected, ink-soft when unselected. Do not use an icon library for these; keep them as inline SVGs to match the hand-drawn line quality already established.

Implement as a controlled component — one option selected at a time, value wires to the existing `sun_needs` field in the form state.

No option is pre-selected by default (sun needs is optional).

---

## Submit button

Full-width, single button: "Add plant".
Use the existing `btn-primary` component — no changes to button styling.
No cancel button. Users navigate back via the existing back link at the top of the page.

---

## Page layout

- Page title: "Add a plant" in Fraunces 500, 30px
- Back link at top unchanged
- Field order top to bottom: photo → species → cultivar → [gap] → common name → [gap] → sun needs → Add plant button
- Content padding: 20px horizontal, consistent with the rest of the app

---

## What not to change
- Form validation logic (species required, all others optional)
- Photo upload behaviour and constraints
- Post-save navigation (to new plant detail page)
- Any server actions or data handling
- The back navigation link

---

## Acceptance check
- Verify the underline focus animation works on a real iOS device (blur/focus events can behave differently on mobile Safari)
- Confirm no input has a visible background or border-box — should look like text sitting directly on the paper background
- Confirm sun needs grid selection state wires correctly to form submission value
- Visually compare against the reference mockup (plotted_add_plant_form_v3 in chat history)
