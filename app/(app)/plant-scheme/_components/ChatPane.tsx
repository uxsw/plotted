"use client";

/**
 * The conversation half of the persistent split-pane view.
 *
 * Shows the full scrollback: the Q1–Q4 recap (derived from `outcomes`) followed
 * by the refinement `transcript` (text turns + inline suggestion / direction
 * cards). Suggestion cards never disappear on add — they flip to an "Added"
 * state instead. All assistant responses are mocked (see PlantSchemeContext).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { usePlantScheme, type ChatEntry } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";
import { PlantCard, CheckIcon } from "./PlantCard";

type RecapLine = { id: string; role: "assistant" | "user"; text: string };

const INTRO_TEXT =
  "Placeholder: I'll ask a few questions about your space. Your answers build a garden profile so future schemes need fewer questions.";

function Bubble({ role, text }: { role: "assistant" | "user"; text: string }) {
  return (
    <div className={role === "user" ? "self-end max-w-[80%]" : "self-start max-w-[90%]"}>
      <div
        className={
          role === "user"
            ? "bg-marigold text-ink px-3 py-2 brevier"
            : "bg-paper-deep text-ink px-3 py-2 brevier"
        }
      >
        {text}
      </div>
    </div>
  );
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const startingPlants =
    path === "existing" ? selectedGardenPlants.map((p) => p.commonName) : freeTextPlants;

  const recap = useMemo<RecapLine[]>(() => {
    const out: RecapLine[] = [{ id: "intro", role: "assistant", text: INTRO_TEXT }];
    if (startingPlants.length > 0) {
      out.push({
        id: "starting-plants",
        role: "assistant",
        text: `Placeholder: building a scheme around ${startingPlants.join(", ")}.`,
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [recap.length, transcript.length]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    sendRefinementMessage(text);
    setDraft("");
  }

  return (
    <div className="o-stack--compact min-w-0">
      <h2 className="long-primer kirk o-type-display">Conversation</h2>

      <div
        ref={scrollRef}
        className="flex flex-col gap-3 h-[60vh] overflow-y-auto border border-sand-line bg-paper p-4"
      >
        {recap.map((m) => (
          <Bubble key={m.id} role={m.role} text={m.text} />
        ))}

        {transcript.map((entry) => (
          <EntryView
            key={entry.id}
            entry={entry}
            schemePlantIds={schemePlants.map((p) => p.id)}
            onAdd={addSuggestedPlant}
            onChooseDirection={chooseDirection}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Placeholder: ask for a swap, more options, a different direction…"
          aria-label="Message"
          className="flex-1 bg-paper border border-sand-line px-3 py-2 primer outline-none focus:border-marigold"
        />
        <Button onClick={send} disabled={!draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

function EntryView({
  entry,
  schemePlantIds,
  onAdd,
  onChooseDirection,
}: {
  entry: ChatEntry;
  schemePlantIds: string[];
  onAdd: ReturnType<typeof usePlantScheme>["addSuggestedPlant"];
  onChooseDirection: ReturnType<typeof usePlantScheme>["chooseDirection"];
}) {
  if (entry.kind === "text") {
    return <Bubble role={entry.role} text={entry.text} />;
  }

  if (entry.kind === "suggestions") {
    return (
      <div className="self-start w-full border border-sand-line bg-paper-deep p-3 o-stack--compact">
        <p className="minion text-ink-soft">{entry.title}</p>
        <div className="grid gap-2">
          {entry.plants.map((plant) => {
            const compositeId = `${entry.id}:${plant.plantId}`;
            const added = schemePlantIds.includes(compositeId);
            return (
              <PlantCard
                key={compositeId}
                plant={plant}
                actions={
                  added ? (
                    <span className="o-badge is-sm inline-flex items-center gap-1">
                      <CheckIcon /> Added
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => onAdd(entry.id, plant)}
                      className="px-2 py-1"
                    >
                      + Add
                    </Button>
                  )
                }
              />
            );
          })}
        </div>
      </div>
    );
  }

  // entry.kind === "directions"
  return (
    <div className="self-start w-full border border-sand-line bg-paper-deep p-3 o-stack--compact">
      <p className="minion text-ink-soft">{entry.title}</p>
      <div className="grid gap-2">
        {entry.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChooseDirection(entry.id, option)}
            className="c-scheme-prefs__choice is-default"
            style={{ textAlign: "left", alignItems: "flex-start" }}
          >
            <span className="primer">{option.label}</span>
            <span className="minion">{option.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
