# Conversational Planting Scheme Journey — Feature Spec (Phase 1)

## Problem Statement

Plotted's current planting scheme journey follows a traditional guided-form pattern: fixed inputs, decision trees, fixed output. Gardening has too many variables — rare cultivars, near-identical look-alikes, unknown microclimate, personal preference — for a fixed journey to produce genuinely good recommendations. It also structurally biases output toward whatever's easy to represent in a form and illustrate with a stock photo, rather than what's actually the best plant for the situation.

Two specific weaknesses motivate this: recommendation quality is capped by how much nuance a form can capture, and current schemes are suspected to under-suggest unusual, diverse, or recently introduced plants because recommendation has been implicitly coupled to Wikimedia image availability.

## Goals

- Replace the fixed-form planting scheme journey with a conversational flow that elicits situational context (aspect, soil, existing plants, intent) progressively, producing higher-quality, more tailored recommendations than the current form-based version.
- Decouple recommendation quality from image availability — recommend the best plant for the situation first, illustrate opportunistically second.
- Build a reusable garden profile over time from chat interactions, so recommendation quality improves across a user's future schemes without them re-answering the same questions.
- Validate the conversational pattern in an isolated, low-risk way (parallel feature, existing journey untouched) before considering it for plant identification or other parts of the product.

## Non-Goals (Phase 1)

- **Spatial layout diagram.** Requires more structured input than the current back-of-border / mid-border / ground-cover model, and needs its own design thought. Existing three-tier structure is retained as-is.
- **Scheme forking.** Real data-modelling complexity (shared vs. snapshot history, multi-scheme UI) with no validated user demand yet. Continuous, additive refinement (see Requirements) covers most of the original motivation for wanting variations; revisit forking specifically if usage shows people want genuinely parallel versions rather than one evolving scheme.
- **Multiple gardens per user.** Noted as a plausible future need (e.g. distinct front/back garden conditions) but not required for this feature.
- **Garden settings page.** A dedicated page for users to directly view/edit stored profile facts. Needed eventually as the deliberate-correction mechanism, but not required to ship this feature.
- **"Clever" confidence-based override logic.** No attempt to infer whether a correction should update the garden baseline vs. stay scheme-scoped. See Requirements for the phase 1 rule.
- **Plant identification / disambiguation.** Out of scope for this feature entirely — see "Relationship to Plant ID" below.
- **Bounding/constraining open-ended refinement conversation.** Once a scheme exists, refinement chat is intentionally open — no scope-limiting logic in phase 1. Acknowledged as a likely future need (both for UX focus and for conversation-length/cost reasons) but deliberately deferred until real usage shows where it's actually needed.

## Relationship to Plant ID / Add-to-Garden

Early scoping assumed this feature and plant identification shared a design pattern and might share solving. On inspection they don't need to be solved together:

- Plants discussed or recommended in a scheme chat are **not** written to Plotted's own species database at any point in this flow.
- Users add recommended plants to a **shopping list** (existing behaviour, replicated as-is) rather than directly to their garden — because what they eventually buy (cultivar, availability) often won't exactly match the recommendation.
- Identity resolution against Plotted's database only happens when a shopping list item is marked **purchased**, using the existing add-to-garden lookup, unchanged.

This means the conversational scheme journey can reason and recommend completely freely — general horticultural knowledge, no requirement to match a curated record — without ever needing plant ID/disambiguation logic itself. Disambiguation remains a real problem, but it belongs entirely to the existing add-to-garden feature, to be improved separately.

## User Stories

