import type { PlantInsert } from "@/lib/types";

/**
 * A non-empty manual species entry must move identification_status to
 * 'identified' and species_source to 'manual' in the same write — otherwise
 * a non-null species on a still-'unidentified' row violates
 * plants_identification_status_species_check (migration 026).
 */
export function manualSpeciesTransition(): Pick<
  PlantInsert,
  "identification_status" | "species_source"
> {
  return { identification_status: "identified", species_source: "manual" };
}
