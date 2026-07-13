"use server";

import { createClient } from "@/lib/supabase/server";

export async function markSpeciesSpotted(speciesId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_species_sightings")
    .insert({ user_id: user.id, species_id: speciesId });

  if (error) return { error: error.message };
  return {};
}

export async function unmarkSpeciesSpotted(speciesId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_species_sightings")
    .delete()
    .eq("user_id", user.id)
    .eq("species_id", speciesId);

  if (error) return { error: error.message };
  return {};
}