- As a gardener with an established bed, I want to select plants already in my garden and describe what I'm hoping to add, so that I get a scheme tailored to what's already growing.
- As a gardener planning a new bed (e.g. veg for the season), I want to type the plants I'm considering from scratch, so that I can get a scheme without those plants needing to already be in my garden record.
- As a user answering setup questions, I want to skip any question I don't know the answer to, so that I'm not blocked from getting a scheme.
- As a user who wants a fast result, I want to stop the questions at any point and get the best answer possible with what I've given so far, so that I'm not forced through a long flow if I don't want one.
- As a returning user, I want the details I've already given (soil, aspect, etc.) to be remembered and applied to future schemes, so that I don't repeat myself every time.
- As a user with an unusual growing situation (e.g. a raised bed or shaded corner that doesn't match my garden's general conditions), I want to correct that in the moment, so that the recommendation reflects reality without it messing up what Plotted knows about the rest of my garden.
- As a user who likes a recommendation, I want to add it to my shopping list, so that I can buy it and add it to my garden later, the same way I do today.
- As a user reviewing my first proposed scheme, I want to keep talking to Plotted about it — ask questions, say what I like or don't, get suggestions swapped or added — so that the scheme keeps improving rather than being a one-shot result I have to start over to change.
- As a user refining a scheme, I want new plant suggestions to appear as proposals I explicitly choose to add, so that nothing gets added to my scheme without my say-so.
- As a user who isn't keen on the current suggestions, I want the option to remove any of them myself, so that I control exactly what's in my scheme at all times.
- As a user who wants a fundamentally different direction (not just a tweak), I want to be guided through a sharper brief rather than have my whole scheme wiped and replaced without warning.

## Requirements

### Must-Have (P0)

**Entry point: A/B choice**
- User is asked whether they want to build a scheme from existing garden plants (A) or from scratch (B).
- *Acceptance criteria:*
  - Given a user starts a new scheme, when they reach the entry point, then they are offered exactly two choices: "from existing plants" and "from scratch."

**Path A: existing plants**
- Retain current UI for selecting existing garden plants as the starting input.
- *Acceptance criteria:*
  - Given path A is selected, when the user reaches plant selection, then they see the existing plant-picker UI, unchanged from the current implementation.

**Path B: from scratch**
- User types the plant(s) they're considering (free text) as the starting input.
- *Acceptance criteria:*
  - Given path B is selected, when the user reaches plant entry, then they can type one or more plant names as free text with no requirement to match an existing record.

**Progressive, skippable question flow**
- After initial input, the chat asks clarifying questions one at a time (aspect, soil, size, intent, etc.) to refine the recommendation.
- Every question (from the second question onward) offers two explicit exits: **Skip** (move to the next question) and **Quick answer** (stop asking, generate the best possible scheme now).
- The very first question is exempt from "quick answer" — it must be answered or skipped before quick-answer becomes available — so that a scheme is never generated from literally zero context.
- The reason questions are being asked (building a profile for better answers, now and in future) is stated to the user up front.
- The "quick answer" option is presented with a clear expectation-setting statement that the result will be less tailored than continuing would produce.
- *Acceptance criteria:*
  - Given a user is mid-flow, when a question is presented, then Skip and Quick Answer are both visible and one tap/action away (question 1 excepted, per above).
  - Given a user selects Quick Answer, then no further questions are asked and a scheme is generated immediately from whatever context exists.
  - Given a user selects Skip, then the next question in sequence is presented, no data is recorded for the skipped question.

**Profile capture (garden-level)**
- No baseline garden knowledge is assumed at the start of any chat.
- Whatever context is given — however partial — is persisted to the garden's profile, regardless of how the conversation ends (fully answered, partially skipped, or quick-answered).
- This profile is applied as a starting point in future scheme chats for the same garden.
- *Acceptance criteria:*
  - Given a user provides any answer (including via a quick-answered flow that had partial context), then that information is saved against the garden record, not discarded.
  - Given a user starts a second scheme chat for the same garden, then previously captured profile data is used to skip or pre-fill relevant questions rather than asking again from scratch.

**Scheme-scoped overrides**
- If a user's answer in-chat conflicts with previously stored garden profile data (e.g. garden is generally free-draining, but this bed is different), the correction applies **only to the current scheme**, never silently overwriting the stored garden baseline.
- *Acceptance criteria:*
  - Given stored profile data conflicts with what the user says in a new chat, when the user provides the differing answer, then the scheme generated uses the new answer, and the garden's stored profile value remains unchanged.

**Open, unconstrained recommendations**
- Recommendations are generated using general horticultural reasoning, not limited to plants that exist as records in Plotted's own species database.
- Image availability (Wikimedia or otherwise) must not influence which plants are recommended.
- *Acceptance criteria:*
  - Given a scheme is generated, then recommended plants may include species/cultivars with no existing Plotted record and no available image.

