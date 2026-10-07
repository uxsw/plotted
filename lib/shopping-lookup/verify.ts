import type { WikipediaSummary, WikipediaSummaryResult } from "@/lib/wikimedia";
import type { LookupConfidence, ResolverCandidate } from "./resolver";

// Pure rules for turning "what the model thinks" plus "what Wikipedia has"
// into the confidence the UI acts on. No network or model calls in here.

/**
 * verified   — a real page that is about this plant.
 * unverified — no such page, or a page about something else.
 * unknown    — Wikipedia couldn't be asked (network error); says nothing either way.
 */
export type Verification = "verified" | "unverified" | "unknown";

/** The page title to look a candidate up under: the binomial, or the genus alone. */
export function wikipediaTitleFor(candidate: Pick<ResolverCandidate, "genus" | "species">): string {
  if (!candidate.species) return candidate.genus;
  return `${candidate.genus} ${candidate.species.replace(/^×/, "× ")}`;
}

const PLANT_WORDS =
  /\b(plants?|species|genus|flower(s|ing)?|shrubs?|trees?|perennials?|annuals?|herbs?|herbaceous|grass(es)?|ferns?|vines?|climbers?|cultivars?|hybrids?|succulents?|bulbs?|orchids?|conifers?|palms?|bamboos?)\b/i;

// "sulphureus" and "sulfureus" are the same epithet; so are a few others
// that differ only by ph/f. Folded on both sides before comparing.
function fold(text: string): string {
  return text.toLowerCase().replace(/ph/g, "f").replace(/×\s*/g, "");
}

/**
 * Is this page actually about the candidate? Guards against the ways a 200
 * can mislead: disambiguation pages, a genus name that is also something else
 * entirely ("Iris"), and — the one that matters for invented names — an
 * unknown species title redirecting to its genus page.
 */
export function isMatchingPlantPage(
  candidate: Pick<ResolverCandidate, "genus" | "species">,
  page: WikipediaSummary
): boolean {
  if (page.type !== "standard") return false;

  const text = fold([page.title, page.description ?? "", page.extract ?? ""].join(" "));
  if (!PLANT_WORDS.test(text)) return false;

  const hasWord = (word: string) => new RegExp(`(^|[^a-z])${fold(word)}([^a-z]|$)`).test(text);
  if (!hasWord(candidate.genus)) return false;
  if (candidate.species && !hasWord(candidate.species)) return false;
  return true;
}

export function verificationFrom(
  candidate: Pick<ResolverCandidate, "genus" | "species">,
  result: WikipediaSummaryResult
): Verification {
  if (result.status === "error") return "unknown";
  if (result.status === "missing") return "unverified";
  return isMatchingPlantPage(candidate, result.summary) ? "verified" : "unverified";
}

/**
 * | model  | Wikipedia              | final  |
 * | high   | verified               | high   |
 * | high   | unverified             | medium |
 * | high   | unknown (couldn't ask) | high   |
 * | medium | verified, see below    | high   |
 * | medium | anything else          | medium |
 * | low    | any                    | low    |
 *
 * Two caps come first, and nothing overrides them — a capped candidate is
 * medium at best:
 * - It names a cultivar. Wikipedia can only vouch for the species or genus,
 *   so a cultivar is never confirmed by anything but the gardener.
 * - It leaves part of the note unexplained (unmatched_text).
 *
 * A page proves the plant exists, not that it's the one the gardener meant —
 * so a medium is only raised when it is the model's one and only candidate
 * (a second candidate, even a guess, means the note was ambiguous) and it
 * names a species (a bare genus offered at medium is the model falling back
 * from an epithet it couldn't place, e.g. an invented species).
 */
export function finalConfidence(
  candidate: Pick<ResolverCandidate, "confidence" | "species" | "cultivar" | "unmatched_text">,
  verification: Verification,
  /** How many candidates the model returned in all, this one included. */
  totalCandidates: number
): LookupConfidence {
  if (candidate.confidence === "low") return "low";
  if (candidate.cultivar || candidate.unmatched_text) return "medium";
  if (candidate.confidence === "high") return verification === "unverified" ? "medium" : "high";
  return verification === "verified" && totalCandidates === 1 && candidate.species
    ? "high"
    : "medium";
}
