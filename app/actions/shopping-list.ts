"use server";

import { createClient } from "@/lib/supabase/server";

export async function markShoppingListNoticeSeen(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_flags")
    .upsert(
      { user_id: user.id, shopping_list_notice_seen_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}
