import {
  fetchWikipediaSummary,
  type WikimediaImage,
  type WikipediaSummaryResult,
} from "@/lib/wikimedia";
import type { ModelUsage } from "./client";
import { resolvePlantName, type LookupConfidence, type ResolverCandidate } from "./resolver";
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

/**
 * Hard ceiling on one whole lookup, whatever the individual timeouts and
 * retries add up to. When it runs out, whatever is in flight is aborted:
 * an unfinished resolve fails the lookup, an unfinished verification counts
 * as "couldn't ask", an unfinished summary is left blank. Sized to leave
 * room inside the shopping list page's 60s maxDuration for the image
 * snapshot and the database writes that follow.
 */
export const LOOKUP_BUDGET_MS = 40_000;
/** Not worth starting a model call with less than this left. */
const MIN_SUMMARY_MS = 3_000;

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
  /** The resolver's scratch line. Diagnostic only: never stored or shown. */
  sounds_like: string | null;
  resolver: ModelUsage | null;
  summary: ModelUsage | null;
  wikipedia_ms: number;
};

type Budget = { signal: AbortSignal; remaining: () => number };

function startBudget(ms: number): Budget {
  const deadline = Date.now() + ms;
  return { signal: AbortSignal.timeout(ms), remaining: () => deadline - Date.now() };
}

const RANK: Record<LookupConfidence, number> = { high: 0, medium: 1, low: 2 };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The candidate's Wikipedia page. A bare genus is often also something else
 * ("Rosa", "Iris" are disambiguation pages), so those get a second try at
 * "Genus (plant)". Never throws.
 */
async function fetchCandidatePage(
  candidate: ResolverCandidate,
  signal: AbortSignal
): Promise<WikipediaSummaryResult> {
  try {
    const page = await fetchWikipediaSummary(wikipediaTitleFor(candidate), { signal });
    if (!candidate.species && page.status === "found" && page.summary.type === "disambiguation") {
      return await fetchWikipediaSummary(`${candidate.genus} (plant)`, { signal });
    }
    return page;
  } catch {
    return { status: "error" };
  }
}

async function describe(
  candidate: ResolverCandidate,
  page: WikipediaSummaryResult | undefined,
  budget: Budget
): Promise<CandidateDetails & { usage: ModelUsage | null }> {
  const result = page ?? (await fetchCandidatePage(candidate, budget.signal));
  const verified =
    result.status === "found" && verificationFrom(candidate, result) === "verified"
      ? result.summary
      : null;

  let summary: PlantSummary | null = null;
  let usage: ModelUsage | null = null;
  if (budget.remaining() > MIN_SUMMARY_MS) {
    try {
      const summarised = await summarisePlant(candidate, verified?.extract ?? null, {
        signal: budget.signal,
      });
      summary = summarised.result;
      usage = summarised.usage;
    } catch (err) {
      console.error("[shopping-lookup] summary failed:", err instanceof Error ? err.message : err);
    }
  }

  return { summary, image: verified?.image ?? null, usage };
}

/**
 * Summary and image for one candidate the gardener has accepted from a
 * "Did you mean…?" suggestion. Never throws: a failed summary or a missing
 * image leaves that part null.
 */
export async function describeCandidate(
  candidate: ResolverCandidate,
  options: { budgetMs?: number } = {}
): Promise<CandidateDetails> {
  const { summary, image } = await describe(
    candidate,
    undefined,
    startBudget(options.budgetMs ?? LOOKUP_BUDGET_MS)
  );
  return { summary, image };
}

export async function lookupPlantByName(
  enteredName: string,
  knownPlants: string[] = [],
  options: { budgetMs?: number } = {}
): Promise<{ outcome: LookupOutcome; trace: LookupTrace }> {
  const budget = startBudget(options.budgetMs ?? LOOKUP_BUDGET_MS);

  const resolved = await resolvePlantName(enteredName, knownPlants, { signal: budget.signal });

  // Low-confidence candidates are never shown, so they are never looked up.
  const wikiStarted = Date.now();
  let fetched = 0;
  const pages = await Promise.all(
    resolved.candidates.map(async (candidate) => {
      if (candidate.confidence === "low") return null;
      const position = fetched++;
      if (position > 0) await delay(position * WIKIPEDIA_STAGGER_MS);
      return fetchCandidatePage(candidate, budget.signal);
    })
  );
  const wikipediaMs = fetched ? Date.now() - wikiStarted : 0;

  const candidates: VerifiedCandidate[] = resolved.candidates.map((candidate, index) => {
    const page = pages[index];
    if (!page) return { ...candidate, verification: "not_checked", final_confidence: "low" };
    const verification = verificationFrom(candidate, page);
    return {
      ...candidate,
      verification,
      final_confidence: finalConfidence(candidate, verification, resolved.candidates.length),
    };
  });

  // Stable sort: the model's own order breaks ties.
  const ranked = [...candidates].sort(
    (a, b) => RANK[a.final_confidence] - RANK[b.final_confidence]
  );
  const trace: LookupTrace = {
    candidates: ranked,
    sounds_like: resolved.sounds_like,
    resolver: resolved.usage,
    summary: null,
    wikipedia_ms: wikipediaMs,
  };

  if (ranked.length === 0) return { outcome: { kind: "none" }, trace };

  const highs = ranked.filter((c) => c.final_confidence === "high");
  if (highs.length === 1) {
    const top = highs[0];
    const { usage, ...details } = await describe(
      top,
      pages[candidates.indexOf(top)] ?? undefined,
      budget
    );
    trace.summary = usage;
    return { outcome: { kind: "resolved", candidate: top, details }, trace };
  }

  // Two confident answers is an ambiguity, not a resolution: ask.
  const plausible = ranked.filter((c) => c.final_confidence !== "low");
  if (plausible.length > 0) return { outcome: { kind: "suggest", candidates: plausible }, trace };

  return { outcome: { kind: "low" }, trace };
}
