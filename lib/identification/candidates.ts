import type { IdentificationCandidate } from "./types";

// Always three. The spec rules out a conditional single-result view: the
// thresholds aren't calibratable and a lone result implies a certainty the
// provider hasn't earned.
export const CANDIDATE_COUNT = 3;

// Above this the top result is framed as likely; below, as a guess. The score
// itself is never shown — it only picks the register of the copy.
const LIKELY_THRESHOLD = 0.6;

export function topCandidates(
  candidates: IdentificationCandidate[]
): IdentificationCandidate[] {
  return candidates.slice(0, CANDIDATE_COUNT);
}

export function confidenceRegister(score: number): "likely" | "guess" {
  return score > LIKELY_THRESHOLD ? "likely" : "guess";
}

/**
 * The genus shared by all the shown candidates, if there is one.
 *
 * When the provider can't separate species but is confident about the genus,
 * "Hydrangea — species uncertain" turns the worst-case output into a usable
 * answer. Needs at least two candidates to be a meaningful agreement.
 */
export function sharedGenus(candidates: IdentificationCandidate[]): string | null {
  const shown = topCandidates(candidates);
  if (shown.length < 2) return null;

  const first = shown[0].genus?.trim();
  if (!first) return null;

  const allAgree = shown.every(
    (c) => c.genus?.trim().toLowerCase() === first.toLowerCase()
  );
  return allAgree ? first : null;
}
