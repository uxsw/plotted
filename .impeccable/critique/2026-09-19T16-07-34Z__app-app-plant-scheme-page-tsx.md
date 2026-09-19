---
target: plant-scheme hub (/plant-scheme)
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 4
timestamp: 2026-09-19T16-07-34Z
slug: app-app-plant-scheme-page-tsx
---
Method: dual-agent (A: a9cf59f546dd1b53f · B: ac1d1c67d23f2cb33)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live tray count and filtered "N of 34" count both work, but the filtered count has no `aria-live` — a screen-reader user narrowing a search gets no announcement. |
| 2 | Match System / Real World | 4 | Gardener-specific voice throughout; common-name-leads-Latin hierarchy matches how a gardener actually thinks about their own plants. |
| 3 | User Control and Freedom | 2 | A long typed plant name overflows its tray pill and physically pushes the Remove button outside the clipped card — confirmed live, no way back except reload. |
| 4 | Consistency and Standards | 3 | Mostly disciplined use of the system's own rules (Radio-card selection, focus-colour token, button variants); breaks the system's own Latin-in-Italic Rule on the fallback title. |
| 5 | Error Prevention | 3 | 5-plant cap handled gracefully; no guard against malformed plant data rendering as broken-looking Latin in the one surface meant to be rigorous about it. |
| 6 | Recognition Rather Than Recall | 4 | Photo-led tiles, persistent tray, marks drawn in both selected/unselected states. |
| 7 | Flexibility and Efficiency | 2 | Search is the only efficiency device; no bulk actions, no shortcuts beyond Tab — reasonable for this Operate surface, not exceptional. |
| 8 | Aesthetic and Minimalist Design | 4 | Calm, restrained; the gallery breakout is the one deliberate flourish and it earns its place. |
| 9 | Error Recovery | 2 | No visible acknowledgment at all when something's silently wrong (a broken photo tile, the clipped remove button) — the user just can't act, with no explanation. |
| 10 | Help and Documentation | 3 | The one-time welcome carousel is an appropriately light substitute for standing docs, consistent with the product's "quietly clever" principle. |
| **Total** | | **30/40** | **Good** |

## Design Specificity Verdict

**LLM assessment:** This is genuinely authored for gardening, not a generic "pick items from a grid" UI — but unevenly so. The copy is convincingly gardener-voiced ("Choose up to five plants to build around," "That's five, plenty to start from"), the photo-card grammar deliberately echoes the `/plants` catalogue so picking feels like browsing your own collection rather than filling out a form, and the season-washed tray is a specific, considered brand touch. Where it slips toward generic SaaS: the welcome-dialog carousel — the single highest-leverage first impression in the whole flow — currently shows flat placeholder-icon squares instead of real garden photography, so exactly the moment meant to sell "a living catalogue" instead reads as an unfinished design-system demo.

**Deterministic scan:** `node detect.mjs --json "app/(app)/plant-scheme"` returned **clean, 0 findings** across all 31 scannable files (verified not a scan failure — the walker correctly discovers files under the parenthesized `(app)` segment, and a wider `app/(app)` sweep also came back empty). This directory has no static-analysis-detectable anti-patterns in its markup. The real defects on this page are runtime/computed properties — resolved contrast, rendered text width against a fixed container, a grid element's actual width vs. viewport — which is exactly what a regex-based static pass can't see and exactly what the live-DOM overlay below caught instead.

**Live-DOM overlay** (injection succeeded): the `[impeccable] 13 anti-patterns found` console report flagged two categories worth acting on and two that are **false positives for this brand**:
- **Real:** 3× low-contrast button text (3.2:1, needs 4.5:1) and up to 10 instances of `.c-garden-gallery__latin` text overflowing its box (16–101px) — both independently confirmed by hand-measurement below.
- **False positives:** `overused-font` (Inter at 88% of text) and `cream-palette` (the page background) are both *deliberate, documented* brand decisions — DESIGN.md specifies Inter as the one body/UI face and the warm paper ground (`#FAF6EC`) as "the page ground everywhere." A generic heuristic detector can't know a cream palette and a single body font are the brief, not an oversight; ignore both.

## Overall Impression

