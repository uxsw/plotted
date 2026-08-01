import type { ReactNode } from "react";
import type { Plant } from "@/lib/types";

type NameParts = Pick<Plant, "genus" | "species" | "cultivar">;

/**
 * Renders a species name, capitalized only when standing alone (no genus
 * leading it) — once genus is shown, species reverts to lowercase per
 * normal binomial convention. Shared by ScientificName below and by
 * components/plants/PlantName.tsx.
 */
export function speciesLine(genus: string | null | undefined, species: string): ReactNode {
  if (genus) return <span>{genus} {species}</span>;
  return <span>{species[0].toUpperCase() + species.slice(1)}</span>;
}

/**
 * Renders species and cultivar in standard botanical formatting.
 * Genus is omitted by default — the normal case is secondary text sitting
 * next to a common-name title, where genus would be redundant. Pass `genus`
 * explicitly for the rarer case where this stands in as the primary name
 * (no common name to pair it with) — a bare epithet on its own reads as
 * nothing (species names are never used standalone), so genus is required
 * once there's no common name carrying the rest of the identity.
 * e.g. <em>acutiflora</em> 'Karl Foerster', or with genus: Calamagrostis <em>acutiflora</em> 'Karl Foerster'
 */
export function ScientificName({
  genus,
  species,
  cultivar,
  className,
}: Omit<NameParts, "genus"> & { genus?: string | null; className?: string }) {
  if (!species && !cultivar) return null;
  return (
    <span className={className}>
      {species && speciesLine(genus, species)}
      {cultivar && <> <em>&apos;{cultivar}&apos;</em></>}
    </span>
  );
}

/**
 * Returns the plant's display title as a plain string.
 * Uses first common name if set. Otherwise falls back to the full binomial
 * (genus + species) rather than the bare epithet alone — "serpyllum" isn't a
 * name anyone recognises or could search for; "Thymus serpyllum" is.
 */
export function plantDisplayTitle(plant: Pick<Plant, "common_names" | "genus" | "species" | "cultivar">): string {
  if (plant.common_names?.length) return plant.common_names[0];
  const binomial = [plant.genus, plant.species].filter(Boolean).join(" ") || null;
  if (binomial && plant.cultivar) return `${binomial} '${plant.cultivar}'`;
  return binomial ?? plant.cultivar ?? "Unnamed plant";
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
