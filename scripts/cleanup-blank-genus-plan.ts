import type { LookupResult, NameConfidence } from "@/lib/plant-lookup";
import { namesFromResolution, hasGenusForEnrichment, type PlantNames } from "@/lib/lookup-apply";
import { computeSpeciesMatchKey } from "@/lib/species-match-key";

// The decisions behind scripts/cleanup-blank-genus.ts, kept free of network
// and database access so they can be unit tested: what to propose for a
// blank-genus plant, whether that is safe to apply unattended, and the order
// an apply must happen in.

export type BlankGenusPlant = {
  id: string;
  genus: string | null;
  species: string | null;
  cultivar: string | null;
  species_input: string | null;
  status: "active" | "removed";
  identification_status: "identified" | "unidentified";
  species_source: "identification" | "manual" | null;
};

/**
 * split      — the stored words are all still there; a genus was added or a
 *              word moved to its proper column ("verbena bonariensis").
 * changed    — a stored word would be altered or dropped: a spelling
 *              correction, a common name becoming Latin, a different cultivar.
 */
export type ChangeKind = "split" | "changed";

export type Decision = "apply" | "review" | "skip";

export type Proposal = {
  plant_id: string;
  status: "active" | "removed";
  current: PlantNames;
  /** Null when the lookup offered no usable name. */
  proposed: PlantNames | null;
  confidence: NameConfidence | "none";
  typed_kind: "latin" | "common" | null;
  change: ChangeKind | null;
  /** apply: safe unattended. review: only with the id named in --ids. skip: never. */
  decision: Decision;
  reason: string;
  /** species_input to write alongside, or undefined to leave the column alone. */
  species_input?: string;
  old_key: string;
  new_key: string | null;
};

const words = (text: string | null | undefined) =>
  (text ?? "").toLowerCase().split(/[^\p{L}\p{N}×.-]+/u).filter(Boolean);

/** Blank genus, treated as '' whether it is stored as '' or NULL. */
export function isBlankGenus(genus: string | null | undefined): boolean {
  return !hasGenusForEnrichment(genus);
}

/**
 * The two CHECK constraints on plants that a name change could break,
 * evaluated the way Postgres would (genus NULL counted as blank):
 * - plants_identified_requires_name_check: an identified plant needs a
 *   species or a genus.
 * - plants_identification_status_species_check: an unidentified plant has
 *   neither.
 */
export function constraintViolations(row: {
  genus: string | null;
  species: string | null;
  identification_status: "identified" | "unidentified";
}): string[] {
  const blank = (row.genus ?? "") === "";
  const violations: string[] = [];
  if (row.identification_status !== "unidentified" && row.species === null && blank) {
    violations.push("plants_identified_requires_name_check");
  }
  if (row.identification_status === "unidentified" && !(row.species === null && blank)) {
    violations.push("plants_identification_status_species_check");
  }
  return violations;
}

/** The name columns a proposal would write. */
export function plantUpdateFor(proposal: Proposal): Record<string, string | null> {
  if (!proposal.proposed) throw new Error("No proposed name to write");
  return {
    genus: proposal.proposed.genus,
    species: proposal.proposed.species,
    cultivar: proposal.proposed.cultivar,
    ...(proposal.species_input !== undefined ? { species_input: proposal.species_input } : {}),
  };
}

/**
 * What the cleanup would do with one blank-genus plant, given the lookup's
 * answer for its stored name. Pure: the same inputs always give the same
 * proposal.
 */
export function proposeForPlant(plant: BlankGenusPlant, lookup: LookupResult | null): Proposal {
  const current: PlantNames = { genus: plant.genus ?? "", species: plant.species, cultivar: plant.cultivar };
  const base = {
    plant_id: plant.id,
    status: plant.status,
    current,
    old_key: computeSpeciesMatchKey(current.genus, current.species, current.cultivar),
  };
  const skip = (reason: string, extra: Partial<Proposal> = {}): Proposal => ({
    ...base,
    proposed: null,
    confidence: "none",
    typed_kind: null,
    change: null,
    decision: "skip",
    reason,
    new_key: null,
    ...extra,
  });

  if (!isBlankGenus(plant.genus)) return skip("already has a genus");
  if (!plant.species) return skip("no stored name to resolve");
  // The identification trust boundary: a photo-identified name is not second-guessed.
  if (plant.species_source === "identification") return skip("photo-identified; left as it is");
  if (!lookup) return skip("lookup failed");

  const resolved = lookup.resolved_name;
  if (!resolved) return skip("the lookup could not name a genus");

  // Shown in the report at any confidence; only ever applied at high.
  const proposed = namesFromResolution(
    { ...resolved, confidence: "high" },
    { species: plant.species, cultivar: plant.cultivar }
  )!;
  const new_key = computeSpeciesMatchKey(proposed.genus, proposed.species, proposed.cultivar);

  const stored = [...words(plant.species), ...words(plant.cultivar)];
  const next = [...words(proposed.species), ...words(proposed.cultivar)];
  const genusWord = proposed.genus.toLowerCase();
  // Safe only if nothing stored is lost and nothing but the genus is new.
  const lost = stored.filter((word) => word !== genusWord && !next.includes(word));
  const added = next.filter((word) => !stored.includes(word));
  const change: ChangeKind = lost.length === 0 && added.length === 0 ? "split" : "changed";

  const details = {
    proposed,
    confidence: resolved.confidence,
    typed_kind: resolved.kind,
    change,
    new_key,
    // What they typed is kept when the stored words change — and never over
    // a species_input that is already there.
    ...(change === "changed" && !plant.species_input ? { species_input: plant.species } : {}),
  };

  const after = { genus: proposed.genus, species: proposed.species, identification_status: plant.identification_status };
  const violations = constraintViolations(after);
  if (violations.length) return skip(`would violate ${violations.join(", ")}`, details);

  if (resolved.confidence !== "high") {
    return skip(`${resolved.confidence} confidence`, details);
  }
  if (change === "changed") {
    const parts = [
      lost.length ? `drops "${lost.join(" ")}"` : "",
      added.length ? `adds "${added.join(" ")}"` : "",
    ].filter(Boolean);
    return { ...base, ...details, decision: "review", reason: `changes stored words: ${parts.join(", ")}` };
  }
  return { ...base, ...details, decision: "apply", reason: "adds the genus; stored words unchanged" };
}

