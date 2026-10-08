// Shared between the background enrichment job (species-reference-enrichment.ts,
// server-only — do not import that module from client components) and the
// plant detail page's "Looking up frost tolerance…" affordance
// (PlantDetail.tsx, a client component). Both need the same notion of "how
// long is a pending lookup still genuinely in flight" — the UI shouldn't show
// an indefinite spinner past the point the server itself would consider the
// row stale and eligible for retry. Kept in its own dependency-free module so
// the client bundle never pulls in species-reference-enrichment.ts's
// server-only imports (Anthropic SDK, service-role Supabase client).
export const PENDING_STALE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Whether the plant detail page should show "Looking up frost tolerance…"
 * (and poll). True only while an answer could still arrive: the plant is
 * recently added, it has a genus — enrichment never runs without one (the
 * genus guard, hasGenusForEnrichment), so with a blank genus there is nothing
 * to wait for — and there is no species_reference row yet or it is pending.
 */
export function isFrostLookupPending(input: {
  recentlyAdded: boolean;
  genus: string | null | undefined;
  speciesRef: { lookup_status: "pending" | "complete" | "failed" } | null;
}): boolean {
  if (!input.recentlyAdded || !input.genus?.trim()) return false;
  return input.speciesRef === null || input.speciesRef.lookup_status === "pending";
}
