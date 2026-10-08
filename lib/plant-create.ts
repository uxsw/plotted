import { revalidatePath } from "next/cache";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { createClient } from "@/lib/supabase/server";
import type { PlantInsert } from "@/lib/types";
import { performLookup } from "@/lib/plant-lookup";
import { applyLookupResult, hasGenusForEnrichment, type PlantNames } from "@/lib/lookup-apply";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";

// Deliberately NOT in app/actions/plants.ts: every export of a "use server"
// file becomes a client-callable Server Function, and this takes a supabase
// client and a pre-sanitized row — it's an internal step, not an action.

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Insert a plant, run the AI lookup, then schedule species_reference
 * enrichment in after(). Shared by upsertPlant's insert branch (garden add)
 * and purchaseShoppingListItem, so a purchased plant gets exactly the
 * treatment a garden-added one does.
 *
 * `row` must already be sanitized and validated. A row with a blank genus has
 * its typed name resolved into genus/species/cultivar by the lookup
 * (applyLookupResult); a row that arrives with a genus keeps it. Callers own
 * their own redirect, list revalidation and any rollback.
 *
 * options.fromIdentification: see upsertPlant's doc comment — trusts a
 * photo-identified name over lookup correction.
 *
 * options.requireGenus: switches the genus guard on — enrichment is skipped
 * (and no species_reference row written) unless the plant has a non-blank
 * genus. Off by default so garden manual add, which still sends genus: "",
 * keeps getting frost data.
 */
export async function createPlantWithLookup(
  supabase: SupabaseServerClient,
  row: PlantInsert,
  options: { fromIdentification?: boolean; requireGenus?: boolean } = {}
): Promise<{ id: string } | { error: string }> {
  const { data: inserted, error } = await supabase
    .from("plants")
    .insert(row)
    .select("id")
    .single();
  if (error || !inserted) return { error: error?.message ?? "Insert failed" };

  let lookup_status: "skipped" | "success" | "not_found" | "error" = "skipped";
  let names: PlantNames = { genus: row.genus, species: row.species, cultivar: row.cultivar };
  if (row.species) {
    try {
      const result = await performLookup(row.genus, row.species, row.cultivar ?? null);
      const applied = applyLookupResult(
        result,
        { genus: row.genus, species: row.species, cultivar: row.cultivar ?? null },
        {
          skipCorrection: options.fromIdentification,
          existingCommonNames: options.fromIdentification ? row.common_names : undefined,
        }
      );
      lookup_status = applied.lookup_status;
      names = applied.names;
      await supabase.from("plants").update({ ...applied.updates, lookup_status }).eq("id", inserted.id);
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
      await supabase.from("plants").update({ lookup_status }).eq("id", inserted.id);
    }
  } else {
    await supabase.from("plants").update({ lookup_status }).eq("id", inserted.id);
  }

  // `names` is the plant's name after any resolution or correction — a
  // typed name that the lookup resolved now has its genus here.
  const shouldEnrich = options.requireGenus
    ? hasGenusForEnrichment(names.genus)
    : !!(names.genus || names.species);

  if (shouldEnrich) {
    // This is the call site the frost-tolerance-bug race actually showed up
    // on: a freshly-inserted plant, navigated to immediately, with enrichment
    // for a genuinely new species still running in the background.
    // revalidatePath here is cache hygiene for a later navigation only — the
    // live update on this first view comes from PlantDetail.tsx's polling,
    // not from this call. See the file-level note in app/actions/plants.ts
    // before touching this.
    after(async () => {
      await enrichSpeciesReference(names.genus, names.species, names.cultivar);
      revalidatePath(`/plants/${inserted.id}`);
    });
  }

  return { id: inserted.id };
}
