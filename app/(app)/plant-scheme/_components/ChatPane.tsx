"use client";

/**
 * The conversation half of the persistent workspace.
 *
 * Shows the full scrollback: the Q1–Q4 recap (derived from `outcomes`) then the
 * refinement `transcript` (text turns + inline suggestion / direction panels).
 * Suggestion cards never disappear on add — they flip to an "Added" state.
 *
 * Each turn is a real call to /api/plant-scheme/turn: a sent message shows
 * optimistically with a typing indicator, and the assistant's entries are
 * committed to the transcript only once the call succeeds. It can fail or
 * hang: see `attemptTurn` below for the retry/discard state machine, and
 * requestTurn.ts for the client-side timeout.
 *
 * The starting scheme is the exception: the provider requests it (see
 * initialTurnStatus in PlantSchemeContext.tsx) and this pane only renders its
 * loading and failed states — no user bubble, and Retry only, since
 * discarding it would leave an empty workspace with nothing to refine.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePlantScheme, type ChatEntry, type DirectionOption } from "./PlantSchemeContext";
import { SOMETHING_ELSE_OPTION } from "@/lib/scheme-conversation";
import { requestTurn } from "./requestTurn";
import { MOCK_QUESTIONS } from "./mockData";
import { ChatMessage, ChatComposer, SendFailedNotice, TypingIndicator } from "./ChatLog";
import { DirectionOptions } from "./DirectionOptions";
import { SuggestionPanel, SuggestionPanelSkeleton } from "./SuggestionPanel";
import { Icon } from "@/components/ui/Icon";

/** The local reply to the fixed "Something else" direction — it invites the
 *  gardener to describe the direction themselves, so there's nothing to ask
 *  the model yet. Same wording the mock used. */
const DESCRIBE_DIRECTION_TEXT =
  "Tell me more about the direction you have in mind and I'll suggest some plants.";

const INTRO_TEXT =
  "I'll help you turn this into a full planting scheme. Ask for a swap, more options in a direction, or tell me what isn't working — your list only changes when you add something.";

type Role = "assistant" | "user";
type RecapLine = { id: string; role: Role; text: string };

/** One turn in flight or failed — a free-text send or a direction pick. */
type PendingTurn =
  | { kind: "text"; text: string }
  | { kind: "direction"; entryId: string; option: DirectionOption };

type TurnState = { status: "sending" | "failed"; turn: PendingTurn };

function turnBubbleText(turn: PendingTurn): string {
  return turn.kind === "text" ? turn.text : `Let's try "${turn.option.label}".`;
}

