# Naming Convention: Objects, Components & CSS

Status: **Active** — applies to all new work. Existing components migrate incrementally, element by element, as part of ongoing UI refinement (not a one-off sweep).

## Purpose

Move away from ad-hoc Tailwind utility strings toward a component-driven, token-based CSS architecture. This doc defines how we name and structure things so that:

- Components are easy to find by name (grep-able), whether starting from UI, compiled code, or design.
- Styling responsibility is clear: what's a reusable primitive vs. a feature-specific component.
- New features can follow the convention from the start, avoiding retrofit work later.

This doc governs **naming and structure**. It does not mandate a visual redesign — migration happens gradually as individual components are refined.

---

## The two prefixes

### `o-*` — Objects

Global, reusable, presentational primitives with no feature-specific meaning. An `o-*` object doesn't know or care what feature uses it.

Examples: `o-button`, `o-card`, `o-input`, `o-list-item`, `o-badge`, `o-modal`, `o-tag`

### `c-*` — Components

Feature-specific components tied to a concept in the product. A `c-*` component composes `o-*` objects internally and adds its own content, layout, and behaviour.

Examples: `c-plant-item`, `c-weather-widget`, `c-schemes-cta`, `c-dashboard-card`, `c-bird-spotter`

**Rule of thumb:** if you'd need to know what the app does to understand why the class exists, it's `c-*`. If it would make sense in a completely different app, it's `o-*`.

---

## Composition: `c-*` components render `o-*` objects

`c-*` components should not reimplement shell styling that an `o-*` object already provides. They compose objects internally rather than duplicating structure.

Example: `WeatherWidget` (`c-weather-widget`) renders a `<Card>` (`o-card`) internally, with its own content and elements inside it:

```tsx
<Card variant="highlight" className={styles['c-weather-widget']}>
  <CardHeader>
    <span className={styles['c-weather-widget__location']}>{location}</span>
  </CardHeader>
  <CardBody>
    <span className={styles['c-weather-widget__temp']}>{temp}°</span>
  </CardBody>
</Card>
```

### Starting point: most things are `o-card` variants

Rather than each feature component (weather widget, plant item, dashboard cards, schemes CTA, bird spotter) building its own card shell, they should start by composing a shared `<Card>` primitive (`o-card`) with style variants (e.g. `default`, `interactive`, `highlight`).

This is a deliberate starting assumption, not a permanent rule. Some components will naturally diverge over time (e.g. needing full-bleed media, a non-standard slot structure, or unique interactive behaviour). When a component resists fitting the `<Card>` API — you find yourself bolting on a one-off modifier just for it, or fighting its slot structure — that's the signal to give it its own shell, not a failure of the taxonomy. Don't pre-classify components as "not really a card" in advance; let actual usage surface it.

Tag choice (`<div>`, `<a>`, `<li>`, etc.) is a semantics/accessibility decision, independent of styling. An `o-card` class applies the same regardless of the underlying element.

---

## BEM structure

Within a block (`o-*` or `c-*`), use standard BEM element/modifier syntax:

```
.c-plant-item                  /* block */
.c-plant-item__header          /* element */
.c-plant-item__actions         /* element */
.c-plant-item--flagged         /* modifier */
```

### When does something get its own block vs. become an element of its parent?

Only give something its own block name if it's meaningful as a standalone UI concept independent of its current parent — i.e. it could reasonably be reused elsewhere or identified on its own in the DOM.

If a component file exists purely as an implementation detail of a parent (e.g. `PlantItemActions.tsx` is only ever rendered inside `PlantItem`), it stays an element of the parent's block (`c-plant-item__actions`), even though it lives in its own file/component.

This keeps the taxonomy from fragmenting as React encourages splitting UI into many small files.

---

## CSS Modules for scoping

Each component owns a co-located `.module.css` file. BEM naming is preserved as the authored class name; CSS Modules handles uniqueness/scoping at build time, removing the historical reason BEM class names needed to be globally unique by convention.

```
components/
  PlantItem/
    PlantItem.tsx
    PlantItem.module.css
```

```css
/* PlantItem.module.css */
.c-plant-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface);
  border-radius: var(--radius-md);
}

.c-plant-item__header {
  display: flex;
  justify-content: space-between;
}

.c-plant-item--flagged {
  border-left: 3px solid var(--color-warning);
}
```

```tsx
import styles from './PlantItem.module.css';
import { clsx } from 'clsx';

<div className={clsx(styles['c-plant-item'], isFlagged && styles['c-plant-item--flagged'])}>
  <div className={styles['c-plant-item__header']}>...</div>
</div>
```

Reference existing design tokens (`var(--space-md)`, `var(--color-surface)`, etc.) inside module CSS — no separate token translation step needed. Components reference semantic tokens only, never primitives directly (see existing token architecture).

---

## Current inventory

### `o-*` objects (starting set)

