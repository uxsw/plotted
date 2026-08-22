# Styles Library — Architecture

Living document. Update as each object/component migrates — don't let this become a final write-up once the migration is "done."

**Status:** draft skeleton, 2026-08-22
**Scope:** `styles/`, `app/globals.css`, `components/ui/*.module.css`

## Layer map

What loads, in what order, from where. Keep this table current — it's the fastest thing for an agent to grep before touching anything.

| Order | Source | Role | Status |
|---|---|---|---|
| 1 | `app/globals.css` | Token source — single palette + scales | ⚠️ pending unification, see Token source below |
| 2 | `styles/main.scss` | ITCSS layers: abstracts → base → layout → objects → components → pages | active |
| 3 | `components/ui/*.module.css` | CSS Modules — target architecture for objects/components | 2 of N migrated (button, card) |

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
- **Layout configuration** lives as a modifier on the object itself — e.g. `o-row--space-between`, `o-row--expand`, `o-row--align-top` — not as a bare, un-namespaced utility class.
- **Neutral color family:** `n-*` for grey, distinct from hue-prefixed accents. `g-*` is green only.
- **Font weight** is its own axis (`--font-weight-regular` / `--font-weight-bold`), independent of the type scale. `kirk` remains as a standalone bold utility class by deliberate, long-standing choice — not part of the size scale, don't try to fold it in.

## Block vs. modifier vs. new object — the rule

A modifier changes how *one instance* of a thing looks or behaves. A new object is warranted when something represents a genuinely different structural composition — especially "many instances arranged together" (e.g. a grid of cards is its own object, not a card modifier).

Agents: apply this test before inventing a new block. If it's ambiguous, that's a gap — stop and flag it, don't decide unilaterally.

## Where new work goes

*TBD — file location conventions for new objects/components once migration resumes.*

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
