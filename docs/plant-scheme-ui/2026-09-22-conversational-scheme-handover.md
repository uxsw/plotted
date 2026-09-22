# Conversational planting scheme — state of play (2026-09-22)

Factual snapshot of `/plant-scheme` as it exists in the code today, for handover. This is **not** a restatement of [plotted-conversational-planting-scheme-spec_1.md](plotted-conversational-planting-scheme-spec_1.md) — where current code diverges from that spec, it's flagged explicitly below. No opinions, no next steps.

Branch note: the feature was developed on `plant-scheme-conversational-shell`, merged via PR #89, and now lives on `chat-ui-4`/`main` at `app/(app)/plant-scheme/`. Commit `2f29aa1` ("Add conversational planting scheme shell (stages 1–2)") is where this route tree begins; everything after is iteration on it (44 commits touching this area, `dd1a568`..`dffe810`).

**The single most important fact:** `/plant-scheme` is a completely separate, parallel stack from the older `/schemes` feature. `/schemes` is real — DB-backed, calls a real LLM, does real Wikimedia image lookups. `/plant-scheme` (the conversational shell) is, as of today, **UI-layer only**: no LLM calls, no persistence of any conversation/answer/scheme content, no Wikimedia. The two share no code path. This isolation is deliberate and stated directly in the code (`layout.tsx:6-9`): *"a wholly separate top-level segment from /schemes... so 'this cannot affect the live scheme feature' is true by construction."*

---

## 1. Current flow, as actually implemented

### Routes, in order of a typical journey

| Route | File | What happens |
|---|---|---|
| `/plant-scheme` | `app/(app)/plant-scheme/page.tsx` | Server component. Real Supabase reads: active garden plants + the user's schemes (complete/failed). Computes `showWelcome` via `needsSchemeOnboarding()`. Supports preview query params `?welcome=1`/`?welcome=0` (force the dialog on/off), `?drafts=0`, `?plans=0`, `?garden=0`. Renders `SchemesHub`. |
| (same page) | `_components/SchemesHub.tsx` | Client shell: welcome dialog (first-time only), `RecentPlans` (top 3, real data), `DraftShelf` (built but currently **disabled**, see §3), `StartPanel`. |
| — welcome dialog | `_components/SchemeWelcomeDialog.tsx` + `OnboardingCarousel.tsx` + `schemeOnboardingSteps.ts` | 3-step scroll-snap carousel: (1) "Choose a few plants", (2) "Answer a few quick questions", (3) "Watch it come together". Marks itself seen on mount (`markSchemeOnboardingSeen()` server action) unless opened via `?welcome=1` preview. Final step's `finish()` closes the dialog and focuses/scrolls to the plant-picker field in the hub via a `data-onboarding-target="add-plant-field"` hook. |
| — plant picking | `_components/StartPanel.tsx` + `GardenGallery.tsx` | Compact tray (max 5 picks) backed by a wide garden-photo gallery. One field does double duty: filters the gallery grid AND lets typing an unmatched name register as a free-text "considering" plant. This is the point where the old spec's separate Path A ("existing garden plants") / Path B ("plants you're considering", "scratch") entry screens were merged into one panel — see §Drift below. |
| `/plant-scheme/chat` | `chat/page.tsx` → `_components/SchemeChat.tsx` | Thin route switch: no `path` in state → dead-end "No scheme in progress" card; `phase === "questions"` → `QuestionFlow`; otherwise → `SplitPaneView`. |
| — questions | `_components/QuestionFlow.tsx` | 4 fixed questions asked one at a time (full list in §2). |
| — workspace | `_components/SplitPaneView.tsx` (`ChatPane` + `SchemeListPane`) | Persistent two-pane workspace: refinement chat on one side, running scheme list on the other. Matches the spec's "split pane, no dead-end no-results screen" intent. |
| `/plant-scheme/plans` | `plans/page.tsx` | Real Supabase-backed "All plans" management list, separate from the hub's 3-item `RecentPlans` preview. |
| `/plant-scheme/existing` | `existing/page.tsx` | **Dead stub.** `redirect("/plant-scheme")`. Comment: "Picking garden plants now happens in the hub's start panel." |
| `/plant-scheme/scratch` | `scratch/page.tsx` | **Dead stub.** `redirect("/plant-scheme")`. Comment: "Typing plants you're considering now happens in the hub's start panel." |