export type ApplyOutcome =
  | { plant_id: string; result: "updated"; new_key: string }
  | { plant_id: string; result: "untouched"; why: string };

export type ApplyDeps = {
  /** The plant as it is now, or null if it is gone. */
  readPlant(id: string): Promise<BlankGenusPlant | null>;
  /** Runs enrichment for the new name (a cache hit if the key already has a row). */
  enrich(names: PlantNames): Promise<void>;
  /** lookup_status of the species_reference row for a key, or null if there is none. */
  referenceStatus(matchKey: string): Promise<string | null>;
  /** Writes the name columns only if the row still holds `expected`. Returns whether a row was updated. */
  updatePlant(id: string, expected: PlantNames, update: Record<string, string | null>): Promise<boolean>;
};

const sameNames = (a: PlantNames, b: PlantNames) =>
  (a.genus ?? "") === (b.genus ?? "") && a.species === b.species && a.cultivar === b.cultivar;

/**
 * Applies one proposal, in the only safe order: enrich the new key first, and
 * touch the plant only once that species_reference row exists and is
 * complete. If enrichment fails or is still pending, the plant keeps its old
 * name and its old (blank-genus) frost row — a plant is never left pointing
 * at a key with no row.
 */
export async function applyProposal(
  proposal: Proposal,
  deps: ApplyDeps,
  options: { includeRemoved?: boolean; reviewedIds?: ReadonlySet<string> } = {}
): Promise<ApplyOutcome> {
  const untouched = (why: string): ApplyOutcome => ({ plant_id: proposal.plant_id, result: "untouched", why });

  if (!proposal.proposed || !proposal.new_key || proposal.decision === "skip") return untouched(proposal.reason);
  if (proposal.decision === "review" && !options.reviewedIds?.has(proposal.plant_id)) {
    return untouched(`needs review (${proposal.reason}); name its id in --ids to apply`);
  }
  if (proposal.status !== "active" && !options.includeRemoved) return untouched("removed plant; active only by default");

  const plant = await deps.readPlant(proposal.plant_id);
  if (!plant) return untouched("plant no longer exists");
  const now: PlantNames = { genus: plant.genus ?? "", species: plant.species, cultivar: plant.cultivar };
  if (!sameNames(now, proposal.current)) return untouched("name changed since the report was made");
  if (plant.status !== "active" && !options.includeRemoved) return untouched("removed plant; active only by default");

  const update = plantUpdateFor(proposal);
  const violations = constraintViolations({
    genus: update.genus,
    species: update.species,
    identification_status: plant.identification_status,
  });
  if (violations.length) return untouched(`would violate ${violations.join(", ")}`);

  await deps.enrich(proposal.proposed);
  const status = await deps.referenceStatus(proposal.new_key);
  if (status !== "complete") {
    return untouched(`enrichment for ${proposal.new_key} is ${status ?? "missing"}, not complete`);
  }

  const updated = await deps.updatePlant(proposal.plant_id, proposal.current, update);
  return updated
    ? { plant_id: proposal.plant_id, result: "updated", new_key: proposal.new_key }
    : untouched("name changed while applying; nothing written");
}

/**
 * species_reference rows that no plant's name computes to. `matched_by_removed`
 * marks rows only a removed plant still points at.
 */
export function orphanedReferenceKeys(
  referenceKeys: string[],
  plants: Pick<BlankGenusPlant, "genus" | "species" | "cultivar" | "status">[]
): { match_key: string; matched_by_removed: boolean }[] {
  const active = new Set<string>();
  const removed = new Set<string>();
  for (const plant of plants) {
    const key = computeSpeciesMatchKey(plant.genus ?? "", plant.species, plant.cultivar);
    (plant.status === "active" ? active : removed).add(key);
  }
  return referenceKeys
    .filter((key) => !active.has(key))
    .map((key) => ({ match_key: key, matched_by_removed: removed.has(key) }));
}
