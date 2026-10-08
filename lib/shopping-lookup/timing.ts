// Dependency-free so client components (ShoppingList.tsx, via
// lib/shopping-list.ts) can share these with the server-side lookup without
// pulling the Anthropic SDK into the client bundle. Deliberately not the
// species_reference constant: the two lookups are separate features.

/** A lookup still "pending" after this long is treated as failed and can be retried. */
export const LOOKUP_PENDING_STALE_MS = 10 * 60 * 1000;

/** How many lookups one user can have running at once. The rest wait their turn. */
export const MAX_CONCURRENT_LOOKUPS = 3;

/** How often the shopping list page re-fetches while a lookup is in flight. */
export const LOOKUP_POLL_INTERVAL_MS = 5000;
