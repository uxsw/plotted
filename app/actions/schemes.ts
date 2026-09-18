"use server";

import { createClient } from "@/lib/supabase/server";

export async function markSchemeAiNoticeSeen(schemeId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("schemes")
    .update({ ai_notice_seen_at: new Date().toISOString() })
    .eq("id", schemeId)
    .eq("user_id", user.id);
}

/** Marks the one-time /plant-scheme/welcome interstitial as shown, so a
 *  later visit goes straight to the hub. See lib/scheme-onboarding.ts. */
export async function markSchemeOnboardingSeen(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_flags")
    .upsert(
      { user_id: user.id, scheme_onboarding_seen_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}
