import { createClient } from "@/lib/supabase/server";

/**
 * Whether a signed-in user should be routed through the one-time "how a
 * scheme comes together" interstitial (/plant-scheme/welcome) before the
 * schemes hub. No signed-in user (shouldn't reach here — the (app) layout
 * already redirects) never needs it.
 *
 * Gated on two independent signals, either of which counts as "not new":
 *  - the interstitial has already been shown (user_flags.scheme_onboarding_seen_at)
 *  - the user already has at least one finished plan, made via the existing
 *    /schemes feature before this flag existed — they aren't new to
 *    planting schemes, whatever this flag says.
 */
export async function needsSchemeOnboarding(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const [{ data: flags }, { count }] = await Promise.all([
    supabase
      .from("user_flags")
      .select("scheme_onboarding_seen_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("schemes")
      .select("id", { count: "exact", head: true })
      .eq("status", "complete"),
  ]);

  if (flags?.scheme_onboarding_seen_at) return false;
  if ((count ?? 0) > 0) return false;
  return true;
}
