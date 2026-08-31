"use client";

/**
 * The progressive question flow (Q1–Q4), step 3 of the journey.
 *
 * Rendered while context phase === "questions". Completing it calls
 * `completeFlow()`, which flips into the persistent workspace.
 *
 * Flow rules (from the spec):
 *  - Questions are asked one at a time.
 *  - Skip is available on every question (including the first).
 *  - Quick answer is available only from the second question onward — a scheme
 *    is never generated from zero context.
 *
 * Presentation reuses the shared c-chat primitives and the journey step marker,
 * so this reads as one continuous conversation with the workspace that follows.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import buttonStyles from "@/components/ui/Button.module.css";
import { usePlantScheme } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";
import { ChatMessage, ChatComposer, QuickReplies, TypingIndicator } from "./ChatLog";

const THINK_MS = 500;

const INTRO_TEXT =
  "A few questions about your space so the scheme fits it — and so future schemes need fewer. Answer what you can; skip anything you're unsure of.";

type Role = "assistant" | "user";
type Line = { id: string; role: Role; text: string };

export default function QuestionFlow() {
  const {
    path,
    selectedGardenPlants,
    freeTextPlants,
    questionIndex,
    outcomes,
    answerQuestion,
    skipQuestion,
    quickAnswer,
    completeFlow,
  } = usePlantScheme();

  const [draft, setDraft] = useState("");
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startingPlants =
    path === "existing" ? selectedGardenPlants.map((p) => p.commonName) : freeTextPlants;
  const totalQuestions = MOCK_QUESTIONS.length;
  const currentQuestion = MOCK_QUESTIONS[questionIndex] ?? null;
  const isFirstQuestion = questionIndex === 0;
  const flowComplete = questionIndex >= totalQuestions;
  const busy = pendingAnswer !== null;

  const lines = useMemo<Line[]>(() => {
    const out: Line[] = [{ id: "intro", role: "assistant", text: INTRO_TEXT }];
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
    if (currentQuestion && !busy) {
      out.push({ id: `q-${currentQuestion.id}`, role: "assistant", text: currentQuestion.prompt });
    }
    return out;
  }, [startingPlants, outcomes, currentQuestion, busy]);

  const roleSeq: Role[] = lines.map((l) => l.role);
  const headsRun = (i: number) => roleSeq[i] === "assistant" && roleSeq[i - 1] !== "assistant";

  // Auto-scroll to newest — instant on first render, smooth after. The log
  // opts out of browser scroll anchoring (see _chat.scss), which otherwise
  // shifts scrollTop when the pending bubble + typing indicator are swapped
  // for the landed reply and leaves the newest message out of view. No rAF
  // here: hidden tabs never fire animation frames.
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    // Instant in a hidden tab: smooth scrolling needs animation frames, which
    // don't run there — the animation would park mid-way until the tab fronts.
    el.scrollTo({
      top: el.scrollHeight,
      behavior: hasScrolledRef.current && !document.hidden ? "smooth" : "auto",
    });
    hasScrolledRef.current = true;
  }, [lines.length, pendingAnswer]);

  // Fallback: every question handled but the flow hasn't completed — complete it.
  useEffect(() => {
    if (flowComplete && !busy) completeFlow();
  }, [flowComplete, busy, completeFlow]);

  function submitAnswer(value: string) {
    const text = value.trim();
    if (!text || !currentQuestion || busy) return;
    const wasLast = questionIndex === totalQuestions - 1;
    setPendingAnswer(text);
    setDraft("");
    inputRef.current?.focus();
    window.setTimeout(() => {
      answerQuestion(currentQuestion.id, text);
      setPendingAnswer(null);
      if (wasLast) completeFlow();
    }, THINK_MS);
  }

  function handleSkip() {
    if (!currentQuestion || busy) return;
    const wasLast = questionIndex === totalQuestions - 1;
    skipQuestion(currentQuestion.id);
    if (wasLast) completeFlow();
  }

  function handleQuickAnswer() {
    if (busy) return;
    quickAnswer();
    completeFlow();
  }

  return (
    <div className={clsx("c-scheme-chat", path === "existing" ? "is-path-existing" : "is-path-scratch")}>
      <div
        className="c-scheme-journey"
        aria-label={`Planting scheme, step 3: question ${Math.min(questionIndex + 1, totalQuestions)} of ${totalQuestions}`}
      >
        <span className="o-type-label">Planting scheme</span>
        <span className="c-scheme-journey__track" aria-hidden="true">
          <span className="is-done" />
          <span className="is-done" />
          <span className="is-current" />
        </span>
        <span className="o-type-label c-scheme-journey__count">
          {Math.min(questionIndex + 1, totalQuestions)} / {totalQuestions}
        </span>
      </div>

      <div className="o-stack">
        <h1 className="paragon o-type-display kirk">A few questions</h1>
      </div>

      <div className="c-chat">
        <div
          ref={logRef}
          className="c-chat__log c-chat__log--short"
          role="log"
          aria-live="polite"
          aria-label="Questions from Plotted"
        >
          {lines.map((m, i) => (
            <ChatMessage key={m.id} role={m.role} showFrom={headsRun(i)}>
              {m.text}
            </ChatMessage>
          ))}

          {busy && (
            <>
              <ChatMessage role="user">{pendingAnswer}</ChatMessage>
              <TypingIndicator />
            </>
          )}
        </div>

        {currentQuestion && !busy && (
          <>
            {currentQuestion.suggestions && currentQuestion.suggestions.length > 0 && (
              <QuickReplies options={currentQuestion.suggestions} onPick={submitAnswer} />
            )}

            <ChatComposer
              ref={inputRef}
              value={draft}
              onChange={setDraft}
              onSend={() => submitAnswer(draft)}
              ariaLabel="Your answer"
              placeholder="Type your answer…"
            />

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
                <Button variant="ghost" onClick={handleQuickAnswer}>
                  Skip ahead — build it now
                </Button>
              )}
            </div>

            {!isFirstQuestion && (
              <p className="c-scheme-chat__aside brevier">
                Building now uses just what you&apos;ve given so far — less tailored than
                finishing the questions, and you can keep refining afterwards.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
