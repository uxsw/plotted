"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizePlantName, sanitizeGenus, sanitizeSpecies } from "@/lib/sanitize";
import { validatePlantInput, hasFieldErrors, type FieldErrors } from "@/lib/validation";
import type { PlantInsert } from "@/lib/types";

export async function updatePlantField(
  plantId: string,
  data: Partial<PlantInsert>
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const clean: Partial<PlantInsert> = { ...data };

  if ("common_name" in data) {
    clean.common_name = data.common_name ? sanitizePlantName(data.common_name) : "";
  }
  if ("species" in data) {
    clean.species = data.species ? sanitizeSpecies(data.species) : null;
    if (!clean.species) return { error: "Species is required." };
  }
  if ("cultivar" in data) {
    clean.cultivar = data.cultivar ? sanitizePlantName(data.cultivar) : null;
  }
  if ("purchased_from" in data) {
    clean.purchased_from = typeof data.purchased_from === "string" ? data.purchased_from.trim() || null : null;
  }
  if ("notes" in data) {
    clean.notes = typeof data.notes === "string" ? data.notes.trim() || null : null;
  }

  const { error } = await supabase
    .from("plants")
    .update(clean)
    .eq("id", plantId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/plants");
}

type UpsertError = { error: string } | { fieldErrors: FieldErrors };

/**
 * Create or update a plant row, then redirect to the detail page.
 * Returns an error shape only on failure; on success, redirect() handles navigation.
 * Order of operations: sanitize → validate → write → redirect.
 * Pass plantId=null to insert; pass an existing id to update.
 */
export async function upsertPlant(
  plantId: string | null,
  data: PlantInsert
): Promise<UpsertError | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const clean: PlantInsert = {
    ...data,
    common_name: data.common_name ? sanitizePlantName(data.common_name) : "",
    genus: data.genus ? sanitizeGenus(data.genus) : "",
    species: data.species ? sanitizeSpecies(data.species) : null,
    cultivar: data.cultivar ? sanitizePlantName(data.cultivar) : null,
  };

  const fieldErrors = validatePlantInput(clean);
  if (hasFieldErrors(fieldErrors)) return { fieldErrors };

  if (plantId) {
    const { error } = await supabase
      .from("plants")
      .update(clean)
      .eq("id", plantId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/plants");
    redirect(`/plants/${plantId}`);
  } else {
    const { data: row, error } = await supabase
      .from("plants")
      .insert(clean)
      .select("id")
      .single();
    if (error) return { error: error.message };
    revalidatePath("/plants");
    redirect(`/plants/${row.id}`);
  }
}