| Class | Notes |
|---|---|
| `o-button` | |
| `o-card` | Base shell; variants: `default`, `interactive`, `highlight` (expand as needed) |
| `o-input` | |
| `o-list-item` | |
| `o-badge` | |
| `o-modal` | |
| `o-tag` | |

### `c-*` components (starting set)

| Class | Notes |
|---|---|
| `c-plant-item` | |
| `c-weather-widget` | Composes `o-card` |
| `c-schemes-cta` | Composes `o-card` |
| `c-dashboard-card` | Composes `o-card` |
| `c-bird-spotter` | Composes `o-card` (may diverge — dedicated page context differs from dashboard context) |

*Both tables are starting points, not exhaustive. Add to them as components are migrated — this doc should stay a living reference rather than a one-time snapshot.*

---

## What this doc does not cover yet

- Full `o-*`/`c-*` inventory across the whole app (populated incrementally as components are touched)
- Migration tracking / progress log
- `CLAUDE.md` integration (planned as a follow-up once conventions have settled through real use)

## Open questions to revisit as we go

- Where the line sits for `o-card` variants vs. components that need their own shell (expect real examples to surface this faster than we can predict it)
- Whether `c-*` components ever need their own modifier namespace beyond BEM (e.g. state modifiers shared across multiple `c-*` blocks)

---

## Pilot sweep — `o-button` + `o-card` (July 2026)

### Files created

- `components/ui/Button.module.css` — `o-button` base + all variants below
- `components/ui/Card.module.css` — `o-card` base + elements + variants below

### `o-button` — elements and modifiers found in practice

| Class | Notes |
|---|---|
| `o-button--primary` | Moss fill; default variant |
| `o-button--secondary` | Outlined, moss; transparent background |
| `o-button--ghost` | No background; ink-soft text |
| `o-button--danger` | Clay fill; focus ring uses clay |
| `o-button--ghost-danger` | Ghost appearance, clay hover/focus — for destructive icon actions |
| `o-button--pill` | `border-radius: 9999px`; used by FeedbackButton |
| `o-button--icon` | Square 2.25rem, no text padding; for icon-only buttons |

### `o-card` — elements and modifiers found in practice

| Class | Notes |
|---|---|
| `o-card--interactive` | Adds hover shadow + active press scale; applied when `href` or `onClick` present |
| `o-card--flat` | Removes border and background |
| `o-card__image` | `aspect-ratio: 4/3` image well |
| `o-card__body` | Flex column, `1rem` padding, `flex: 1` |
| `o-card__footer` | Bottom slot with top border |

### Consumers migrated

**`o-button`:**
- `components/ui/Button.tsx` — primitive updated to use CSS module
- `app/(app)/plants/page.tsx` — `<Link>` styled with `o-button--primary`
- `app/(app)/schemes/page.tsx` — `<Link>` styled with `o-button--danger`
- `components/DeletePlantButton.tsx` — `o-button--ghost-danger` + `o-button--icon`
- `components/feedback/FeedbackButton.tsx` — `o-button--primary` + `o-button--pill`; positional/shadow styles (`fixed bottom-6 right-6 z-50 shadow-lg`) left as Tailwind pending `c-feedback-button` module

**`o-card`:**
- `components/ui/Card.tsx` — primitive updated to use CSS module
- `components/ui/PlaceholderPlantCard.tsx` — skeleton card shell migrated; skeleton bar content left as Tailwind

### Unmigrated usages (for later passes)

**`o-button`:**
- `app/not-found.tsx` — `rounded-full` home link; uses `bg-ink` (not a standard variant yet)
- `components/LogoutButton.tsx` — uses `text-gray-600 hover:text-gray-900` (Tailwind defaults); design-system outlier, should use `text-ink-soft hover:text-ink`

**`o-card` — notice/panel variants not yet migrated (may warrant their own modifier or separate object):**
- `components/ui/PwaInstallTriggerCard.tsx` — moss-tint background with moss border
- `components/ui/AiNoticePanel.tsx` — gold-tint background with gold border
- `components/ui/FeatureNoticePanel.tsx` — sand background with sand-line border

### Contradictions and gaps flagged

1. **Missing spacing tokens.** The guide examples reference `var(--space-md)` and `var(--color-surface)` — neither exists. Actual: no `--space-*` tokens (CSS modules use raw rem values matching Tailwind's default scale); surface token is `--color-paper`. Recommend adding `--space-*` tokens to `@theme {}` or updating guide examples to reflect what's real.

2. **`o-card` variant inventory mismatch.** The guide lists variants `default`, `interactive`, `highlight`. In practice: `default` (implicit, no modifier), `flat`, and `interactive` exist. `highlight` does not. Added `flat` to the table above; `highlight` remains aspirational until a real use case surfaces it.

3. **`o-button` `danger` variant missing from guide inventory.** Added to table above.

4. **`o-button--pill` padding.** `FeedbackButton` previously used `py-2.5` (10px); `o-button` base uses `py-2` (8px). The canonical button size wins; the 2px difference is intentional consolidation, not a regression.
