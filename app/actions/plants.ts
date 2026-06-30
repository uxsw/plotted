"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizePlantName, sanitizeGenus, sanitizeSpecies } from "@/lib/sanitize";
import { validatePlantInput, hasFieldErrors, type FieldErrors } from "@/lib/validation";
import type { PlantInsert, SunNeeds } from "@/lib/types";
import { performLookup } from "@/lib/plant-lookup";

export async function updatePlantField(
  plantId: string,
  data: Partial<PlantInsert>
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const clean: Partial<PlantInsert> = { ...data };

  if ("species" in data) {
    clean.species = data.species ? sanitizeSpecies(data.species) : null;
    if (!clean.species) return { error: "Species is required." };
  }
  if ("cultivar" in data) {
    clean.cultivar = data.cultivar ? sanitizePlantName(data.cultivar) : null;
  }
  if ("notes" in data) {
    clean.notes = typeof data.notes === "string" ? data.notes.trim() || null : null;
    if (clean.notes && clean.notes.length > 5000) return { error: "Notes must be 5000 characters or fewer." };
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

    if (clean.species) {
      const { data: flags } = await supabase
        .from("user_flags")
        .select("ai_lookup_enabled")
        .eq("user_id", user.id)
        .single();

      if (flags?.ai_lookup_enabled) {
        try {
          const result = await performLookup(clean.species, clean.cultivar ?? null);
          const VALID_SUN_NEEDS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
          const validMonth = (v: number | null) => v !== null && Number.isInteger(v) && v >= 1 && v <= 12;
          const validCm = (v: number | null) => v !== null && Number.isInteger(v) && v > 0;
          const updates: Record<string, unknown> = {};
          if (result.common_names.length > 0) updates.common_names = result.common_names;
          if (result.sun_needs && (VALID_SUN_NEEDS as string[]).includes(result.sun_needs)) updates.sun_needs = result.sun_needs;
          if (validMonth(result.flowering_season_from)) updates.flowering_season_from = result.flowering_season_from;
          if (validMonth(result.flowering_season_to)) updates.flowering_season_to = result.flowering_season_to;
          if (validCm(result.eventual_height_cm)) updates.eventual_height_cm = result.eventual_height_cm;
          if (validCm(result.eventual_spread_cm)) updates.eventual_spread_cm = result.eventual_spread_cm;
          if (Object.keys(updates).length > 0) {
            await supabase.from("plants").update(updates).eq("id", row.id);
          }
        } catch (err) {
          console.error("AI lookup failed on plant creation:", err);
        }
      }
    }

    revalidatePath("/plants");
    redirect(`/plants/${row.id}`);
  }
}
