# `.o-badge`

Lives at `styles/objects/_badge.scss`. Living document — update in place as colours settle and migration completes.

**Purpose:** static labelling only — text, optionally with a leading icon. Never interactive. If it needs a click handler, it's a `.o-chip`, not a badge.

**Shape rule vs. `.o-roundel`:** if it has text (icon optional) → `.o-badge`. If it's icon-only, no text → `.o-roundel`. Decided by content, not by context/screen.

**Anatomy:** `inline-flex`, pill radius, hairline border, `gap: var(--space-xs)` for an optional icon child, `padding-inline: var(--space-sm)`, `line-height: 2`.

**Pattern:** uses the private custom-property convention (`--_badge-*`) — see `styles/design.md`'s naming rules.

## Modifiers

| Modifier | Represents | Colour status |
|---|---|---|
| `is-sm` | smaller text size (0.75rem vs. 0.85rem default) | — |
| `is-bug` / `is-error` | error/bug state | ✅ fixed 2026-08-23 |
| `is-feedback` / `is-info` / `is-suggestion-count` | intentionally identical (confirmed) — also covers the legacy "UX issue" feedback type, which the submission form no longer offers | provisional, guessed |
| `is-wildlife-friendly` | suggestion category | provisional, guessed — bg/fg from same hue family (`p-lavender`/`p-white`), worth a contrast check |
| `is-drought-tolerant` | suggestion category | provisional, guessed — bg/fg from same hue family (`b-cyan`/white), worth a contrast check |
| `is-edible` | suggestion category | provisional, guessed |
| `is-british-native` | suggestion category | provisional, guessed |
| `is-full-sun` / `is-partial-shade` / `is-full-shade` / `is-sun-shade` | sun requirement, with text | provisional — shared values planned to be tokenised and reused in `.o-roundel` once settled |

**Known provisional state:** most colour values above are first-pass guesses, explicitly flagged as something to review visually once live rather than get right analytically upfront. Don't treat any colour here as finalised without checking back — update this table in place as each gets reviewed.

## Migration status (from the 2026-08-22 badge/chip audit)

| Audit group | Instance | Status |
|---|---|---|
| A — suggestion count pill | `SchemeList.tsx`, `SchemeCardScroller.tsx` | pending migration |
| B — category tags | `SchemeResults.tsx` | pending migration |
| C — feedback type tags | `FeedbackTable.tsx` | pending migration |
| E — `Tag` component | `components/ui/Tag.tsx` | pending retirement, superseded by this object |
| F — `SunBadgePill` | `SunBadge.tsx`, rendered in `PlantDetail.tsx` | pending migration |