The redesign this session landed the thing it set out to fix — bigger, calmer plant photography, a genuinely elegant width breakout, a refined selection mark — and both assessments independently rate the overall composition well (30/40, "Good," and a clean static scan). But the dual-track process caught two things a single pass would have missed entirely: a real, reproducible ~7px horizontal page overflow on the new breakout grid at desktop widths, and a genuine mobile text-overflow bug in the new Latin caption — both introduced by this session's own work, both invisible unless you actually measure `scrollWidth` and rendered text width rather than just eyeballing screenshots. The single biggest opportunity, though, predates this session and is more consequential than either: the welcome dialog — the one moment every brand-new gardener meets first — has no keyboard focus trap and its final CTA ("Create planting scheme →") does nothing but close itself.

## What's Working

- **The 5-plant cap UX** (`StartPanel.tsx` `full` state / `GardenGallery.tsx`): disabling the field with "That's five, plenty to start from. Remove one to swap it for another," and fading unselected tiles to 0.5 opacity, is warm and reversible at once — exactly the calm-by-construction tone the product asks for.
- **The gallery breakout device** (`.c-garden-gallery__grid`): letting only the grid escape the 800px measure while the search field and heading stay put reads as a genuinely elegant, restrained "the page opens up for the real task" moment, not a jarring width shift. (The mechanism has a real bug — see Priority Issues — but the *design intent* lands.)
- **Search-and-type unification** (`addFromField` / `exactGardenMatch`): one field doing double duty — filtering the grid and free-text "add a plant you're considering," with automatic resolution to a garden record on an exact match — removes a decision a gardener shouldn't have to make.

## Priority Issues

**[P0] Welcome dialog has no keyboard focus trap.**
*Why it matters:* `components/ui/Modal.tsx` sets `aria-modal="true"` and moves initial focus into the panel, but never contains Tab/Shift+Tab. Live-tested with the dialog open (`?welcome=1`): two Tab presses move focus straight through the wordmark link and into the header's user-avatar button — fully live controls behind a backdrop a keyboard or screen-reader user has no visual cue exist. This lives in the shared `Modal.tsx`, so it affects every modal in the app, not just this one.
*Fix:* Add a standard Tab-cycle trap in `Modal.tsx` (cycle between first/last focusable descendant of `panelRef`) — one fix, every modal consumer inherits it.
*Suggested command:* `/impeccable audit`

**[P0] Onboarding's final CTA does nothing it claims to.**
*Why it matters:* `OnboardingCarousel.tsx`'s last step reads "Create planting scheme →," but the handler just closes the dialog — 0/5 plants chosen, nothing pre-filled. For the exact audience this flow targets (someone who just read "choose a few plants… then Plotted suggests plants to go with them"), the CTA over-promises and drops them back to square one with no explanation.
*Fix:* Either relabel honestly ("Got it" / "Start browsing") or actually carry the moment forward (focus the search field, or pre-open the tray).
*Suggested command:* `/impeccable onboard`

**[P1] Primary CTA and site-wide Feedback button fail AA contrast (3.16:1, needs 4.5:1).**
*Why it matters:* Confirmed independently by both the live overlay (3.2:1) and hand-measured computed styles (3.16:1, `#fff6f4` text on `#e26650` marigold): the "Start with N plants" button — the single primary action of this entire page — and the site-wide Feedback button both fail AA. This is a systemic button-token issue (marigold fill + off-white text), not scoped to this page, but it's the page's own primary CTA that surfaces it most.
*Fix:* Darken the marigold fill or the text token for this button variant until it clears 4.5:1; this likely wants a system-wide token fix, not a per-page patch.
*Suggested command:* `/impeccable audit`

**[P1] Garden gallery's Latin caption overflows its box on mobile — up to 10 of 30 tiles, by as much as 101px.**
*Why it matters:* Introduced this session. `.c-garden-gallery__latin` has `overflow:hidden` + `text-overflow:ellipsis` + `white-space:nowrap` set, but as a flex child of `.o-card__body` (`display:flex; flex-direction:column`) it never got `min-inline-size:0` — a flex item's default `min-width:auto` lets it overflow its container rather than actually truncating, silently defeating the ellipsis rule that was already written. Confirmed live: real cultivar names like `"Calamagrostis calamagrostis 'Karl Foerster'"` blow 110px past their 131.5px box on a 375px viewport.
*Fix:* Add `min-inline-size: 0` to `.c-garden-gallery__latin` (and check `.c-garden-gallery__name` for the same gap).
*Suggested command:* `/impeccable adapt`

