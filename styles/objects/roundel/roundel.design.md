# `.o-roundel`

Lives at `styles/objects/_roundel.scss`. Living document.

**Purpose:** icon-only indicator, fixed 1.5rem square, roundel radius. No text, ever — that's the dividing line from `.o-badge`.

**Pattern:** same private custom-property convention (`--_roundel-*`) — see `styles/design.md`'s naming rules.

## Modifiers

| Modifier | Represents | Colour status |
|---|---|---|
| `is-full-sun` / `is-partial-shade` / `is-full-shade` / `is-sun-shade` | sun requirement, icon-only contexts | provisional — same underlying meaning as `.o-badge`'s sun modifiers; values to be tokenised and shared across both files once settled, not independently maintained |

## Migration status

Icon-only sun indicators (separate from `SunBadgePill`, which has text and belongs to `.o-badge`) — instances not yet confirmed. Locate and confirm before migrating; don't assume placement.
