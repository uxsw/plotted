# components/ui — Index

Thin index only — name, type, location, one-line status, link. Full detail lives in each item's own co-located `.design.md` file (see `styles/design.md`'s "Where new work goes"). Update this table whenever something is added, renamed, or retired; don't let detail creep back in here.

| Name | Type | Location | Status | Doc |
|---|---|---|---|---|
| `.o-chip` | object | `styles/objects/_chip.scss` | correct, in use — reference pattern | *not yet split out — worth doing next since it's the reference pattern others should match* |
| `.o-badge` | object | `styles/objects/badge/_badge.scss` | built, colours provisional, call sites migrated | `styles/objects/badge.design.md` |
| `.o-roundel` | object | `styles/objects/roundel/_roundel.scss` | built, colours provisional, call sites migrated | `styles/objects/roundel.design.md` |
| `Card` | component (SCSS ↔ CSS Modules, dual-live) | `styles/objects/_card.scss` / `components/ui/Card.module.css` | drifted fork, reconciliation pending | *not yet documented — next calibration case per `styles/design.md`* |
| `Button` | component | `components/ui/Button.module.css` | migrated, partially reused by other objects (badge migration references `o-button--text`) | *not yet documented* |
