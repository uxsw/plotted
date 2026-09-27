# Stage 3: real in-chat suggestions — conversation engine proposal

**Date:** 2026-09-27 · **Status:** approved; 3a (engine) built — see [3a status](#3a-status) at the end.

Stages 1–2 (draft persistence, save/generate) are infrastructure around an empty centre: every suggestion a gardener sees *during* the conversation is static content from `mockData.ts` (`MOCK_SUGGESTIONS`, `MOCK_FOLLOWUP_SUGGESTIONS`, `MOCK_DIRECTION_OPTIONS`), whatever they say. This stage replaces that with real generation.

## Decisions (2026-09-27)

1. **Model:** stays on `claude-sonnet-4-6`, the same model as every other generation call site — consistent with the app's cost profile, which matters more now this is a per-turn cost rather than per-scheme. Structured outputs support was verified with a live call (the SDK docs' model list doesn't name 4.6, but the API accepts `output_config.format` on it), so the proposal's structured-output approach stands.
2. **Schema validation:** a hand-written JSON schema passed to `output_config.format`, **not zod** — no new direct dependency, and the merge step still validates by hand like the other four call sites.
3. **Rate limiting ships in 3a, with the engine** — a simple per-user hourly cap, following the existing `lib/identification/dailyLimit.ts` pattern.
4. **Transport:** stateless `POST /api/plant-scheme/turn` (client sends its draft state + the new turn), not a `[draftId]`-anchored route — see §1.

## Headline findings

1. **The add/remove contract does not need to change.** Real output lands entirely inside `ChatEntry` content; `addSuggestedPlant` / `removeSchemePlant` are untouched, and the finalize step still only reads `schemePlants`.
2. **The context API does need to change — the significant finding.** `sendRefinementMessage`, `chooseDirection` and `completeFlow` currently *manufacture* the assistant's response locally and synchronously. With a real model the response comes from the network, so these become "commit a completed turn" functions that take entries as arguments. ChatPane↔context plumbing, not the add/remove contract — but a change to the context's public signatures.
3. **Initial suggestions sit outside ChatPane's state machine today.** `completeFlow()` (called from `QuestionFlow`) posts `MOCK_SUGGESTIONS` synchronously — no loading, stall or failure path. Making it real needs a new async "initial turn". Biggest UX change in the stage.
4. **Reply text can misrepresent the contract** ("I've added salvia to your list") and code can't enforce against that. The system prompt explicitly forbids claiming any add/remove; copy review should check for it.
5. **Types fit as-is** — no reshaping of `SuggestionPlant` / `DirectionOption` (see §6).

## 1. What triggers a call, and what gets sent

| Trigger | Model call? | Context |
|---|---|---|
| **Initial** (after `completeFlow`) | Yes | Brief · list plants (garden-origin enriched from `plants` rows, as the save route does) · typed plants · ~6 plants across all tiers |
| **Follow-up message** (`sendRefinementMessage`) | Yes | Brief · list plants · avoid-list · compacted recent exchange · the new message |
| **Direction pick** (`chooseDirection`) | Yes, except "Something else" | As follow-up + the chosen option's label/blurb as the steer, and the options passed over |
| **"Something else — I'll describe it"** | No | Local assistant prompt, as today |
| **`reopenDirection`** | No | Purely local un-stamp |

**Brief:** answered questions (labelled like `QUESTION_LABELS`), *skipped* questions listed explicitly so the model doesn't assume, the `quickAnswered` flag, typed plants as context.
**List plants:** name/latin/tier/months — the model needs them to reason about what's chosen (tier gaps, flowering gaps, style consistency).
**Compacted exchange, not the raw transcript:** user messages verbatim (capped at 300 chars), the assistant's reply texts, and one line per panel (`[Suggested: Knautia (…), Molinia (…)]`, `[Offered directions: …; they chose "…"]`). No card JSON, ids or badges.

**Transport — stateless route.** `/[draftId]/turn` reading from the DB would force the initial turn to wait for the async draft insert, need a `flushDraft` before every turn, break preview mode, and turn stage 1's "draft create failed → carry on unsaved" fallback into a dead end (fixing that would mean touching stage 1). The trust cost is negligible: output only goes back to the same client and is never persisted server-side. State is still validated and capped server-side.

## 2. Replacing keyword-sniffing with real judgement

One call per turn; the model selects the response shape. No pre-classification step (double latency, same context needed anyway).

**Codebase precedent:** all four existing calls ask for JSON in the prompt, strip fences and hand-parse; nothing used structured outputs or tool use. This stage reuses the stage-2 split (pure builder + pure merge/validate, unit-tested; SDK call in its own file) and upgrades the transport to structured outputs, because in chat a malformed response is a user-visible failed turn, and turns are far more frequent than saves.

**Schema:** flat with a discriminator rather than `anyOf` — `reply` (always), `response_type` (`suggestions | directions | text`), `suggestions_title`, `plants[]` (common/latin name, tier, `note`, `badges` limited to the existing 8-badge vocabulary, `flowering_months`, `match_note`), `direction_options[]` (label, blurb). Empty strings, not nulls, mean "none". The merge function enforces what the schema can't (which arrays must be empty, option counts, degrade-to-text).

**Response-shape rules** (also answers spec_2's open product question, line 202):
- **suggestions** — asks for more / specific / a swap ("swap the lavender"). Propose alternatives and remind them they can remove the original themselves; never remove.
- **text** — questions ("will salvia survive frost?"); vague dislike of one plant → acknowledge + remind they can remove it.
- **directions** — broad dissatisfaction → **exactly 3** generated options; code appends the fixed "Something else" (preserves the 4-option ceiling).
- Initial and direction turns must return suggestions; an initial turn with no surviving plants is a failed, retryable turn.

Wording needs a copy pass with Natalie.

## 3. Diversity guard, from day one

1. **Prompt:** reuses `generateScheme()`'s wording verbatim — *"favour a mix of well-known and less common plants suited to the conditions, rather than defaulting to the most obvious choice every time"* — plus "at most one plant per genus per reply", and the new latin-name wording from `ddd9053`. **The prompt never mentions images or image lookup** (the old "avoid cultivar names, to support reliable image lookup" was exactly the Wikimedia coupling the spec forbids); a test asserts this.
2. **In-session avoid-list, as two lists:** "on their list" (reason about, don't re-suggest) and "already suggested this session" (don't repeat — and not-added ≠ disliked).
3. **Enforced in code, not just asked:** the merge drops any returned plant whose species-level key (lowercase genus + epithet, cultivar and hybrid marker ignored) matches either list or repeats within the reply. The hard filter costs no UX — earlier cards stay in scrollback with a live Add button, so a re-proposal is never needed.
4. **Measurement:** latin names per turn are logged (`[scheme-conversation] suggested: …`) to watch for convergence on real traffic.
5. **Cross-session avoid-list:** out of scope; natural extension. Note: the raw data already exists (`scheme_suggestions` per user's past schemes), so a basic version may not need to wait for profile persistence.

## 4. Cost/latency and the "thinking" UX

**ChatPane fit:** mostly clean. `attemptTurn` is already `fetch().then(apply).catch(setFailed)`-shaped, and a failed turn leaves the transcript clean (the user bubble lives in `turnState` and only commits on success). Needed:
- a **client timeout** (~45s) rejecting into `failed` — the mock can't hang, a real fetch can;
- remove `/fail`, `SIMULATED_FAILURE_DELAY_MS`, `THINK_MS`;
- a new `PendingTurn` kind `initial` (no user bubble; Retry only);
- a **rehydration rule**: phase `scheme` with no `INITIAL_SUGGESTIONS_ENTRY_ID` in the transcript → fire the initial turn on mount (derived from content, like `generationStatus`);
- a hard refresh mid-turn loses the in-flight message — acceptable, but a regression from the mock's 700ms turns;
- map the route's `429 { error: "rate_limited" }` to its own wording (not the generic failure) — Retry won't help within the hour.

**Cost/latency (measured in 3a smoke run):** ~1.9–2.5k input / 140–600 output tokens per turn → roughly $0.01 per turn at Sonnet 4.6 pricing. Latency 5–10s for follow-ups; 16.7s for the first initial turn (includes the one-time schema compilation, cached 24h). Routinely past `STALL_MS` (6s), so "Still thinking…" will show.

**Streaming: blocking per turn for v1.** No precedent anywhere in the codebase; the useful part (cards) isn't usable until the JSON is complete; and streaming breaks the atomic-turn guarantee. Revisit as sub-stage 3e if measured p50 > ~8s: stream only the reply text, still commit cards atomically.

## 5. Where it lives

New files, mirroring stage 2 — not `scheme-generation.ts`, which is the isolated `/schemes` stack and a different shape (one-shot, returns a scheme, not `ChatEntry[]`).

- `lib/scheme-conversation.ts` — pure: `ConversationTurn`, `parseConversationTurn`, `buildConversationContext(state, gardenRows)`, `resolveDirectionChoice`, `CONVERSATION_SYSTEM_PROMPT`, `buildConversationPrompt`, `CONVERSATION_RESPONSE_SCHEMA`, `mergeConversationResponse(raw, ctx, turn, mkId): ChatEntry[]`, `speciesKey`.
- `lib/scheme-conversation-generation.ts` — `generateConversationTurn(ctx, turn, direction, mkId)`.
- `lib/scheme-conversation-limit.ts` — `enforceHourlySchemeTurnLimit`.
- `app/api/plant-scheme/turn/route.ts` — auth, body cap, validation, rate limit, garden-row enrichment.

Planned context signatures (3b/3c): `sendRefinementMessage(text, entries)`, `chooseDirection(entryId, option, entries)`, `applyInitialSuggestions(entries)`; `completeFlow()` keeps the phase flip and garden seeding but stops posting suggestions. `PlantSchemeContext` should import `INITIAL_SUGGESTIONS_ENTRY_ID` from `lib/scheme-conversation.ts` (it's duplicated for now — server code can't import values from a `"use client"` module).

## 6. What does not change

Explicit add/remove UI contract, split-pane layout, the stage-2 save/generate pipeline, stage-1 draft persistence/write-through (the stateless route means stage 1 needs no edits). `MOCK_QUESTIONS` stays static — the question flow isn't in scope.

Type fit: `plantId` becomes a server-assigned id unique within its entry (`p1…pN`), so the `${entryId}:${plantId}` composite ids keep working; `badges` constrained to the existing vocabulary; `matchNote` comes from the model under the same "omit rather than fabricate" rule. `buildMatchNote` / `MockSun` / `MockSoil` then only serve the preview seed.

## Risks

- **Rate limit bypass:** `user_flags` is user-writable under RLS, so a determined user could reset their own counter — the same accepted weakness as the identify limit. It's an abuse guard at private-beta scale, not a quota. Failed turns count against the allowance (the cap is generous enough that this shouldn't bite).
- **No saved-draft check** on the stateless route; the client already locks the chat while saving, and `updatePlantSchemeDraft` refuses writes to saved drafts, so a stray turn can't persist.
- **Route timeout:** `maxDuration = 60` set on the route; confirm the host honours it.

## Staging and effort (~4–6 days excluding streaming)

| Sub-stage | Scope | Estimate |
|---|---|---|
| **3a Engine** | Pure builder/merge + tests, SDK call, route, rate limit. No UI change. | 1.5–2 days — **done** |
| **3b Follow-up + direction turns** | Swap `mockAttempt` for the real call; context signature changes; remove `DISLIKE_MARKERS` and `/fail`; client timeout; 429 copy | ~1 day |
| **3c Initial turn** | Async `completeFlow`, `initial` turn kind, rehydration rule | ~1 day (riskiest UX piece) |
| **3d Tuning** | Response-shape rules + copy with Natalie; horticultural-fit and latency pass on real runs | ~1 day |
| *3e (optional)* | Stream reply text only | 1–2 days, only if p50 > ~8s |

3b before 3c: it exercises the existing state machine unchanged, so engine problems surface before the new initial-turn state goes in.

## 3a status

Built:
- `supabase/migrations/034_scheme_turn_limit.sql` — `user_flags.scheme_turn_count` / `scheme_turn_window_start`. **Must be applied before the route works** — the limiter fails closed (500) if it can't read or write the counter.
- `lib/scheme-conversation-limit.ts` — 40 turns/user/hour, fixed hourly window, same read-then-upsert shape as `dailyLimit.ts` but failing closed. Tested.
- `lib/scheme-conversation.ts` + tests; `lib/scheme-conversation-generation.ts`; `app/api/plant-scheme/turn/route.ts`.
- Not wired into the UI — `/plant-scheme` still runs on mocks until 3b.

**Smoke run against the real model** (partial shade, heavy clay, pollinators, cottage; typed "Lavender"): every turn type produced the right shape — initial (6 plants, all tiers), swap request → alternatives + "you can remove it yourself" reminder with no claim of changing the list, care question → text, "none of this feels right" → 3 tailored directions + the fixed fourth, direction pick → 4 on-theme plants. 13 suggestions, no repeats, a reasonable spread of less-common plants (Veronicastrum, Galega, Rodgersia, Trollius).

**Quality notes for 3d** (prompt-tunable, not engine bugs):
- *Horticultural fit:* initial scheme included *Salvia nemorosa 'Caradonna'* (badged drought tolerant) for a partial-shade, heavy-clay bed, justified only by "complements the lavender you mentioned" — and didn't flag that lavender itself suits neither. Likely wants an instruction to weigh conditions over typed-plant affinity and to gently flag a typed plant that won't suit the bed.
- *Badges:* some are generous (Rodgersia badged Pollinators).
- *Referent ambiguity:* "Will these cope with a very wet winter?" was answered about the latest suggestions, not the list; the answer also said "all three" while naming four plants.
