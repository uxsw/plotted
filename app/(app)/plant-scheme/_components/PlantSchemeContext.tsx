"use client";

/**
 * Cross-route client state for the conversational planting scheme shell.
 *
 * There is no AI wiring yet for the conversation itself: the question flow and
 * every "assistant" response are driven off hardcoded mock content (see
 * ./mockData.ts). Saving the finished scheme is real — see
 * SchemeGenerateAction.tsx and /api/plant-scheme/[draftId]/save.
 *
 * Persistence: the question flow (Q1–Q4) is in-memory only. When it completes,
 * a `plant_scheme_drafts` row is created and the URL moves to
 * /plant-scheme/chat/[draftId]; from then on every state change is written
 * through to that row (optimistic local update, async save), and the
 * [draftId] route rehydrates from it on a hard refresh or new tab. A hard
 * refresh mid-question-flow still loses the state, as before.
 *
 * The provider is mounted in the segment layout, so state survives client-side
 * navigation between /plant-scheme sub-routes.
 *
 * Deliberately isolated: this file shares no code path with the existing
 * /schemes feature.
 */

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createPlantSchemeDraft,
  updatePlantSchemeDraft,
} from "@/app/actions/plant-scheme-drafts";
import {
  MOCK_DIRECTION_FOLLOWUP,
  MOCK_DIRECTION_OPTIONS,
  MOCK_FOLLOWUP_SUGGESTIONS,
  MOCK_SUGGESTIONS,
  type MockSuggestion,
} from "./mockData";
import { buildMatchNote } from "./matchNote";
import { PREVIEW_SEED_STATE } from "./previewSeed";

export type SchemePath = "existing" | "scratch";
export type SchemePhase = "questions" | "scheme";
export type SchemeTier = "back" | "mid" | "ground";
/** "idle" until the gardener asks to save; "generating" while the save +
 *  write-up is in flight (the list and chat are locked meanwhile, so what's
 *  generated is what's on screen); "complete" once it lands; "failed" if the
 *  attempt failed — the draft is untouched and saving can simply be retried.
 *  Never persisted: the truth lives on the scheme row (`schemes.status`), and
 *  the [draftId] route restores "generating"/"failed" from it on a refresh.
 *  A later change to `schemePlants` resets "complete" to "idle". */
export type SchemeGenerationStatus = "idle" | "generating" | "complete" | "failed";

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
  /** Months in flower, 1–12 — aggregated into the scheme list's year strip. */
  months: number[];
  /** "Why this fits" — see matchNote.ts. Undefined when nothing genuinely
   *  lines up with what the gardener said, rather than a fabricated match. */
  matchNote?: string;
}

/**
 * A Path A garden plant the user explicitly selected in the picker step. These
 * are resolved records (unlike Path B's typed names), so they're safe to
 * pre-populate onto the scheme list without an explicit add.
 */
export interface GardenPlantRef {
  plantId: string;
  commonName: string;
  latinName: string;
  /** The garden record's own stored photo, if any — NOT a Wikimedia lookup. */
  photoUrl: string | null;
}

export type SchemePlantOrigin = "garden" | "suggestion";

