"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizePlantName, sanitizeGenus, sanitizeSpecies } from "@/lib/sanitize";
import { validatePlantInput, hasFieldErrors, type FieldErrors } from "@/lib/validation";
import type { PlantInsert } from "@/lib/types";
import { performLookup } from "@/lib/plant-lookup";
import { applyLookupResult } from "@/lib/lookup-apply";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";
import Anthropic from "@anthropic-ai/sdk";

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

  const genus = data.genus ? sanitizeGenus(data.genus) : "";
  const species = data.species ? sanitizeSpecies(data.species) : null;

  const clean: PlantInsert = {
    ...data,
    genus,
    species,
    cultivar: data.cultivar ? sanitizePlantName(data.cultivar) : null,
    // Computed, not chosen directly by any UI control — 'unidentified' is
    // only reachable by having neither a genus nor a species at all. See
    // migration 027 and lib/validation.ts.
    identification_status: genus || species ? "identified" : "unidentified",
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
    // Nothing to enrich for a fully unidentified plant — genus-only is still
    // enriched (a genus-level lookup is a real, if hedged, answer; see spec's
    // "Enrichment of genus-level records").
    if (clean.genus || clean.species) {
      after(() => enrichSpeciesReference(clean.genus, clean.species, clean.cultivar));
    }
    revalidatePath("/plants");
    redirect(`/plants/${plantId}`);
  } else {
    const { data: row, error } = await supabase
      .from("plants")
      .insert(clean)
      .select("id")
      .single();
    if (error) return { error: error.message };
    if (clean.genus || clean.species) {
      after(() => enrichSpeciesReference(clean.genus, clean.species, clean.cultivar));
    }

    let lookup_status: "skipped" | "success" | "not_found" | "error" = "skipped";
    if (clean.species) {
      try {
        const result = await performLookup(clean.species, clean.cultivar ?? null);
        const { updates, lookup_status: ls } = applyLookupResult(result, { species: clean.species, cultivar: clean.cultivar ?? null });
        lookup_status = ls;
        await supabase.from("plants").update({ ...updates, lookup_status }).eq("id", row.id);
      } catch (err) {
        const isBillingError =
          err instanceof Anthropic.APIError &&
          ((err.status === 429) ||
            (err.status === 400 &&
              typeof err.message === "string" &&
              err.message.toLowerCase().includes("credit")));
        if (isBillingError) {
          console.error("AI lookup failed — possible billing/quota issue:", err);
        } else {
          console.error("AI lookup failed on plant creation:", err);
        }
        lookup_status = "error";
        await supabase.from("plants").update({ lookup_status }).eq("id", row.id);
      }
    } else {
      await supabase.from("plants").update({ lookup_status }).eq("id", row.id);
    }

    revalidatePath("/plants");
    redirect(`/plants/${row.id}`);
  }
}

export async function markLookupNoticeSeen(plantId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("plants")
    .update({ lookup_notice_seen_at: new Date().toISOString() })
    .eq("id", plantId)
    .eq("user_id", user.id);
}
