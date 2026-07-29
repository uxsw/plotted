import type { SupabaseClient } from "@supabase/supabase-js";
import { IdentificationLimitError } from "./types";

// Abuse protection at private-beta scale, not a quota system — no user-facing
// balance, no upgrade path. Pl@ntNet's whole-app free tier is 500 requests/day
// (see spec_1.md); this keeps one user from being able to exhaust it alone
// while staying generous enough for genuinely setting up a garden in one day.
export const DAILY_IDENTIFY_LIMIT = 20;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks the caller's daily identification count and increments it.
 * Throws IdentificationLimitError if today's count is already at the cap —
 * the route maps that to a plain error response, no upgrade prompt.
 *
 * Not perfectly race-safe under concurrent requests from the same user (a
 * read-then-write, not an atomic increment) — acceptable for an abuse guard
 * at this scale; a user racing their own limit isn't the threat being
 * guarded against.
 */
export async function enforceDailyIdentifyLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = todayUTC();

  const { data: flags } = await supabase
    .from("user_flags")
    .select("identify_count, identify_count_date")
    .eq("user_id", userId)
    .maybeSingle();

  const isNewDay = !flags || flags.identify_count_date !== today;
  const currentCount = isNewDay ? 0 : (flags?.identify_count ?? 0);

  if (currentCount >= DAILY_IDENTIFY_LIMIT) {
    throw new IdentificationLimitError("Daily identification limit reached");
  }

  await supabase
    .from("user_flags")
    .upsert(
      { user_id: userId, identify_count: currentCount + 1, identify_count_date: today },
      { onConflict: "user_id" }
    );
}
