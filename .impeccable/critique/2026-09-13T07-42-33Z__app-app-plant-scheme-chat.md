---
target: plant-scheme/chat
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-09-13T07-42-33Z
slug: app-app-plant-scheme-chat
---
Method: dual-agent (A: general-purpose design-review subagent · B: general-purpose detector/browser-evidence subagent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Typing indicator + optimistic bubble are good, but there's no sense of "how much scheme-building is left" — an open-ended tally, not a progress signal. |
| 2 | Match Between System / Real World | 4 | "Back of border / Mid border / Ground cover", "letterhead", UK horticultural language throughout. |
| 3 | User Control and Freedom | 2 | Choosing a direction permanently closes `.c-chat__option` for the whole group (confirmed live) — no undo short of free-typing and hoping the model re-reads it as a change of direction. |
| 4 | Consistency and Standards | 4 | Rigorous, *verified live*, adherence to DESIGN.md's own rules (aria-pressed group not radiogroup, Focus Colour Rule, Chosen-Is-Filled). |
| 5 | Error Prevention | 2 | The "wants something different" trigger that surfaces the direction panel is a crude text heuristic (per `ChatPane.tsx`'s own comments) with no visible fallback if it misfires. |
| 6 | Recognition Rather Than Recall | 3 | Full scrollback stays visible (good), but the chat suggestion card shows a narrower slice of plant info than the scheme-list card for the same plant — the user has to hold the mapping in their head. |
| 7 | Flexibility and Efficiency of Use | 2 | No shortcuts, no batch-add across suggestion cards, no way to jump back to an earlier direction. One interaction speed for everyone. |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained: one accent per path, icon+label badges, no decorative chrome. |
| 9 | Error Recovery | 1 | Confirmed by source read across `ChatPane.tsx`/`QuestionFlow.tsx`/`ChatLog.tsx`: no failed-send state, no stall/timeout messaging, no retry affordance anywhere — for a surface about to run against a real LLM. |
| 10 | Help and Documentation | 2 | One line of onboarding (`INTRO_TEXT`) that scrolls out of reach permanently once the conversation grows. |

**Total: 27/40 — Acceptable.** Solid, specific execution with a real gap around failure handling and a couple of first-run overload/control issues.

## Design Specificity Verdict

**LLM assessment:** This surface would be hard to lift into an unrelated product unchanged. `BorderElevation.tsx` draws literal tiered silhouettes generated from the actual scheme's plant tiers (not decoration — mechanism), `FloweringYear.tsx` is keyed to real calendar months against `--sem-flowering-*` hues, and the composer's "✎ Your reply" / "🌱 Plotted" bracketed correspondence framing is a considered metaphor, not a default chat skin. The one generic patch is the mocked assistant copy itself ("Here's a starting scheme based on your answers...") — serviceable boilerplate that any assistant-driven form-filler could ship; the chrome around it is what actually carries Plotted's voice.

**Deterministic scan:** `detect.mjs --json` against all 17 files in `_components/` plus the route/layout files returned **exit code 0, zero findings** from the static CLI pass. The live in-browser detector overlay told a different story: **24 anti-pattern instances**, all one root cause — rule `undersized-ui-text`, **10.4px** trait-tag text (below the 11px accessible-text floor), repeating across every plant card's badge row ("Wildlife friendly", "Scented", "Drought tolerant", "Pollinators", "Cut flowers", "Low maintenance", "Edible"). I traced this to source: **not a false positive** — `PlantCard.tsx:86` renders `<span className="o-badge is-sm">`, and `.o-badge.is-sm` in `styles/objects/badge/_badge.scss:33` sets `--_badge-text-size: 0.65rem` (10.4px at the 16px root), below AA-practical minimum for a trait label a gardener needs to actually read. The live overlay separately flagged font-family concentration (Inter 64%/Fraunces 24% of visible text) and "flat type hierarchy" as running tallies — expected and correct for this design system's own Two-Register Rule (Inter for running text/controls, Fraunces reserved for headings/titles), not a defect; I'm not counting these as findings.

**Visual overlays:** No persistent user-visible overlay remains — the live-server used to run the in-browser detector was a background helper for this critique only, and has been stopped and confirmed removed (port 8400 free, no `live-server.mjs` process, injected script stripped from `app/layout.tsx`). Assessment B's console capture and screenshots are the record.

## Overall Impression

The mechanism-level specificity here is genuinely good — the border elevation and flowering-year strip are doing real design work, not decoration, and the choose-one direction rows are a textbook-correct implementation of this project's own accessibility rules (confirmed by clicking through them live, not just reading the source). The gap is what happens off the happy path: nothing in this surface has a designed response to an AI response that's slow, wrong, or fails outright, and the first moment of real stakes — six unranked plant suggestions landing all at once, right after the user finishes the Q&A — asks for more simultaneous judgment than the product's own cognitive-load ceiling allows anywhere else on this route. Biggest opportunity: design the failure/retry state before this goes in front of a real LLM, and split or rank that first suggestion panel.

## What's Working

- **`BorderElevation.tsx` + `FloweringYear.tsx`** turn abstract list state into a literal, live-updating diagram of the actual garden bed — verified live that silhouettes are correctly keyed by plant id (no redraw on unrelated adds) and empty tiers render as dashed ghosts, exactly as documented.
- **`DirectionOptions.tsx`'s `aria-pressed`/`role="group"`** choice over `radiogroup` is exactly right for a fire-on-click action set — confirmed live that choosing one instantly disables and dims the rest while the chosen row keeps its fill and cyan edge, with zero bleed between hover and selected treatments (the Chosen-Is-Filled rule, working as designed).
- **Keyboard focus is real, not asserted** — tabbing onto the scheme-list "Remove" button produced a visible `--sem-focus-color` outline live, not just claimed in source.

## Priority Issues

**[P0] No error, retry, or stall state anywhere in the chat surface.**
Why it matters: `ChatPane.tsx`, `QuestionFlow.tsx`, and `ChatLog.tsx` have no code path for a failed send, a network drop, or a stalled model response. This is a real multi-turn AI product about to run against a live LLM in production — right now a failure is silent, and heuristic #9 (Error Recovery) scores a 1 because of it. It's also the confirmed single largest emotional-journey risk: the one production moment guaranteed to happen (a slow or failed AI turn) currently has zero designed response.
Fix: add a `failed` message state with an inline retry affordance where the pending bubble was, and a stall-timeout on the typing indicator that surfaces "still thinking…" rather than spinning indefinitely. Screen-reader users need this even more than sighted ones — right now a stalled response is silence, not a status update, with no `role="alert"` anywhere in the reviewed components.
Suggested command: `/impeccable harden`

**[P1] The first suggestion panel breaks the product's own ≤4-visible-choice ceiling, at the highest-stakes moment in the flow.**
Why it matters: `MOCK_SUGGESTIONS` renders all 6 plants in one panel with no grouping or ranking — 2 over the cognitive-load ceiling this same surface holds to everywhere else (the direction-choice panel is exactly 4). This lands immediately after the user finishes the Q&A, i.e. it's the first scheme output they see, with no visible link back to the answers they just gave ("full sun", "free-draining", "pollinators") to explain why these six plants specifically.
Fix: cap the first panel at 3–4 with progressive disclosure ("show more"), or split by tier group (back/mid/ground — the same grouping the scheme-list pane already uses) so it reads as three chunks of ≤2 rather than one chunk of 6. Pair with a one-line per-card rationale sourced from the same answer data (sun/soil badges already exist — surface the match explicitly) to strengthen the "quietly clever" positioning instead of reading as generic plant matching.
Suggested command: `/impeccable distill`

**[P1] No undo path once a direction is chosen.**
Why it matters: `.c-chat__option:disabled` permanently closes the group (confirmed live) with no visible way to reopen or reconsider except free-typing a new message and hoping the model reinterprets it as "change direction again." This is a real user-control gap, not a hypothetical — a gardener who taps the wrong option (or changes their mind) has no attached recovery action.
Fix: a small "choose a different direction" ghost action attached to the closed panel itself, not only implied through open-ended prose.
Suggested command: `/impeccable clarify`

**[P1] Trait-tag text sits below the accessible-text floor across every plant card.**
Why it matters: confirmed by both the live detector overlay (24 instances of `undersized-ui-text`) and a source trace — `PlantCard.tsx:86`'s `<span className="o-badge is-sm">` resolves to `0.65rem` (10.4px) via `_badge.scss:33`, below the 11px floor, on every trait chip ("Drought tolerant", "Wildlife friendly", etc.) across both the chat suggestion cards and the scheme-list cards. This is the one deterministic, unambiguous defect either assessment surfaced — not a matter of taste.
Fix: raise `--_badge-text-size` on `.o-badge.is-sm` to at least 11px (0.6875rem), or retire the `is-sm` modifier on plant-card trait tags specifically and use the base 0.85rem badge size there.
Suggested command: `/impeccable typeset`

**[P2] Split-pane keyboard tab order doesn't follow visual order.**
Why it matters: confirmed live — tabbing forward from the composer (bottom of the conversation pane) jumps focus to the "Remove" button on the *top plant card in the opposite pane*, skipping the direction-option rows entirely and causing a jump-scroll back to the top of the conversation. A keyboard-only user's tab order silently diverges from the visual layout across the two-pane split.
Fix: audit DOM order vs. the two-column CSS layout in `SplitPaneView.tsx` / `_scheme-chat.scss`; either reorder the DOM to match reading order or scope a `tabindex`/landmark strategy so focus stays within one pane before crossing to the other.
Suggested command: `/impeccable audit`

## Persona Red Flags

**Jordan (First-Timer):** Lands on 6 unranked plant cards immediately after finishing the Q&A with no indication of what to do first — add all, pick a few, does order matter? The only guidance is a single panel-title line. Jordan also has no way to know a direction choice is *permanent* until after clicking a sibling row and finding it disabled — the cost of the choice isn't visible before it's made.

**Sam (Accessibility-Dependent):** The border-elevation and flowering-year components correctly carry visually-hidden text equivalents — confirmed present in the live accessibility tree ("Border shape so far: 1 at the back, 2 mid-border…"), genuinely good work. The gap is failure handling: a stalled or failed AI response produces silence for a screen-reader user rather than an announced status change, which is worse for Sam than for a sighted user who at least sees the typing dots stop.

**Riley (Stress-Tester):** The mocked `THINK_MS` (700ms) `setTimeout` pattern in `ChatPane.tsx` briefly toggles a `disabled` prop to guard against double-firing a direction choice — but this proves nothing about whether the real (non-mocked) implementation will debounce equivalently once it's a live network call instead of a local timer. Worth a specific test once the real API lands: can two option clicks within the same render frame both fire?

## Minor Observations

- The chat composer's send button correctly disables on empty input, but the disabled-arrow contrast at rest wasn't separately verified against DESIGN.md's stated ratios.
- Mobile layout (verified live at 375px) stacks chat-then-list cleanly with full-width cards and good tap targets — no squeezed grid, no horizontal overflow.
- `PlantCard.tsx`'s own comments note a photo-block treatment was tried and dropped for suggestion cards — a good sign of prior iteration, not a first-guess ship.
- The static CLI detector scan (`detect.mjs`) returned zero findings; every real issue this run surfaced came from the live browser pass and the two design-review agents, not the deterministic scan — worth remembering that a clean CLI run is not the same as a clean surface.

## Questions to Consider

- What if the first suggestion panel showed one plant at a time with a clear next/skip rhythm, instead of a 6-item list — does that resolve the cognitive-load failure without losing the "starting scheme" framing, or would a confident gardener find it slower than scanning all six at once?
- What if choosing a direction weren't permanent — what does "reconsider" even mean once the border sketch and flowering strip have already been partially built from the prior direction's adds? Has that data model been thought through, or does undo only make sense before the first plant is added under a direction?
- What if the intro/help text lived as a permanently-collapsed affordance next to the composer (a "?" that expands to the current turn's valid moves) instead of a scrollback message that ages out — would that solve the Jordan onboarding gap and the vanishing-help issue in one move?
