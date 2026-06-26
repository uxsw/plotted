import type { Plant } from "@/lib/types";

type NameParts = Pick<Plant, "genus" | "species" | "cultivar">;

/**
 * Renders species and cultivar in standard botanical formatting.
 * Genus is intentionally omitted from display.
 * e.g. <em>acutiflora</em> 'Karl Foerster'
 */
export function ScientificName({
  species,
  cultivar,
  className,
}: Omit<NameParts, "genus"> & { genus?: string | null; className?: string }) {
  if (!species && !cultivar) return null;
  return (
    <span className={className}>
      {species && <em>{species}</em>}
      {cultivar && ` '${cultivar}'`}
    </span>
  );
}

/**
 * Returns the plant's display title as a plain string.
 * Uses first common name if set; falls back to species/cultivar.
 */
export function plantDisplayTitle(plant: Pick<Plant, "common_names" | "genus" | "species" | "cultivar">): string {
  if (plant.common_names?.length) return plant.common_names[0];
  if (plant.species && plant.cultivar) return `${plant.species} '${plant.cultivar}'`;
  return plant.species ?? plant.cultivar ?? "Unnamed plant";
}

/**
 * Returns the primary label for an autocomplete dropdown item.
 * Format: "species – 'Cultivar'" if cultivar present, otherwise just "species".
 * Falls back to cultivar alone if no species.
 */
export function autocompleteTitle({ species, cultivar }: NameParts): string {
  if (species && cultivar) return `${species} – '${cultivar}'`;
  return species ?? cultivar ?? "";
}

/**
 * Returns species and cultivar as a plain string (no italics).
 * Useful for alt text, confirm dialogs, etc.
 */
export function scientificNameString({ species, cultivar }: NameParts): string {
  if (species && cultivar) return `${species} '${cultivar}'`;
  return species ?? cultivar ?? "";
}
