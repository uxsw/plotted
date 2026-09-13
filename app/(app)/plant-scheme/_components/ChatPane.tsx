"use client";

/**
 * The conversation half of the persistent workspace.
 *
 * Shows the full scrollback: the Q1–Q4 recap (derived from `outcomes`) then the
 * refinement `transcript` (text turns + inline suggestion / direction panels).
 * Suggestion cards never disappear on add — they flip to an "Added" state.
 *
 * All assistant responses are mocked (see PlantSchemeContext). To make the mock
 * read like a real assistant, a sent message shows optimistically with a typing
 * indicator, and the canned reply lands after a short beat — the same rhythm a
 * streamed LLM response will have. That beat can also fail: see `attemptTurn`
 * below for the retry/discard state machine and the `/fail` dev trigger.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlantScheme, type ChatEntry, type DirectionOption } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";
import { PlantCard } from "./PlantCard";
import { ChatMessage, ChatComposer, SendFailedNotice, TypingIndicator } from "./ChatLog";
import { DirectionOptions } from "./DirectionOptions";
import { Icon } from "@/components/ui/Icon";

const THINK_MS = 700;

/**
 * Typing "/fail" into the composer and then sending it, or choosing a
 * direction while it's still sitting there, simulates that turn failing —
 * the one deliberate hook for exercising the retry/discard state below
 * without a real backend yet. Same crude-trigger idiom as `DISLIKE_MARKERS`
 * in PlantSchemeContext.tsx: intentionally not real, replaced the moment a
 * genuine API call can actually fail on its own.
 *
 * The simulated delay is long enough for TypingIndicator's own stall
 * threshold (STALL_MS, ChatLog.tsx) to show "Still thinking…" before the
 * failure lands — one test run walks through both new states.
 */
const FAIL_TRIGGER = "/fail";
const SIMULATED_FAILURE_DELAY_MS = 7500;

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

/** Stands in for the real network call this becomes. Resolves after THINK_MS;
 *  rejects after SIMULATED_FAILURE_DELAY_MS when asked to. Swapping this for
 *  a genuine API call is the only change the real integration needs — the
 *  surrounding retry/stall state machine is already shaped for it. */
function mockAttempt(simulateFailure: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(
      () => (simulateFailure ? reject(new Error("simulated failure")) : resolve()),
      simulateFailure ? SIMULATED_FAILURE_DELAY_MS : THINK_MS
    );
  });
}

export default function ChatPane() {
  const {
    path,
    selectedGardenPlants,
    freeTextPlants,
    outcomes,
    transcript,
    schemePlants,
    addSuggestedPlant,
    sendRefinementMessage,
    chooseDirection,
  } = usePlantScheme();

  const [draft, setDraft] = useState("");
  /* The turn currently in flight or stuck failed — at most one at a time.
     Both the composer and the direction rows lock while this is set, so
     there's never more than one thing to resolve (Retry or Discard) before
     doing anything else. */
  const [turnState, setTurnState] = useState<TurnState | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);

  const startingPlants =
    path === "existing" ? selectedGardenPlants.map((p) => p.commonName) : freeTextPlants;

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
  }, [recap.length, transcript.length, turnState]);

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
     replays the same turn (always for real — see below); the mock's own
     mutation only runs once `mockAttempt` resolves, matching the shape a real
     `fetch(...).then(applyMutation).catch(setFailed)` will take. */
  function attemptTurn(turn: PendingTurn, simulateFailure: boolean) {
    setTurnState({ status: "sending", turn });
    atBottomRef.current = true;
    mockAttempt(simulateFailure)
      .then(() => {
        if (turn.kind === "text") sendRefinementMessage(turn.text);
        else chooseDirection(turn.entryId, turn.option);
        setTurnState(null);
      })
      .catch(() => {
        setTurnState({ status: "failed", turn });
      });
  }

  function send() {
    const text = draft.trim();
    if (!text || turnState) return;
    setDraft("");
    inputRef.current?.focus();
    attemptTurn({ kind: "text", text }, text.toLowerCase() === FAIL_TRIGGER);
  }

  function pickDirection(entryId: string, option: DirectionOption) {
    if (turnState) return;
    const simulateFailure = draft.trim().toLowerCase() === FAIL_TRIGGER;
    attemptTurn({ kind: "direction", entryId, option }, simulateFailure);
  }

  /* Retry always attempts for real: in the mock, a transient failure is
     assumed resolved by the time someone deliberately retries, so this is
     the one way out of a failed text turn (its wording can't be edited) and
     the fast path for a failed direction turn. */
  function retry() {
    if (!turnState || turnState.status !== "failed") return;
    attemptTurn(turnState.turn, false);
  }

  /* The other way out — drop the failed turn without resending, back to
     idle so the reader can type something else or pick a different
     direction instead. Never silent: the reader chose this, Discard didn't
     happen to them. */
  function discard() {
    setTurnState(null);
  }

  return (
    <div className="c-chat">
      <h2 className="long-primer kirk o-type-display">Conversation</h2>

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
            pendingChoiceId={
              turnState?.status === "sending" &&
              turnState.turn.kind === "direction" &&
              turnState.turn.entryId === entry.id
                ? turnState.turn.option.id
                : undefined
            }
            disabled={turnState !== null}
          />
        ))}

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
        disabled={turnState !== null}
        label="Your reply"
        ariaLabel="Your reply to Plotted"
        placeholder="Ask for a swap, more options, a different direction…"
      />
    </div>
  );
}

function EntryView({
  entry,
  showFrom,
  schemePlantIds,
  onAdd,
  onChooseDirection,
  pendingChoiceId,
  disabled,
}: {
  entry: ChatEntry;
  showFrom: boolean;
  schemePlantIds: string[];
  onAdd: ReturnType<typeof usePlantScheme>["addSuggestedPlant"];
  onChooseDirection: (entryId: string, option: DirectionOption) => void;
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
    return (
      <div className="c-chat__panel">
        <p className="c-chat__panel-title brevier">{entry.title}</p>
        <div className="o-stack--compact">
          {entry.plants.map((plant, i) => {
            const compositeId = `${entry.id}:${plant.plantId}`;
            const added = schemePlantIds.includes(compositeId);
            return (
              /* Cards in a fresh panel ease in one after another — the scheme
                 arrives as a planting, not a dump. Keyed by card, so flipping
                 to "Added" never replays the entrance. */
              <div
                key={compositeId}
                className="c-scheme-chat__arrive"
                style={{ "--_delay": `${i * 80}ms` } as React.CSSProperties}
              >
                <PlantCard
                  plant={plant}
                  actions={
                    added ? (
                      <span className="c-suggestion__added minion">
                        <Icon name="check" size={12} /> Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="c-suggestion__add brevier"
                        onClick={() => onAdd(entry.id, plant)}
                      >
                        + Add
                      </button>
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // entry.kind === "directions"
  return (
    <DirectionOptions
      entry={entry}
      onChoose={onChooseDirection}
      pendingChoiceId={pendingChoiceId}
      disabled={disabled}
    />
  );
}
