# Styles Library — Architecture

Living document. Update as each object/component migrates — don't let this become a final write-up once the migration is "done."

**Status:** active, in real use. No longer a skeleton.
**Scope:** `styles/`, `app/globals.css`, `components/ui/*.module.css`

**Relationship to `DESIGN.md`/`PRODUCT.md` (repo root):** these are a synthesized, tool-facing pair generated via the Impeccable skill (https://impeccable.style) — `DESIGN.md`'s YAML frontmatter in particular is a clean, machine-shaped summary of colours/type/spacing/radius/components, well suited to handing directly to an external AI design tool. **It does not auto-update** — Impeccable includes commands to manually re-prompt/regenerate it, but nothing keeps it synced automatically. Treat it as a periodic snapshot, not a live view: this file and `theme.md` remain the continuously-updated source of truth, and `DESIGN.md` should be manually refreshed after any meaningful change here, especially before handing it to an external tool.

## Layer map

What loads, in what order, from where. Keep this table current — it's the fastest thing for an agent to grep before touching anything.

| Order | Source | Role | Status |
|---|---|---|---|
| 1 | `app/globals.css` | Token source — single palette + scales | ⚠️ pending unification, see Token source below |
| 2 | `styles/main.scss` | ITCSS layers: abstracts → base → layout → objects → components → pages. Utility classes (`u-*`) live in `base/utilities`, deliberately — not a separate late-loading layer, see naming rules for why. | active |
| 3 | `components/ui/*.module.css` | CSS Modules — **legacy, not target architecture** (reversed 2026-08-23, see gaps log). Existing modules (`Button`, `ProgressBar`) are not being actively migrated away from urgently, but nothing new should be added here. | 2 remaining, no further modules planned |

## Token source

**Single source of truth — confirmed 2026-08-22.** Not a wholesale palette swap: a curated mix. Full rationale and values in `styles/theme.md`.

- **Palette:** `paper`, `ink`, `ink-soft`, `sand` kept from the Tailwind `@theme` palette; `moss` and `clay` retired in favour of `--color-r-marigold`; `gold` retired in favour of `--color-y-yellow`; plus neutral (`n-*`) and remaining hue-prefixed accents (`r-` / `y-` / `b-` / `o-` / `p-` / `g-`) from the SCSS/OKLCH palette
- **Spacing scale:** TBD — define alongside token unification
- **Radius scale:** TBD
- **Shadow / elevation scale:** TBD — 2–3 steps, consolidating the five hand-typed values found in the audit (dialog, popover, card hover, card module, dashboard)
- **Motion (transition/easing pairing):** TBD

Full values and semantic intent live in `styles/theme.md`, not here — this file stays architectural.

## Naming rules

- **Objects:** `o-*` — BEM elements with `__`, modifiers with `--`
- **Components:** `c-*` — same BEM conventions
- **State:** `is-*` / `has-*` — state only (active, checked, disabled). Never layout configuration.
- **Layout configuration that's specific to one object** lives as a modifier on that object — e.g. `o-row--space-between`, `o-row--align-top` — not as a bare, un-namespaced class.
- **Utility classes** — `u-*`, prefixed, living in `base/utilities` (not a separate late-loading layer; this codebase keeps utilities in `base/`, deliberately). Use a utility instead of an object modifier when the fix is genuinely general-purpose rather than specific to one object's internal relationships — e.g. `u-expand` (`flex: 1; min-width: 0`, the standard fix for a flex child that needs to grow and allow text truncation) is a flex-child concern, not a row concern, so it's a utility, not `o-row--expand`. Utility classes **always use `!important`** — the entire point of a utility is that it must apply regardless of what else targets the element; specificity/load-order concerns don't apply here by design, unlike everywhere else in this system. First real usage: `u-expand`, 2026-08-23 (migrated off a bare, unnamespaced `.expand` in `layout/_row.scss`, flagged in the original CSS audit).
- **Neutral color family:** `n-*` for grey, distinct from hue-prefixed accents. `g-*` is green only.
- **Font weight** is its own axis (`--font-weight-regular` / `--font-weight-bold`), independent of the type scale. `kirk` remains as a standalone bold utility class by deliberate, long-standing choice — not part of the size scale, don't try to fold it in.

## Block vs. modifier vs. new object — the rule

A modifier changes how *one instance* of a thing looks or behaves. A new object is warranted when something represents a genuinely different structural composition — especially "many instances arranged together" (e.g. a grid of cards is its own object, not a card modifier).

Agents: apply this test before inventing a new block. If it's ambiguous, that's a gap — stop and flag it, don't decide unilaterally.

**This applies to utility-class composition too, not just custom class names.** Assembling several utility classes (Tailwind or otherwise) into a repeated cluster that visually or structurally behaves like a component — a badge, a chip, a pill — *is* inventing an undocumented component, even though no single new class name was created. If a pattern is being repeated rather than written once, it needs an entry in `components/ui/design.md`, not another ad-hoc utility chain. Stop and flag it the same as any other gap.

## Preferred pattern — private custom properties for modifiers

Objects with color/size modifiers should scope their variable values through object-private custom properties (prefixed `--_`), set once in the base rule and overridden per modifier, rather than repeating full property declarations in every `.is-*`/`--*` rule. Example, from `.o-badge` (first real usage, 2026-08-23):

```scss
.o-badge {
  --_badge-bg-color: var(--color-paper);
  --_badge-fg-color: var(--color-ink-soft);
  background-color: var(--_badge-bg-color);
  color: var(--_badge-fg-color);

  &.is-info {
    --_badge-bg-color: var(--color-y-yellow);
  }
}
```

This keeps each modifier's diff to just the values that actually change, rather than a full re-declaration of every property. Adopt this pattern for new objects/components going forward.

## Where new work goes

Documentation structure, confirmed 2026-08-23:

- **Top-level docs** (`design.md`, `theme.md`, the components index) live together in `styles/docs/`.
- **Every object or component gets its own folder** under `styles/objects/` (or `styles/components/` for the `c-*` layer), containing its source file(s) and its own doc file co-located together, keeping the full `<name>.design.md` filename inside the folder rather than shortening to a bare `design.md` — e.g. `styles/objects/badge/_badge.scss` + `styles/objects/badge/badge.design.md`. **`components/ui/*.module.css` is not a destination for new work** — see the 2026-08-23 architecture reversal in the gaps log. Existing modules stay where they are; nothing new goes there.
- The components index (in `styles/docs/`) stays a **thin index only** — name, type, location, one-line status, link to the object's own folder. Full detail lives with the source, not centrally.
- When moving a source file into a new folder, update whatever `@forward`s it from the objects layer's index — confirmed done for the `badge`/`roundel` move, 2026-08-23.

## Lint rules

- Stylelint checks custom-property usage against the known token list — catches typo'd tokens (e.g. `--radius-md` vs `--radius-m`) before merge, not as a silent visual bug after.

## Known exclusions — do not touch

- `plant-detail.scss`, `.plant`, `.plant-detail`, `.plant__frost-tolerance` — flagged in the Aug 2026 audit as poorly structured. Scoped for a dedicated refactor outside this migration. **Agents: leave these files alone until this exclusion is lifted.**

## Contradictions & gaps log

Carried forward from `docs/styleguide/naming-convention.md`'s pilot log — keep appending here as new ones surface. Dated, honest record of what the plan assumed vs. what real usage showed.

| Date | Item | Resolution |
|---|---|---|
| 2026-08-22 | `g-green` / `g-grey` collision | Split: grey → `n-*` (neutral), `g-*` reserved for green |
| 2026-08-22 | `.kirk` weight naming | Kept as utility; `--font-weight-*` tokens added as the real axis |
| 2026-08-22 | `.o-popover-menu` naming | Superseded — see 2026-08-22 entry below. Original plan (rename to `.o-popover__menu`) was based on an incorrect assumption; investigation found it's not an element of `.o-popover` at all. |
| 2026-08-22 | `.o-popover` vs `.o-popover-menu` — structural investigation | `.o-popover` (UserMenu, SchemeList) is Radix-driven; positioning/z-index come from Radix inline, CSS only needs to own visual chrome (shadow/radius currently missing — separate fix needed). `.o-popover-menu` (PlantGrid filter dropdown) is a fully manual, hand-rolled implementation — its own `useState`, outside-click via `filterRef`, self-positioned CSS. Confirmed live and reachable (not dead code) via Claude Code investigation: triggered by the "Filter plants" button, `filterOpen` state, routed on `/plants`. Not duplication in the sense of dead/competing code — two genuine parallel implementations of the same UI pattern, one of which reimplements what Radix already provides. |
| 2026-08-22 | `.o-popover-menu` — decision | Migrate `PlantGrid`'s filter dropdown onto Radix Popover, matching `UserMenu`/`SchemeList`. Retire the manual `filterRef` outside-click handler and `.o-popover-menu` object once migrated — no reason for the split to persist. `.o-popover` gains shadow/radius as part of the same elevation-scale gap (see `theme.md`). |
| 2026-08-22 | `.o-popover-menu` — resolved | Migration complete. `PlantGrid.tsx` now uses `Popover.Root`/`Trigger`/`Portal`/`Content` (controlled, matching `SchemeList`'s pattern — the filter badge dot needs open state). Manual `filterRef` and its outside-click handler removed entirely. `.o-popover-menu`/`.o-popover-menu__item` retired from `_popover.scss`; `.o-popover` is now the single shared shell for all three popovers, with border-radius/box-shadow added (reused `.o-autocomplete`'s existing elevation value rather than inventing a new one — see `theme.md`). |
| 2026-08-22 | `.o-popover` hover-highlight geometry | Folding items into `.o-popover`'s own padding changed the filter menu's hover highlight from edge-to-edge to inset. Noted, not treated as a regression — leaving as-is. Flagging here so it reads as a deliberate, known side-effect if it's ever questioned later. |
| 2026-08-22 | Palette source | Confirmed as a curated mix, not one palette wholesale: `paper`/`ink`/`ink-soft`/`sand` kept from Tailwind; `moss`, `clay` → `--color-r-marigold`; `gold` → `--color-y-yellow`. See `styles/theme.md`. |
| 2026-08-22 | Marigold/yellow — flat vs. tinted | First migration pass introduced opacity-based tints (`marigold/15` etc., one `color-mix()`) to preserve the old `-tint` variants. Corrected: no tints — flat token only, everywhere. Deliberate simplification; visual distinctions lost by flattening are accepted for now, to be revisited progressively as real styling decisions rather than preserved by default. |
| 2026-08-22 | ⚠️ **Known bug — text/background contrast** — **STOPGAP FIXED, 2026-08-23** | Flattening surfaced pre-existing pairings of `bg-marigold`+`text-marigold` (or `bg-yellow`+`text-yellow`) that previously read as distinct tint-vs-base and now resolve to the same color — text effectively invisible. Confirmed locations: `generating/page.tsx`, `FeedbackModal`, badge types in `SchemeResults`/`SchemeList`/`SchemeCardScroller`/`FeedbackTable`, `Select`'s `data-[highlighted]` state. **Temporary fix applied 2026-08-23:** all 7 locations changed to `text-ink` (~4.6:1 contrast on marigold, ~12.9:1 on yellow, both WCAG AA pass). No tint fallback needed. Explicitly provisional — proper fix is the pending `.o-badge` component work (utility-class-composition audit in progress), not this patch. Do not treat `text-ink` here as a final design decision.
| 2026-08-22 | `app/globals.css` colour evacuation | Complete. Every remaining colour token (including `--color-paper-deep`, `--color-sand-line`, found in a follow-up audit) relocated into `styles/abstracts/_variables.scss`. `app/globals.css`'s `@theme` block now only bridges via `var()` for Tailwind utility generation — verified against compiled build output, not inferred. `--border-color`, `--breakpoint-*`, `--radius*` remain, correctly out of scope (non-colour). |
| 2026-08-23 | `.expand` row utility | Not a row modifier after all — `flex: 1; min-width: 0` is a general flex-child concern (grow + allow truncation), not row-specific. Migrated to `u-expand`, first real usage of the new utility-class convention (`u-*`, `base/utilities`, `!important` by design). `.space-between`/`.align-top` remained genuine row modifiers — see next entry. |
| 2026-08-23 | `.space-between` / `.align-top` row modifiers | ✅ Migrated. Both confirmed as clean `o-row` compound-class usage (4 and 1 call sites respectively) before renaming. Now `&.o-row--space-between` / `&.o-row--align-top` in `layout/_row.scss`. All call sites updated. |
| 2026-08-23 | `.surface-info` dead alias — **not dead, resolved** | Original audit assumed this was a leftover from before `.o-surface--info` was namespaced. Investigation found it live in two places, correctly stopped rather than deleted. **Resolved:** `SchemeNewForm.tsx` and `PwaInstallTriggerCard.tsx` migrated from unprefixed `surface-info` to `o-surface--info`. Incidental bug also fixed: `PhotoIdentification.tsx` had `o-surface-info` (single dash, matched no selector, silently no background) — corrected to `o-surface--info`, confirmed via computed style that the section now gets its background/border. Unprefixed alias removed from `styles/objects/_surfaces.scss`; `.o-surface--info` is the sole rule. Zero remaining references confirmed. |
| 2026-08-23 | `Card.module.css` vs `_card.scss` — full investigation | Original audit's three divergences all still live; three more found (`position: relative` SCSS-only; SCSS's tokenised transition with a `z-index` channel vs. the module's flat `box-shadow 150ms`; ~~`--radius-md`, a dead/non-existent token — module resolves to square corners~~ **correction below**). Crucially, **the two files no longer style the same DOM**: `Card.tsx` and every real consumer (`PlantGrid`, `PhotoIdentification`, `SchemeList`) use global `o-card` classes from `_card.scss` directly — the module is imported only by `PlaceholderPlantCard.tsx` (the plants-grid loading skeleton), using just 5 of its classes. ~55% of the module is dead code. `_card.scss` is unambiguously the better-maintained file (correct radius token, `--color-white`, tokenised transitions) — the module has had zero token maintenance since forking. `_card.scss` itself isn't fully clean either: raw `0.375rem`/`1rem` values off the confirmed spacing scale, `.o-card--interactive` transitions still untokenised (150ms/75ms), and `--color-y-yellow`/`--color-r-red` used raw where a `--sem-*` token would arguably fit but doesn't exist yet — logged as a separate, deferred item, not folded into this migration. |
| 2026-08-23 | ✅ **`Card.module.css` retired — complete** | `PlaceholderPlantCard.tsx` switched from `Card.module.css` imports to plain global `o-card` classes, matching `Card.tsx`'s pattern. Module deleted; confirmed sole importer via full-codebase grep before deletion. Visually verified by rendering the exact post-change markup live and screenshotting at all three opacities `PlantGrid` uses (0.5/0.35/0.2) — shape, colour, spacing all correct. **Correction to the investigation entry above:** `--radius-md` was NOT a dead token resolving to nothing — it was silently resolving via Tailwind's own built-in default (`0.375rem`/6px), not a custom token this codebase ever defined. The skeleton was rendering 2px rounder than the real card (which correctly uses `--radius-m`/4px) — now fixed as a side effect of the consolidation. **Broader lesson:** anywhere a custom property looks "dead" or undefined, verify rather than assume — Tailwind's implicit defaults can silently mask what would otherwise be a real bug, and every instance of this will break for real once Tailwind is fully removed, since there'll be no fallback left. Worth an explicit check for this pattern when that removal happens. Two stale doc references to the deleted module remain — `components-ui-design-index.md`'s Card row and `docs/styleguide/naming-convention.md`'s file list — queued as a small follow-up, not yet fixed. |
| 2026-08-23 | ⭐ **Architecture reversal — CSS Modules is no longer the target, global SCSS is** | The Card investigation surfaced that CSS Modules — stated as the target architecture since the very first audit, with the explicit recommendation to "keep the o-*/c-* + CSS Modules direction... as target architecture" — hasn't matched how the system has actually evolved in practice. Confirmed decision: **global SCSS/ITCSS is the permanent system-wide direction, not a stopgap.** `Button.module.css` and `ProgressBar.module.css` remain as-is for now (not urgent to migrate away from), but **no new component work should go into `components/ui/*.module.css`** — see the updated layer map and "Where new work goes" above. This corrects the original audit's stated recommendation; it was a reasonable read of intent at the time, but doesn't reflect the direction the system has actually settled on. **Card resolution, following this decision:** consolidate on `_card.scss`. Retire `Card.module.css` entirely; `PlaceholderPlantCard.tsx` switches to plain global `o-card` classes, matching `Card.tsx`'s own pattern, rather than importing the module. |
| 2026-08-23 | Process gap — token unification silently missed a file in its own stated scope | The original token-unification task's scope explicitly named `components/ui/*.module.css`. `Button.module.css` and `ProgressBar.module.css` were updated in that pass; `Card.module.css` was not, and nobody flagged the omission at the time — it was only caught two weeks later by an unrelated investigation. Worth a standing lesson: a "search every call site" instruction doesn't guarantee full coverage was actually verified against the stated scope; for future multi-file mechanical passes, worth explicitly asking the agent to confirm which files within the stated scope were and weren't touched, not just report on the files it did change. |
| 2026-08-30 | `theme.md` — what `TBD` actually meant | Reviewing `theme.md` against the newer `DESIGN.md` synthesis found spacing scale, elevation scale, and breakpoints all marked `TBD` despite `DESIGN.md` stating confirmed values for all three. Clarified: `TBD` was conflating two different things — *value undecided* vs. *value decided, rollout to legacy code incomplete*. All three are now the confirmed target scale for new work; existing files not yet conforming (`_card.scss`'s raw spacing values, `_onboarding-card.scss`'s unreconciled shadow pair, `Input.tsx`'s stray `sm:` breakpoint) are legacy debt, not evidence the scale itself is unsettled. `theme.md` updated to reflect this distinction directly rather than leaving it ambiguous. |
| 2026-08-30 | `Input.tsx` stray breakpoint | Found during the 2026-08-29 typeset pass (via `DESIGN.md`), not previously logged here: `Input.tsx` uses a Tailwind `sm:` (640px), which matches neither confirmed breakpoint (`--breakpoint-tablet: 860px` / `--breakpoint-mobile: 480px`). Off-system, not yet fixed. Queued. |
| 2026-08-30 | Marketing route palette | `DESIGN.md` describes the marketing route's moss/terracotta/sage palette (`app/(marketing)/_components/tokens.ts`) as "a legacy fork being folded in" — present tense, active-sounding. Confirmed this is **not** current active work: the marketing route hasn't been touched, doesn't follow current style guidance, and that's deliberately fine for now, consistent with every earlier decision in this project to keep marketing out of scope. `DESIGN.md`'s phrasing reads more aspirational than accurate as of this date — worth keeping in mind next time it's regenerated, but not something to act on now. |
