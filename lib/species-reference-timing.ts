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