Full contents of the two stubs (both trivial, one screen each):

```tsx
// existing/page.tsx
import { redirect } from "next/navigation";
/* Picking garden plants now happens in the hub's start panel. */
export default function PlantSchemeExistingPage() {
  redirect("/plant-scheme");
}
```
```tsx
// scratch/page.tsx
import { redirect } from "next/navigation";
/* Typing plants you're considering now happens in the hub's start panel. */
export default function PlantSchemeScratchPage() {
  redirect("/plant-scheme");
}
```

### New vs. returning user — what's actually real

The new/returning gate is real and DB-backed: `lib/scheme-onboarding.ts:15-37`, `needsSchemeOnboarding()`. It checks Supabase for `user_flags.scheme_onboarding_seen_at` OR the presence of any pre-existing complete scheme. Marking the flag (`app/actions/schemes.ts:18-28`, `markSchemeOnboardingSeen`) is a real server action doing a real upsert.

**However**, this is the *only* piece of cross-session persistence in the new feature. The spec's implied "garden profile persists across schemes" idea (answers/preferences carrying over) does not exist anywhere — there is no database table for chat answers, question outcomes, or a garden profile. All of that lives purely in-memory in `PlantSchemeContext`, which states this outright:

> `PlantSchemeContext.tsx:6-9`: "Stage 1 (UI / state-shape only). Nothing here is persisted — not to a database and not to browser storage — and there is no AI wiring. The question flow and every 'assistant' response are driven off hardcoded mock content (see ./mockData.ts)."

> `PlantSchemeContext.tsx:11-13`: "The provider is mounted in the segment layout, so state survives client-side navigation between /plant-scheme sub-routes. A hard refresh mid-flow loses the state and the step guards send the user back to the entry point."

So concretely: a "returning user" today is only distinguished by (a) whether the onboarding dialog shows again, and (b) whatever real garden plants / real past schemes they have (from the *old* `/schemes` feature's tables, which this new feature reads from for the hub's `RecentPlans`/hub-emptiness checks). Nothing about a prior *conversation* — their answers, their in-progress scheme, their chosen direction — survives a refresh or a new session, for either new or returning users.

### Drift from the spec — flow/journey logic in code now that isn't in spec_1

- The spec's two separate entry paths (Path A "existing garden plants" via one screen, Path B "plants you're considering"/scratch via another) have been **collapsed into a single `StartPanel`** with one combined tray+gallery. `/plant-scheme/existing` and `/plant-scheme/scratch` are the leftover route stubs, now just redirects.
- The spec's single conceptual "chat + split pane" surface is implemented as **three separate components**: `SplitPaneView` (layout/container) + `ChatPane` (conversation half) + `SchemeListPane` (list half), rather than one monolithic view.
- A **"Carry on" drafts shelf** (`DraftShelf.tsx`, `mockDrafts.ts`) has been built — full UI, mock data — to satisfy a "reopen and continue an in-progress scheme" requirement, but is switched off (`SHOW_DRAFTS = false` in `SchemesHub.tsx`) because nothing persists yet to back it with real data. This is UI built ahead of the persistence layer, not in the spec's original sequencing.
- A **dev preview-seed mechanism** (`?preview=1`, see §4) and a **dev debug panel** (`NEXT_PUBLIC_PLANT_SCHEME_DEBUG`, see §4) were added — pure engineering/iteration tooling, not part of the spec.
- An **`/plant-scheme/plans`** "all plans" management page exists, separate from the hub's recent-3 preview — not called out in the spec as a distinct route.

---

## 2. The question flow

**Location:** `app/(app)/plant-scheme/_components/mockData.ts:21-50`, array `MOCK_QUESTIONS`. Fully hardcoded plain JS objects — see structure below.

**All 4 questions, verbatim, in order:**

