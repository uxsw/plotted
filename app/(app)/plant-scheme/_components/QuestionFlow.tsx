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
 * An answer can also fail to send — see `attemptAnswer` for the retry/discard
 * state machine and the `/fail` dev trigger (same idiom as ChatPane.tsx).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";
import { usePlantScheme } from "./PlantSchemeContext";
import { MOCK_QUESTIONS } from "./mockData";
import { ChatMessage, AnswerOptions, ChatComposer, SendFailedNotice, TypingIndicator } from "./ChatLog";

const THINK_MS = 500;

/** See ChatPane.tsx's FAIL_TRIGGER for why this exists and how it's meant to
 *  be replaced. The delay is long enough for TypingIndicator's own stall
 *  threshold to show before the simulated failure lands. */
const FAIL_TRIGGER = "/fail";
const SIMULATED_FAILURE_DELAY_MS = 7500;

const INTRO_TEXT =
  "A few questions about your space so the scheme fits it — and so future schemes need fewer. Answer what you can; skip anything you're unsure of.";

type Role = "assistant" | "user";
type Line =
  | { id: string; role: Role; kind: "text"; text: string }
  | { id: "starting-plants"; role: "assistant"; kind: "plants" };
type AnswerState = { status: "sending" | "failed"; text: string };

/** One chip in the opening turn's starting-plants summary — the same shape
 *  StartPanel.tsx's tray pill reads from, minus the remove action (this is a
 *  record of what the scheme started from, not something still editable
 *  here). */
type StartingPlantChip =
  | { key: string; kind: "garden"; name: string; photoUrl: string | null }
  | { key: string; kind: "considering"; name: string };

