---
target: the dashboard page
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-29T19-17-42Z
slug: app-app-dashboard-page-tsx
---
# Dashboard Critique

Method: dual-agent (A: design review · B: deterministic detector + in-page browser scan), both isolated sub-agents. Not degraded. Browser pane wedged partway through both runs; A's rendered-detail judgments reasoned from source, B's structure/mobile snapshot incomplete. B completed a full in-page detector scan.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Weather skeleton/error/retry + optimistic bird toggle. Skeleton aria-hidden, no aria-busy/live region; no "last updated". |
| 2 | Match System / Real World | 4 | On-world vocabulary, UK date/units, botanical Latin. |
| 3 | User Control and Freedom | 3 | Toggle reversible, search Escape-safe. No block collapse/reorder; animation not skippable. |
| 4 | Consistency and Standards | 2 | Weather block = utilities + border + rounded-[8px] vs borderless 4px SCSS cards elsewhere; three button-row idioms; four block backgrounds. |
| 5 | Error Prevention | 3 | Onboarding-card read-once visibility + search remount so reversible cancel can't write the seen flag. |
| 6 | Recognition Rather Than Recall | 3 | Blocks labelled. Dot pagers show no count/position; "Change" is a tiny minion underline. |
| 7 | Flexibility and Efficiency | 2 | No accelerators, no keyboard path between blocks, ~11 swipes to mark newest bird, settle animation replays every visit. |
| 8 | Aesthetic and Minimalist Design | 3 | Masthead + empty plate exemplary. Weather no disclosure; bird meter adds scoreboard weight. |
| 9 | Error Recovery | 3 | Weather/bird errors plain and specific. Location surfaces raw result.error. |
| 10 | Help and Documentation | 2 | Decent inline first-run help. Nothing explains bird list purpose or seasonal logic. ~5 placeholder-copy spots. |
| Total | | 28/40 | Good (bottom of band) |

## Design Specificity Verdict

Mixed, leaning generic-with-strong-flourishes. Personality lives in the chrome; composition is category-interchangeable.

Authored for Plotted: DashboardDateline almanac masthead; GardenEmptyPlate (structural catalogue metaphor — inset mat rule, folio number, pressed sprig, consequence-naming copy); italic botanical Latin; lib/season.ts seasonal labels; "spot nearby this season".

Category-interchangeable: returning-user spine is heading + one-line subtitle + 60%-width white-card scroller + aria-hidden dot pager, repeated Garden/Birds and in grid form for Shopping. GardenCardScroller and BirdCardScroller are near-duplicate components. Three of five content blocks are the same object. Weather is a stock widget (current + 24h + 5d, all expanded, no disclosure) in a foreign style register. Marigold leaks past "primary action + active nav, <=10%" — weather panel four non-action ways, bird block on a paragon numeral + full-width progress fill.

Deterministic scan (B):
- CLI detector: clean, 0 findings. Markup well-formed; every real issue is rendered/CSS/contrast.
- In-page scan: 19 findings / 17 elements. Dominant: marigold primary button fails AA — #fff6f4 on #e26650 = 3.2:1 (need 4.5:1); same color on avatar + Feedback pill; "Mark as spotted" pills #fff on marigold = 3.4:1 (x9). Also p.minion ~155 chars/line, c-spotted-count clips a positioned child, progress-bar-complete animates width, 20 em-dashes.
- False positive: "cream-palette" flag = the committed #FAF6EC paper ground.
- Console: zero errors. Next.js warning: first plant image is LCP, should be priority.

Agreement A+B: bird progress bar is a problem (scoreboard energy; animates layout property; clipped overflow container). Over-long .minion copy lines. Marigold surface area.
B caught what A couldn't: the exact contrast ratio (below AA). Neither design review nor CLI detector alone would have found it.

## Overall Impression

Identity rests on two excellent moves (almanac dateline, catalogue empty-plate) on top of a composition that's three copies of one card-scroller plus a stock weather widget in a different visual dialect. It's a launcher for five features, not a companion with a seasonal point of view. Biggest opportunity: decide what the page is for, let the garden photos lead, give it one synthesised sentence about the week. Must-fix regardless: primary marigold button fails AA contrast and this page leans on it hard.

## What's Working

1. GardenEmptyPlate — catalogue metaphor made structural (inset mat rule, folio caption, 22% pressed sprig); copy names the action's consequence.
2. Almanac dateline masthead — "gardening year is the clock" as a running header; honest, cheap, sets tone before content loads.
3. Onboarding-card dismiss safety — read-once visibility + search remount so a reversible cancel never permanently writes the seen flag.
Bonus: optimistic bird toggle with exact rollback + inline error copy.

## Priority Issues