1. **id: `aspect`** — "Which way does this bed face, and how much sun does it get through the day?"
   Suggestion chips: `Full sun`, `Partial shade`, `Full shade`, `Not sure`
2. **id: `soil`** — "What's the soil like — heavy and wet, light and dry, or somewhere in between?"
   Suggestion chips: `Free-draining`, `Heavy clay`, `Stays damp`, `Not sure`
3. **id: `intent`** — "What are you hoping this planting adds — colour, structure, wildlife, scent?"
   Suggestion chips: `Year-round colour`, `Pollinators`, `Evergreen structure`, `Cut flowers`
4. **id: `style`** — "Any style you're drawn to, or plants you'd rather avoid?"
   Suggestion chips: `Cottage / informal`, `Architectural`, `Low maintenance`

Doc comment directly above the array (`mockData.ts:17-20`): *"The mock conversation. The first question has no 'Quick answer' exit (a scheme is never generated from zero context) — the chat shell enforces this by index."*

**Editability:** it's a flat, hardcoded TypeScript array of plain objects (`{id, prompt, suggestions}`-shaped) in a single file — no JSON config, no CMS, no DB table. Changing wording, reordering, or adding/removing a question is a direct code edit to `mockData.ts` (plus re-checking any code that assumes exactly 4 questions or indexes by position, e.g. the Q1 exemption logic below, which reads `questionIndex`/`isFirstQuestion` rather than hardcoding the question id, so it should tolerate reordering/adding safely — not independently re-verified beyond reading the logic).

**File-level doc comment (`mockData.ts:1-7`):** *"Hardcoded mock content for the Stage 1 conversational planting scheme shell. None of this is real. The question sequence stands in for what will later be an LLM-driven conversation; the scheme stands in for a generated result. All user-facing copy here is placeholder — Natalie reviews real copy separately."*

### Skip / Quick Answer / Q1 exemption — current behaviour, matched against spec

Confirmed **matching the spec**: Skip is available on every question including the first; Quick Answer ("Skip ahead — build it now") is available only from the second question onward, so a scheme is never generated from zero context.

Doc comment directly in the component (`QuestionFlow.tsx:9-13`): *"Flow rules (from the spec): Questions are asked one at a time. Skip is available on every question (including the first). Quick answer is available only from the second question onward — a scheme is never generated from zero context."*

Handlers (`QuestionFlow.tsx:192-203`):
```ts
function handleSkip() {
  if (!currentQuestion || busy) return;
  const wasLast = questionIndex === totalQuestions - 1;
  skipQuestion(currentQuestion.id);
  if (wasLast) completeFlow();
}

function handleQuickAnswer() {
  if (busy) return;
  quickAnswer();
  completeFlow();
}
```

Render logic gating Quick Answer behind `!isFirstQuestion` (`QuestionFlow.tsx:274-291`):
```tsx
<div className="o-row">
  <button type="button" onClick={handleSkip} className={...}>
    Skip this question
  </button>

  {!isFirstQuestion && (
    <Button variant="ghost" onClick={handleQuickAnswer}>
      Skip ahead — build it now
    </Button>
  )}
</div>

{!isFirstQuestion && (
  <p className="c-scheme-chat__aside brevier">
    Building now uses just what you've given so far — less tailored than
    finishing the questions, and you can keep refining afterwards.
  </p>
)}
```

Underlying state mutators (`PlantSchemeContext.tsx:291-309`):
```ts
const answerQuestion = useCallback((questionId: string, answer: string) => {
  setState((s) => ({
    ...s,
    outcomes: [...s.outcomes, { questionId, type: "answered", answer }],
    questionIndex: s.questionIndex + 1,
  }));
}, []);

const skipQuestion = useCallback((questionId: string) => {
  setState((s) => ({
    ...s,
    outcomes: [...s.outcomes, { questionId, type: "skipped" }],
    questionIndex: s.questionIndex + 1,
  }));
}, []);

const quickAnswer = useCallback(() => {
  setState((s) => ({ ...s, quickAnswered: true }));
}, []);
```

No divergence from spec found on this specific mechanic.

---

