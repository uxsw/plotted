"use client";

/**
 * The progressive question flow (Q1–Q4), Stage 1.
 *
 * UNCHANGED from the original shell except the exit: instead of navigating to a
 * separate results route, completing the flow calls `completeFlow()`, which
 * flips the context into the persistent split-pane phase.
 *
 * Flow rules (from the spec):
 *  - Questions are asked one at a time.
 *  - Skip is available on every question (including the first).
 *  - Quick answer is available only from the second question onward — a scheme
 *    is never generated from zero context.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import buttonStyles from "@/components/ui/Button.module.css";
import { usePlantScheme } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";

type TranscriptLine = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const INTRO_TEXT =
  "Placeholder: I'll ask a few questions about your space. Your answers build a garden profile so future schemes need fewer questions. Answer what you can — skip anything you're unsure of.";

export default function QuestionFlow() {
  const {
    path,
    selectedPlantLabels,
    freeTextPlants,
    questionIndex,
    outcomes,
    answerQuestion,
    skipQuestion,
    quickAnswer,
    completeFlow,
  } = usePlantScheme();

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const startingPlants = path === "existing" ? selectedPlantLabels : freeTextPlants;
  const totalQuestions = MOCK_QUESTIONS.length;
  const currentQuestion = MOCK_QUESTIONS[questionIndex] ?? null;
  const isFirstQuestion = questionIndex === 0;
  const flowComplete = questionIndex >= totalQuestions;

  const lines = useMemo<TranscriptLine[]>(() => {
    const out: TranscriptLine[] = [{ id: "intro", role: "assistant", text: INTRO_TEXT }];

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

    if (currentQuestion) {
      out.push({ id: `q-${currentQuestion.id}`, role: "assistant", text: currentQuestion.prompt });
    }

    return out;
  }, [startingPlants, outcomes, currentQuestion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  // Fallback: if every question has been handled but the flow hasn't been
  // completed yet, complete it.
  useEffect(() => {
    if (flowComplete) completeFlow();
  }, [flowComplete, completeFlow]);

  function submitAnswer(value: string) {
    const text = value.trim();
    if (!text || !currentQuestion) return;
    const wasLast = questionIndex === totalQuestions - 1;
    answerQuestion(currentQuestion.id, text);
    setDraft("");
    if (wasLast) completeFlow();
  }

  function handleSkip() {
    if (!currentQuestion) return;
    const wasLast = questionIndex === totalQuestions - 1;
    skipQuestion(currentQuestion.id);
    if (wasLast) completeFlow();
  }

  function handleQuickAnswer() {
    quickAnswer();
    completeFlow();
  }

  return (
    <div className="o-stack">
      <div className="o-row o-row--space-between">
        <h1 className="pica o-type-display kirk">A few questions</h1>
        <span className="minion">
          Placeholder · {Math.min(questionIndex + 1, totalQuestions)} of {totalQuestions}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto border border-sand-line bg-paper p-4"
      >
        {lines.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "self-end max-w-[80%]" : "self-start max-w-[85%]"}
          >
            <div
              className={
                m.role === "user"
                  ? "bg-marigold text-ink px-3 py-2 brevier"
                  : "bg-paper-deep text-ink px-3 py-2 brevier"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {currentQuestion && (
        <div className="o-stack--compact">
          {currentQuestion.suggestions && currentQuestion.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentQuestion.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submitAnswer(s)}
                  className="o-badge is-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitAnswer(draft);
                }
              }}
              placeholder="Type your answer…"
              aria-label="Your answer"
              className="flex-1 bg-paper border border-sand-line px-3 py-2 primer outline-none focus:border-marigold"
            />
            <Button onClick={() => submitAnswer(draft)} disabled={!draft.trim()}>
              Send
            </Button>
          </div>

          <div className="o-row">
            <button
              type="button"
              onClick={handleSkip}
              className={clsx(
                buttonStyles["o-button"],
                buttonStyles["o-button--ghost"],
                buttonStyles["o-button--flush-start"]
              )}
            >
              Skip this question
            </button>

            {!isFirstQuestion && (
              <button
                type="button"
                onClick={handleQuickAnswer}
                className={clsx(buttonStyles["o-button"], buttonStyles["o-button--ghost"])}
              >
                Quick answer — stop &amp; generate now
              </button>
            )}
          </div>

          {!isFirstQuestion && (
            <p className="minion text-ink-soft">
              Placeholder: a quick answer generates a scheme from what you&apos;ve given so far —
              it&apos;ll be less tailored than finishing the questions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
