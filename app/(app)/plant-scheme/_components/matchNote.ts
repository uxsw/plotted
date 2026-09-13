/**
 * Builds the short "why this fits" line under a suggestion card, tying a
 * mocked plant back to the gardener's own Q1 (aspect) / Q2 (soil) answers.
 *
 * Without this, a suggestion panel reads as generic plant matching — the
 * badges show general traits (drought tolerant, pollinators) but nothing
 * connects a specific card back to what THIS gardener actually said about
 * THIS bed. That gap undermines the "quietly clever" positioning (PRODUCT.md):
 * competent-looking output with no visible reasoning behind it.
 *
 * Same crude-but-honest mock idiom as `DISLIKE_MARKERS` in
 * PlantSchemeContext.tsx: real horticultural fit per plant (`MockSuggestion.sun`
 * / `.soil`), matched against the user's answer text with keyword sniffing,
 * not real NLU. A real integration replaces the matching, not the shape —
 * this always stays a short, honest sentence about what actually lined up,
 * never a fabricated one when nothing did (the user said "not sure", skipped
 * the question, or the plant's needs don't line up with what they described).
 */

import type { MockSoil, MockSuggestion, MockSun } from "./mockData";
import type { QuestionOutcome } from "./PlantSchemeContext";

function matchSun(answer: string): MockSun | null {
  const t = answer.toLowerCase();
  if (t.includes("full sun")) return "full-sun";
  if (t.includes("partial shade") || t.includes("part shade")) return "partial-shade";
  if (t.includes("full shade") || t.includes("shade")) return "full-shade";
  return null;
}

function matchSoil(answer: string): MockSoil | null {
  const t = answer.toLowerCase();
  if (
    t.includes("free-draining") ||
    t.includes("free draining") ||
    t.includes("light and dry") ||
    t.includes("dry")
  )
    return "free-draining";
  if (t.includes("clay") || t.includes("heavy")) return "clay";
  if (t.includes("damp") || t.includes("wet")) return "damp";
  return null;
}

const SUN_LABEL: Record<MockSun, string> = {
  "full-sun": "full sun",
  "partial-shade": "partial shade",
  "full-shade": "full shade",
};

const SOIL_LABEL: Record<MockSoil, string> = {
  "free-draining": "free-draining soil",
  clay: "heavy clay",
  damp: "damp soil",
};

/**
 * `undefined` when neither the aspect nor the soil answer both (a) exists as
 * a real answer (not skipped) and (b) recognisably matches this plant's own
 * needs — silence is correct here, not a fabricated match.
 */
export function buildMatchNote(
  plant: Pick<MockSuggestion, "sun" | "soil">,
  outcomes: QuestionOutcome[]
): string | undefined {
  const aspectAnswer = outcomes.find((o) => o.questionId === "aspect" && o.type === "answered")
    ?.answer;
  const soilAnswer = outcomes.find((o) => o.questionId === "soil" && o.type === "answered")
    ?.answer;

  const sunMatches = aspectAnswer ? matchSun(aspectAnswer) === plant.sun : false;
  const soilMatches = soilAnswer ? matchSoil(soilAnswer) === plant.soil : false;

  if (sunMatches && soilMatches) {
    return `Suits your ${SUN_LABEL[plant.sun]}, ${SOIL_LABEL[plant.soil]}.`;
  }
  if (sunMatches) return `Suits your ${SUN_LABEL[plant.sun]} spot.`;
  if (soilMatches) return `Suits your ${SOIL_LABEL[plant.soil]}.`;
  return undefined;
}
