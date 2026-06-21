"use server";

import { createClient } from "@/lib/supabase/server";
import { sanitizePlantName, sanitizeGenus, sanitizeSpecies } from "@/lib/sanitize";
import type { PlantInsert } from "@/lib/types";

type UpsertResult = { id: string } | { error: string };

/**
 * Create or update a plant row. Sanitization of all name fields happens here,
 * server-side, immediately before the DB write — regardless of what the client sent.
 *
 * Pass plantId=null to insert a new plant; pass an existing id to update.
 */
export async function upsertPlant(
  plantId: string | null,
  data: PlantInsert
): Promise<UpsertResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const clean: PlantInsert = {
    ...data,
    common_name: sanitizePlantName(data.common_name),
    genus: sanitizeGenus(data.genus),
    species: data.species ? sanitizeSpecies(data.species) : null,
    cultivar: data.cultivar ? sanitizePlantName(data.cultivar) : null,
  };

  if (plantId) {
    const { error } = await supabase
      .from("plants")
      .update(clean)
      .eq("id", plantId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    return { id: plantId };
  } else {
    const { data: row, error } = await supabase
      .from("plants")
      .insert(clean)
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { id: row.id };
  }
}
