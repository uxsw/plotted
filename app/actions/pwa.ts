"use server";

import { createClient } from "@/lib/supabase/server";

export async function incrementPwaPromptDismissCount(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: flags } = await supabase
    .from("user_flags")
    .select("pwa_prompt_dismiss_count")
    .maybeSingle();

  const next = (flags?.pwa_prompt_dismiss_count ?? 0) + 1;

  await supabase
    .from("user_flags")
    .upsert(
      { user_id: user.id, pwa_prompt_dismiss_count: next },
      { onConflict: "user_id" }
    );
}

export async function setPwaInstalledAt(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_flags")
    .upsert(
      { user_id: user.id, pwa_installed_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}