## 3. What's real vs. mocked

**LLM conversation:** entirely mocked. No Anthropic/OpenAI/LLM API call exists anywhere in `/plant-scheme`. All "assistant" content — suggestions, follow-ups, direction options — is static data from `mockData.ts` (`MOCK_SUGGESTIONS`, `MOCK_FOLLOWUP_SUGGESTIONS`, `MOCK_DIRECTION_OPTIONS`). The simulated send/response cycle in `ChatPane.tsx` (`mockAttempt`, lines 59-70) explicitly stands in for a future real network call:

> "Stands in for the real network call this becomes. Resolves after THINK_MS; rejects after SIMULATED_FAILURE_DELAY_MS when asked to. Swapping this for a genuine API call is the only change the real integration needs — the surrounding retry/stall state machine is already shaped for it."

Timings: `THINK_MS = 700`, `SIMULATED_FAILURE_DELAY_MS = 7500`. There is a deliberate dev-only failure trigger: typing `/fail` into the composer and sending, or choosing a direction while it's still present, simulates that turn failing — the one hook for exercising retry/discard without a real backend (`ChatPane.tsx:27-38`).

"Dislike" / "want something different" detection is keyword sniffing, not NLU — `PlantSchemeContext.tsx:222-223`:
```ts
const DISLIKE_MARKERS = [
  "don't like", "dont like", "do not like", "something else",
  "different", "not keen", "not sure about", "hate", "start again",
];
```
Doc comment: "Crude mock trigger for the 'I want something different' path. Not real NLU."

Similarly, the "why this fits" match text under each suggestion card (`matchNote.ts`) keyword-matches the Q1 (sun) / Q2 (soil) free-text answers against each mock plant's `sun`/`soil` fields — not real horticultural matching or NLU. It deliberately returns `undefined` (renders nothing) rather than fabricate a reason when nothing genuinely lined up (`matchNote.ts:1-18`).

**Persistence:** none, for anything conversation/scheme related. `PlantSchemeContext` is pure in-memory React state (`useState`), provided at the `/plant-scheme` segment layout level so it survives client-side navigation between sub-routes, but is lost entirely on a hard refresh (step guards then bounce the user back to the entry point). No `localStorage`/`sessionStorage` use either. The **only** real persistence anywhere in this feature is the one-time onboarding-seen flag (`user_flags.scheme_onboarding_seen_at`, migration 031) and reads of real garden plants / real completed schemes (from the old `/schemes` tables) that feed the hub's display.

**Garden-plant pre-population:** real and functioning as UI behavior (though the plants themselves come from the real garden table, nothing about the resulting scheme is saved). `StartPanel.tsx:129-136` → `PlantSchemeContext.tsx:311-358` seeds `schemePlants` from the plants a user picked in the gallery, carrying over their actual garden photo (not a Wikimedia image). These are grouped separately in the scheme list under "From your garden" (`SchemeListPane.tsx:40-52`), distinct from AI-suggested plants.

**Photo rendering:** garden-origin plants show their real garden photo. Every AI-suggested plant is text-only — no image, anywhere, in this feature. This is explicit and considered, not an oversight (`PlantCard.tsx:15-21`):

> "`photoUrl` is only ever set for Path A garden plants, from the garden record's own stored photo — there is no Wikimedia lookup at this stage. Every AI-suggested plant (the common case, both here and on the scheme list) has none — this is a text-only card in that case, in both places. A photo-sized illustrated block was tried here and dropped: too big to scan/select from in the chat, and too primary a placeholder on the scheme list for something we know will never be a real image."

**Tier grouping:** functioning UI logic, unchanged in spirit from what iteration would have left it as. `SchemeListPane.tsx` groups `schemePlants` into a "From your garden" group (origin === "garden") plus tier groups (back/mid/ground) via `MOCK_TIER_ORDER`/`MOCK_TIER_LABELS`. `SuggestionPanel.tsx` applies the same tier grouping only when a single suggestion batch exceeds `TIER_GROUP_THRESHOLD = 4` plants; smaller batches (e.g. a 2-plant follow-up) render as one flat list.

