/**
 * A scheme still 'generating' after this long is treated as abandoned (the
 * server died mid-generation): a conversation-scheme save may reclaim it, and
 * a refresh shows it as failed rather than polling forever. Generation itself
 * takes ~30s. No server-only imports, so client and server can share it.
 */
export const STALE_GENERATING_MS = 5 * 60 * 1000;

/** True when a 'generating' scheme last changed longer ago than STALE_GENERATING_MS. */
export function isStaleGenerating(updatedAtIso: string): boolean {
  return Date.now() - new Date(updatedAtIso).getTime() >= STALE_GENERATING_MS;
}
