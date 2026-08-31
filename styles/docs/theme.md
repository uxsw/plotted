# Theme — Foundations

Living document. Values and semantic intent for every token referenced across `styles/design.md` and `components/ui/design.md`.

**Status:** active, in real use. No longer a skeleton — see `DESIGN.md` at the repo root for the synthesized, tool-facing companion to this file (generated via the Impeccable skill, https://impeccable.style; does **not** auto-sync — refresh it manually via its own commands after meaningful changes here, don't assume it stays current on its own).

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

## Semantic tokens

**Added 2026-08-23**, alongside the badge/roundel colour review. A middle layer between the raw palette and component modifiers — `--sem-*` tokens name *what a colour means*, not just what hue it is, and either reference a palette token or (where the review called for a genuinely new value) a fresh hex. Established as the preferred pattern for any future state-based colour — don't have `.o-badge`-style objects reference raw palette tokens directly for semantic states going forward, go through this layer.

| Token | Value | Used by |
|---|---|---|
| `--sem-border-color` | `var(--color-paper-line)` | general border default |
| `--sem-color-error-bg` / `-fg` | `#ad0018` / `#ffe5e9` | `.o-badge.is-bug`/`.is-error` — a fresh red, doesn't reuse `--color-r-red` |
| `--sem-color-info-bg` / `-fg` | `var(--color-y-yellow)` / `var(--color-n-deep-grey)` | `.o-badge.is-feedback`/`.is-info`/`.is-suggestion-count` |
| `--sem-color-wildlife-friendly-bg` / `-fg` | `var(--color-p-lavender)` / `var(--color-p-white)` | `.o-badge.is-wildlife-friendly` |
| `--sem-drought-tolerant-bg` / `-fg` | `#F4BC86` / `#5D3209` | `.o-badge.is-drought-tolerant` |
| `--sem-edible-bg` / `-fg` | `#C2EBB8` / `#193C11` | `.o-badge.is-edible` |
| `--sem-british-native-bg` / `-fg` | `#B8CEED` / `#142E52` | `.o-badge.is-british-native` |
| `--sem-full-sun-bg` / `-fg` | `#FEEC43` / `#655B01` | `.o-badge.is-full-sun`, `.o-roundel.is-full-sun` |
| `--sem-partial-shade-bg` / `-fg` | `#EBD6B4` / `#513A15` | `.o-badge`/`.o-roundel` `.is-partial-shade` **and** `.is-sun-shade` (intentionally merged — same visual treatment) |
| `--sem-full-shade-bg` / `-fg` | `var(--color-n-grey)` / `var(--color-n-deep-grey)` | `.o-badge`/`.o-roundel` `.is-full-shade` — reuses existing neutrals rather than a new value |
| `--sem-flowering-winter` / `-spring` / `-early-summer` / `-summer` / `-autumn` `-bg`/`-fg` | see `_variables.scss` | `.o-badge.is-flowering-*` — **supersedes the earlier "deliberately hardcoded, not tokenised" decision** (2026-08-23); now consistent with the rest of this layer |

*Fill in hex/OKLCH values as the token layer is unified. Don't leave a token in this table without a stated intent — "what it means" is what stops the next fork.*

## Type scale

**Filled in 2026-08-29 (typeset pass).** Printers'-names scale in `styles/base/_typography.scss` — closed, ordered sequence, fluid `clamp()` steps. Closed means an agent must not invent a step; map any new size need onto the nearest existing one. The Tailwind default type scale (`text-xs`/`text-sm`/…) and arbitrary `text-[Npx]` values are **not** part of this system and are being replaced by these classes.

| Step | Class | Size (min → max) | Role / use |
|---|---|---|---|
| canon | `.canon` | 2.244 → 3.815rem | **Display** — page/hero headline (marketing hero; large in-app titles). Ships `font-weight: 600`, `line-height: 1`. |
| long-paragon | `.long-paragon` | 1.907 → 3.052rem | Display, long-heading variant. Ships 600, `line-height: 1.05`. |
| paragon | `.paragon` | 1.627 → 2.441rem | **Headline** — section headers, app `<h1>`, empty-state headings. Ships 600, `line-height: 1`. |
| long-pica | `.long-pica` | 1.395 → 1.953rem | Headline, long-heading variant. `line-height: 1.1`. |
| pica | `.pica` | 1.202 → 1.563rem | **Title** — card titles, dialog titles, sub-section headers. `line-height: 1.15`. Add `.kirk` for the bold-roman product voice. |
| long-primer | `.long-primer` | 1.042 → 1.250rem | Large body / lead paragraph / editorial narrative in the display face. `line-height: 1.3`. |
| primer | `.primer` | 0.909 → 1.000rem | **Body** — all running UI text. `line-height: 1.5`. |
| brevier | `.brevier` (`.o-brevier`) | 0.813 → 0.894rem | **Body-sm** — secondary text, card subtitles, hints, helper copy. `line-height: 1.5`. |
| minion | `.minion` (`.o-minion`) | 0.728 → 0.800rem | **Caption / data** — metadata, timestamps, dense numerals, badge text. `line-height: 1.5`. Also the size of `.o-type-label`. |

**Role classes & utilities** (also in `_typography.scss`):
- `.o-type-display` — sets the Fraunces family; pair with a size step.
- `.o-type-label` — the single label treatment: Spline Sans Mono, `.minion` size, weight 500, `uppercase`, `letter-spacing: 0.14em`. Replaces ad-hoc `text-xs font-semibold uppercase tracking-wider`. See DESIGN.md "The Mono Label Rule".
- `.o-type-tabular` — `font-variant-numeric: tabular-nums` for aligned numeral columns.
- `.o-type--italic`, `.o-type--truncate`, `.o-type--center`, `.o-type-line-clamp-2` — unchanged.
- Line-height: `.o-type-leading--none` (1) / `--tight` (1.2) / `--snug` (1.4) / `--relaxed` (1.6). Closed set matching real usage; replaces Tailwind `leading-*`.
- `.o-measure` — `max-width: var(--measure)` (34rem ≈ 65ch), for running prose in wide containers.

**Weight** is a separate axis, not part of the size scale:
- `--font-weight-regular: 400` (body default)
- `--font-weight-medium: 500` → `.o-type-weight--medium`. Added 2026-08-29. Inter 500 and Spline Mono 500 are loaded; this is the weight for mono labels and subtle UI emphasis (replaces Tailwind `font-medium`).
- `--font-weight-bold: 600` → `.kirk` (the bold-roman product-heading voice; replaces Tailwind `font-semibold`). The old `.o-type-weight--bold` alias (1 call site) was removed in favour of `.kirk`.

**Two-Register Rule (from DESIGN.md):** Fraunces headings are `.kirk` bold roman (600) in the product UI, italic 400 on marketing/editorial surfaces — never mixed within one surface.

**Tailwind `--font-weight-bold` name collision (theme-var, resolves to 700):** still a real landmine while any plain-Tailwind `font-bold` exists, but the typeset pass confirmed **zero `font-bold`/`font-black` usages** in `app/` and `components/`, so nothing currently trips it. `app/auth/reset-password/page.tsx` uses `font-semibold` and is on the deferred conversion list.

**Fonts loaded** (`app/layout.tsx`): Fraunces 400/500/600 normal+italic; Inter 400/500/600 (700 dropped 2026-08-29, unused); Spline Sans Mono 400/500.

## Spacing scale

**Confirmed as the target scale, 2026-08-30.** `--space-base: 1rem`, with `xs`/`sm`/`md`/`lg`/`xl` as multiples (0.25×/0.5×/1×/1.5×/2×) — `4px`/`8px`/`16px`/`24px`/`32px`. Stylelint validates against this. **All new work must use these tokens, no raw px/rem.**

**Legacy note:** this is confirmed as the going-forward rule, not confirmation that every existing file already conforms. `_card.scss`, for one, still has raw `0.375rem`/`1rem` values off this scale — logged as a known, deferred cleanup item in the gaps log, not yet migrated. Treat any raw spacing value found in older files as legacy debt to flag, not as evidence the scale itself is unsettled.

## Radius scale

**Confirmed** — `--radius-s: 2px`, `--radius-m: 4px`, `--radius-l: 8px`, `--radius-pill: 32px`, `--radius-roundel: 50%`. Single scale, shared by both the SCSS objects layer and CSS Modules.

## Elevation / shadow scale

**Confirmed as the target scale, 2026-08-30** — three steps, closed vocabulary:
- **Menu / raised-panel** — `0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a`. Popovers, the autocomplete menu.
- **Card hover / frame** — `0 8px 24px rgba(0, 0, 0, 0.15)`. `.o-card--interactive:hover` (also raises `z-index` to 1), and `_planting-schemes.scss`'s `.is-frame` panels.
- **Dialog** — `0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a`. Modal dialogs only — the deepest step, reserved for content that stops the page.

Shadow is a *state response* only (hover, open, overlay) — surfaces are flat at rest by design, separated by tonal paper layers and hairlines instead. See `DESIGN.md`'s Flat-By-Default Rule.

**Legacy note:** `_onboarding-card.scss`'s separate rest/hover shadow pair (`_onboarding-card.scss:8`) is **not yet reconciled into this scale** — it predates it and wasn't folded into any of the three steps above. Treat as known legacy debt, not as an open question about what the scale should be; the scale itself is settled, this file just hasn't been migrated onto it yet.

## Motion

*TBD — transition/easing pairing convention (fixes the malformed two-declaration bug found in `_autocomplete.scss`).*

## Breakpoints

**Confirmed as the target values, 2026-08-30.** `--breakpoint-tablet: 860px`, `--breakpoint-mobile: 480px` (consumed as Tailwind `max-tablet`/`max-mobile` during the transition off Tailwind).

**Legacy note:** `Input.tsx` has a stray Tailwind `sm:` (640px) — off-system, doesn't match either confirmed breakpoint. Found during the 2026-08-29 typeset pass, not yet fixed. Logged in `design.md`'s gaps log.
