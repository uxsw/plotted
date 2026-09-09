/**
 * Dev-only preview seed for the split-pane planting-scheme workspace.
 *
 * When `/plant-scheme/chat?preview=1` is opened directly (typed or bookmarked),
 * PlantSchemeContext initialises its state to this object instead of
 * INITIAL_STATE, landing straight on the split-pane view with representative
 * mock content — no entry / picker / question flow to walk through on every
 * refresh while iterating on ChatPane / SchemeListPane / PlantCard.
 *
 * This is a development convenience only. It has no effect unless the exact
 * `?preview=1` query param is present, and it is never reachable from the real
 * flow (which navigates to `/plant-scheme/chat` with a bare path). Nothing here
 * is persisted.
 *
 * The state is fully deterministic — repeated refreshes show the identical
 * layout, so visual changes can be compared cleanly. All content is reused from
 * ./mockData.ts; none of it is new placeholder copy.
 *
 * Coverage exercised by this seed:
 *  - garden-origin plants (Path A): one with a photo, one without
 *  - a garden-origin plant already toggled onto the shopping list
 *  - suggestion-origin plants across all three tiers (back / mid / ground)
 *  - suggestion cards in both states: some plants added (flipped to "Added"
 *    in scrollback + present on the list), some still pending ("+ Add")
 *  - per-card add-state: MOCK `s3` is added from the initial card but still
 *    pending in the follow-up card that re-proposes it
 *  - transcript with the Q&A recap (from `outcomes`, incl. one "Skipped"),
 *    an initial suggestion card, a follow-up suggestion card, and a
 *    directions card
 */

import type {
  ChatEntry,
  PlantSchemeState,
  QuestionOutcome,
  SchemePlant,
  SuggestionPlant,
} from "./PlantSchemeContext";
import {
  MOCK_DIRECTION_OPTIONS,
  MOCK_FOLLOWUP_SUGGESTIONS,
  MOCK_SUGGESTIONS,
  type MockSuggestion,
} from "./mockData";

/**
 * Stable transcript-entry ids for this seed. They only need to be internally
 * consistent (the composite scheme-plant ids below are built from them) — they
 * deliberately do NOT reuse the real flow's INITIAL_SUGGESTIONS_ENTRY_ID, since
 * preview never runs completeFlow().
 */
const INITIAL_CARD_ID = "preview-initial-suggestions";
const FOLLOWUP_CARD_ID = "preview-followup-suggestions";
const DIRECTIONS_CARD_ID = "preview-directions";

function toSuggestionPlants(mocks: MockSuggestion[]): SuggestionPlant[] {
  return mocks.map((m) => ({
    plantId: m.id,
    commonName: m.commonName,
    latinName: m.latinName,
    tier: m.tier,
    note: m.note,
    badges: m.badges,
    months: m.months,
  }));
}

/** A suggestion-card plant that has been added onto the scheme list. */
function addedFromCard(
  cardId: string,
  mock: MockSuggestion,
  addedToShoppingList = false
): SchemePlant {
  return {
    id: `${cardId}:${mock.id}`,
    origin: "suggestion",
    sourceEntryId: cardId,
    plantId: mock.id,
    commonName: mock.commonName,
    latinName: mock.latinName,
    tier: mock.tier,
    note: mock.note,
    badges: mock.badges,
    months: mock.months,
    photoUrl: null,
    addedToShoppingList,
  };
}

/** Path A garden plants the user "selected" in the picker step. */
const GARDEN_PLANTS = [
  {
    plantId: "preview-garden-geum",
    commonName: "Geum 'Totally Tangerine'",
    latinName: "Geum coccineum",
    photoUrl: "/demo-thumb-geum.jpg",
  },
  {
    plantId: "preview-garden-alchemilla",
    commonName: "Lady's mantle",
    latinName: "Alchemilla mollis",
    photoUrl: null,
  },
] as const;

