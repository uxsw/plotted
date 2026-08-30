"use client";

/**
 * Cross-route client state for the conversational planting scheme shell.
 *
 * Stage 1 (UI / state-shape only). Nothing here is persisted — not to a
 * database and not to browser storage — and there is no AI wiring. The question
 * flow and every "assistant" response are driven off hardcoded mock content
 * (see ./mockData.ts).
 *
 * The provider is mounted in the segment layout, so state survives client-side
 * navigation between /plant-scheme sub-routes. A hard refresh mid-flow loses the
 * state and the step guards send the user back to the entry point.
 *
 * Deliberately isolated: this file shares no code path with the existing
 * /schemes feature.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  MOCK_DIRECTION_FOLLOWUP,
  MOCK_DIRECTION_OPTIONS,
  MOCK_FOLLOWUP_SUGGESTIONS,
  MOCK_SUGGESTIONS,
  type MockSuggestion,
} from "./mockData";

export type SchemePath = "existing" | "scratch";
export type SchemePhase = "questions" | "scheme";
export type SchemeTier = "back" | "mid" | "ground";

export type QuestionOutcome = {
  questionId: string;
  /** "answered" — user typed/selected a reply; "skipped" — user pressed Skip. */
  type: "answered" | "skipped";
  answer?: string;
};

/** A plant as proposed inside a chat suggestion card (not yet on the list). */
export interface SuggestionPlant {
  plantId: string;
  commonName: string;
  latinName: string;
  tier: SchemeTier;
  note: string;
  badges: string[];
}

/** A plant the user has explicitly added to the scheme list pane. */
export interface SchemePlant extends SuggestionPlant {
  /**
   * Composite key `${sourceEntryId}:${plantId}` — unique per originating
   * suggestion card, so the same plant proposed by two different cards tracks
   * its added-state independently and can't collide.
   */
  id: string;
  sourceEntryId: string;
  /** Mocked "add to shopping list" state — no network call. */
  addedToShoppingList: boolean;
}

export interface DirectionOption {
  id: string;
  label: string;
  blurb: string;
}

/** One entry in the post-question-flow conversation transcript. */
export type ChatEntry =
  | { kind: "text"; id: string; role: "assistant" | "user"; text: string }
  | { kind: "suggestions"; id: string; title: string; plants: SuggestionPlant[] }
  | { kind: "directions"; id: string; title: string; options: DirectionOption[] };

export interface PlantSchemeState {
  /** Which entry path the user chose, or null before the A/B choice. */
  path: SchemePath | null;
  /** "questions" = still in Q1–Q4 flow; "scheme" = persistent split-pane view. */
  phase: SchemePhase;
  /** Path A: ids of garden plants selected in the picker. */
  selectedPlantIds: string[];
  /** Path A: display labels for the selected plants. */
  selectedPlantLabels: string[];
  /** Path B: free-text plant names the user entered. */
  freeTextPlants: string[];
  /** Index of the question currently being asked. */
  questionIndex: number;
  /** One entry per question the user has answered or skipped, in order. */
  outcomes: QuestionOutcome[];
  /** True once the user pressed "Quick answer" to stop the flow early. */
  quickAnswered: boolean;
  /** True once the initial question flow has completed (any exit path). */
  finished: boolean;
  /** The refinement conversation that follows the question flow. */
  transcript: ChatEntry[];
  /** Plants explicitly added to the scheme list pane. */
  schemePlants: SchemePlant[];
}

