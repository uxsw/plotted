# Plant selection refinement — scheme creation, step 1 of 2

## Context

Refinement of the existing "Pick up to 5 plants" screen in the planting scheme
flow. Two changes:

1. Larger plant cards in the main scroll, following an iOS-style peek pattern.
2. A new fixed-slot thumbnail strip showing current selections, replacing
   reliance on scrolling back to find checkmarks.

Both changes are additive to the existing screen — no change to the
underlying selection logic (max 5, toggle on tap), routing, or the step 2
handoff.

---

## 1. Main plant scroll (top section)

### Card sizing

- Card width: `min(60vw, 280px)`.
  - On mobile this gives a true ~60% viewport width per card.
  - On wider viewports (tablet, desktop) it caps at 280px rather than scaling
    indefinitely. 280px is a starting value — adjust once real plant photos
    are in place and it can be judged visually.
- Card image fills the card width, standard photo aspect ratio (match
  whatever the current cards use — likely 1:1 or 4:5).
- Plant name sits below or overlaid at the bottom of the image (match
  current pattern) — with more card width available, this is a chance to
  show the full name without truncation in most cases.

### Peek / scroll behaviour

- Horizontal scroll container padding: `24px` left and right (fixed value,
  not vw-based). This creates the peek effect at both ends of the list
  regardless of card width.
- Gap between cards: use existing token spacing (`--gap-md` or equivalent).
- Add scroll snap:
  - Container: `scroll-snap-type: x mandatory`
  - Each card: `scroll-snap-align: center`
  - This makes a swipe settle on one plant rather than resting mid-scroll
    between two cards.

### Selection indicator

- Existing checkmark badge pattern (dark circle, white check) carries over.
- **Check at larger card size**: confirm the badge doesn't look
  disproportionately small or large once cards are ~280px vs. the current
  smaller size. If it needs adjusting, either scale the badge slightly or
  reposition it — no fixed decision yet, a visual call once real assets are
  in.

---

## 2. Selection strip (new)

Sits below the main scroll, above the "Continue" CTA. Always rendered once
the screen loads (not conditionally shown/hidden), so page height and CTA
position never shift as selections are made.

### Structure

- Label above the strip: `Selected (X/5)`, where X is live selection count.
- Row of exactly **5 fixed slots**, horizontally scrollable if they overflow
  the viewport (won't overflow on most phones at the sizing below, but
  shouldn't be assumed not to).
- Slot size: 84px square. Not tied to the main card sizing logic — this is a
  fixed UI element, not a hero image, so no vw-based scaling and no
  breakpoint variation needed.
- Gap between slots: `10px` (or existing `--gap-sm`/`--gap-md` token,
  whichever is closest).

### Slot states

**Empty slot:**
- 84 × 84px, `border-radius: 12px` (or existing card radius token)
- `1.5px dashed` border using `--border-strong` equivalent
- No fill, no icon, no label

**Filled slot:**
- Plant photo (thumbnail crop) fills the 84 × 84px box, same corner radius
  as empty state
- Small circular remove button, top-right, overlapping the corner
  (approx -6px offset top/right so it sits half on/half off the thumbnail)
- Remove button: ~22px circle, X icon, sits on a surface-colour background
  with a border so it reads against any photo

### Ordering behaviour

- Slots fill **left to right in selection order** (first plant selected
  occupies slot 1, regardless of its position in the main scroll above).
- On removal, remaining selected plants **compact left** — i.e. removing the
  plant in slot 2 of 3 shifts the slot-3 plant into slot 2, rather than
  leaving a gap in the middle. This avoids an empty slot appearing between
  two filled ones, which would read as a bug.
- No manual reordering/dragging within the strip — order is purely a
  function of selection sequence.

### No plant names in the strip

Deliberately omitted — the photo is the recognisable element; a name isn't
needed at this size and would force truncation on longer plant names.

---

## Interaction / state sync

- Tapping a plant in the main scroll toggles its selection: adds/removes it
  from the strip.
- Tapping the remove (×) button on a strip thumbnail deselects that plant —
  same effect as tapping it again in the main scroll. Both entry points
  drive the same underlying selection state; there is no separate state to
  keep in sync.
- Selection count in both the `Selected (X/5)` label and the CTA
  (`Continue with X plants →`) update live from the same source of truth.
- At 5 selected, remaining un-selected cards in the main scroll should be
  visually disabled or simply become non-interactive on tap (match whatever
  the current max-5 behaviour already does — no change to this logic).

---

## Explicitly out of scope for this pass

- No drag-and-drop, no reordering within the strip.
- No reordering of the main scroll on selection (main scroll order is
  always the original fetch order, full stop).
- No desktop-specific layout — this spec targets the existing mobile-first
  behaviour; a dedicated desktop layout is a separate, later piece of work.
- No changes to how plants are fetched, filtered, or ranked for this screen.

---

## Open questions (resolve during build or flag back)

- Exact badge treatment on larger cards (see "Selection indicator" above) —
  a visual judgement call once real photos are in place, not a blocking
  decision.
- Confirm existing spacing/radius/border tokens to reuse rather than
  introducing new raw values — check the semantic token layer for an
  equivalent before hardcoding any of the px values above.