**Shopping list button:** mocked and, per the investigation, effectively orphaned. `toggleShoppingList` exists in `PlantSchemeContext.tsx` (lines 111-112, 182-183, 396-403) as a pure local boolean flip with no network call — but no UI control actually invoking it was found in `PlantCard.tsx` or `SchemeListPane.tsx`. So the plumbing exists in state but currently has no visible trigger wired to it in the rendered UI.

**Wikimedia image lookup:** still absent from this feature, confirmed. It exists and works in the old `/schemes` feature (`lib/wikimedia.ts`, called from `app/api/schemes/_lib.ts:63`, with dedicated columns `wikimedia_image_url`/`wikimedia_attribution` on `scheme_suggestions` from migration 012) — but nothing in `/plant-scheme` references it.

---

## 4. Known gaps / rough edges

No `TODO`/`FIXME` comments were found anywhere in this feature's code. Instead, mocked/deferred status is consistently flagged via prose doc-comments at the point of use (several quoted above and below) — this appears to be the deliberate convention in this codebase rather than an omission.

### Debug panel

**Env var:** `NEXT_PUBLIC_PLANT_SCHEME_DEBUG=1`, set in `.env.local`, dev server restart required. Checked at `SplitPaneView.tsx:47`; doc comment there: "State-inspection panel — off by default. Turn on with NEXT_PUBLIC_PLANT_SCHEME_DEBUG=1 in .env.local and restart the dev server." When on, it renders a `DebugPanel` (`SplitPaneView.tsx:65-135`) dumping the full live state: path, phase, starting plants, quick-answered flag, finished flag, question outcomes, and the full scheme list (with origin, tier, photo, shopping-cart flag, id).

### Preview seed

**Mechanism:** open `/plant-scheme/chat?preview=1` directly (typed or bookmarked — must be a full page load, not client-side nav). `PlantSchemeContext` then initializes to `PREVIEW_SEED_STATE` (from `previewSeed.ts`) instead of the normal empty `INITIAL_STATE`, landing straight on the split-pane workspace with representative mock content, skipping the entry/picker/question flow. No env var involved — pure query-string check. Doc comment (`previewSeed.ts:1-17`): "Dev-only preview seed... This is a development convenience only. It has no effect unless the exact `?preview=1` query param is present, and it is never reachable from the real flow (which navigates to `/plant-scheme/chat` with a bare path). Nothing here is persisted."

Note: the disabled `DraftShelf`'s two mock entries (`mockDrafts.ts`) both link to the same `href: "/plant-scheme/chat?preview=1"` — i.e. even if `SHOW_DRAFTS` were flipped on, clicking either mock draft today lands on the identical seeded state rather than anything distinguishing them.

Other hub-level preview-only query params (found alongside `?welcome=1`/`?welcome=0` in `page.tsx`): `?drafts=0`, `?plans=0`, `?garden=0` — not fully traced in this pass beyond their presence in the server page.

### Other rough edges surfaced by design-critique history (`.impeccable/critique/`)

Four critique passes exist, alternating between the hub and the chat/workspace surface, showing real before/after iteration:

- **Chat surface:** 27/40 → 35/40. Resolved: no error/retry/stall state (now has a 6s "Still thinking…" stall caption and 7.5s failure simulation with Retry/Discard), a 6-plant suggestion panel breaking the intended ≤4-visible-choice ceiling (now tier-grouped above 4), no undo once a direction was chosen (now has a "Choose a different direction — what's already here stays" reopen action), and trait-tag badge text below the AA-accessible size floor (10.4px → fixed to 12.2px). One item is only **partially** resolved: split-pane keyboard tab order — assistive-tech users can now jump between panes via landmark regions, but a sighted keyboard-only (non-AT) user still hits a disorienting tab-order jump. Open P3s from the most recent run: two different "why a plant fits" registers (badges vs. the matchNote sentence) distinguished only by icon/weight, with no stated resolution.
- **Hub surface:** 30/40 → 33/40. Resolved: no keyboard focus trap on the welcome modal (app-wide `Modal.tsx` issue, not scheme-specific), onboarding's final CTA doing nothing but closing the dialog (now hands off focus to the plant picker), CTA/Feedback-button AA contrast failure (3.16:1 vs. required 4.5:1 — a systemic token issue, not scheme-specific), garden-gallery Latin-caption overflow on mobile, and a gallery grid causing ~7–15px horizontal page overflow at desktop widths. Two claims from the first hub pass did **not** hold up on independent re-verification (no actual horizontal-scroll capability found at 960/1440px; 0/30 overflowing captions at 375px on repeated fresh loads) — worth knowing if referencing that earlier report. Recurring, still-open across both hub runs: **welcome dialog ships with placeholder-only iconography** — `schemeOnboardingSteps.ts` has no `photoSrc` for any of its 3 steps (confirmed in code, lines 10-13: "expect real content (and photoSrc/photoAlt) to replace both once written"). Also still open: a prose-only error banner with no retry button when the hub's real-plans fetch fails (`RecentPlans.tsx`, `plansError` state).

