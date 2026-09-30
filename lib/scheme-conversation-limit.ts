import type { SupabaseClient } from "@supabase/supabase-js";

// Abuse protection at private-beta scale, not a quota system — no user-facing
// balance, no upgrade path. Each conversational-scheme turn is a real model
// call, so this caps what one user can spend in an hour while staying well
// above what a genuine planning session needs (a long chat is ~15–20 turns).
export const HOURLY_SCHEME_TURN_LIMIT = 40;
export const SCHEME_TURN_WINDOW_MS = 60 * 60 * 1000;

export class SchemeTurnLimitError extends Error {}

/**
 * Checks the caller's turn count for the current hourly window and increments
 * it. Throws SchemeTurnLimitError if the window is already at the cap — the
 * route maps that to a 429.
 *
 * Same trade-offs as enforceDailyIdentifyLimit (lib/identification/dailyLimit.ts):
 * a read-then-write, not an atomic increment, so not perfectly race-safe under
 * concurrent requests from one user — acceptable for an abuse guard, since the
 * chat only ever has one turn in flight. Unlike that function, a failed read
 * or write throws rather than silently letting the request through: this
 * guards per-message API spend, so it fails closed (e.g. if migration 034
 * hasn't been applied).
 */
export async function enforceHourlySchemeTurnLimit(
  supabase: SupabaseClient,
  userId: string,
  now = new Date()
): Promise<void> {
  const { data: flags, error: readError } = await supabase
    .from("user_flags")
    .select("scheme_turn_count, scheme_turn_window_start")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw new Error(`scheme turn limit read failed: ${readError.message}`);

  const windowStart = flags?.scheme_turn_window_start
    ? new Date(flags.scheme_turn_window_start)
    : null;
  const isNewWindow =
    !windowStart || now.getTime() - windowStart.getTime() >= SCHEME_TURN_WINDOW_MS;
  const currentCount = isNewWindow ? 0 : (flags?.scheme_turn_count ?? 0);

  if (currentCount >= HOURLY_SCHEME_TURN_LIMIT) {
    throw new SchemeTurnLimitError("Hourly scheme turn limit reached");
  }

  const { error: writeError } = await supabase.from("user_flags").upsert(
    {
      user_id: userId,
      scheme_turn_count: currentCount + 1,
      scheme_turn_window_start: isNewWindow ? now.toISOString() : windowStart!.toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (writeError) throw new Error(`scheme turn limit write failed: ${writeError.message}`);
}
