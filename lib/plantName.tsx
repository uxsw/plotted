import type { Plant } from "@/lib/types";

type NameParts = Pick<Plant, "genus" | "species" | "cultivar">;

/**
 * Renders a botanical name with standard formatting:
 * genus and species in italics, cultivar in straight single quotes.
 * e.g. <em>Calamagrostis acutiflora</em> 'Karl Foerster'
 */
export function ScientificName({
  genus,
  species,
  cultivar,
  className,
}: NameParts & { className?: string }) {
  const italicPart = [genus, species].filter(Boolean).join(" ");
  return (
    <span className={className}>
      <em>{italicPart}</em>
      {cultivar && ` '${cultivar}'`}
    </span>
  );
}

/**
 * Returns the plant's display title as a plain string.
 * Uses common_name if set; falls back to the scientific name string.
 */
export function plantDisplayTitle(plant: Pick<Plant, "common_name" | "genus" | "species" | "cultivar">): string {
  if (plant.common_name) return plant.common_name;
  const sci = [plant.genus, plant.species].filter(Boolean).join(" ");
  return plant.cultivar ? `${sci} '${plant.cultivar}'` : sci;
}

/**
 * Returns the full scientific name as a plain string (no italics).
 * Useful for alt text, confirm dialogs, etc.
 */
export function scientificNameString({ genus, species, cultivar }: NameParts): string {
  const sci = [genus, species].filter(Boolean).join(" ");
  return cultivar ? `${sci} '${cultivar}'` : sci;
}