export default function ChatPane() {
  const {
    selectedGardenPlants,
    freeTextPlants,
    outcomes,
    transcript,
    schemePlants,
    generationStatus,
    draftId,
    getPersistedState,
    initialTurnStatus,
    retryInitialTurn,
    addSuggestedPlant,
    sendRefinementMessage,
    chooseDirection,
    reopenDirection,
  } = usePlantScheme();

  /* The scheme is being saved: the conversation is frozen (the context also
     ignores changes) so the list that's generated matches what's on screen. */
  const saving = generationStatus === "generating";
  /* The starting scheme is still loading or failed: nothing to refine yet,
     so the composer stays locked until it lands. */
  const awaitingStart = initialTurnStatus !== "idle";
  const [draft, setDraft] = useState("");
  /* The turn currently in flight or stuck failed — at most one at a time.
     Both the composer and the direction rows lock while this is set, so
     there's never more than one thing to resolve (Retry or Discard) before
     doing anything else. */
  const [turnState, setTurnState] = useState<TurnState | null>(null);
  /* Names this pane as a real landmark region (see the wrapping <section>
     below) — a symmetric counterpart to the scheme-list pane's own
     `aria-label="Scheme list"` section, so a keyboard/AT user can jump
     directly between the two panes rather than tabbing through every
     control in one to reach the other. */
  const headingId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);

  const startingPlants = useMemo(
    () => [...selectedGardenPlants.map((p) => p.commonName), ...freeTextPlants],
    [selectedGardenPlants, freeTextPlants]
  );

  const recap = useMemo<RecapLine[]>(() => {
    const out: RecapLine[] = [{ id: "intro", role: "assistant", text: INTRO_TEXT }];
    if (startingPlants.length > 0) {
      out.push({
        id: "starting-plants",
        role: "assistant",
        text: `We're working from ${startingPlants.join(", ")}.`,
      });
    }
    outcomes.forEach((outcome, i) => {
      const q = MOCK_QUESTIONS[i];
      if (q) out.push({ id: `q-${q.id}`, role: "assistant", text: q.prompt });
      out.push({
        id: `a-${i}`,
        role: "user",
        text: outcome.type === "skipped" ? "Skipped" : (outcome.answer ?? ""),
      });
    });
    return out;
  }, [startingPlants, outcomes]);

  // A flat role sequence so the "Plotted" attribution shows once per run.
  const roleSeq: Role[] = [
    ...recap.map((m) => m.role),
    ...transcript.map((e): Role => (e.kind === "text" ? e.role : "assistant")),
  ];
  const headsRun = (i: number) => roleSeq[i] === "assistant" && roleSeq[i - 1] !== "assistant";

  // Auto-scroll to newest, but never yank the view if the reader scrolled up.
  // Instant on arrival (the recap is history, not news), smooth after. The log
  // opts out of browser scroll anchoring (see _chat.scss) so the pending-bubble
  // → reply swap can't shift the target. While our own smooth scroll is
  // animating, scroll events are the animation, not the reader — onScroll must
  // not read them as "scrolled up" (that guard-bug swallowed the post-reply
  // scroll). A wheel or touch hands control back to the reader immediately.
  const hasScrolledRef = useRef(false);
  const autoScrollingRef = useRef(false);
  useEffect(() => {
    const el = logRef.current;
    if (!el || !atBottomRef.current) return;
    // Instant in a hidden tab: smooth scrolling needs animation frames, which
    // don't run there — the animation would park mid-way until the tab fronts.
    const behavior =
      hasScrolledRef.current && !document.hidden ? "smooth" : ("auto" as const);
    hasScrolledRef.current = true;
    autoScrollingRef.current = behavior === "smooth";
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [recap.length, transcript.length, turnState, initialTurnStatus]);

  function onScroll() {
    const el = logRef.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (autoScrollingRef.current) {
      if (gap < 4) autoScrollingRef.current = false;
      return;
    }
    atBottomRef.current = gap < 48;
  }

  function onReaderScrollIntent() {
    autoScrollingRef.current = false;
  }

  /* The one place a turn actually resolves or fails. `send` and
     `pickDirection` each build a `PendingTurn` and hand it here; `retry`
     replays the same turn. The draft state is read fresh at each attempt, so
     a retry reflects anything the gardener changed on the list meanwhile.
     Nothing is committed to the transcript until the call succeeds. */
  function attemptTurn(turn: PendingTurn) {
    setTurnState({ status: "sending", turn });
    atBottomRef.current = true;
    const request: Promise<ChatEntry[]> =
      turn.kind === "text"
        ? requestTurn(getPersistedState(), draftId, { kind: "message", text: turn.text })
        : turn.option.id === SOMETHING_ELSE_OPTION.id
          ? Promise.resolve([
              {
                kind: "text",
                id: `entry-assistant-${crypto.randomUUID()}`,
                role: "assistant",
                text: DESCRIBE_DIRECTION_TEXT,
              },
            ])
          : requestTurn(getPersistedState(), draftId, {
              kind: "direction",
              directionsEntryId: turn.entryId,
              optionId: turn.option.id,
            });
    request
      .then((entries) => {
        if (turn.kind === "text") sendRefinementMessage(turn.text, entries);
        else chooseDirection(turn.entryId, turn.option, entries);
        setTurnState(null);
      })
      .catch((err) => {
        console.error("[ChatPane] turn failed:", err);
        setTurnState({ status: "failed", turn });
      });
  }

  function send() {
    const text = draft.trim();
    // Enter sends regardless of the send button's disabled state, so the
    // locks it shows are enforced here too.
    if (!text || turnState || saving || awaitingStart) return;
    setDraft("");
    inputRef.current?.focus();
    attemptTurn({ kind: "text", text });
  }

  function pickDirection(entryId: string, option: DirectionOption) {
    if (turnState || saving || awaitingStart) return;
    attemptTurn({ kind: "direction", entryId, option });
  }

  /* Retry resends the same turn — the one way out of a failed text turn (its
     wording can't be edited) and the fast path for a failed direction turn. */
  function retry() {
    if (!turnState || turnState.status !== "failed") return;
    attemptTurn(turnState.turn);
  }

  /* The other way out — drop the failed turn without resending, back to
     idle so the reader can type something else or pick a different
     direction instead. Never silent: the reader chose this, Discard didn't
     happen to them. */
  function discard() {
    setTurnState(null);
  }

  return (
    <section className="c-chat" aria-labelledby={headingId} id="c-scheme-workspace-chat" tabIndex={-1}>
      <h2 id={headingId} className="long-primer kirk o-type-display">
        Conversation
      </h2>

      <div
        ref={logRef}
        onScroll={onScroll}
        onWheel={onReaderScrollIntent}
        onTouchStart={onReaderScrollIntent}
        className="c-chat__log c-chat__log--bounded"
        role="log"
        aria-live="polite"
        aria-label="Conversation with Plotted"
      >
        {recap.map((m, i) => (
          <ChatMessage key={m.id} role={m.role} showFrom={headsRun(i)}>
            {m.text}
          </ChatMessage>
        ))}

        {transcript.map((entry, j) => (
          <EntryView
            key={entry.id}
            entry={entry}
            showFrom={headsRun(recap.length + j)}
            schemePlantIds={schemePlants.map((p) => p.id)}
            onAdd={addSuggestedPlant}
            onChooseDirection={pickDirection}
            onReopenDirection={reopenDirection}
            pendingChoiceId={
              turnState?.status === "sending" &&
              turnState.turn.kind === "direction" &&
              turnState.turn.entryId === entry.id
                ? turnState.turn.option.id
                : undefined
            }
            disabled={turnState !== null || saving || awaitingStart}
          />
        ))}

        {initialTurnStatus === "sending" && (
          <>
            <TypingIndicator label="Putting together a starting scheme" />
            <SuggestionPanelSkeleton />
          </>
        )}
        {initialTurnStatus === "failed" && (
          <SendFailedNotice
            side="assistant"
            label="Couldn't put together a starting scheme"
            onRetry={retryInitialTurn}
          />
        )}

        {turnState && (
          <>
            <ChatMessage role="user">{turnBubbleText(turnState.turn)}</ChatMessage>
            {turnState.status === "sending" ? (
              <TypingIndicator />
            ) : (
              <SendFailedNotice onRetry={retry} onDiscard={discard} />
            )}
          </>
        )}
      </div>

      <ChatComposer
        ref={inputRef}
        value={draft}
        onChange={setDraft}
        onSend={send}
        disabled={turnState !== null || saving || awaitingStart}
        label="Your reply"
        ariaLabel="Your reply to Plotted"
        placeholder="Ask for a swap, more options, a different direction…"
      />

      {/* Keyboard-only, non-AT users have no equivalent to a screen reader's
          landmark navigation — this is theirs: a real, labelled next stop
          instead of a silent jump into the list pane's first control. Hidden
          until focused (.u-skip-link); the target section is
          tabIndex={-1}-focusable, see SchemeListPane.tsx. */}
      <a
        href="#c-scheme-workspace-list"
        className="c-scheme-chat__skip-link u-skip-link minion"
      >
        Skip to scheme list
        <Icon name="right" size={12} />
      </a>
    </section>
  );
}

function EntryView({
  entry,
  showFrom,
  schemePlantIds,
  onAdd,
  onChooseDirection,
  onReopenDirection,
  pendingChoiceId,
  disabled,
}: {
  entry: ChatEntry;
  showFrom: boolean;
  schemePlantIds: string[];
  onAdd: ReturnType<typeof usePlantScheme>["addSuggestedPlant"];
  onChooseDirection: (entryId: string, option: DirectionOption) => void;
  onReopenDirection: (entryId: string) => void;
  pendingChoiceId?: string;
  disabled: boolean;
}) {
  if (entry.kind === "text") {
    return (
      <ChatMessage role={entry.role} showFrom={showFrom}>
        {entry.text}
      </ChatMessage>
    );
  }

  if (entry.kind === "suggestions") {
    return <SuggestionPanel entry={entry} schemePlantIds={schemePlantIds} onAdd={onAdd} />;
  }

  // entry.kind === "directions"
  return (
    <DirectionOptions
      entry={entry}
      onChoose={onChooseDirection}
      onReopen={onReopenDirection}
      pendingChoiceId={pendingChoiceId}
      disabled={disabled}
    />
  );
}