export interface PlantSchemeContextValue extends PlantSchemeState {
  choosePath: (path: SchemePath) => void;
  setSelectedPlants: (ids: string[], labels: string[]) => void;
  setFreeTextPlants: (names: string[]) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  skipQuestion: (questionId: string) => void;
  /** Stop asking questions (does not itself change phase). */
  quickAnswer: () => void;
  /**
   * End the question flow and enter the split-pane view, posting the initial
   * batch of mocked suggestions into the chat. Safe to call more than once.
   */
  completeFlow: () => void;
  /** Explicit add: move a proposed plant from a card onto the scheme list. */
  addSuggestedPlant: (sourceEntryId: string, plant: SuggestionPlant) => void;
  /** Explicit remove: take a plant off the scheme list (by composite id). */
  removeSchemePlant: (id: string) => void;
  /** Mocked shopping-list toggle on a scheme-list plant (by composite id). */
  toggleShoppingList: (id: string) => void;
  /** Send a free-text refinement message; posts a mocked assistant response. */
  sendRefinementMessage: (text: string) => void;
  /** Pick one of the inline "directional options"; posts follow-up suggestions. */
  chooseDirection: (sourceEntryId: string, option: DirectionOption) => void;
  /** Wipe all state — used by "Start over". */
  reset: () => void;
}

const INITIAL_STATE: PlantSchemeState = {
  path: null,
  phase: "questions",
  selectedPlantIds: [],
  selectedPlantLabels: [],
  freeTextPlants: [],
  questionIndex: 0,
  outcomes: [],
  quickAnswered: false,
  finished: false,
  transcript: [],
  schemePlants: [],
};

const INITIAL_SUGGESTIONS_ENTRY_ID = "entry-initial-suggestions";

/** Crude mock trigger for the "I want something different" path. Not real NLU. */
const DISLIKE_MARKERS = [
  "don't like",
  "dont like",
  "do not like",
  "something else",
  "different",
  "not keen",
  "not sure about",
  "hate",
  "start again",
];

function toSuggestionPlants(mocks: MockSuggestion[]): SuggestionPlant[] {
  return mocks.map((m) => ({
    plantId: m.id,
    commonName: m.commonName,
    latinName: m.latinName,
    tier: m.tier,
    note: m.note,
    badges: m.badges,
  }));
}

const PlantSchemeContext = createContext<PlantSchemeContextValue | null>(null);