### [P1] Primary marigold button fails AA contrast
Why: #fff6f4 on #e26650 = 3.2:1 (need 4.5:1). Hits "Add plant", "J" avatar, Feedback pill, 9x "Mark as spotted" pills (#fff on marigold, 3.4:1). PRODUCT.md: WCAG 2.2 AA baseline + bright-light outdoor phone use called out explicitly.
Fix: DESIGN.md button-primary token change. Darken marigold behind text to 4.5:1, or flip button text to n-deep-grey on marigold (~5:1; already the hover state). Re-derive spotting toggle + avatar from the same decision.
Suggested: /impeccable audit -> DESIGN.md token fix.

### [P1] "Garden visitors" reads as a scoreboard
Why: PRODUCT.md binding anti-pattern (no streak counters; gentle prompt not a score). paragon-size marigold numeral + full-width marigold bar easing from 0 on every load + "You've spotted all 12" line. Animated fill pulls eye to the metric on arrival, every visit. B corroborates: animates width; clipped overflow container.
Fix: remove animated fill (or 2px sand-line hairline, no transition, no marigold); demote count to brevier/ink-soft; cut/de-style completion line; marigold off the block.
Suggested: /impeccable distill. Note: animated bar + completion line are from the recent delight pass.

### [P1] Weather block is category-interchangeable and stylistically foreign
Why: stock widget, no disclosure, raw Tailwind utilities + border + rounded-[8px] — breaks borderless-white 4px card language, violates One Scale Rule, spends marigold four non-action ways, ~29 hairline cell borders. "Change" control is a minion underline — poor tap target, only escape from Exeter default.
Fix: rebuild on SCSS card object; scale tokens only; collapse hourly+daily behind disclosure or one row; marigold out of weather data; "Change" as one o-button--ghost with icon, >=44px, header only.
Suggested: /impeccable shape on the weather block.

### [P2] Structural sameness — three near-identical scrollers with decorative pagers
Why: Garden + Bird scrollers are duplicate objects; Shopping is the same idea in grid. Dot pagers aria-hidden, non-interactive, no count/position. Plant photos meant to be brightest thing on page but same 60% card as everything.
Fix: distinct rhythm per block — Garden fuller/editorial and leads, weather/birds/shopping quieter rows. Replace dots with real "4 of 12" indicator or drop.
Suggested: /impeccable shape on the composition.

### [P3] No synthesis; weak ending
Why: five blocks, never says what the week means, never reassures a gardener with nothing to do. Trails off after shopping list (first-run: after a 0/12 bird wall).
Fix: one-sentence seasonal read under the masthead for returning users; design a "nothing needs you this week" closing state keyed to season/weather.
Suggested: /impeccable clarify on the dashboard voice.

## Persona Red Flags

Alex (power user): no accelerators; unspotted birds sort furthest right (~11 swipes); settle animation replays every visit; no keyboard path between blocks; no weather collapse; dot pagers convey nothing.

Sam (a11y): measured 3.2-3.4:1 on primary/spotting buttons; dot pagers aria-hidden no alternative; HourlyStrip no-rain marker text-ink-soft/40 on white likely <3:1 (code-review flag); bird More/Less uses o-button--text not .o-button so likely no focus ring; ForecastSkeleton aria-hidden no aria-busy/live region; DailyForecast/HourlyStrip cells cramp/clip at 200% zoom + force horizontal scroll; no h1 (dateline is a p, page is all h2).

Casey (distracted mobile): weather client-fetched, no last-known fallback (PWA shell-only) -> spinner on bad signal; "Mark as spotted" pill on photo = accidental thumb hit mid-scroll, fires server action immediately; bird #12 ~11 swipes; scroll-snap x mandatory yanks quick flicks back; entrance stagger delays weather block readiness on top of its skeleton.

## Minor Observations

- Placeholder copy in LocationOnboardingCard (4x) + Exeter notice — first-run text unfinished.
- .c-first-plant-card in _onboarding-card.scss: resting box-shadow (Flat-By-Default violation), transition: all, 7-stop rainbow radial gradient (twee). Appears unused now GardenEmptyPlate uses .c-garden-plate — confirm and delete.
- Duplicate accessible name "Lately in your garden" 2-3x on one block.
- First-run h2 pile-up: "Where's your garden?" above "Garden weather" + Exeter notice.
- Card-radius inconsistency: weather rounded-[8px] vs 4px elsewhere.
- Three button-row idioms for the same need.
- GardenCardScroller image alt={plant.species ?? ""} — empty alt on a linked card; verify accessible name when species is null.
- First plant-card image should be priority (Next.js LCP warning).
- /dashboard 307-redirects to /.
- 20 em-dashes in body text — consistent with voice, worth a light edit pass.

## Questions to Consider

1. If the dashboard could show only one block, which is it — and does the order reflect that?
2. What does this page say to the gardener who has nothing to do this week?
3. Is the N/12 bird meter a companion feature or a retention mechanic in botanical clothing?
4. The plant photos are meant to be the brightest thing on the page — so why are they the same 60%-width card as everything else?
