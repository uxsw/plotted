---
target: plant-scheme hub (/plant-scheme) — re-run
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-19T20-23-52Z
slug: app-app-plant-scheme-page-tsx
---
Method: dual-agent (A: a23f220fdb66a02db · B: af2c3a19352af1a7b), with a third, independent verification pass by the parent session on two claims where A and B disagreed with the fix record.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live "N/5" and "N of 34" counters, instant check-marks. No busy/pending state between clicking "Start the conversation" and navigation firing. |
| 2 | Match System / Real World | 4 | Latin binomials correctly italicized and subordinate to common names; gardener-register copy throughout. |
| 3 | User Control and Freedom | 3 | Every pick has a labelled Remove; Escape/backdrop/X on the welcome dialog confirmed live to close without side effects, distinct from the "finish" path. No undo after Start navigates away. |
| 4 | Consistency and Standards | 4 | Reuses `o-card`, `o-button` variants, and the established mobile-scroller idiom consistently. |
| 5 | Error Prevention | 3 | Cap disables further picks proactively; typing a name already in the garden resolves to the real record instead of duplicating. The `plansError` banner reads as prose, not an actionable Retry button. |
| 6 | Recognition Rather Than Recall | 4 | Tray keeps photo thumbnails of every pick visible while browsing further down the gallery. |
| 7 | Flexibility and Efficiency | 2 | Search-to-filter is the only accelerator; reasonable for a page a gardener visits rarely. |
| 8 | Aesthetic and Minimalist Design | 4 | Single column, marigold spent only on the one primary action, restrained per the One Accent Rule. |
| 9 | Error Recovery | 3 | `plants: null` (read failure) vs `plants: []` (empty) distinguished throughout; typing still works even when the garden fails to load. Same missing Retry affordance as #5. |
| 10 | Help and Documentation | 3 | The welcome dialog serves as contextual, just-in-time help — correct scope; execution is solid even with placeholder content. |
| **Total** | | **33/40** | **Good** |

**Trend: 30 → 33** (out of 40, both runs scored all ten heuristics). P0 count: 2 → 0. P1 count: 4 → 0.

## Design Specificity Verdict

**LLM assessment:** Still genuinely authored for gardening, not a generic picker reskinned — the licensed seasonal accent, the shared photo-card grammar with `/plants`, italic Latin shown only when it adds information, and warm specific copy ("That's five, plenty to start from") all hold up on a fresh read. The one place intent and shipped state still diverge: the welcome dialog — the single highest-stakes first impression — ships with 100% placeholder iconography rather than real photography, explicitly flagged as such in the code's own comments.

**Deterministic scan:** `detect.mjs` returned **clean, 0 findings** again. The live-DOM overlay found 4 items this run (down from a mix including real contrast/overflow hits last time): `line-length` on the "Plan a new scheme" intro paragraph (~107 chars/line), `cramped-padding` on the empty tray row (4px vertical padding for 13.7px text), plus the same two **false positives** as last run — `overused-font` (Inter) and `cream-palette` — both deliberate, DESIGN.md-documented brand choices, not drift.

## Correcting the record: two claims that did not hold up

Both assessments independently reported ~7-7.5px horizontal page overflow persisting at 960px/1440px, and Assessment B additionally reported 12 of 30 gallery captions still overflowing on mobile. Since these directly contradicted the fix record, I independently re-verified both myself, from a **brand-new browser tab** with no prior history, on **repeated fresh page loads**:

- **960px, fully fresh tab:** `documentElement.scrollWidth` = `clientWidth` = 960 exactly. `body.overflowX` = `hidden`. Attempted `window.scrollTo(50, 0)` and confirmed `scrollX` stayed at 0 — the page is **not capable of horizontal scroll at all**, not just "no scrollbar shown."
- **375px, fresh load, before any interaction:** 0 of 30 `.c-garden-gallery__latin` captions overflow their box (re-run twice, identical result both times).

Both fixes hold. The likely explanation: in the course of testing, both A and B also exercised the tray's "add a long typed name" flow, which — as B correctly diagnosed independently — surfaces a real but different, harmless issue (see below) whose artifacts appear to have carried into subsequent measurements taken in the same tab without an intervening fresh reload. I'm confident enough in the repeated, isolated verification above to mark both P1s from the original critique as **closed**, not regressed.

## Overall Impression

The fix pass did what it set out to do: every P0 and P1 from the original critique is now closed and independently re-verified, and the heuristic score moved from 30 to 33 out of 40. What's left is smaller and lower-stakes — one real newly-surfaced P2 (a layout collision, not a broken interaction), a handful of P3 polish items, and one genuinely new-but-harmless CSS quirk B's root-cause instinct correctly diagnosed even though its severity read was off. Nothing found this round blocks the core "glance at recent plans → pick plants → start" task.

## What's Working

