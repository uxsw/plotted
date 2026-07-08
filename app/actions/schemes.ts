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
