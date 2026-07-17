"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markOnboardingLocationSeen(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("user_flags")
    .upsert(
      { user_id: user.id, onboarding_location_seen_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[markOnboardingLocationSeen] upsert failed:", error);
    return;
  }

  revalidatePath("/plants");
}