/** Garden-origin scheme-list rows — same shape completeFlow() produces. */
const GARDEN_SCHEME_PLANTS: SchemePlant[] = GARDEN_PLANTS.map((g, i) => ({
  id: `garden:${g.plantId}`,
  origin: "garden" as const,
  sourceEntryId: null,
  plantId: g.plantId,
  commonName: g.commonName,
  latinName: g.latinName,
  tier: null,
  note: "",
  badges: [],
  months: [],
  photoUrl: g.photoUrl,
  // First garden plant is already on the shopping list — exercises that row state.
  addedToShoppingList: i === 0,
}));

/**
 * Suggestion-origin rows already on the list. `s1`/`s3`/`s5` span back / mid /
 * ground; `s3` is also toggled onto the shopping list. Their siblings in
 * MOCK_SUGGESTIONS (`s2`/`s4`/`s6`) stay pending in the initial card. `f1` is
 * added from the follow-up card; the re-proposed `s3` in that same card stays
 * pending, proving add-state is per card.
 */
const SUGGESTION_SCHEME_PLANTS: SchemePlant[] = [
  addedFromCard(INITIAL_CARD_ID, MOCK_SUGGESTIONS[0]), // s1 — back
  addedFromCard(INITIAL_CARD_ID, MOCK_SUGGESTIONS[2], true), // s3 — mid, on shopping list
  addedFromCard(INITIAL_CARD_ID, MOCK_SUGGESTIONS[4]), // s5 — ground
  addedFromCard(FOLLOWUP_CARD_ID, MOCK_FOLLOWUP_SUGGESTIONS[0]), // f1 — mid
];

const OUTCOMES: QuestionOutcome[] = [
  { questionId: "aspect", type: "answered", answer: "Full sun — faces south-west" },
  { questionId: "soil", type: "answered", answer: "Free-draining" },
  { questionId: "intent", type: "answered", answer: "Pollinators and year-round colour" },
  { questionId: "style", type: "skipped" },
];

const TRANSCRIPT: ChatEntry[] = [
  {
    kind: "text",
    id: "preview-scheme-intro",
    role: "assistant",
    text: "Here's a starting scheme based on your answers. Add what you like, then keep talking to refine it.",
  },
  {
    kind: "suggestions",
    id: INITIAL_CARD_ID,
    title: "A starting scheme — pick the ones you want on your list.",
    plants: toSuggestionPlants(MOCK_SUGGESTIONS),
  },
  {
    kind: "text",
    id: "preview-user-1",
    role: "user",
    text: "Can you give me a few more options for the middle of the border?",
  },
  {
    kind: "text",
    id: "preview-assistant-1",
    role: "assistant",
    text: "Here are a couple more that could work — add any you like.",
  },
  {
    kind: "suggestions",
    id: FOLLOWUP_CARD_ID,
    title: "More suggestions",
    plants: toSuggestionPlants(MOCK_FOLLOWUP_SUGGESTIONS),
  },
  {
    kind: "text",
    id: "preview-user-2",
    role: "user",
    text: "I don't like how pink-heavy this is — I want something different.",
  },
  {
    kind: "text",
    id: "preview-assistant-2",
    role: "assistant",
    text: "Sounds like you want a different direction rather than a tweak. Pick one to explore — nothing already on your list changes.",
  },
  {
    kind: "directions",
    id: DIRECTIONS_CARD_ID,
    title: "Which direction?",
    options: MOCK_DIRECTION_OPTIONS,
  },
];

export const PREVIEW_SEED_STATE: PlantSchemeState = {
  path: "existing",
  phase: "scheme",
  selectedGardenPlants: GARDEN_PLANTS.map((g) => ({ ...g })),
  freeTextPlants: [],
  questionIndex: OUTCOMES.length,
  outcomes: OUTCOMES,
  quickAnswered: false,
  finished: true,
  transcript: TRANSCRIPT,
  schemePlants: [...GARDEN_SCHEME_PLANTS, ...SUGGESTION_SCHEME_PLANTS],
};
