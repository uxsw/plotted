import { revalidatePath } from "next/cache";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { createClient } from "@/lib/supabase/server";
import type { PlantInsert } from "@/lib/types";
import { performLookup } from "@/lib/plant-lookup";
import { applyLookupResult } from "@/lib/lookup-apply";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";

// Deliberately NOT in app/actions/plants.ts: every export of a "use server"
// file becomes a client-callable Server Function, and this takes a supabase
// client and a pre-sanitized row — it's an internal step, not an action.

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The genus guard: species_reference is keyed genus-first
 * (computeSpeciesMatchKey), so a blank genus produces keys of the wrong shape
 * ("|officinalis", "|apple") that different plants can silently share.
 * Genus-only is fine — "hydrangea" is a well-formed key and a genus-level
 * lookup is a real, if hedged, answer.
 */
export function hasGenusForEnrichment(genus: string | null | undefined): boolean {
  return !!genus?.trim();
}

/**
 * With a real genus in its own column, a "corrected" species that comes back
 * as the full binomial ("verbena bonariensis") must not be written into
 * species — that's the genus leaking into the wrong field. Strip the genus
 * prefix from a species correction; discard a cultivar correction that
 * carries it (there's no safe way to tell what the cultivar part is).
 * Inert when genus is blank, so the garden manual-add path (which still sends
 * genus: "" and keeps the whole name in species) is unaffected.
 */
function keepGenusOutOfCorrections(
  updates: Record<string, unknown>,
  genus: string,
  searchedSpecies: string
): void {
  if (!hasGenusForEnrichment(genus)) return;
  const prefix = `${genus.toLowerCase()} `;

  if (typeof updates.species === "string" && updates.species.toLowerCase().startsWith(prefix)) {
    const epithet = updates.species.slice(prefix.length).trim();
    if (!epithet || epithet === searchedSpecies.toLowerCase()) delete updates.species;
    else updates.species = epithet;
  }

  if (typeof updates.cultivar === "string" && updates.cultivar.toLowerCase().startsWith(prefix)) {
    delete updates.cultivar;
  }
}

/**
 * Insert a plant, run the AI lookup, then schedule species_reference
 * enrichment in after(). Shared by upsertPlant's insert branch (garden add)
 * and purchaseShoppingListItem, so a purchased plant gets exactly the
 * treatment a garden-added one does.
 *
 * `row` must already be sanitized and validated, with genus/species/cultivar
 * resolved by the caller — this function doesn't parse names. Callers own
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
  let finalSpecies = row.species;
  let finalCultivar = row.cultivar;
  if (row.species) {
    try {
      const result = await performLookup(row.genus, row.species, row.cultivar ?? null);
      const { updates, lookup_status: ls } = applyLookupResult(
        result,
        { species: row.species, cultivar: row.cultivar ?? null },
        {
          skipCorrection: options.fromIdentification,
          existingCommonNames: options.fromIdentification ? row.common_names : undefined,
        }
      );
      keepGenusOutOfCorrections(updates, row.genus, row.species);
      lookup_status = ls;
      if (updates.species !== undefined) finalSpecies = updates.species as string;
      if (updates.cultivar !== undefined) finalCultivar = updates.cultivar as string;
      await supabase.from("plants").update({ ...updates, lookup_status }).eq("id", inserted.id);
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

  // The lookup never changes genus (it only corrects species/cultivar), so
  // row.genus is still the plant's genus "after any correction".
  const shouldEnrich = options.requireGenus
    ? hasGenusForEnrichment(row.genus)
    : !!(row.genus || finalSpecies);

  if (shouldEnrich) {
    // This is the call site the frost-tolerance-bug race actually showed up
    // on: a freshly-inserted plant, navigated to immediately, with enrichment
    // for a genuinely new species still running in the background.
    // revalidatePath here is cache hygiene for a later navigation only — the
    // live update on this first view comes from PlantDetail.tsx's polling,
    // not from this call. See the file-level note in app/actions/plants.ts
    // before touching this.
    after(async () => {
      await enrichSpeciesReference(row.genus, finalSpecies, finalCultivar);
      revalidatePath(`/plants/${inserted.id}`);
    });
  }

  return { id: inserted.id };
}