- **The welcome dialog's finish handoff, confirmed live end-to-end again**: clicking "Choose your plants" closes the dialog, smooth-scrolls to, and focuses the Add-a-plant field with a visible ring — exactly the documented behaviour, still working after the fix pass.
- **The tray's empty → filled → capped micro-journey**: the dashed "slot" metaphor, scale-in animation, and warm at-cap copy turn a hard constraint into a felt interaction rather than a wall.
- **Graceful degradation on data failure**: a failed garden read still lets a gardener type a plant name and proceed — the null-vs-empty distinction is carried faithfully end to end rather than collapsing into one generic error state.

## Priority Issues

**[P2] The fixed "Feedback" button overlaps gallery tiles at some mobile scroll positions.** Verified live by screenshot at 375px: scrolled to a position where the button's fixed `bottom-6 right-6` position lands directly over a plant tile's photo and selection mark in the bottom-right corner of the viewport — exactly the corner a one-handed mobile user (Casey) is most likely to tap while scrolling. Not a page-overflow issue, a plain z-index/position collision between a global fixed element and a page-specific long scrolling grid. *Fix:* reserve bottom padding on the gallery on mobile, or collapse the Feedback button to icon-only while the gallery is in view. → `/impeccable adapt`

**[P3] Welcome dialog's initial keyboard focus lands on a decorative step-dot, not content or a way forward.** `Modal.tsx`'s `getFocusable(panel)[0]` picks up the first carousel dot ("Go to step 1…") before the Next button in DOM order — a keyboard/screen-reader user's first read on opening is an inert step-indicator. *Fix:* give the carousel's heading or its Next button priority for initial focus, or reorder the dots after the primary actions in the DOM (visually unchanged, tab-order changed). → `/impeccable audit`

**[P3] A tray pick's visually-hidden accessible-name suffix renders with a wildly off-screen static position.** New finding, correctly root-caused by Assessment B: `.c-scheme-start__pick-name .u-visually-hidden` (the sr-only " (considering)"/" (in your garden)" suffix) is `position: absolute` with no positioned ancestor, so its CSS-spec "static position" fallback is computed from where the *untruncated* long name would have flowed — I measured it landing at `x≈460` on a 375px viewport. Verified harmless in practice: `overflow-x: hidden` on `body` (the item-5 fix) already absorbs it completely — `window.innerWidth`, `scrollWidth`, and scroll capability all stay exactly correct, confirmed by direct measurement before and after adding a long name. Worth a cheap correctness fix regardless, since "an element is a few hundred px off in space and we happen to have a global safety net" isn't a reason to leave it wrong. *Fix:* add `position: relative` to `.c-scheme-start__pick` (or `.c-scheme-start__pick-name`) so the hidden span's containing block is local. → `/impeccable harden`

**[P3] Welcome dialog ships with placeholder-only content.** Unchanged from the original critique — all three onboarding slides still show flat-wash icons rather than real photography, per `schemeOnboardingSteps.ts`'s own placeholder comment. Since this fires once per gardener, most real users will never see a "finished" first impression. Flagging again as a shipping-readiness question, not a new issue.

No P0 or P1 found this round.

## Persona Red Flags

**Sam (screen reader + keyboard-only):** Positives confirmed live this round: Tab/Shift+Tab correctly stay trapped inside the welcome dialog across 8+ presses and never escape into page nav (both A and B independently confirmed this holds); disabled gallery tiles at the 5-cap are correctly removed from tab order rather than focusable-but-inert; every Remove button carries a specific `aria-label` naming the plant. Remaining gap: initial focus lands on a decorative dot (P3 above).

**Riley (stress tester):** Confirmed the long-cultivar-name pill fix holds at both 800px+ and 375px — no overflow, Remove stays clickable, verified via direct rect measurement, not just visually. Surfaced the visually-hidden-span quirk (P3) through exactly the kind of deliberate long-input testing this persona is defined by.

**Casey (distracted mobile user):** The Recent Plans horizontal scroller still snaps cleanly for one-handed use. The Feedback-button overlap (P2) is a real, newly-verified risk for her specifically — a mis-tap near the bottom-right corner while scrolling one-handed through a long gallery.

## Minor Observations

- `line-length` (~107 chars/line on the "Plan a new scheme" intro paragraph) and `cramped-padding` (4px vertical padding on the empty tray row) are generic mechanical findings from the live detector — plausible but not independently confirmed as real problems either way; worth a glance, not urgent.
- The "Mongolian sunflower" demo tile's italic caption (`maximilianii 'sunflower'`, no leading genus) reads as invalid botanical Latin — likely a seeded-data issue rather than a display-logic bug, though the display logic doesn't guard against a missing genus either.
- Button contrast fix confirmed holding under fresh measurement: 5.13:1 on both the "Start the conversation"/"Start with N plants" button and the site-wide Feedback button.

## Questions to Consider

- The Feedback button overlap (P2) exists on every scrollable page in the app that this button appears on, not just this one — is a page-scoped fix here the right call, or does this want a more general fix to the Feedback button itself?
- The step-dot-gets-initial-focus issue (P3) is a one-line DOM-order fix — worth bundling with the placeholder-photography follow-up since both touch the same first-impression surface?
- Given both remaining P3s here are cheap, is it worth just doing all three now rather than scheduling a further round?