export function PlantSchemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlantSchemeState>(INITIAL_STATE);
  const idCounter = useRef(0);
  const mkId = useCallback((prefix: string) => `${prefix}-${++idCounter.current}`, []);

  const choosePath = useCallback((path: SchemePath) => {
    setState((s) => ({ ...s, path }));
  }, []);

  const setSelectedPlants = useCallback((ids: string[], labels: string[]) => {
    setState((s) => ({ ...s, selectedPlantIds: ids, selectedPlantLabels: labels }));
  }, []);

  const setFreeTextPlants = useCallback((names: string[]) => {
    setState((s) => ({ ...s, freeTextPlants: names }));
  }, []);

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

  const completeFlow = useCallback(() => {
    setState((s) => {
      if (s.phase === "scheme") return s;
      const initialEntry: ChatEntry = {
        kind: "suggestions",
        id: INITIAL_SUGGESTIONS_ENTRY_ID,
        title: "Placeholder: a starting scheme — pick the ones you want on your list.",
        plants: toSuggestionPlants(MOCK_SUGGESTIONS),
      };
      return {
        ...s,
        phase: "scheme",
        finished: true,
        transcript: [
          {
            kind: "text",
            id: "entry-scheme-intro",
            role: "assistant",
            text: s.quickAnswered
              ? "Placeholder: here's a starting scheme from what you've told me so far — less tailored than finishing the questions would be. Add what you like, then keep talking to refine it."
              : "Placeholder: here's a starting scheme based on your answers. Add what you like, then keep talking to refine it.",
          },
          initialEntry,
        ],
      };
    });
  }, []);

  const addSuggestedPlant = useCallback((sourceEntryId: string, plant: SuggestionPlant) => {
    const compositeId = `${sourceEntryId}:${plant.plantId}`;
    setState((s) => {
      if (s.schemePlants.some((p) => p.id === compositeId)) return s;
      return {
        ...s,
        schemePlants: [
          ...s.schemePlants,
          { ...plant, id: compositeId, sourceEntryId, addedToShoppingList: false },
        ],
      };
    });
  }, []);

  const removeSchemePlant = useCallback((id: string) => {
    setState((s) => ({ ...s, schemePlants: s.schemePlants.filter((p) => p.id !== id) }));
  }, []);

  const toggleShoppingList = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      schemePlants: s.schemePlants.map((p) =>
        p.id === id ? { ...p, addedToShoppingList: !p.addedToShoppingList } : p
      ),
    }));
  }, []);

  const sendRefinementMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      const wantsDifferent = DISLIKE_MARKERS.some((m) => lower.includes(m));

      const userEntry: ChatEntry = {
        kind: "text",
        id: mkId("entry-user"),
        role: "user",
        text: trimmed,
      };

      const responseEntries: ChatEntry[] = wantsDifferent
        ? [
            {
              kind: "text",
              id: mkId("entry-assistant"),
              role: "assistant",
              text: "Placeholder: sounds like you want a different direction rather than a tweak. Pick one to explore — nothing already on your list changes.",
            },
            {
              kind: "directions",
              id: mkId("entry-directions"),
              title: "Placeholder: which direction?",
              options: MOCK_DIRECTION_OPTIONS,
            },
          ]
        : [
            {
              kind: "text",
              id: mkId("entry-assistant"),
              role: "assistant",
              text: "Placeholder: here are a couple more that could work — add any you like.",
            },
            {
              kind: "suggestions",
              id: mkId("entry-suggestions"),
              title: "Placeholder: more suggestions",
              plants: toSuggestionPlants(MOCK_FOLLOWUP_SUGGESTIONS),
            },
          ];

      setState((s) => ({ ...s, transcript: [...s.transcript, userEntry, ...responseEntries] }));
    },
    [mkId]
  );

  const chooseDirection = useCallback(
    (sourceEntryId: string, option: DirectionOption) => {
      const userEntry: ChatEntry = {
        kind: "text",
        id: mkId("entry-user"),
        role: "user",
        text: `Placeholder: let's try "${option.label}".`,
      };

      const followupMocks = MOCK_DIRECTION_FOLLOWUP[option.id];
      const responseEntries: ChatEntry[] = followupMocks
        ? [
            {
              kind: "text",
              id: mkId("entry-assistant"),
              role: "assistant",
              text: `Placeholder: leaning into "${option.label}", then. Here are some options in that vein — your current list is untouched.`,
            },
            {
              kind: "suggestions",
              id: mkId("entry-suggestions"),
              title: `Placeholder: ${option.label} suggestions`,
              plants: toSuggestionPlants(followupMocks),
            },
          ]
        : [
            {
              kind: "text",
              id: mkId("entry-assistant"),
              role: "assistant",
              text: "Placeholder: tell me more about the direction you have in mind and I'll suggest some plants.",
            },
          ];

      setState((s) => ({
        ...s,
        transcript: [...s.transcript, userEntry, ...responseEntries],
      }));
    },
    [mkId]
  );

  const reset = useCallback(() => {
    idCounter.current = 0;
    setState(INITIAL_STATE);
  }, []);

  const value = useMemo<PlantSchemeContextValue>(
    () => ({
      ...state,
      choosePath,
      setSelectedPlants,
      setFreeTextPlants,
      answerQuestion,
      skipQuestion,
      quickAnswer,
      completeFlow,
      addSuggestedPlant,
      removeSchemePlant,
      toggleShoppingList,
      sendRefinementMessage,
      chooseDirection,
      reset,
    }),
    [
      state,
      choosePath,
      setSelectedPlants,
      setFreeTextPlants,
      answerQuestion,
      skipQuestion,
      quickAnswer,
      completeFlow,
      addSuggestedPlant,
      removeSchemePlant,
      toggleShoppingList,
      sendRefinementMessage,
      chooseDirection,
      reset,
    ]
  );

  return <PlantSchemeContext.Provider value={value}>{children}</PlantSchemeContext.Provider>;
}

export function usePlantScheme(): PlantSchemeContextValue {
  const ctx = useContext(PlantSchemeContext);
  if (!ctx) {
    throw new Error("usePlantScheme must be used within a PlantSchemeProvider");
  }
  return ctx;
}

export { INITIAL_SUGGESTIONS_ENTRY_ID };