function mockAttempt(simulateFailure: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(
      () => (simulateFailure ? reject(new Error("simulated failure")) : resolve()),
      simulateFailure ? SIMULATED_FAILURE_DELAY_MS : THINK_MS
    );
  });
}

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
  /* At most one answer in flight or failed at a time — the composer, Skip,
     and "build it now" all stay hidden until it resolves, the same
     lock-until-resolved shape ChatPane.tsx uses for the workspace chat. */
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startingPlantChips = useMemo<StartingPlantChip[]>(
    () => [
      ...selectedGardenPlants.map((p) => ({
        key: `garden:${p.plantId}`,
        kind: "garden" as const,
        name: p.commonName,
        photoUrl: p.photoUrl,
      })),
      ...freeTextPlants.map((name) => ({
        key: `typed:${name}`,
        kind: "considering" as const,
        name,
      })),
    ],
    [selectedGardenPlants, freeTextPlants]
  );
  const totalQuestions = MOCK_QUESTIONS.length;
  const currentQuestion = MOCK_QUESTIONS[questionIndex] ?? null;
  const isFirstQuestion = questionIndex === 0;
  const flowComplete = questionIndex >= totalQuestions;
  const busy = answerState !== null;

  const lines = useMemo<Line[]>(() => {
    const out: Line[] = [{ id: "intro", role: "assistant", kind: "text", text: INTRO_TEXT }];
    if (startingPlantChips.length > 0) {
      out.push({ id: "starting-plants", role: "assistant", kind: "plants" });
    }
    outcomes.forEach((outcome, i) => {
      const q = MOCK_QUESTIONS[i];
      if (q) out.push({ id: `q-${q.id}`, role: "assistant", kind: "text", text: q.prompt });
      out.push({
        id: `a-${i}`,
        role: "user",
        kind: "text",
        text: outcome.type === "skipped" ? "Skipped" : (outcome.answer ?? ""),
      });
    });
    if (currentQuestion && !busy) {
      out.push({
        id: `q-${currentQuestion.id}`,
        role: "assistant",
        kind: "text",
        text: currentQuestion.prompt,
      });
    }
    return out;
  }, [startingPlantChips, outcomes, currentQuestion, busy]);

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
  }, [lines.length, answerState]);

  // Fallback: every question handled but the flow hasn't completed — complete it.
  useEffect(() => {
    if (flowComplete && !busy) completeFlow();
  }, [flowComplete, busy, completeFlow]);

  function attemptAnswer(text: string, simulateFailure: boolean, wasLast: boolean) {
    setAnswerState({ status: "sending", text });
    mockAttempt(simulateFailure)
      .then(() => {
        answerQuestion(currentQuestion!.id, text);
        setAnswerState(null);
        if (wasLast) completeFlow();
      })
      .catch(() => setAnswerState({ status: "failed", text }));
  }

  function submitAnswer(value: string) {
    const text = value.trim();
    if (!text || !currentQuestion || busy) return;
    const wasLast = questionIndex === totalQuestions - 1;
    setDraft("");
    inputRef.current?.focus();
    attemptAnswer(text, text.toLowerCase() === FAIL_TRIGGER, wasLast);
  }

  /* Always attempts for real — same reasoning as ChatPane.tsx's retry(): a
     failed answer's wording can't be edited, so retry is its only way
     forward, and a mock retry should actually get there. */
  function retryAnswer() {
    if (!answerState || answerState.status !== "failed" || !currentQuestion) return;
    attemptAnswer(answerState.text, false, questionIndex === totalQuestions - 1);
  }

  function discardAnswer() {
    setAnswerState(null);
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
        aria-label={`Planting scheme, step 2: question ${Math.min(questionIndex + 1, totalQuestions)} of ${totalQuestions}`}
      >
        <span className="o-type-label">Planting scheme</span>
        <span className="c-scheme-journey__track" aria-hidden="true">
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
              {m.kind === "plants" ? (
                <StartingPlantsSummary chips={startingPlantChips} />
              ) : (
                m.text
              )}
            </ChatMessage>
          ))}

          {answerState && (
            <>
              <ChatMessage role="user">{answerState.text}</ChatMessage>
              {answerState.status === "sending" ? (
                <TypingIndicator />
              ) : (
                <SendFailedNotice onRetry={retryAnswer} onDiscard={discardAnswer} />
              )}
            </>
          )}
        </div>

        {currentQuestion && !busy && (
          <>
            {currentQuestion.suggestions && currentQuestion.suggestions.length > 0 && (
              <>
                <AnswerOptions options={currentQuestion.suggestions} onPick={submitAnswer} />
                <p className="c-scheme-chat__aside brevier">Or answer in your own words below.</p>
              </>
            )}

            <ChatComposer
              ref={inputRef}
              value={draft}
              onChange={setDraft}
              onSend={() => submitAnswer(draft)}
              label="Your answer"
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

/**
 * The opening turn's "here's what we're building around" line, rendered as
 * the same read-only tray pill StartPanel.tsx's starting tray uses (DESIGN.md:
 * "reuse the tray pill... rather than reinventing it per screen") instead of
 * a plain comma-joined sentence — a garden plant's photo carries more than
 * its name alone did, and a scheme with several starting plants reads as a
 * scannable row instead of a run-on clause. No remove control: this is a
 * record of what the scheme started from, not the tray itself.
 */
function StartingPlantsSummary({ chips }: { chips: StartingPlantChip[] }) {
  return (
    <>
      <span className="brevier">We&rsquo;re working from:</span>
      <ul
        className="c-scheme-start__picks c-scheme-chat__pills"
        aria-label="Starting plants"
      >
        {chips.map((chip) => (
          <li key={chip.key} className="c-scheme-start__pick c-scheme-start__pick--static">
            <span className="c-scheme-start__pick-mark">
              {chip.kind === "garden" && chip.photoUrl ? (
                <Image src={chip.photoUrl} alt="" fill sizes="32px" />
              ) : (
                <Icon name={chip.kind === "garden" ? "sprout" : "leaf"} size={14} />
              )}
            </span>
            <span className="c-scheme-start__pick-name brevier">
              {chip.name}
              <span className="u-visually-hidden">
                {chip.kind === "garden" ? " (in your garden)" : " (considering)"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
