# Theme — Foundations

Living document. Values and semantic intent for every token referenced across `styles/design.md` and `components/ui/design.md`.

**Status:** draft skeleton, 2026-08-22

## Palette

**Confirmed, 2026-08-22.** Not a wholesale "pick one palette" — a deliberate mix: the Tailwind neutrals that are actually load-bearing are kept, the warm-accent tokens are consolidated into the hue-prefixed accent system instead of maintaining near-duplicates in two places.

| Token | Origin | Value | Semantic intent |
|---|---|---|---|
| `--color-paper` | Tailwind `@theme` | | page background |
| `--color-ink` | Tailwind `@theme` | | primary text/ink |
| `--color-ink-soft` | Tailwind `@theme` | | secondary/label text — **this is the correctly-prefixed token**; the audit's `_plant-detail.scss` bug (`var(--ink-soft)`, missing `color-`) resolves against this |
| `--color-sand` | Tailwind `@theme` | | |
| `--color-n-*` (neutral scale) | new | | structural — borders, disabled states, chrome |
| `--color-g-*` (green) | SCSS/OKLCH | | brand / accent |
| `--color-r-marigold` | SCSS/OKLCH | | replaces `--color-moss` **and** `--color-clay` — both retired |
| `--color-y-yellow` | SCSS/OKLCH | | replaces `--color-gold` — retired |
| `--color-b-*` / `o-*` / `p-*` | SCSS/OKLCH | | brand / accent hues |

**Retired — remove from `app/globals.css` and reassign every call site:**
- `--color-moss` → `--color-r-marigold`
- `--color-clay` → `--color-r-marigold`
- `--color-gold` → `--color-y-yellow`

*Fill in hex/OKLCH values as the token layer is unified. Don't leave a token in this table without a stated intent — "what it means" is what stops the next fork.*

## Type scale

Printers'-names scale — closed, ordered sequence. Document it as closed so an agent doesn't assume there's room to invent a step.

| Step | Token | Size | Use |
|---|---|---|---|
| minion | | | |
| brevier | | | |
| primer | | | |
| pica | | | |
| paragon | | | |
| canon | | | |
| *(long- variants)* | | | |

**Weight** is a separate axis, not part of this scale:
- `--font-weight-regular`
- `--font-weight-bold`
- `kirk` — standalone bold utility class, kept deliberately outside the size scale (a long-standing convention, not an inconsistency)

## Spacing scale

*TBD — define once token unification lands. Agents should not use raw px/rem values once this exists; only scale tokens.*

## Radius scale

*TBD — single scale shared by both the SCSS objects layer and CSS Modules.*

## Elevation / shadow scale

*TBD — target 2–3 steps. Audit found five distinct hand-typed shadow values across dialog, popover, card hover, the Card module, and the dashboard, for what reads as two or three real elevation levels visually. Consolidate down, don't just alias the existing five.*

## Motion

*TBD — transition/easing pairing convention (fixes the malformed two-declaration bug found in `_autocomplete.scss`).*

## Breakpoints

*TBD.*