**[P1] The gallery grid's breakout causes a real ~7–15px horizontal page overflow at desktop widths.**
*Why it matters:* Introduced this session, and directly contradicts what DESIGN.md now documents about this exact device ("no horizontal scroll at any width"). Confirmed at both 960px (`scrollWidth 952` vs `clientWidth 945`) and 1440px (`1432` vs `1425`), isolated specifically to `.c-garden-gallery__grid` — mobile (375px) is clean. Classic cause: `calc(50% - 50vw)` measures `50vw` against the full viewport including the scrollbar's own width, while the element's own `50%` is based on the (scrollbar-excluded) content area — the mismatch is the scrollbar's width.
*Fix:* The usual robust fix is `overflow-x: clip` (or `hidden`) on a page-level ancestor so the small mismatch can't create its own scrollbar, or switch the breakout to a `scrollbar-gutter: stable`-aware calculation.
*Suggested command:* `/impeccable layout`

**[P1] A long typed plant name overflows its tray pill and hides the Remove button entirely.**
*Why it matters:* Pre-existing (not from this session's redesign), but a genuine dead end. `.c-scheme-start` clips overflow; a real cultivar-length typed name produces a 471px pill inside a 343px card, pushing the Remove control ~150px outside the visible, clipped area — present in the DOM, unreachable by mouse or touch.
*Fix:* `text-overflow: ellipsis` / a `max-inline-size` cap on `.c-scheme-start__pick-name` so the Remove button always stays inside the card.
*Suggested command:* `/impeccable harden`

## Persona Red Flags

**Sam (screen reader + keyboard-only):**
- The Modal focus-trap gap (P0) is the headline issue — Tab exits the "modal" into live background nav within two presses.
- Focus lands on `<body>` (not a heading or landmark) after the dialog closes, so a screen-reader user loses their place entirely.
- The live "N of 34" filter count has no `aria-live` — narrowing a search from 34 to 1 plant is silent unless they manually re-navigate to that span.

**Riley (stress tester / edge cases):**
- The tray-overflow bug (P1) is a genuine functional break, not cosmetic — a plant the gardener can no longer remove or read.
- The gallery Latin-caption overflow (P1) reproduces on 1 in 3 real garden entries at mobile width, not an edge case at all.
- A garden entry with a malformed genus ("allium 'Sphaerocephalon'," lowercase, no species) renders a nonsensical title *and* what's clearly a broken placeholder photo (a texture mosaic, not a plant), with zero error handling — the tile just displays it as if valid.

**Jordan (confused first-timer):**
- Meets the "Create planting scheme" dead-end (P0) at the exact moment they're most trusting of the product's guidance.
- The welcome dialog's all-placeholder photography may quietly lower confidence before they've done anything at all.
- If their garden is empty, the "add one" link (`GardenGallery.tsx`) has no underline or visual distinction from surrounding text — unlike its sibling "no search matches" state a few lines away, which does — easy to miss the one path forward entirely.

## Minor Observations

- The site-wide "Send feedback" floating button overlaps the "In your garden" tile grid on mobile at various scroll positions, covering plant photos and selection marks in exactly the surface where tap precision matters most.
- Selected + keyboard-focused gallery tiles render two concentric cyan rings (the selection box-shadow and the focus-visible outline both resolve to the same focus-colour token) — distinguishable, but only just, since the outline sits a mere 2px further out.
- All three onboarding steps ship with no `photoSrc` — the code comments make clear this is known and deliberately deferred, not an oversight, but it's worth a shipping-readiness call rather than sitting indefinitely as a TODO.
- Next.js flagged an LCP `<Image>` missing `loading="eager"` on the recent-plans photo during the audit — unrelated to this critique's scope but free to fix while in the area.

## Questions to Consider

- What if "Create planting scheme" actually did something — pre-filled the tray, or focused the search field — instead of producing the identical outcome as clicking the X?
- What if "In your garden" defaulted to most-recently-added or most-recently-viewed first, so the ≤4-visible-choice discipline the rest of the app holds to could apply to the *first screenful* here too, with the full 34+ still one scroll away?
- What if a plant with no resolvable common name and a broken genus/species fell back to something honest like "Unnamed plant" instead of surfacing raw, broken-looking Latin — trading momentary completeness for the catalogue's own credibility?
