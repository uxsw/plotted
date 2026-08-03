"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveGardenLocation(
  latitude: number,
  longitude: number,
  locationLabel: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // No unique constraint on user_id (designed for future multi-garden support),
  // so we can't use upsert. Get-or-create instead.
  const { data: existing } = await supabase
    .from("garden")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("garden")
      .update({ latitude, longitude, location_label: locationLabel })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("garden")
      .insert({ user_id: user.id, latitude, longitude, location_label: locationLabel });
    if (error) return { error: error.message };
  }

  revalidatePath("/weather");
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return {};
}
