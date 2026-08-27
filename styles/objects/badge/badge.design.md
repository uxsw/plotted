# `.o-badge`

Lives at `styles/objects/_badge.scss`. Living document — update in place as colours settle and migration completes.

**Purpose:** static labelling only — text, optionally with a leading icon. Never interactive. If it needs a click handler, it's a `.o-chip`, not a badge.

**Shape rule vs. `.o-roundel`:** if it has text (icon optional) → `.o-badge`. If it's icon-only, no text → `.o-roundel`. Decided by content, not by context/screen.

**Anatomy:** `inline-flex`, pill radius, hairline border, `gap: var(--space-xs)` for an optional icon child, `padding-inline: var(--space-sm)`, `line-height: 2`.

**Pattern:** uses the private custom-property convention (`--_badge-*`) — see `styles/design.md`'s naming rules.

## Modifiers

| Modifier | Represents | Colour status |
|---|---|---|
| `is-sm` | smaller text size (0.65rem), tighter line-height and inline padding | — |
| `is-bug` / `is-error` | error/bug state | ✅ confirmed — `--sem-color-error-bg`/`-fg` |
| `is-feedback` / `is-info` / `is-suggestion-count` | intentionally identical (confirmed) — also covers the legacy "UX issue" feedback type | ✅ confirmed — `--sem-color-info-bg`/`-fg` |
| `is-wildlife-friendly` | suggestion category | ✅ confirmed — `--sem-color-wildlife-friendly-bg`/`-fg` |
| `is-drought-tolerant` | suggestion category | ✅ confirmed, revised from the original guess — `--sem-drought-tolerant-bg`/`-fg` |
| `is-edible` | suggestion category | ✅ confirmed, revised from the original guess — `--sem-edible-bg`/`-fg` |
| `is-british-native` | suggestion category | ✅ confirmed, revised from the original guess (moved hue family entirely, red → blue) — `--sem-british-native-bg`/`-fg` |
| `is-full-sun` | sun requirement, with text | ✅ confirmed, revised from the original guess — `--sem-full-sun-bg`/`-fg` |
| `is-partial-shade` / `is-sun-shade` | sun requirement — intentionally merged, same treatment | ✅ confirmed — `--sem-partial-shade-bg`/`-fg` |
| `is-full-shade` | sun requirement, with text | ✅ confirmed, reuses existing neutral tokens rather than a new value | 
| `is-flowering-winter` / `-spring` / `-early-summer` / `-summer` / `-autumn` | flowering-season colour band, by month-range midpoint | ✅ confirmed — **now tokenised** via `--sem-flowering-*`, superseding the earlier hardcode decision |

**Status:** all modifiers confirmed following visual review, 2026-08-23. All colours now route through the `--sem-*` semantic layer (see `theme.md`) rather than referencing raw palette tokens directly — the preferred pattern for any new state-based modifier going forward.

**⚠️ Open bugs, not yet fixed (found during doc review of the colour-token pass):**
- `_variables.scss`, `--sem-full-shade-fg` declaration — missing trailing semicolon, will break Sass compilation.
- `_badge.scss`, `.is-flowering-spring`'s `--_badge-border-color` declaration — same missing-semicolon issue.
- `_badge.scss`'s header comment still says "Use `o-badge-icon` with icon only" — stale, that class was renamed to `.o-roundel`. Update to match.

## Migration status (from the 2026-08-22 badge/chip audit)

| Audit group | Instance | Status |
|---|---|---|
| A — suggestion count pill | `SchemeList.tsx`, `SchemeCardScroller.tsx` | pending migration |
| B — category tags | `SchemeResults.tsx` | pending migration |
| C — feedback type tags | `FeedbackTable.tsx` | pending migration |
| E — `Tag` component | `components/ui/Tag.tsx` | pending retirement, superseded by this object |
| F — `SunBadgePill` | `SunBadge.tsx`, rendered in `PlantDetail.tsx` | pending migration |
| F — Flowering season badge | `.c-flowering-season-chip` (retired, deleted), `FloweringSeasonBadge.tsx`, `PlantGrid.tsx` inline block | ✅ migrated 2026-08-23. **Correction on record:** the original brief mischaracterised `PlantGrid.tsx`'s block as dead — it was live, rendered via `Card`'s `tags` prop. The actually-dead code was a similarly-named, never-called `FloweringSeasonChip` function in the same file. Claude Code caught the discrepancy and stopped rather than deleting live UI — correction applied before Step 2 ran. Verified against the compiled bundle, standalone-rendered; typecheck/lint clean. |
