# `.o-roundel`

Lives at `styles/objects/_roundel.scss`. Living document.

**Purpose:** icon-only indicator, fixed 1.5rem square, roundel radius. No text, ever — that's the dividing line from `.o-badge`.

**Pattern:** same private custom-property convention (`--_roundel-*`) — see `styles/design.md`'s naming rules.

## Modifiers

| Modifier | Represents | Colour status |
|---|---|---|
| `is-full-sun` | sun requirement, icon-only contexts | ✅ confirmed — shares `--sem-full-sun-bg`/`-fg` with `.o-badge`, exactly as planned |
| `is-partial-shade` / `is-sun-shade` | sun requirement, icon-only contexts — intentionally merged, same treatment | ✅ confirmed — shares `--sem-partial-shade-bg`/`-fg` with `.o-badge` |
| `is-full-shade` | sun requirement, icon-only contexts | ✅ confirmed — shares `--sem-full-shade-bg`/`-fg` with `.o-badge`, reuses existing neutral tokens |

**Status:** confirmed following visual review, 2026-08-23. Values are genuinely shared with `.o-badge` via the `--sem-*` semantic layer (see `theme.md`), not independently maintained — the original plan held.

## Migration status

`PlantGrid.tsx`'s `SunBadge` (icon-only, distinct from `SunBadgePill` which has text and belongs to `.o-badge`) — ✅ migrated 2026-08-23, confirmed and live.
