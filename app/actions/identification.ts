"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSpeciesMatchKey } from "@/lib/species-match-key";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";
import type { SpeciesRef } from "@/lib/types";

/**
 * Hand-off from photo identification into the existing species_reference flow.
 *
 * Deliberately thin. It computes the key with the same function the plant
 * detail page reads with, then hands genus/species/cultivar to the existing
 * enricher — which already owns every cache decision (hit returns, miss
 * inserts pending and runs the lookup, stale re-runs). Gating the after() call
 * on the row we just read would duplicate that logic here and let the two
 * copies drift, so the call is unconditional, matching upsertPlant.
 *
 * Photo-sourced names skip performLookup/applyLookupResult entirely: the
 * provider's scientific name is already canonical, so spelling correction has
 * nothing to correct and would only risk enriching under a stale key.
 */
export async function resolveIdentifiedSpecies(
  genus: string,
  species: string | null,
  cultivar: string | null = null
): Promise<{ matchKey: string; speciesRef: SpeciesRef | null } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const matchKey = computeSpeciesMatchKey(genus, species, cultivar);

  const { data: speciesRefRow } = await supabase
    .from("species_reference")
    .select("id, lookup_status, frost_tolerance_c, frost_tolerance_notice")
    .eq("match_key", matchKey)
    .maybeSingle();

  after(() => enrichSpeciesReference(genus, species, cultivar));

  return { matchKey, speciesRef: (speciesRefRow as SpeciesRef | null) ?? null };
}
