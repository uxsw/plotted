import { sanitizeGenus, sanitizeSpecies, sanitizePlantName } from "@/lib/sanitize";

// Fuzzy-matching quality here directly determines species_reference cache hit
// rate. Two spellings normalizing differently silently produce duplicate rows
// instead of a shared cache entry — keep this in sync with how plants
// genus/species/cultivar are normalized on write (sanitize.ts).
//
// Convention for absent fields:
// - null/empty species → omitted from the key (no trailing separator)
// - null/empty cultivar → omitted from the key
// Segments are joined with "|" so "Rosa" never collides with "Rosa canina".
export function computeSpeciesMatchKey(
  genus: string,
  species: string | null | undefined,
  cultivar: string | null | undefined
): string {
  const parts: string[] = [sanitizeGenus(genus).toLowerCase()];

  const s = species ? sanitizeSpecies(species) : "";
  if (s) parts.push(s);

  const c = cultivar ? sanitizePlantName(cultivar).toLowerCase() : "";
  if (c) parts.push(c);

  return parts.join("|");
}