### Carry on drafts

Built but unreachable: `SHOW_DRAFTS = false` in `SchemesHub.tsx`, with an in-code note that when reactivated, drafts belong interleaved by recency inside the `RecentPlans` row rather than as a separate shelf — a design decision recorded but not yet implemented.

---

## 5. File / component map

### `/plant-scheme` route tree

| Path | Role |
|---|---|
| `app/(app)/plant-scheme/page.tsx` | Server hub page — real Supabase reads (active plants + schemes), computes onboarding gate, renders `SchemesHub` |
| `app/(app)/plant-scheme/layout.tsx` | Segment layout — mounts `PlantSchemeProvider` only |
| `app/(app)/plant-scheme/chat/page.tsx` | Thin wrapper rendering `SchemeChat` |
| `app/(app)/plant-scheme/existing/page.tsx` | Dead redirect stub → `/plant-scheme` |
| `app/(app)/plant-scheme/scratch/page.tsx` | Dead redirect stub → `/plant-scheme` |
| `app/(app)/plant-scheme/plans/page.tsx` | Real Supabase-backed full "All plans" management list |

### `_components/`

| File | Role |
|---|---|
| `PlantSchemeContext.tsx` | Cross-route in-memory state machine — the entire feature's "backend" today; fully mocked, unpersisted (state shape/methods below) |
| `mockData.ts` | All hardcoded question/suggestion/direction content, tier order/labels |
| `mockDrafts.ts` | Mock "carry on" draft data (currently unreached, `SHOW_DRAFTS=false`) |
| `previewSeed.ts` | Dev-only deterministic seed state for `?preview=1` |
| `matchNote.ts` | Keyword matcher building "why this fits" text from Q1/Q2 answers |
| `schemeOnboardingSteps.ts` | Copy/content for the 3-step onboarding carousel (no photoSrc yet) |
| `plantMarks.ts` | SVG path variants feeding `BorderElevation` |
| `SchemesHub.tsx` | Hub's client shell — recent plans + drafts (disabled) + start panel + welcome dialog |
| `SchemeWelcomeDialog.tsx` | One-time onboarding modal wrapper |
| `OnboardingCarousel.tsx` | 3-step scroll-snap carousel inside the welcome dialog |
| `RecentPlans.tsx` | Hub's top-3 recent real plans row (real Supabase data) |
| `DraftShelf.tsx` | "Carry on" drafts shelf UI (built, currently unreached) |
| `StartPanel.tsx` | Compact tray for picking up to 5 starting plants (`MAX_PLANTS = 5`) |
| `GardenGallery.tsx` | Wide garden-plant browse/search/multi-select grid, part of `StartPanel` |
| `SchemeChat.tsx` | Route-level switch: no-scheme / `QuestionFlow` / `SplitPaneView` |
| `QuestionFlow.tsx` | Q1–Q4 sequential question UI, Skip/Quick-Answer logic |
| `SplitPaneView.tsx` | Persistent workspace layout: `ChatPane` + `SchemeListPane` + debug panel |
| `ChatPane.tsx` | Refinement-conversation half; mocked send/retry/fail state machine |
| `SchemeListPane.tsx` | Scheme-list half (garden group + tier groups), pinned `SchemeGenerateAction` |
| `SchemeGenerateAction.tsx` | "Generate the scheme" mocked save action (`GENERATE_MS = 1500`) |
| `ChatLog.tsx` | Domain-neutral chat primitives: `ChatMessage`, `TypingIndicator`, `SendFailedNotice`, `QuickReplies`, `AnswerOptions`, `ChatComposer` |
| `SuggestionPanel.tsx` | Titled suggestion-card group, tier-grouped above 4 plants (`TIER_GROUP_THRESHOLD = 4`) |
| `DirectionOptions.tsx` | "Which direction?" choose-one card group, with reopen/undo |
| `PlantCard.tsx` | Shared plant card (chat suggestion + scheme-list item), text-only for non-garden plants |
| `BorderElevation.tsx` | SVG cross-section elevation sketch keyed by plant tier |
| `FloweringYear.tsx` | 12-month flowering-coverage strip |

