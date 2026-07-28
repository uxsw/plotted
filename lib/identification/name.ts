import { sanitizeGenus, sanitizeSpecies, sanitizePlantName } from "@/lib/sanitize";
import type { IdentificationCandidate } from "./types";

// A standalone hybrid marker binds to the token after it: "Salix × fragilis"
// is genus "Salix", epithet "×fragilis" — not three separate name parts.
const HYBRID_MARKERS = new Set(["×", "x", "X"]);

/**
 * Providers return the scientific name with authorship attached
 * ("Ajuga genevensis L.", "Clinopodium alpinum (L.) Kuntze"). There is no
 * separate authorship field to read, so the split doubles as the authorship
 * strip: take the genus and the specific epithet, discard everything after.
 *
 * Botanical convention guarantees the specific epithet is lowercase while
 * authorship is not, which is what makes the two distinguishable. That matters
 * for genus-level names — "Hydrangea L." must yield species null, not "l.".
 */
function isEpithet(token: string): boolean {
  return /^×?[a-z][a-z-]*$/.test(token);
}

function foldHybridMarkers(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const next = tokens[i + 1];
    if (HYBRID_MARKERS.has(tokens[i]) && next) {
      out.push(`×${next}`);
      i++;
    } else {
      out.push(tokens[i]);
    }
  }
  return out;
}

/**
 * "Ajuga genevensis L." → { genus: "Ajuga", species: "genevensis" }
 *
 * Casing matches how upsertPlant already writes these columns: genus
 * capitalised via sanitizeGenus, epithet lowercased via sanitizeSpecies.
 * Anything unrecognisable as an epithet yields species null rather than a
 * guess — a genus-only record is recoverable, a wrong epithet is not.
 */
export function parseScientificName(scientificName: string): {
  genus: string;
  species: string | null;
} {
  const cleaned = sanitizePlantName(scientificName ?? "");
  if (!cleaned) return { genus: "", species: null };

  const tokens = foldHybridMarkers(cleaned.split(" ").filter(Boolean));

  const genus = sanitizeGenus(tokens[0] ?? "");
  const epithet = tokens[1] ?? "";

  return {
    genus,
    species: isEpithet(epithet) ? sanitizeSpecies(epithet) : null,
  };
}

// Providers repeat the same common name at different casings across candidates
// ("Wild Thyme" / "Wild thyme"). Dedupe case-insensitively, keep first casing.
function normaliseCommonNames(names: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names ?? []) {
    const name = sanitizePlantName(raw ?? "");
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export type IdentifiedPlantFields = {
  genus: string;
  species: string | null;
  /** Photo identification never resolves cultivar — see the spec's cultivar ceiling. */
  cultivar: null;
  common_names: string[];
  species_input: string | null;
};

/**
 * Turns a chosen candidate into the plant column values to write.
 *
 * originalInput is whatever the user had already typed into the species field
 * before running identification, if anything. It is kept only when it says
 * something the canonical name doesn't — someone who typed "bugle" should be
 * shown "bugle" back, but re-storing "Ajuga reptans" alongside itself is noise.
 */
function pickSpeciesInput(
  originalInput: string | null | undefined,
  canonicalForms: (string | null)[]
): string | null {
  const original = originalInput ? sanitizePlantName(originalInput) : "";
  if (!original) return null;

  const forms = canonicalForms
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toLowerCase());

  return forms.includes(original.toLowerCase()) ? null : original;
}

export function candidateToPlantFields(
  candidate: Pick<IdentificationCandidate, "scientificName" | "commonNames">,
  originalInput?: string | null
): IdentifiedPlantFields {
  const { genus, species } = parseScientificName(candidate.scientificName);

  return {
    genus,
    species,
    cultivar: null,
    common_names: normaliseCommonNames(candidate.commonNames),
    species_input: pickSpeciesInput(originalInput, [
      species ? `${genus} ${species}` : genus,
      species,
      genus,
    ]),
  };
}

/**
 * The "Hydrangea — species uncertain" option.
 *
 * Genus goes in the genus column, species is null — the plant is genuinely
 * "genus known, species unknown", and computeSpeciesMatchKey (genus first
 * segment, omitted fields dropped entirely) keys this as "hydrangea", not
 * "|hydrangea". See name.test.ts for why the earlier species-slot version
 * was wrong: it inverted the two, so match_key read as "species hydrangea,
 * genus unknown" — the opposite of what was actually selected — and would
 * have asked enrichSpeciesReference to describe a species, not a genus.
 *
 * (Historical note: an earlier version of this function hit both the
 * display fallback and the validation gap described above; both were fixed
 * in stage 5 — see plantName.tsx's genus fallback and validatePlantInput's
 * species-or-genus rule.)
 */
export function genusFallbackToPlantFields(
  genus: string,
  originalInput?: string | null
): IdentifiedPlantFields {
  const canonical = sanitizeGenus(genus);

  return {
    genus: canonical,
    species: null,
    cultivar: null,
    common_names: [],
    species_input: pickSpeciesInput(originalInput, [canonical]),
  };
}

/**
 * The "none of these" outcome — no genus, no species. Distinct from the
 * genus-fallback case above: this is "we have no idea", not "we know the
 * genus at least". upsertPlant computes identification_status from these
 * same two fields, so returning both empty is what makes the save land as
 * 'unidentified' rather than a fourth, redundant status field to set here.
 */
export function unidentifiedPlantFields(): IdentifiedPlantFields {
  return {
    genus: "",
    species: null,
    cultivar: null,
    common_names: [],
    species_input: null,
  };
}