/** A plant on the scheme list pane, however it got there. */
export interface SchemePlant {
  /**
   * garden-origin: `garden:${plantId}`.
   * suggestion-origin: `${sourceEntryId}:${plantId}` — unique per originating
   * suggestion card, so the same plant proposed by two cards tracks its
   * added-state independently. The two namespaces never collide.
   */
  id: string;
  origin: SchemePlantOrigin;
  /** null for garden-origin plants — they don't come from a suggestion card. */
  sourceEntryId: string | null;
  plantId: string;
  commonName: string;
  latinName: string;
  /** null for garden-origin plants — no resolved structural role (see spec). */
  tier: SchemeTier | null;
  note: string;
  badges: string[];
  /**
   * Months in flower, 1–12. Empty for garden-origin plants at this stage —
   * the real integration will derive it from the record's flowering season.
   */
  months: number[];
  /** Garden record photo for garden-origin plants; null for suggestions. */
  photoUrl: string | null;
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
  /* `chosenOptionId` is set once the gardener picks one. The panel then stops
     being a live prompt and becomes a record of the decision — see
     chooseDirection below and EntryView in ChatPane.tsx. */
  | {
      kind: "directions";
      id: string;
      title: string;
      options: DirectionOption[];
      chosenOptionId?: string;
    };

export interface PlantSchemeState {
  /** The journey's accent family, or null before a scheme is started:
   *  "existing" when any garden plants were chosen, otherwise "scratch". */
  path: SchemePath | null;
  /** "questions" = still in Q1–Q4 flow; "scheme" = persistent split-pane view. */
  phase: SchemePhase;
  /** Path A: the garden plants selected in the picker step (resolved records). */
  selectedGardenPlants: GardenPlantRef[];
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
  /** See SchemeGenerationStatus. */
  generationStatus: SchemeGenerationStatus;
}

/**
 * What goes in `plant_scheme_drafts.state`. `path`/`phase` are real columns;
 * `generationStatus` is left out — it's derived from the scheme row on load
 * (see PlantSchemeDraftRecord.generation), not stored on the draft.
 */
export type PersistedDraftState = Omit<PlantSchemeState, "path" | "phase" | "generationStatus">;

/** A `plant_scheme_drafts` row as read back for rehydration. */
export interface PlantSchemeDraftRecord {
  id: string;
  path: SchemePath;
  phase: SchemePhase;
  state: Partial<PersistedDraftState>;
  /** A save begun before this load (a refresh mid-save), read off the draft's
   *  scheme row. Absent when no save has been attempted. */
  generation?: { schemeId: string; status: "generating" | "failed" };
}

export interface PlantSchemeContextValue extends PlantSchemeState {
  /** The persisted draft this conversation writes through to; null until the
   *  question flow completes and the row has been created. */
  draftId: string | null;
  /** The scheme being generated by a save that was already in flight when this
   *  draft was loaded, so the poller can resume; null otherwise. */
  resumeSchemeId: string | null;
  /** Resolves once every queued write to the draft row has landed (retrying a
   *  failed one) — call before asking the server to save. False if the draft
   *  couldn't be brought up to date. */
  flushDraft: () => Promise<boolean>;
  /** Replace all state with a draft read back from the database. */
  hydrateDraft: (draft: PlantSchemeDraftRecord) => void;
  /**
   * Begin a fresh scheme from the hub's start panel. Either list may be empty,
   * not both: garden plants are resolved records (pre-populated onto the list
   * later), typed names are chat context only.
   */
  startScheme: (gardenPlants: GardenPlantRef[], freeTextPlants: string[]) => void;
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
  /** Enter the "generating" state (also from "failed", to retry). No-op if the
   *  list is empty or a save is already running. The request and polling live
   *  in the component that calls this (SchemeGenerateAction.tsx). */
  beginGenerateScheme: () => void;
  /** Land the save — no-op unless one is actually in flight, so a stale
   *  response from a since-abandoned attempt can't resurrect it. */
  finishGenerateScheme: () => void;
  /** The save failed — no-op unless one is actually in flight. */
  failGenerateScheme: () => void;
  /** Send a free-text refinement message; posts a mocked assistant response. */
  sendRefinementMessage: (text: string) => void;
  /** Pick one of the inline "directional options"; posts follow-up suggestions. */
  chooseDirection: (sourceEntryId: string, option: DirectionOption) => void;
  /** Undo a direction pick: reopens the panel so the gardener can choose a
   *  different one. Leaves everything that panel's choice already posted (the
   *  assistant's reply, any suggestion cards) in the transcript — picking
   *  again just adds another round, the same as choosing fresh; nothing the
   *  gardener already saw or added disappears. */
  reopenDirection: (sourceEntryId: string) => void;
  /** Wipe all state — used by "Start over". */
  reset: () => void;
}

const INITIAL_STATE: PlantSchemeState = {
  path: null,
  phase: "questions",
  selectedGardenPlants: [],
  freeTextPlants: [],
  questionIndex: 0,
  outcomes: [],
  quickAnswered: false,
  finished: false,
  transcript: [],
  schemePlants: [],
  generationStatus: "idle",
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

function toSuggestionPlants(
  mocks: MockSuggestion[],
  outcomes: QuestionOutcome[]
): SuggestionPlant[] {
  return mocks.map((m) => ({
    plantId: m.id,
    commonName: m.commonName,
    latinName: m.latinName,
    tier: m.tier,
    note: m.note,
    badges: m.badges,
    months: m.months,
    matchNote: buildMatchNote(m, outcomes),
  }));
}

function toPersisted(s: PlantSchemeState): PersistedDraftState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { path, phase, generationStatus, ...rest } = s;
  return rest;
}

const PlantSchemeContext = createContext<PlantSchemeContextValue | null>(null);

export function PlantSchemeProvider({ children }: { children: React.ReactNode }) {
  // Wrapped only so useSearchParams (read in the inner provider to detect the
  // dev `?preview=1` seed) has a Suspense boundary above it, matching the
  // project convention (see app/auth/login/page.tsx). The (app) segment is
  // always dynamically rendered, so this resolves synchronously — no fallback
  // is ever shown and the real flow is unaffected.
  return (
    <Suspense fallback={null}>
      <PlantSchemeProviderInner>{children}</PlantSchemeProviderInner>
    </Suspense>
  );
}

function PlantSchemeProviderInner({ children }: { children: React.ReactNode }) {
  // Dev convenience: `/plant-scheme/chat?preview=1` opened directly (typed or
  // bookmarked, NOT via router.push) seeds the split-pane view with mock content
  // so ChatPane / SchemeListPane / PlantCard can be iterated on without walking
  // the entry → picker → questions flow on every refresh. No effect otherwise.
  const previewActive = useSearchParams().get("preview") === "1";
  const [state, setState] = useState<PlantSchemeState>(() =>
    previewActive ? PREVIEW_SEED_STATE : INITIAL_STATE
  );
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [resumeSchemeId, setResumeSchemeId] = useState<string | null>(null);
  // Random rather than a counter: a rehydrated transcript's ids must not
  // collide with entries created after the reload.
  const mkId = useCallback((prefix: string) => `${prefix}-${crypto.randomUUID()}`, []);

  /* Bumped whenever the conversation is replaced (start, reset, hydrate) so an
     in-flight draft insert from the previous one can't claim the new one. */
  const sessionRef = useRef(0);
  /* Set by completeFlow; the insert itself runs in the effect below once the
     phase flip has actually landed — callers often queue answerQuestion and
     completeFlow in the same tick, so completeFlow can't see final state. */
  const pendingCreateRef = useRef(false);
  /* `${draftId}:${json}` of the last payload saved or loaded, so unchanged
     renders (and the hydrate itself) don't trigger a write. */
  const lastSavedRef = useRef<string | null>(null);
  /* Writes run strictly in order, so a slow earlier save can never land after
     (and overwrite) a later one. */
  const writeChainRef = useRef<Promise<unknown>>(Promise.resolve());
  /* Whether the most recent write landed — flushDraft's answer to "is the row
     current?". Also the latest state, so a flush can retry a failed write. */
  const lastWriteOkRef = useRef(true);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const beginNewSession = useCallback(() => {
    sessionRef.current += 1;
    pendingCreateRef.current = false;
    lastSavedRef.current = null;
    lastWriteOkRef.current = true;
    setDraftId(null);
    setResumeSchemeId(null);
  }, []);

  const enqueueWrite = useCallback(
    (id: string, phase: SchemePhase, persisted: PersistedDraftState) => {
      writeChainRef.current = writeChainRef.current.then(() =>
        updatePlantSchemeDraft(id, { phase, state: persisted }).then(
          (result) => {
            lastWriteOkRef.current = !(result && "error" in result);
            if (result && "error" in result) {
              console.error("[PlantSchemeContext] draft save failed:", result.error);
            }
          },
          (err) => {
            lastWriteOkRef.current = false;
            console.error("[PlantSchemeContext] draft save failed:", err);
          }
        )
      );
    },
    []
  );

  useEffect(() => {
    if (!pendingCreateRef.current || state.phase !== "scheme" || !state.path || draftId) return;
    pendingCreateRef.current = false;
    const session = sessionRef.current;
    const persisted = toPersisted(state);
    const json = JSON.stringify({ phase: state.phase, state: persisted });
    createPlantSchemeDraft({ path: state.path, phase: state.phase, state: persisted }).then(
      (result) => {
        if (sessionRef.current !== session) return;
        if ("error" in result) {
          // The conversation carries on unsaved, as it did before persistence.
          console.error("[PlantSchemeContext] draft create failed:", result.error);
          return;
        }
        lastSavedRef.current = `${result.id}:${json}`;
        setDraftId(result.id);
        // Only move the URL if the gardener is still on the id-less chat route.
        if (window.location.pathname === "/plant-scheme/chat") {
          router.replace(`/plant-scheme/chat/${result.id}`, { scroll: false });
        }
      }
    );
  }, [state, draftId, router]);

  useEffect(() => {
    if (!draftId) return;
    const persisted = toPersisted(state);
    const json = JSON.stringify({ phase: state.phase, state: persisted });
    const key = `${draftId}:${json}`;
    if (lastSavedRef.current === key) return;
    lastSavedRef.current = key;
    enqueueWrite(draftId, state.phase, persisted);
  }, [state, draftId, enqueueWrite]);

  const flushDraft = useCallback(async () => {
    await writeChainRef.current;
    if (!lastWriteOkRef.current && draftId) {
      // The last write failed and an unchanged state never re-queues itself.
      const s = stateRef.current;
      const persisted = toPersisted(s);
      lastSavedRef.current = `${draftId}:${JSON.stringify({ phase: s.phase, state: persisted })}`;
      enqueueWrite(draftId, s.phase, persisted);
      await writeChainRef.current;
    }
    return lastWriteOkRef.current;
  }, [draftId, enqueueWrite]);

  const hydrateDraft = useCallback(
    (draft: PlantSchemeDraftRecord) => {
      beginNewSession();
      const next: PlantSchemeState = {
        ...INITIAL_STATE,
        ...draft.state,
        path: draft.path,
        phase: draft.phase,
        generationStatus: draft.generation?.status ?? "idle",
      };
      lastSavedRef.current = `${draft.id}:${JSON.stringify({
        phase: next.phase,
        state: toPersisted(next),
      })}`;
      setDraftId(draft.id);
      setResumeSchemeId(draft.generation?.status === "generating" ? draft.generation.schemeId : null);
      setState(next);
    },
    [beginNewSession]
  );

  const startScheme = useCallback(
    (gardenPlants: GardenPlantRef[], freeTextPlants: string[]) => {
      beginNewSession();
      setState({
        ...INITIAL_STATE,
        path: gardenPlants.length > 0 ? "existing" : "scratch",
        selectedGardenPlants: gardenPlants,
        freeTextPlants,
      });
    },
    [beginNewSession]
  );

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
      pendingCreateRef.current = true;
      const initialEntry: ChatEntry = {
        kind: "suggestions",
        id: INITIAL_SUGGESTIONS_ENTRY_ID,
        title: "A starting scheme — pick the ones you want on your list.",
        plants: toSuggestionPlants(MOCK_SUGGESTIONS, s.outcomes),
      };
      // Garden plants picked on the start panel are resolved records the user
      // deliberately selected, so they start already on the list — no explicit
      // add. Typed names have no resolved identity and stay chat-context only.
      const seededGardenPlants: SchemePlant[] =
        s.selectedGardenPlants.length > 0
          ? s.selectedGardenPlants.map((g) => ({
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
              addedToShoppingList: false,
            }))
          : [];
      return {
        ...s,
        phase: "scheme",
        finished: true,
        schemePlants: seededGardenPlants,
        transcript: [
          {
            kind: "text",
            id: "entry-scheme-intro",
            role: "assistant",
            text: s.quickAnswered
              ? "Here's a starting scheme from what you've told me so far — less tailored than finishing the questions would be. Add what you like, then keep talking to refine it."
              : "Here's a starting scheme based on your answers. Add what you like, then keep talking to refine it.",
          },
          initialEntry,
        ],
      };
    });
  }, []);

  const addSuggestedPlant = useCallback((sourceEntryId: string, plant: SuggestionPlant) => {
    const compositeId = `${sourceEntryId}:${plant.plantId}`;
    setState((s) => {
      if (s.generationStatus === "generating") return s;
      if (s.schemePlants.some((p) => p.id === compositeId)) return s;
      const added: SchemePlant = {
        id: compositeId,
        origin: "suggestion",
        sourceEntryId,
        plantId: plant.plantId,
        commonName: plant.commonName,
        latinName: plant.latinName,
        tier: plant.tier,
        note: plant.note,
        badges: plant.badges,
        months: plant.months,
        photoUrl: null,
        addedToShoppingList: false,
      };
      return {
        ...s,
        schemePlants: [...s.schemePlants, added],
        // A saved confirmation shouldn't keep reading as current once the
        // list it described has changed — see SchemeGenerationStatus.
        generationStatus: s.generationStatus === "complete" ? "idle" : s.generationStatus,
      };
    });
  }, []);

  const removeSchemePlant = useCallback((id: string) => {
    setState((s) =>
      s.generationStatus === "generating"
        ? s
        : {
            ...s,
            schemePlants: s.schemePlants.filter((p) => p.id !== id),
            generationStatus: s.generationStatus === "complete" ? "idle" : s.generationStatus,
          }
    );
  }, []);

  const toggleShoppingList = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      schemePlants: s.schemePlants.map((p) =>
        p.id === id ? { ...p, addedToShoppingList: !p.addedToShoppingList } : p
      ),
    }));
  }, []);

  const beginGenerateScheme = useCallback(() => {
    setState((s) => {
      if (s.schemePlants.length === 0 || s.generationStatus === "generating") return s;
      return { ...s, generationStatus: "generating" };
    });
  }, []);

  const failGenerateScheme = useCallback(() => {
    setState((s) => (s.generationStatus === "generating" ? { ...s, generationStatus: "failed" } : s));
  }, []);

  const finishGenerateScheme = useCallback(() => {
    setState((s) => (s.generationStatus === "generating" ? { ...s, generationStatus: "complete" } : s));
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
              text: "Sounds like you want a different direction rather than a tweak. Pick one to explore — nothing already on your list changes.",
            },
            {
              kind: "directions",
              id: mkId("entry-directions"),
              title: "Which direction?",
              options: MOCK_DIRECTION_OPTIONS,
            },
          ]
        : [
            {
              kind: "text",
              id: mkId("entry-assistant"),
              role: "assistant",
              text: "Here are a couple more that could work — add any you like.",
            },
            {
              kind: "suggestions",
              id: mkId("entry-suggestions"),
              title: "More suggestions",
              plants: toSuggestionPlants(MOCK_FOLLOWUP_SUGGESTIONS, state.outcomes),
            },
          ];

      setState((s) =>
        s.generationStatus === "generating"
          ? s
          : { ...s, transcript: [...s.transcript, userEntry, ...responseEntries] }
      );
    },
    [mkId, state.outcomes]
  );

  const chooseDirection = useCallback(
    (sourceEntryId: string, option: DirectionOption) => {
      const userEntry: ChatEntry = {
        kind: "text",
        id: mkId("entry-user"),
        role: "user",
        text: `Let's try "${option.label}".`,
      };

      const followupMocks = MOCK_DIRECTION_FOLLOWUP[option.id];
      const responseEntries: ChatEntry[] = followupMocks
        ? [
            {
              kind: "text",
              id: mkId("entry-assistant"),
              role: "assistant",
              text: `Leaning into "${option.label}", then. Here are some options in that vein — your current list is untouched.`,
            },
            {
              kind: "suggestions",
              id: mkId("entry-suggestions"),
              title: `${option.label} suggestions`,
              plants: toSuggestionPlants(followupMocks, state.outcomes),
            },
          ]
        : [
            {
              kind: "text",
              id: mkId("entry-assistant"),
              role: "assistant",
              text: "Tell me more about the direction you have in mind and I'll suggest some plants.",
            },
          ];

      /* Stamp the choice onto the panel it came from: the four options stop
         being a live prompt and become a record of what was picked, the way
         the rest of the scrollback is a record of what was said. */
      setState((s) =>
        s.generationStatus === "generating"
          ? s
          : {
              ...s,
              transcript: [
                ...s.transcript.map((e) =>
                  e.kind === "directions" && e.id === sourceEntryId
                    ? { ...e, chosenOptionId: option.id }
                    : e
                ),
                userEntry,
                ...responseEntries,
              ],
            }
      );
    },
    [mkId, state.outcomes]
  );

  const reopenDirection = useCallback((sourceEntryId: string) => {
    setState((s) =>
      s.generationStatus === "generating"
        ? s
        : {
            ...s,
            transcript: s.transcript.map((e) =>
              e.kind === "directions" && e.id === sourceEntryId
                ? { ...e, chosenOptionId: undefined }
                : e
            ),
          }
    );
  }, []);

  const reset = useCallback(() => {
    beginNewSession();
    setState(INITIAL_STATE);
  }, [beginNewSession]);

  const value = useMemo<PlantSchemeContextValue>(
    () => ({
      ...state,
      draftId,
      resumeSchemeId,
      flushDraft,
      hydrateDraft,
      startScheme,
      answerQuestion,
      skipQuestion,
      quickAnswer,
      completeFlow,
      addSuggestedPlant,
      removeSchemePlant,
      toggleShoppingList,
      beginGenerateScheme,
      finishGenerateScheme,
      failGenerateScheme,
      sendRefinementMessage,
      chooseDirection,
      reopenDirection,
      reset,
    }),
    [
      state,
      draftId,
      resumeSchemeId,
      flushDraft,
      hydrateDraft,
      startScheme,
      answerQuestion,
      skipQuestion,
      quickAnswer,
      completeFlow,
      addSuggestedPlant,
      removeSchemePlant,
      toggleShoppingList,
      beginGenerateScheme,
      finishGenerateScheme,
      failGenerateScheme,
      sendRefinementMessage,
      chooseDirection,
      reopenDirection,
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