**Existing structural model retained**
- Generated schemes continue to use the back-of-border / mid-border / ground-cover structure.
- *Acceptance criteria:*
  - Given a scheme is generated, then each recommended plant is categorised into one of the three existing structural tiers.

**Post-generation image lookup**
- Once a plant is added to the scheme (see "Explicit add" below), Plotted performs a best-effort Wikimedia image lookup for illustration purposes only.
- Missing images do not block or alter the scheme in any way.
- *Acceptance criteria:*
  - Given a plant has been added to the scheme, then it is checked against Wikimedia for an image; plants without a match display without an image, with no error state.

**Shopping list integration**
- Each plant on the scheme list has an "add to shopping list" action, replicating current shopping list behaviour exactly.
- Downstream shopping list behaviour (mark as purchased → full plant lookup / add to garden) is unchanged.
- *Acceptance criteria:*
  - Given a plant is on the scheme list, when the user adds it to their shopping list, then it behaves identically to adding a plant to the shopping list from the current scheme feature.

**Persistent split-pane experience (chat + scheme list)**
- The initial question flow and all subsequent refinement happen in **one continuous experience**, not a hand-off from a chat step to a separate results step. The chat and the current scheme list are both visible together (split pane) throughout, before and after the first plants are added.
- There is no terminal "results" screen and no "start over to make a change" pattern. The first scheme is a checkpoint within the conversation, not its endpoint.
- *Acceptance criteria:*
  - Given a user is at any point past the initial question flow, then the chat and the current scheme list are both visible/reachable together, not on separate sequential screens.
  - Given a scheme has plants on it, then the user can continue the same conversation to refine it without navigating away or resetting.

**Inline suggestions, always explicit add**
- The LLM never writes directly to the scheme list. New plant suggestions (whether prompted by a direct question, a swap request, a vague dislike, or a broader pivot) are presented as selectable proposals inline in the chat, using a pattern consistent with option-presentation seen in Claude/Claude Code chat interfaces.
- The user must take an explicit action (e.g. tap/select) to add a suggested plant to the scheme list. Suggesting is never the same as adding.
- *Acceptance criteria:*
  - Given the LLM proposes one or more plants in response to any user message, then those plants appear as inline, individually selectable cards in the chat — not automatically reflected in the scheme list.
  - Given a user selects a suggested plant, then it is added to the scheme list, and the addition is clearly reflected in the split-pane list.
  - Given the user takes no action on a suggestion, then the scheme list remains unchanged.

