import type { LookupResult, ResolvedName } from "@/lib/plant-lookup";
import type { SunNeeds } from "@/lib/types";
import { sanitizePlantName, sanitizeSpecies } from "@/lib/sanitize";

const VALID_SUN_NEEDS: SunNeeds[] = ["full sun", "full sun / partial shade", "partial shade", "full shade"];
const validMonth = (v: number | null) => v !== null && Number.isInteger(v) && v >= 1 && v <= 12;
const validCm = (v: number | null) => v !== null && Number.isInteger(v) && v > 0;

/**
 * The genus guard: species_reference is keyed genus-first
 * (computeSpeciesMatchKey), so a blank genus produces keys of the wrong shape
 * ("|officinalis", "|apple") that different plants can silently share. Every
 * path that enriches checks this first — no genus, no enrichment, no row.
 * Genus-only is fine — "hydrangea" is a well-formed key and a genus-level
 * lookup is a real, if hedged, answer.
 */
export function hasGenusForEnrichment(genus: string | null | undefined): boolean {
  return !!genus?.trim();
}

export type PlantNames = { genus: string; species: string | null; cultivar: string | null };

const squash = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

function editDistance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

/** The same word give or take a typo: "spherocephalon" / "sphaerocephalon". */
function sameWord(a: string, b: string): boolean {
  const x = squash(a), y = squash(b);
  if (!x || !y) return false;
  return x === y || editDistance(x, y) <= 2;
}

/**
 * With a real genus in its own column, a "corrected" species that comes back
 * as the full binomial ("verbena bonariensis") must not be written into
 * species — that's the genus leaking into the wrong field. Strip the genus
 * prefix from a species correction; discard a cultivar correction that
 * carries it (there's no safe way to tell what the cultivar part is).
 */
function keepGenusOutOfCorrections(
  updates: Record<string, unknown>,
  genus: string,
  searchedSpecies: string
): void {
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
 * A blank-genus plant's typed name → genus, species and cultivar in their own
 * fields, from the lookup's resolved name. Only a high-confidence name is
 * used: anything less leaves the genus blank, so the genus guard skips
 * enrichment rather than keying species_reference on a guess.
 *
 * The gardener's cultivar is kept unless the model returned one, or what they
 * typed there was really the epithet or genus in the wrong field ("allium" /
 * "Spherocephalon").
 */
export function namesFromResolution(
  resolved: ResolvedName | null,
  typed: { species: string; cultivar: string | null }
): PlantNames | null {
  if (!resolved || resolved.confidence !== "high") return null;

  let cultivar = resolved.cultivar;
  if (!cultivar && typed.cultivar) {
    const misplaced =
      sameWord(typed.cultivar, resolved.genus) ||
      (!!resolved.species && sameWord(typed.cultivar, resolved.species));
    if (!misplaced) cultivar = typed.cultivar;
  }

  return { genus: resolved.genus, species: resolved.species, cultivar };
}

/**
 * Turns a lookup result into the columns to write. Shared by plant creation
 * (lib/plant-create.ts), the retry route and the blank-genus cleanup script,
 * so all three treat names identically.
 *
 * searched.genus decides how names are handled:
 * - blank: the typed text is resolved into genus / species / cultivar
 *   (namesFromResolution). If that isn't confident, the old spelling
 *   correction still applies and genus stays blank.
 * - present: genus is never changed; species and cultivar only get spelling
 *   corrections, with the genus kept out of both.
 *
 * `names` is the plant's name after these updates — what enrichment must be
 * keyed on.
 */
export function applyLookupResult(
  result: LookupResult,
  searched: { genus?: string | null; species: string; cultivar: string | null },
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
  names: PlantNames;
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

  const searchedGenus = searched.genus?.trim() ?? "";
  const names: PlantNames = { genus: searchedGenus, species: searched.species, cultivar: searched.cultivar };

  if (!options.skipCorrection) {
    const resolved = searchedGenus ? null : namesFromResolution(result.resolved_name, searched);

    if (resolved) {
      updates.genus = resolved.genus;
      if (resolved.species !== searched.species) updates.species = resolved.species;
      if (resolved.cultivar !== searched.cultivar) updates.cultivar = resolved.cultivar;
      // What they typed, kept whenever the stored name no longer says it
      // (a common name, a corrected spelling) — not for a plain split of
      // "verbena bonariensis" into its two columns.
      const binomial = [resolved.genus, resolved.species].filter(Boolean).join(" ");
      if (squash(searched.species) !== squash(binomial)) updates.species_input = searched.species;
      Object.assign(names, resolved);
    } else {
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

      if (searchedGenus) keepGenusOutOfCorrections(updates, searchedGenus, searched.species);
      if (typeof updates.species === "string") names.species = updates.species;
      if (typeof updates.cultivar === "string") names.cultivar = updates.cultivar;
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

  return { updates, lookup_status: allEmpty ? "not_found" : "success", names };
}
