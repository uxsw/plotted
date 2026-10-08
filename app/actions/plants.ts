"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizePlantName, sanitizeGenus, sanitizeSpecies } from "@/lib/sanitize";
import { validatePlantInput, hasFieldErrors, type FieldErrors } from "@/lib/validation";
import type { PlantInsert } from "@/lib/types";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";
import { manualSpeciesTransition } from "@/lib/species-transition";
import { createPlantWithLookup } from "@/lib/plant-create";
import { hasGenusForEnrichment } from "@/lib/lookup-apply";

// ─── revalidatePath from inside after(): cache hygiene only, not live push ───
//
// The three enrichSpeciesReference call sites (two below, plus the insert
// path's in lib/plant-create.ts) each call revalidatePath
// *inside* their after() callback, once enrichment has actually resolved,
// rather than alongside the surrounding write. This does NOT push a live
// update to a client already sitting on the plant's detail page — an earlier
// version of this fix assumed it did, based on revalidatePath.md's "Server
// Functions: Updates the UI immediately (if viewing the affected path)" —
// but that behaviour rides on the invoking Server Function's own HTTP
// response, and after() (per after.md: "schedule work to be executed after a
// response... is finished") only runs once that response is already gone.
// There's no live response left to attach an update to by the time
// enrichSpeciesReference resolves, confirmed by testing: the page only ever
// picked up frost tolerance on manual reload, never live.
//
// What revalidatePath here still buys us: it marks the path so a *later*
// navigation (e.g. clicking back into this plant from the list) doesn't
// serve a stale prefetched payload. The actual live-update mechanism is
// client-side polling in PlantDetail.tsx (router.refresh() while
// frostLookingUp is true) — see CLAUDE.md's species-reference-enrichment
// section for the full history.
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
    Object.assign(clean, manualSpeciesTransition());
    // The name typed when the plant was added no longer describes it.
    clean.species_input = null;
  }
  if ("cultivar" in data) {
    clean.cultivar = data.cultivar ? sanitizePlantName(data.cultivar) : null;
  }
  if ("notes" in data) {
    clean.notes = typeof data.notes === "string" ? data.notes.trim() || null : null;
    if (clean.notes && clean.notes.length > 5000) return { error: "Notes must be 5000 characters or fewer." };
  }

  const { data: updated, error } = await supabase
    .from("plants")
    .update(clean)
    .eq("id", plantId)
    .eq("user_id", user.id)
    .select("genus, species, cultivar")
    .single();

  if (error) return { error: error.message };

  if ("species" in clean || "cultivar" in clean) {
    // revalidatePath is called after enrichment resolves, not alongside the
    // write above — cache hygiene for a later navigation, not a live push to
    // an open tab. See the file-level note above before touching this.
    //
    // Genus guard: this edit doesn't run the plant lookup, so a plant whose
    // genus is still blank stays blank here and is not enriched.
    if (hasGenusForEnrichment(updated.genus)) {
      after(async () => {
        await enrichSpeciesReference(updated.genus, updated.species, updated.cultivar);
        revalidatePath(`/plants/${plantId}`);
      });
    }
  }

  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/plants");
}

type UpsertError = { error: string } | { fieldErrors: FieldErrors };

/**
 * Create or update a plant row, then redirect to the detail page.
 * Returns an error shape only on failure; on success, redirect() handles navigation.
 * Order of operations: sanitize → validate → write → redirect.
 * Pass plantId=null to insert; pass an existing id to update.
 *
 * options.fromIdentification: set by the identification results screen only
 * (see PlantForm.tsx's handleIdentificationSave). Gates the AI lookup below,
 * which must trust a photo-identified name and its provider-supplied common
 * names rather than "correcting" a canonical species (see Digitalis thapsi →
 * thapsus) or overwriting real common names with an enrichment guess.
 * Manual entry has no such trust boundary — full, uncritical lookup
 * treatment as before. Also persisted as species_source below, so the retry
 * lookup route (app/api/plants/[id]/lookup/route.ts) can re-derive the same
 * gate later for an already-saved plant, where this call-time flag is no
 * longer available.
 */
export async function upsertPlant(
  plantId: string | null,
  // genus is optional: the manual form has only typed text and no genus to
  // send. Photo identification and edits supply one.
  data: Omit<PlantInsert, "genus"> & { genus?: string },
  options: { fromIdentification?: boolean } = {}
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
    // The single source of truth for this column — nothing else sets it.
    species_source: options.fromIdentification ? "identification" : "manual",
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
    // Genus guard: nothing is enriched without a genus. Genus-only is still
    // enriched (a genus-level lookup is a real, if hedged, answer; see spec's
    // "Enrichment of genus-level records").
    if (hasGenusForEnrichment(clean.genus)) {
      // revalidatePath fires post-enrichment, inside the after() callback —
      // cache hygiene for a later navigation, not a live push to an open
      // tab. See the file-level note above before touching this.
      after(async () => {
        await enrichSpeciesReference(clean.genus, clean.species, clean.cultivar);
        revalidatePath(`/plants/${plantId}`);
      });
    }
    revalidatePath("/plants");
    redirect(`/plants/${plantId}`);
  } else {
    // A typed name arrives with no genus; the lookup inside resolves one
    // where it confidently can, and enrichment is skipped where it can't.
    const row = await createPlantWithLookup(supabase, clean, {
      fromIdentification: options.fromIdentification,
    });
    if ("error" in row) return { error: row.error };

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
