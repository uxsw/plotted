"use client";

/**
 * Cross-route client state for the conversational planting scheme shell.
 *
 * The conversation is real: each turn's assistant response comes from
 * /api/plant-scheme/turn and is committed here once it lands. The starting
 * scheme (the "initial" turn) is requested from this provider — see
 * initialTurnStatus — and every later turn from ChatPane.tsx. The question
 * flow itself is still hardcoded (see ./mockData.ts). Saving the finished
 * scheme is real — see SchemeGenerateAction.tsx and
 * /api/plant-scheme/[draftId]/save.
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
import { INITIAL_SUGGESTIONS_ENTRY_ID } from "@/lib/scheme-conversation";
import { isRateLimited, requestTurn } from "./requestTurn";
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
/** The starting scheme's own request (the engine's "initial" turn): "sending"
 *  while it's in flight, "failed" until retried ("rate_limited" when it failed
 *  on the hourly turn limit, which a retry won't fix until the hour is up),
 *  "idle" otherwise. Never
 *  persisted — whether one is still needed is derived from the transcript
 *  (no INITIAL_SUGGESTIONS_ENTRY_ID entry yet), the same way generationStatus
 *  is derived from the scheme row. */
export type InitialTurnStatus = "idle" | "sending" | "failed" | "rate_limited";

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
  /** "Why this fits" — written by the model (match_note, see
   *  lib/scheme-conversation.ts). Undefined when nothing genuinely lines up
   *  with what the gardener said, rather than a fabricated match. */
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
  /** See InitialTurnStatus. Lives here rather than in ChatPane because the
   *  request usually spans the id-less → /chat/[draftId] route change, which
   *  remounts ChatPane (the provider, in the layout, survives it). */
  initialTurnStatus: InitialTurnStatus;
  /** Re-request the starting scheme after a failure. No-op unless it failed. */
  retryInitialTurn: () => void;
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
   * End the question flow and enter the split-pane view (seeding any garden
   * plants onto the list). The starting scheme is then requested by an effect
   * in the provider, not here — callers often queue the last answer in the
   * same tick, so this can't see final state. Safe to call more than once.
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
  /** The current state as persisted — what a conversation turn request sends
   *  (see /api/plant-scheme/turn). Read at call time, never a render snapshot. */
  getPersistedState: () => PersistedDraftState;
  /** Commit a completed free-text turn: the gardener's message plus the
   *  assistant's `entries`, as returned by /api/plant-scheme/turn. Only call
   *  once the turn has succeeded — a failed turn leaves the transcript alone. */
  sendRefinementMessage: (text: string, entries: ChatEntry[]) => void;
  /** Commit a completed direction pick: stamps the choice onto its panel, then
   *  appends the gardener's pick and the assistant's `entries`. Same
   *  only-on-success rule as sendRefinementMessage. */
  chooseDirection: (sourceEntryId: string, option: DirectionOption, entries: ChatEntry[]) => void;
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

/** Posted above the starting scheme once it lands — never before, so it
 *  doesn't announce a scheme that's still loading (or failed to). */
function schemeIntroEntry(quickAnswered: boolean): ChatEntry {
  return {
    kind: "text",
    id: "entry-scheme-intro",
    role: "assistant",
    text: quickAnswered
      ? "Here's a starting scheme from what you've told me so far — less tailored than finishing the questions would be. Add what you like, then keep talking to refine it."
      : "Here's a starting scheme based on your answers. Add what you like, then keep talking to refine it.",
  };
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
  const [initialTurnStatus, setInitialTurnStatus] = useState<InitialTurnStatus>("idle");
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
  /* The session whose starting-scheme request is in flight, if any — so a
     StrictMode double effect, or a re-render before "sending" lands, can't
     fire a second concurrent request for the same conversation. */
  const initialInFlightRef = useRef<number | null>(null);
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
    setInitialTurnStatus("idle");
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
        transcript: [],
      };
    });
  }, []);

  /* The starting scheme. `s` must be the state the request describes — the
     trigger effect passes committed state; a retry reads stateRef. */
  const runInitialTurn = useCallback((s: PlantSchemeState, id: string | null) => {
    const session = sessionRef.current;
    if (initialInFlightRef.current === session) return;
    initialInFlightRef.current = session;
    setInitialTurnStatus("sending");
    requestTurn(toPersisted(s), id, { kind: "initial" }).then(
      (entries) => {
        // Superseded (reset, start over, another draft loaded) — drop it.
        if (sessionRef.current !== session) return;
        initialInFlightRef.current = null;
        setInitialTurnStatus("idle");
        setState((cur) =>
          // A save that started meanwhile froze the conversation; and a
          // starting scheme that somehow already landed is never doubled.
          cur.generationStatus === "generating" ||
          cur.transcript.some((e) => e.id === INITIAL_SUGGESTIONS_ENTRY_ID)
            ? cur
            : { ...cur, transcript: [schemeIntroEntry(cur.quickAnswered), ...entries, ...cur.transcript] }
        );
      },
      (err) => {
        if (sessionRef.current !== session) return;
        initialInFlightRef.current = null;
        console.error("[PlantSchemeContext] starting scheme failed:", err);
        setInitialTurnStatus(isRateLimited(err) ? "rate_limited" : "failed");
      }
    );
  }, []);

  /* Request the starting scheme whenever the workspace has none: straight
     after completeFlow, and on loading a draft that never got one (e.g. a
     refresh mid-request). Derived from the transcript, not a stored flag.
     Not while a save is running or has run (the conversation is frozen or
     finished), and never for the dev preview seed, which has its own cards. */
  useEffect(() => {
    if (previewActive || initialTurnStatus !== "idle") return;
    if (state.phase !== "scheme" || state.generationStatus !== "idle") return;
    if (state.transcript.some((e) => e.id === INITIAL_SUGGESTIONS_ENTRY_ID)) return;
    runInitialTurn(state, draftId);
  }, [state, draftId, initialTurnStatus, previewActive, runInitialTurn]);

  const retryInitialTurn = useCallback(() => {
    if (initialTurnStatus !== "failed" && initialTurnStatus !== "rate_limited") return;
    runInitialTurn(stateRef.current, draftId);
  }, [initialTurnStatus, runInitialTurn, draftId]);

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

  const getPersistedState = useCallback(() => toPersisted(stateRef.current), []);

  const sendRefinementMessage = useCallback(
    (text: string, entries: ChatEntry[]) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const userEntry: ChatEntry = {
        kind: "text",
        id: mkId("entry-user"),
        role: "user",
        text: trimmed,
      };
      setState((s) =>
        s.generationStatus === "generating"
          ? s
          : { ...s, transcript: [...s.transcript, userEntry, ...entries] }
      );
    },
    [mkId]
  );

  const chooseDirection = useCallback(
    (sourceEntryId: string, option: DirectionOption, entries: ChatEntry[]) => {
      const userEntry: ChatEntry = {
        kind: "text",
        id: mkId("entry-user"),
        role: "user",
        text: `Let's try "${option.label}".`,
      };

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
                ...entries,
              ],
            }
      );
    },
    [mkId]
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
      initialTurnStatus,
      retryInitialTurn,
      flushDraft,
      getPersistedState,
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
      initialTurnStatus,
      retryInitialTurn,
      flushDraft,
      getPersistedState,
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

