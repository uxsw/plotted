---
target: plant-scheme/chat
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-13T08-42-45Z
slug: app-app-plant-scheme-chat
---
Method: dual-agent (A: general-purpose design-review subagent · B: general-purpose detector/browser-evidence subagent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Typing indicator + 6s stall caption + failed/retry state all fire correctly, `role="status"`/`role="alert"` confirmed live. |
| 2 | Match Between System / Real World | 3 | Tier/border language is domain-correct; the checkbox mark is a slightly generic control image for a "choose one" pick. |
| 3 | User Control and Freedom | 3 | Direction reopen (undo) verified working live; no equivalent undo on suggestion "+Add", but Remove exists on the list pane so net freedom is fine. |
| 4 | Consistency and Standards | 4 | Chat/list panes share one vocabulary (tier labels, badge sizing token) rather than parallel implementations. |
| 5 | Error Prevention | 3 | Choose-one buttons correctly guard against double-fire; nothing else changed here since the last run. |
| 6 | Recognition Rather Than Recall | 4 | Committed choices and added/chosen states stay visibly stamped in scrollback — nothing to remember. |
| 7 | Flexibility and Efficiency of Use | 3 | Quick replies + skip-ahead help; still no bulk "add all" for a tier group. |
| 8 | Aesthetic and Minimalist Design | 4 | Tier grouping turned a 6-card wall into legible chunks with nothing decorative added. |
| 9 | Error Recovery | 4 | Retry re-attempts for real (confirmed live), Discard clears cleanly with no residue. |
| 10 | Help and Documentation | 3 | No inline hint on first use of "Choose a different direction" about what it keeps vs. discards — the behavior is right, but unexplained at the moment someone might hesitate to click it. |

**Total: 35/40 — Good.** Up from 27/40 on the last run (+8), driven by the P0 and three P1 fixes landing cleanly with no new regressions, and one P2 genuinely mitigated (not just documented as mitigated).

## Design Specificity Verdict

**LLM assessment:** Still grounded, not generic. The failed-turn copy, the shared `/fail` dev-trigger idiom, the tier-group labels reusing the scheme-list's own vocabulary, and the match-note copy built from the gardener's actual answers are specific to this mechanism. Verified live that match notes are genuinely silent when nothing lines up (not fabricated) and present when it does.

**Deterministic scan:** `detect.mjs --json` against all `_components/` files plus route/layout returned **exit code 0, zero findings** — clean, same as last run. The live in-browser detector's overlay reported five style-tally lines this time (`overused-font` Inter 63%/Fraunces 24%, `flat-type-hierarchy`, `em-dash-overuse`, `cream-palette`) — all expected under this design system's own rules (the Two-Register Rule assigns Inter/Fraunces exactly these roles; the six-step named type scale is a deliberately controlled hierarchy, not "flat" by accident; the paper ground and editorial em-dash voice are both documented brand commitments) and none actionable. No real findings from either the CLI or the live detector this run.

## Overall Impression

All five issues from the last critique were independently re-verified live, not just re-read from source: the P0 error/retry/stall machine, the three P1s (tier-grouped suggestions with honest match notes, direction-choice undo, and the badge text-size floor), and the P2 tab-order mitigation. Four are fully closed. The fifth — tab order — got the right fix for the constraint (AT-user landmark navigation), but both assessments independently converged on the same honest residual: a sighted, keyboard-only user with no assistive tech still gets the disorienting cross-pane jump, since landmark navigation is an AT-specific mechanism. That's a real, named gap, not a rounding error, and it's the most useful thing this re-run surfaced.

## What's Working

- **The retry/discard state machine is genuinely shared code** (`ChatLog.tsx`'s `SendFailedNotice`/`TypingIndicator`), driving `QuestionFlow.tsx` and `ChatPane.tsx` identically — confirmed in source, not just visually similar, and confirmed live in both directions (fail → stall caption → retry → success; fail → discard → clean idle).
- **Tier grouping and match notes are real reuse**, not two parallel implementations that could drift apart: `MOCK_TIER_LABELS`/`MOCK_TIER_ORDER` are shared constants between `SuggestionPanel.tsx` and `SchemeListPane.tsx`, and `matchNote.ts`'s silence-when-nothing-matches behavior was live-verified on the actual seeded Q&A answers, not asserted from source alone.
- **Landmark regions are real, not documentation theater** — both `<section aria-labelledby>` (chat) and `<section aria-label="Scheme list">` (list) were confirmed present in the live accessibility tree by both assessments independently.

## Prior Issues — Disposition

- **[RESOLVED] P0 — No error/retry/stall state.** Verified live end-to-end in both `ChatPane.tsx` and `QuestionFlow.tsx`: stall caption at 6s, failure at 7.5s, Retry re-attempts for real, Discard clears with no residue, composer/rows correctly lock throughout.
- **[RESOLVED] P1 — Six-item panel over the ≤4-visible-choice ceiling, no rationale.** The 6-plant starting scheme renders under "Back of border" / "Mid border" / "Ground cover" sub-headers; a smaller 2-card follow-up panel correctly stays flat. Match-note copy ("Suits your full sun, free-draining soil.") verified present when the gardener's answers genuinely support it and silent when they don't.
- **[RESOLVED] P1 — No undo once a direction was chosen.** "Choose a different direction" verified live: reopens the row set without retracting the assistant's reply or the suggestion cards already posted, matching the documented contract exactly.
- **[RESOLVED] P1 — Badge text at 10.4px, below the AA floor.** Computed font-size confirmed at 12.2px live, and the fix reuses the existing `.minion` step (One Scale Rule) rather than inventing a new value — it also silently fixed every other `is-sm` badge site-wide (`SchemeList.tsx`, `SchemeResults.tsx`, `PlantGrid.tsx`, the dashboard scroller), not just this surface.
- **[PARTIALLY RESOLVED] P2 — Split-pane tab order.** The underlying DOM/visual mismatch is unchanged and, for two independently-scrolling panes of different heights, isn't realistically fixable by reordering DOM. What landed is real and correct as far as it goes: both panes are now genuine landmark regions, confirmed live in the accessibility tree, letting assistive-tech users jump directly between "Conversation" and "Scheme list." But that's an AT-specific mechanism — a **sighted, keyboard-only user with no screen reader** (a real, common persona: RSI, temporary motor limitation, or simple preference) has no equivalent shortcut and still hits the same disorienting jump from the composer straight to a "Remove" button in the opposite pane. This should be tracked as "mitigated for AT users, open for keyboard-only users," not closed outright.

## New Issues Found This Run

**[P3] "Choose a different direction" doesn't say what it keeps.** The action is correct (verified: nothing already posted is retracted) but silent about that on the button itself — a natural hesitation point right at the moment the undo is supposed to feel safe.
Fix: a small line under the button, shown once or persistently, e.g. "(keeps what's already here)."
Suggested command: `/impeccable clarify`

**[P3] Two different "why" registers sit on one card with only a check-glyph distinguishing them.** Trait badges (Evergreen, Drought tolerant) and the match-note line ("Suits your full sun…") are both "reasons," but one is editorial/generic and the other is personalized — nothing but weight/color separates them today, which is subtle enough to warrant checking with a real reader rather than assuming it lands.
Fix: no code change proposed yet — worth a quick real-user check before touching the hierarchy further.
Suggested command: `/impeccable critique` (scoped to `PlantCard.tsx` specifically, once there's something concrete to test against)

**[P2, carried forward] Keyboard-only (non-AT) users still get the disorienting cross-pane tab jump.**
Fix: a visually-hidden "Jump to scheme list" / "Jump to conversation" skip-link pair at the top of each pane — a keyboard-only equivalent to the landmark navigation AT users already have, not a DOM reorder.
Suggested command: `/impeccable harden`

## Persona Red Flags

**Keyboard-only, no screen reader:** hits the exact residual tab-order jump above, with no landmark UI to lean on (that mechanism is AT-only) — will find the workspace disorienting on first use, though not blocked.

**Anxious first-time user:** the reopen-undo is a real confidence builder in practice, but its silence about consequences on first encounter could cause a moment's hesitation — someone already wary of "the AI messing up my list" gets no reassurance until after they click.

**Power user iterating quickly:** benefits from tier grouping and skip-ahead, but still has no bulk "add all from this tier" — every plant is its own click, which starts to feel like a small tax by the fourth or fifth add in a session.

## Minor Observations

- `SendFailedNotice`'s Retry icon and `DirectionOptions`' reopen action share the same glyph (`retry`) — consistent, not a defect, just confirm that reuse across two different "go back" verbs (retry vs. undo) is intentional rather than incidental.
- Mobile stacking (375px, chat-then-list, page scroll) verified clean, no layout breakage.
- Assessment B's report noted a plain Enter keypress didn't submit the composer in its automated test — I checked the source (`ChatLog.tsx`'s `onKeyDown`) and the handler is unchanged and correct; this reads as a testing-tool artifact (synthetic key events unreliably trigger React's key handlers, which I hit myself earlier in this same session), not a real regression. Worth a quick manual sanity check next time someone's in the app, but not treating it as a confirmed defect here.

## Questions to Consider

- Now that "why this fits" exists, does its *absence* actually read to a real user as "nothing matched," or could it read as "this card forgot to explain itself"? Worth watching one real person hit both cases.
- Is "reopen never retracts prior output" the right permanent behavior, or will users eventually want a clean "start this direction over" once a scheme accumulates several abandoned suggestion panels?
- Landmark regions solve this for assistive-tech users today — does the two-pane, independently-scrolling shape still make sense for a keyboard-only, non-AT user, or does that persona deserve its own affordance (skip links) rather than inheriting a mechanism built for someone else?
