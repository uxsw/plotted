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
  /**
   * apply: only adds a genus. review: changes stored words. skip: no usable
   * name, or not confident. Nothing is written unless its id is in --ids.
   */
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

  // Shown in the report at any confidence; only ever applied unattended at high.
  const proposed = namesFromResolution(
    { ...resolved, confidence: "high" },
    { species: plant.species, cultivar: plant.cultivar }
  )!;
  const { summary, ...details } = describeChange(plant, proposed, resolved.kind);
  const named = { ...base, ...details, proposed, confidence: resolved.confidence, typed_kind: resolved.kind };

  const violations = constraintViolations({
    genus: proposed.genus,
    species: proposed.species,
    identification_status: plant.identification_status,
  });
  if (violations.length) return { ...named, decision: "skip", reason: `would violate ${violations.join(", ")}` };
  if (resolved.confidence !== "high") return { ...named, decision: "skip", reason: `${resolved.confidence} confidence` };
  if (details.change === "changed") return { ...named, decision: "review", reason: summary };
  return { ...named, decision: "apply", reason: "adds the genus; stored words unchanged" };
}

/** How a proposed name differs from what is stored, and what goes with it. */
function describeChange(
  plant: Pick<BlankGenusPlant, "species" | "cultivar" | "species_input">,
  proposed: PlantNames,
  kind: "latin" | "common"
): { change: ChangeKind; new_key: string; species_input?: string; summary: string } {
  const stored = [...words(plant.species), ...words(plant.cultivar)];
  const next = [...words(proposed.species), ...words(proposed.cultivar)];
  const genusWord = proposed.genus.toLowerCase();
  // Safe only if nothing stored is lost and nothing but the genus is new.
  const lost = stored.filter((word) => word !== genusWord && !next.includes(word));
  const added = next.filter((word) => !stored.includes(word));
  const change: ChangeKind = lost.length === 0 && added.length === 0 ? "split" : "changed";
  const parts = [
    lost.length ? `drops "${lost.join(" ")}"` : "",
    added.length ? `adds "${added.join(" ")}"` : "",
  ].filter(Boolean);

  return {
    change,
    new_key: computeSpeciesMatchKey(proposed.genus, proposed.species, proposed.cultivar),
    // A typed common name is kept as species_input (it stays the plant's
    // primary name on screen) — never over one that is already there, and
    // not for typed Latin, where the Latin name is the primary one.
    ...(change === "changed" && kind === "common" && plant.species && !plant.species_input
      ? { species_input: plant.species }
      : {}),
    summary: parts.length ? `changes stored words: ${parts.join(", ")}` : "stored words unchanged",
  };
}

/**
 * Replaces a proposal's name with one chosen by hand (--name), for a plant
 * the lookup got wrong or answered inconsistently. The name is used exactly
 * as given.
 */
export function withNameSetByHand(proposal: Proposal, names: PlantNames): Proposal {
  const details = describeChange(
    { species: proposal.current.species, cultivar: proposal.current.cultivar, species_input: null },
    names,
    proposal.typed_kind ?? "latin"
  );
  const { summary, ...rest } = details;
  return {
    ...proposal,
    ...rest,
    species_input: proposal.species_input !== undefined ? rest.species_input : undefined,
    proposed: names,
    decision: "review",
    reason: `name set by hand; ${summary}`,
  };
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
 *
 * Nothing is applied unless its plant id is in `ids`: a batch is always an
 * explicit list. Naming an id is the human sign-off, so it also covers
 * "review" proposals and ones skipped only for medium or low confidence.
 * It never overrides a missing name, a constraint violation, a plant that
 * has changed since the report, or (without includeRemoved) a removed plant.
 */
export async function applyProposal(
  proposal: Proposal,
  deps: ApplyDeps,
  options: { ids: ReadonlySet<string>; includeRemoved?: boolean }
): Promise<ApplyOutcome> {
  const untouched = (why: string): ApplyOutcome => ({ plant_id: proposal.plant_id, result: "untouched", why });

  if (!options.ids.has(proposal.plant_id)) return untouched("not in this batch");
  if (!proposal.proposed || !proposal.new_key) return untouched(proposal.reason);
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

/** One row of an undo file: what a plant held before an apply, and what the apply wrote. */
export type UndoEntry = {
  plant_id: string;
  previous: { genus: string; species: string | null; cultivar: string | null; species_input: string | null };
  applied: Record<string, string | null>;
};

/** Built from a fresh read of the plant, before anything is written. */
export function undoEntryFor(proposal: Proposal, plant: BlankGenusPlant): UndoEntry {
  return {
    plant_id: proposal.plant_id,
    previous: {
      genus: plant.genus ?? "",
      species: plant.species,
      cultivar: plant.cultivar,
      species_input: plant.species_input,
    },
    applied: plantUpdateFor(proposal),
  };
}

export type UndoDeps = {
  /**
   * Writes `restore` only if the row still holds every value in `expected`.
   * Returns whether a row was updated.
   */
  restorePlant(id: string, expected: Record<string, string | null>, restore: Record<string, string | null>): Promise<boolean>;
};

/**
 * Puts one plant back as it was — but only if it still holds exactly what the
 * apply wrote, so an edit made since then is never overwritten. species_input
 * is restored only if the apply wrote it. species_reference is not touched:
 * rows the apply created stay (nothing is ever deleted).
 */
export async function undoEntry(entry: UndoEntry, deps: UndoDeps): Promise<ApplyOutcome> {
  const { species_input: _typed, ...names } = entry.previous;
  void _typed;
  const restore = "species_input" in entry.applied ? { ...entry.previous } : names;
  const restored = await deps.restorePlant(entry.plant_id, entry.applied, restore);
  return restored
    ? { plant_id: entry.plant_id, result: "updated", new_key: computeSpeciesMatchKey(names.genus, names.species, names.cultivar) }
    : { plant_id: entry.plant_id, result: "untouched", why: "no longer holds what the apply wrote (never applied, or edited since)" };
}

/** Full plant ids for a list that may use the short form (first 8 characters). */
export function resolveIds(wanted: string[], known: string[]): { ids: Set<string>; problems: string[] } {
  const ids = new Set<string>();
  const problems: string[] = [];
  for (const want of wanted) {
    const matches = known.filter((id) => id === want || id.startsWith(want));
    if (matches.length === 1) ids.add(matches[0]);
    else problems.push(matches.length ? `${want} matches ${matches.length} plants` : `${want} is not in the report`);
  }
  return { ids, problems };
}

/** The stored name, ignoring case: "Boskoop Ruby" and "Boskoop ruby" are one plant and get one answer. */
export function storedNameKey(plant: Pick<BlankGenusPlant, "species" | "cultivar">): string {
  const fold = (text: string | null) => (text ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `${fold(plant.species)}\u0000${fold(plant.cultivar)}`;
}

/** Plants whose proposal differs between two reports (or is in only one). */
export function changedProposals(before: Proposal[], after: Proposal[]): { plant_id: string; before: Proposal | null; after: Proposal | null }[] {
  const view = (p: Proposal | undefined) =>
    p ? JSON.stringify([p.proposed, p.confidence, p.decision, p.species_input ?? null]) : "absent";
  const old = new Map(before.map((p) => [p.plant_id, p]));
  const next = new Map(after.map((p) => [p.plant_id, p]));
  return [...new Set([...old.keys(), ...next.keys()])]
    .filter((id) => view(old.get(id)) !== view(next.get(id)))
    .map((id) => ({ plant_id: id, before: old.get(id) ?? null, after: next.get(id) ?? null }));
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
