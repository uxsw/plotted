# Theme — Foundations

Living document. Values and semantic intent for every token referenced across `styles/design.md` and `components/ui/design.md`.

**Status:** draft skeleton, 2026-08-22

## Palette

**Confirmed, 2026-08-22.** Not a wholesale "pick one palette" — a deliberate mix: the Tailwind neutrals that are actually load-bearing are kept, the warm-accent tokens are consolidated into the hue-prefixed accent system instead of maintaining near-duplicates in two places.

| Token | Origin | Value | Semantic intent |
|---|---|---|---|
| `--color-paper` | Tailwind `@theme` (relocated to `_variables.scss`) | `#FAF6EC` | page background |
| `--color-ink` | Tailwind `@theme` (relocated to `_variables.scss`) | `#2B2A24` | primary text/ink |
| `--color-ink-soft` | Tailwind `@theme` (relocated to `_variables.scss`) | `#5B574A` | secondary/label text — **this is the correctly-prefixed token**; the audit's `_plant-detail.scss` bug (`var(--ink-soft)`, missing `color-`) resolves against this |
| `--color-sand` | Tailwind `@theme` (now relocated to `_variables.scss`) | `#E8DFC8` | |
| `--color-paper-deep` | Tailwind `@theme` (relocated to `_variables.scss`) | `#F2ECDB` | |
| `--color-sand-line` | Tailwind `@theme` (relocated to `_variables.scss`) | `#D9CCAC` | |
| `--color-white` | Tailwind `@theme` (relocated to `_variables.scss`) | `#FFF` | |
| `--color-paper-line` | Tailwind `@theme` (relocated to `_variables.scss`) | `#E3D8BC` | backs `--sem-border-color` |
| `--color-n-cool-grey` / `-grey` / `-dark-grey` / `-deep-grey` | SCSS/OKLCH | see `_variables.scss` | structural — borders, disabled states, chrome. Renamed from `--color-g-*` |
| `--color-g-summer-green` / `-green` | SCSS/OKLCH | see `_variables.scss` | brand / accent |
| `--color-r-marigold` | SCSS/OKLCH | `oklch(65.809% 0.15943 31.855)` / `#e26650` | replaces `--color-moss` **and** `--color-clay` — both retired. **Flat only — no tint/opacity variants.** |
| `--color-y-yellow` | SCSS/OKLCH | `oklch(94.577% 0.10215 110.6)` / `#f0f4a3` | replaces `--color-gold` — retired. **Flat only — no tint/opacity variants.** |
| `--color-b-*` / `o-*` / `p-*` | SCSS/OKLCH | see `_variables.scss` | brand / accent hues, unchanged by this migration |

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
- `--font-weight-regular: 400`
- `--font-weight-bold: 600`
- `kirk` — standalone bold utility class, kept deliberately outside the size scale (a long-standing convention, not an inconsistency)

**Known, accepted temporary state:** `--font-weight-bold` shares its custom-property name with Tailwind's own theme variable (Tailwind's default resolves to `700`, not `600`). This caused one silent collision during migration (`app/auth/reset-password/page.tsx`, changed to `font-semibold` to preserve intent). Not being resolved with a naming workaround — full Tailwind removal is the actual fix, at which point the collision stops existing. Worth checking `app/auth/reset-password` and anywhere else still on plain Tailwind for the same class of collision before Tailwind is fully gone.

## Spacing scale

*TBD — define once token unification lands. Agents should not use raw px/rem values once this exists; only scale tokens.*

## Radius scale

*TBD — single scale shared by both the SCSS objects layer and CSS Modules.*

## Elevation / shadow scale

*TBD — target 2–3 steps.* Audit found five distinct hand-typed shadow values across dialog, popover, card hover, the Card module, and the dashboard, for what reads as two or three real elevation levels visually. Consolidate down, don't just alias the existing five.

**Progress:** `.o-popover` now reuses `.o-autocomplete`'s existing shadow value rather than a new one (2026-08-22, popover migration) — first real consolidation, one fewer hand-typed value to reconcile. Still outstanding: dialog, card hover, the Card module's own value, and the dashboard's value — confirm whether any of these already match `.o-autocomplete`'s or represent a genuinely distinct second step before finalising the scale.

## Motion

*TBD — transition/easing pairing convention (fixes the malformed two-declaration bug found in `_autocomplete.scss`).*

## Breakpoints

*TBD.*
