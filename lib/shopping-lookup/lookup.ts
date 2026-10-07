import {
  fetchWikipediaSummary,
  type WikimediaImage,
  type WikipediaSummaryResult,
} from "@/lib/wikimedia";
import {
  resolvePlantName,
  type LookupConfidence,
  type ModelUsage,
  type ResolverCandidate,
} from "./resolver";
import { summarisePlant, type PlantSummary } from "./summary";
import {
  finalConfidence,
  verificationFrom,
  wikipediaTitleFor,
  type Verification,
} from "./verify";

// Resolve → verify → (for a confident match) summarise. No database access:
// the caller decides what to write. See docs/specs/shopping-list-manual-add.md §3.

const WIKIPEDIA_STAGGER_MS = 120;

export type VerifiedCandidate = ResolverCandidate & {
  /** "not_checked" for low-confidence candidates, which are never looked up. */
  verification: Verification | "not_checked";
  final_confidence: LookupConfidence;
};

export type CandidateDetails = {
  summary: PlantSummary | null;
  /** Only ever from a verified page — a wrong photo is worse than none. */
  image: WikimediaImage | null;
};

export type LookupOutcome =
  /** One confident match: its fields can be written to the item. */
  | { kind: "resolved"; candidate: VerifiedCandidate; details: CandidateDetails }
  /** Plausible matches the gardener should confirm ("Did you mean…?"). */
  | { kind: "suggest"; candidates: VerifiedCandidate[] }
  /** Only guesses: leave the item as typed, say nothing. */
  | { kind: "low" }
  /** Nothing the text could reasonably be mapped to. */
  | { kind: "none" };

export type LookupTrace = {
  candidates: VerifiedCandidate[];
  resolver: ModelUsage | null;
  summary: ModelUsage | null;
  wikipedia_ms: number;
};

const RANK: Record<LookupConfidence, number> = { high: 0, medium: 1, low: 2 };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The candidate's Wikipedia page. A bare genus is often also something else
 * ("Rosa", "Iris" are disambiguation pages), so those get a second try at
 * "Genus (plant)". Never throws.
 */
async function fetchCandidatePage(candidate: ResolverCandidate): Promise<WikipediaSummaryResult> {
  try {
    const page = await fetchWikipediaSummary(wikipediaTitleFor(candidate));
    if (!candidate.species && page.status === "found" && page.summary.type === "disambiguation") {
      return await fetchWikipediaSummary(`${candidate.genus} (plant)`);
    }
    return page;
  } catch {
    return { status: "error" };
  }
}

/**
 * Summary and image for one candidate. Used for a confident match, and again
 * when the gardener accepts a suggestion. Never throws: a failed summary or a
 * missing image leaves that part null.
 */
export async function describeCandidate(
  candidate: ResolverCandidate,
  page?: WikipediaSummaryResult
): Promise<CandidateDetails & { usage: ModelUsage | null }> {
  const result = page ?? (await fetchCandidatePage(candidate));
  const verified =
    result.status === "found" && verificationFrom(candidate, result) === "verified"
      ? result.summary
      : null;

  let summary: PlantSummary | null = null;
  let usage: ModelUsage | null = null;
  try {
    const summarised = await summarisePlant(candidate, verified?.extract ?? null);
    summary = summarised.result;
    usage = summarised.usage;
  } catch (err) {
    console.error("[shopping-lookup] summary failed:", err);
  }

  return { summary, image: verified?.image ?? null, usage };
}

export async function lookupPlantByName(
  enteredName: string,
  knownPlants: string[] = []
): Promise<{ outcome: LookupOutcome; trace: LookupTrace }> {
  const { candidates: resolved, usage: resolverUsage } = await resolvePlantName(
    enteredName,
    knownPlants
  );

  const pages = new Map<ResolverCandidate, WikipediaSummaryResult>();
  const wikiStarted = Date.now();
  let fetched = 0;

  const candidates: VerifiedCandidate[] = [];
  for (const candidate of resolved) {
    if (candidate.confidence === "low") {
      candidates.push({ ...candidate, verification: "not_checked", final_confidence: "low" });
      continue;
    }
    if (fetched++ > 0) await delay(WIKIPEDIA_STAGGER_MS);
    const page = await fetchCandidatePage(candidate);
    pages.set(candidate, page);
    const verification = verificationFrom(candidate, page);
    candidates.push({
      ...candidate,
      verification,
      final_confidence: finalConfidence(candidate, verification, resolved.length),
    });
  }
  const wikipediaMs = fetched ? Date.now() - wikiStarted : 0;

  // Stable sort: the model's own order breaks ties.
  const ranked = [...candidates].sort(
    (a, b) => RANK[a.final_confidence] - RANK[b.final_confidence]
  );
  const trace: LookupTrace = {
    candidates: ranked,
    resolver: resolverUsage,
    summary: null,
    wikipedia_ms: wikipediaMs,
  };

  if (ranked.length === 0) return { outcome: { kind: "none" }, trace };

  const highs = ranked.filter((c) => c.final_confidence === "high");
  if (highs.length === 1) {
    const top = highs[0];
    const source = resolved[candidates.indexOf(top)];
    const { usage, ...details } = await describeCandidate(top, pages.get(source));
    trace.summary = usage;
    return { outcome: { kind: "resolved", candidate: top, details }, trace };
  }

  // Two confident answers is an ambiguity, not a resolution: ask.
  const plausible = ranked.filter((c) => c.final_confidence !== "low");
  if (plausible.length > 0) return { outcome: { kind: "suggest", candidates: plausible }, trace };

  return { outcome: { kind: "low" }, trace };
}
