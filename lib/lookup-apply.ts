import type { LookupResult } from "@/lib/plant-lookup";
import type { SunNeeds } from "@/lib/types";
import { sanitizePlantName, sanitizeSpecies } from "@/lib/sanitize";

const VALID_SUN_NEEDS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
const validMonth = (v: number | null) => v !== null && Number.isInteger(v) && v >= 1 && v <= 12;
const validCm = (v: number | null) => v !== null && Number.isInteger(v) && v > 0;

export function applyLookupResult(
  result: LookupResult,
  searched: { species: string; cultivar: string | null },
  options: {
    /**
     * Photo-identified names are already canonical (Pl@ntNet's scientific
     * name) — spelling correction has nothing to correct and can only make
     * things worse, e.g. mistaking "thapsi" (Digitalis thapsi, correct) for
     * a misspelling of "thapsus" (Verbascum thapsus, a different plant).
     */
    skipCorrection?: boolean;
    /**
     * Common names already sourced from an external, independently-verified
     * provider (currently: Pl@ntNet). Provider data is closer to ground
     * truth than an AI guess, so it's preferred outright rather than
     * overwritten — AI-enriched common names only fill the gap when the
     * provider didn't supply any.
     */
    existingCommonNames?: string[];
  } = {}
): {
  updates: Record<string, unknown>;
  lookup_status: "success" | "not_found";
} {
  const updates: Record<string, unknown> = {};

  const hasExistingCommonNames = !!options.existingCommonNames?.length;
  if (!hasExistingCommonNames && result.common_names.length > 0) {
    updates.common_names = result.common_names;
  }

  if (result.sun_needs && (VALID_SUN_NEEDS as string[]).includes(result.sun_needs)) updates.sun_needs = result.sun_needs;
  if (validMonth(result.flowering_season_from)) updates.flowering_season_from = result.flowering_season_from;
  if (validMonth(result.flowering_season_to)) updates.flowering_season_to = result.flowering_season_to;
  if (validCm(result.eventual_height_cm)) updates.eventual_height_cm = result.eventual_height_cm;
  if (validCm(result.eventual_spread_cm)) updates.eventual_spread_cm = result.eventual_spread_cm;

  if (!options.skipCorrection) {
    if (
      result.corrected_species &&
      result.corrected_species.toLowerCase() !== searched.species.toLowerCase()
    ) {
      updates.species = sanitizeSpecies(result.corrected_species);
    }

    if (
      result.corrected_cultivar &&
      result.corrected_cultivar.toLowerCase() !== (searched.cultivar ?? "").toLowerCase()
    ) {
      updates.cultivar = sanitizePlantName(result.corrected_cultivar);
    }
  }

  // Whether the lookup itself found anything — independent of what ended up
  // written to the row (e.g. common_names may be withheld above because the
  // provider already had them, which isn't the same as the lookup failing).
  const allEmpty =
    result.common_names.length === 0 &&
    result.sun_needs == null &&
    result.flowering_season_from == null &&
    result.flowering_season_to == null &&
    result.eventual_height_cm == null &&
    result.eventual_spread_cm == null;

  return { updates, lookup_status: allEmpty ? "not_found" : "success" };
}