### Related, outside `_components/` but load-bearing

| File | Role |
|---|---|
| `lib/scheme-onboarding.ts` | `needsSchemeOnboarding()` — real DB-backed new/returning-user gate |
| `app/actions/schemes.ts` | Real server actions: `markSchemeAiNoticeSeen` (old feature), `markSchemeOnboardingSeen` (new feature's onboarding flag) |
| `supabase/migrations/031_scheme_onboarding_seen.sql` | Adds `user_flags.scheme_onboarding_seen_at` — the exact flag the onboarding gate reads |

### The old, separate `/schemes` feature (real, for contrast)

| Path | Role |
|---|---|
| `app/(app)/schemes/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/generating/page.tsx` | Old form-based journey — real DB, real LLM |
| `app/api/schemes/route.ts`, `generate/route.ts`, `[id]/route.ts`, `[id]/status/route.ts`, `[id]/retry/route.ts`, `[id]/suggestions/[suggestionId]/route.ts`, `_lib.ts` | Old feature's API routes; `_lib.ts` does real LLM generation + real Wikimedia enrichment |
| `lib/scheme-generation.ts` | Old feature's generation logic |
| `lib/wikimedia.ts` | Real Wikimedia image fetch |
| `components/SchemeList.tsx`, `SchemeResults.tsx`, `SchemeNewForm.tsx` | Old feature's UI |
| `supabase/migrations/012_schemes.sql` | Creates `schemes`, `scheme_source_plants`, `scheme_suggestions` (incl. Wikimedia columns), RLS |
| `supabase/migrations/013_scheme_summary.sql` | Adds `schemes.summary` |
| `supabase/migrations/016_scheme_ai_notice_seen.sql` | Adds `schemes.ai_notice_seen_at` |
| `supabase/migrations/030_scheme_status.sql` | Adds `schemes.status` (generating/complete/failed) |

No migration anywhere adds a table for chat messages, per-question answers, or a persisted garden profile for the new feature — confirmed absent.

### `PlantSchemeContext` state shape, for reference

```ts
interface PlantSchemeState {
  path: SchemePath | null; // "existing" | "scratch"
  phase: "questions" | "scheme";
  selectedGardenPlants: GardenPlantRef[];
  freeTextPlants: string[];
  questionIndex: number;
  outcomes: QuestionOutcome[];
  quickAnswered: boolean;
  finished: boolean;
  transcript: ChatEntry[];
  schemePlants: SchemePlant[];
  generationStatus: "idle" | "generating" | "complete";
}
```

Methods exposed: `startScheme`, `answerQuestion`, `skipQuestion`, `quickAnswer`, `completeFlow`, `addSuggestedPlant`, `removeSchemePlant`, `toggleShoppingList`, `beginGenerateScheme`, `finishGenerateScheme`, `sendRefinementMessage`, `chooseDirection`, `reopenDirection`, `reset`.

Scheme-plant IDs are composite so the same plant proposed twice tracks independently: garden-origin = `garden:${plantId}`; suggestion-origin = `${sourceEntryId}:${plantId}`.