**Always explicit remove**
- Removing a plant from the scheme list is always a deliberate, app-level UI action (e.g. a remove/dismiss control on the plant's card in the list) — never inferred from chat text and never a side effect of any LLM response.
- *Acceptance criteria:*
  - Given a plant is on the scheme list, then a visible remove action is available on it at all times.
  - Given a user expresses dislike or a swap request in chat (e.g. "swap the lavender," "not keen on this one"), then the LLM may propose an alternative and/or remind the user they can remove the plant themselves, but the existing plant is never removed automatically.

**No destructive regenerate — sharper brief instead**
- There is no "regenerate everything" operation that replaces the scheme list without explicit user action. When a user expresses broad dissatisfaction or wants a fundamentally different direction, the LLM elicits a sharper brief (e.g. a short set of directional options — such as a thematic/style pivot — presented inline, consistent with the same suggestion-card pattern) rather than wiping and replacing the list.
- Suggestions generated from a sharper brief follow the same explicit-add rule as any other suggestion. Existing plants on the list are untouched unless the user removes them individually.
- *Acceptance criteria:*
  - Given a user expresses broad dissatisfaction with the current suggestions, then the LLM responds with clarifying direction-options rather than an unprompted full-list replacement.
  - Given the user selects a direction, then new suggestions are presented inline as proposals (per "Inline suggestions, always explicit add" above) — no existing scheme-list plant is added or removed without separate, explicit user action.

**Reopen and continue**
- A scheme (whether "generated" — i.e. first plants added — or still in progress) can always be reopened, with the full split-pane chat + list experience available to keep refining it. There is no separate regenerate-and-overwrite operation, since ongoing refinement already happens additively within the same persistent conversation (see above).
- *Acceptance criteria:*
  - Given a previously started or generated scheme, when the user reopens it, then the prior chat context and current scheme list are both available, and refinement can continue exactly as it would have in the original session.

**Parallel, isolated feature**
- Built as an entirely new feature, separate from the current planting scheme journey. Existing users continue to see and use the current version unaffected during testing.
- *Acceptance criteria:*
  - Given the new feature is live for testing, then existing users' access to and experience of the current planting scheme journey is unchanged.

### Nice-to-Have (P1)

- Richer framing/copy around *why* each question is being asked (beyond a generic one-time explanation), if early testing shows users dropping off or confused by the question flow.
- Basic instrumentation on how often Quick Answer / Skip are used per flow, to sanity-check whether profile-building is actually happening in practice (see Open Questions).

### Future Considerations (P2)

- Scheme forking (variations from a shared starting point).
- Spatial layout diagram, once enough structured input can be gathered to generate one meaningfully.
- Multiple gardens per user, with independent profiles (e.g. distinct front/back garden conditions).
- Garden settings page for direct, deliberate viewing/editing of stored profile data.
- Smarter (non-conditional) handling of when an in-chat correction should update the garden baseline vs. stay scoped to one scheme.

## Success Metrics

**Leading indicators**
- Completion rate: % of started chats that reach at least one plant added to the scheme list (any exit path from the initial question flow — full flow, skipped, or quick-answered).
- Quick Answer usage rate: % of scheme chats ending via Quick Answer rather than a fuller flow — informative for both product tuning and for understanding how much genuine profile-building is happening.
- Refinement engagement: % of schemes where the user sends at least one message after the first plant is added (i.e. genuinely continues the conversation, not just a one-shot generation).
- Suggestion acceptance rate: % of inline suggested plants that get explicitly added, vs. ignored or left on-screen.
- Shopping list conversion: % of schemes with at least one plant added to the shopping list.
- Profile reuse rate: % of second-and-later scheme chats (same garden) where previously stored profile data was available to pre-fill or skip questions.

**Lagging indicators**
- Purchase-through rate: % of shopping-list items from this feature later marked purchased and added to garden.
- Qualitative comparison against the existing scheme feature (e.g. user feedback, side-by-side satisfaction) once both are live in parallel.

Specific targets are not set here — recommend establishing a baseline from the current feature's equivalent metrics (where available) before setting thresholds.

## Open Questions

- **(Engineering)** Is "garden" already modelled as a distinct entity in the data schema, or currently flattened 1:1 with user? Doesn't block phase 1, but affects how easily multi-garden (P2) can be added later without rework.
- **(Engineering/Design)** What does the one-time explanatory copy say when first introducing the question flow to a user — has this been drafted, or does it need writing as part of this feature?
- **(Product)** At what point, if ever, should a scheme-scoped correction prompt the user to ask whether it should also update their garden-level profile? Deferred to garden settings (P2) per current decision, but worth revisiting once real usage data shows how often this situation arises.
- **(Data)** What's the minimum viable schema for a "profile fact" (source: which scheme, which question, confidence/scope) to support scheme-scoped overrides without conflating them with garden baseline data?
- **(Product)** How does the LLM distinguish "vague dislike, just acknowledge and remind about manual removal" from "clear substitution request, proactively suggest an alternative" (e.g. "not really feeling the lavender" vs. "swap the lavender for something else")? A prompt-design question for the conversation-engine stage, not an architectural one, but worth deciding deliberately rather than left to default model behaviour.
- **(Product)** Do older suggestion-cards in the chat scrollback need any visual treatment (fading, grouping) once a clear directional pivot has happened, or is unlimited scrollback acceptable for phase 1? Treated as P1 polish, not blocking.
- **(Engineering)** Since conversations can now continue indefinitely after the first scheme exists, at what point (if any) does conversation history get summarised/trimmed for cost and context-window reasons? Related to, but broader than, the original reopen/edit token-cost note — worth monitoring rather than solving pre-emptively.

## Timeline Considerations

- No hard external deadline identified.
- Suggested phasing: ship phase 1 as scoped above, in parallel with the existing feature, before committing to any P1/P2 item. Treat this as a genuine test of the conversational pattern — both for planting scheme itself and as a precedent for whether the same approach is worth extending to plant identification.
