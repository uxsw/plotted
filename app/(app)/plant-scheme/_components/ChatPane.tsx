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
 * streamed LLM response will have.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlantScheme, type ChatEntry, type DirectionOption } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";
import { PlantCard } from "./PlantCard";
import { ChatMessage, ChatComposer, TypingIndicator } from "./ChatLog";
import { Icon } from "@/components/ui/Icon";

const THINK_MS = 700;

const INTRO_TEXT =
  "I'll help you turn this into a full planting scheme. Ask for a swap, more options in a direction, or tell me what isn't working — your list only changes when you add something.";

type Role = "assistant" | "user";
type RecapLine = { id: string; role: Role; text: string };

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
  const [pending, setPending] = useState<string | null>(null);
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
  }, [recap.length, transcript.length, pending]);

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

  function send() {
    const text = draft.trim();
    if (!text || pending) return;
    setPending(text);
    setDraft("");
    atBottomRef.current = true;
    inputRef.current?.focus();
    window.setTimeout(() => {
      sendRefinementMessage(text);
      setPending(null);
    }, THINK_MS);
  }

  function pickDirection(entryId: string, option: DirectionOption) {
    if (pending) return;
    setPending(`Let's try "${option.label}".`);
    atBottomRef.current = true;
    window.setTimeout(() => {
      chooseDirection(entryId, option);
      setPending(null);
    }, THINK_MS);
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
            disabled={pending !== null}
          />
        ))}

        {pending !== null && (
          <>
            <ChatMessage role="user">{pending}</ChatMessage>
            <TypingIndicator />
          </>
        )}
      </div>

      <ChatComposer
        ref={inputRef}
        value={draft}
        onChange={setDraft}
        onSend={send}
        disabled={pending !== null}
        ariaLabel="Message Plotted"
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
  disabled,
}: {
  entry: ChatEntry;
  showFrom: boolean;
  schemePlantIds: string[];
  onAdd: ReturnType<typeof usePlantScheme>["addSuggestedPlant"];
  onChooseDirection: (entryId: string, option: DirectionOption) => void;
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
    <div className="c-chat__panel">
      <p className="c-chat__panel-title brevier">{entry.title}</p>
      <div className="o-stack--compact">
        {entry.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="c-chat__option"
            disabled={disabled}
            onClick={() => onChooseDirection(entry.id, option)}
          >
            <span className="c-chat__option__label primer">{option.label}</span>
            <span className="c-chat__option__blurb minion">{option.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
