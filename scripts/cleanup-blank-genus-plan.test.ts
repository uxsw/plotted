import { describe, it, expect, vi } from "vitest";
import type { LookupResult, ResolvedName } from "@/lib/plant-lookup";
import {
  applyProposal,
  changedProposals,
  constraintViolations,
  orphanedReferenceKeys,
  plantUpdateFor,
  proposeForPlant,
  resolveIds,
  storedNameKey,
  undoEntry,
  undoEntryFor,
  withNameSetByHand,
  type ApplyDeps,
  type BlankGenusPlant,
} from "./cleanup-blank-genus-plan";

const PLANT: BlankGenusPlant = {
  id: "plant-1",
  genus: "",
  species: "verbena bonariensis",
  cultivar: null,
  species_input: null,
  status: "active",
  identification_status: "identified",
  species_source: "manual",
};

function lookup(resolved: Partial<ResolvedName> | null): LookupResult {
  return {
    common_names: [],
    sun_needs: null,
    flowering_season_from: null,
    flowering_season_to: null,
    eventual_height_cm: null,
    eventual_spread_cm: null,
    corrected_species: null,
    corrected_cultivar: null,
    resolved_name: resolved
      ? { genus: "Verbena", species: "bonariensis", cultivar: null, confidence: "high", kind: "latin", ...resolved }
      : null,
  };
}

describe("proposeForPlant", () => {
  it("a stored binomial is a plain split: safe to apply", () => {
    const proposal = proposeForPlant(PLANT, lookup({}));
    expect(proposal).toMatchObject({
      proposed: { genus: "Verbena", species: "bonariensis", cultivar: null },
      change: "split",
      decision: "apply",
      old_key: "|verbena bonariensis",
      new_key: "verbena|bonariensis",
    });
    expect(proposal).not.toHaveProperty("species_input");
  });

  it("an epithet that gains its genus is a split", () => {
    const proposal = proposeForPlant(
      { ...PLANT, species: "lycopersicum", cultivar: "Banana Legs" },
      lookup({ genus: "Solanum", species: "lycopersicum", cultivar: "Banana Legs" })
    );
    expect(proposal.decision).toBe("apply");
    expect(proposal.new_key).toBe("solanum|lycopersicum|banana legs");
  });

  it("a common name becoming Latin changes stored words: review, and keeps what was typed", () => {
    const proposal = proposeForPlant(
      { ...PLANT, species: "apple" },
      lookup({ genus: "Malus", species: "domestica", kind: "common" })
    );
    expect(proposal).toMatchObject({ change: "changed", decision: "review", species_input: "apple" });
  });

  it("a spelling correction changes stored words: review", () => {
    const proposal = proposeForPlant(
      { ...PLANT, species: "allium", cultivar: "Spherocephalon" },
      lookup({ genus: "Allium", species: "sphaerocephalon" })
    );
    expect(proposal).toMatchObject({
      proposed: { genus: "Allium", species: "sphaerocephalon", cultivar: null },
      decision: "review",
    });
  });

  it("never overwrites a species_input that is already set", () => {
    const proposal = proposeForPlant(
      { ...PLANT, species: "apple", species_input: "my eating apple" },
      lookup({ genus: "Malus", species: "domestica", kind: "common" })
    );
    expect(proposal).not.toHaveProperty("species_input");
  });

  it.each(["medium", "low"] as const)("%s confidence is reported but skipped", (confidence) => {
    const proposal = proposeForPlant({ ...PLANT, species: "officinalis" }, lookup({ genus: "Salvia", species: "officinalis", confidence }));
    expect(proposal.decision).toBe("skip");
    expect(proposal.proposed?.genus).toBe("Salvia");
  });

  it("skips when the lookup names no genus, fails, or the plant was photo-identified", () => {
    expect(proposeForPlant(PLANT, lookup(null)).decision).toBe("skip");
    expect(proposeForPlant(PLANT, null).decision).toBe("skip");
    expect(proposeForPlant({ ...PLANT, species_source: "identification" }, lookup({})).decision).toBe("skip");
  });

  it("treats a NULL genus as blank, and leaves a plant that has a genus alone", () => {
    expect(proposeForPlant({ ...PLANT, genus: null }, lookup({})).decision).toBe("apply");
    expect(proposeForPlant({ ...PLANT, genus: "Verbena" }, lookup({})).decision).toBe("skip");
  });
});

// plants_identified_requires_name_check: an identified plant must never end
// up with a null species and a blank genus.
describe("the cleanup never produces a row that violates the name constraints", () => {
  const resolutions: (Partial<ResolvedName> | null)[] = [
    {},
    { species: null },
    { genus: "Rosa", species: null, kind: "common" },
    { genus: "Malus", species: "domestica", cultivar: "Bramley" },
    { confidence: "medium" },
    { confidence: "low", species: null },
    null,
  ];
  const plants: BlankGenusPlant[] = [
    PLANT,
    { ...PLANT, genus: null },
    { ...PLANT, species: "climbing rose" },
    { ...PLANT, species: "allium", cultivar: "Spherocephalon" },
    { ...PLANT, status: "removed" },
  ];

  it("every proposal that could be written leaves an identified plant with a genus", () => {
    for (const plant of plants) {
      for (const resolution of resolutions) {
        const proposal = proposeForPlant(plant, lookup(resolution));
        if (proposal.decision === "skip") continue;
        const update = plantUpdateFor(proposal);
        expect(update.genus).toBeTruthy();
        expect(
          constraintViolations({ genus: update.genus, species: update.species, identification_status: plant.identification_status })
        ).toEqual([]);
      }
    }
  });

  it("constraintViolations treats NULL genus as blank", () => {
    expect(constraintViolations({ genus: null, species: null, identification_status: "identified" })).toEqual([
      "plants_identified_requires_name_check",
    ]);
    expect(constraintViolations({ genus: "", species: null, identification_status: "identified" })).toEqual([
      "plants_identified_requires_name_check",
    ]);
    expect(constraintViolations({ genus: "Rosa", species: null, identification_status: "identified" })).toEqual([]);
    expect(constraintViolations({ genus: "Rosa", species: null, identification_status: "unidentified" })).toEqual([
      "plants_identification_status_species_check",
    ]);
    expect(constraintViolations({ genus: null, species: null, identification_status: "unidentified" })).toEqual([]);
  });

  it("apply refuses a hand-edited report entry that would blank an identified plant's name", async () => {
    const proposal = { ...proposeForPlant(PLANT, lookup({})), proposed: { genus: "", species: null, cultivar: null } };
    const deps = makeDeps();
    const outcome = await applyProposal(proposal, deps, BATCH);
    expect(outcome).toMatchObject({ result: "untouched", why: expect.stringContaining("plants_identified_requires_name_check") });
    expect(deps.enrich).not.toHaveBeenCalled();
    expect(deps.updatePlant).not.toHaveBeenCalled();
  });
});

const BATCH = { ids: new Set(["plant-1"]) };

function makeDeps(overrides: Partial<ApplyDeps> = {}) {
  return {
    readPlant: vi.fn(async () => PLANT as BlankGenusPlant | null),
    enrich: vi.fn(async () => {}),
    referenceStatus: vi.fn(async () => "complete" as string | null),
    updatePlant: vi.fn(async () => true),
    ...overrides,
  } satisfies ApplyDeps;
}

describe("applyProposal", () => {
  const proposal = proposeForPlant(PLANT, lookup({}));

  it("enriches the new key first, and updates the plant only after the row is complete", async () => {
    const order: string[] = [];
    const deps = makeDeps({
      enrich: vi.fn(async () => void order.push("enrich")),
      referenceStatus: vi.fn(async () => (order.push("check"), "complete")),
      updatePlant: vi.fn(async () => (order.push("update"), true)),
    });
    const outcome = await applyProposal(proposal, deps, BATCH);

    expect(order).toEqual(["enrich", "check", "update"]);
    expect(deps.enrich).toHaveBeenCalledWith({ genus: "Verbena", species: "bonariensis", cultivar: null });
    expect(deps.updatePlant).toHaveBeenCalledWith(
      "plant-1",
      { genus: "", species: "verbena bonariensis", cultivar: null },
      { genus: "Verbena", species: "bonariensis", cultivar: null }
    );
    expect(outcome).toEqual({ plant_id: "plant-1", result: "updated", new_key: "verbena|bonariensis" });
  });

  it.each(["failed", "pending", null])("enrichment ending %s leaves the plant untouched and reports it", async (status) => {
    const deps = makeDeps({ referenceStatus: vi.fn(async () => status) });
    const outcome = await applyProposal(proposal, deps, BATCH);

    expect(deps.updatePlant).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ result: "untouched", why: expect.stringContaining("not complete") });
  });

  it("does nothing if the plant's name changed since the report", async () => {
    const deps = makeDeps({ readPlant: vi.fn(async () => ({ ...PLANT, species: "verbena hastata" })) });
    const outcome = await applyProposal(proposal, deps, BATCH);

    expect(deps.enrich).not.toHaveBeenCalled();
    expect(deps.updatePlant).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ result: "untouched" });
  });

  it("applies nothing that is not named in the batch, even a safe proposal", async () => {
    const deps = makeDeps();
    expect(await applyProposal(proposal, deps, { ids: new Set(["another-plant"]) })).toMatchObject({
      result: "untouched",
      why: "not in this batch",
    });
    expect(deps.readPlant).not.toHaveBeenCalled();
    expect(deps.enrich).not.toHaveBeenCalled();
  });

  it("a named review proposal is applied, with the typed common name kept", async () => {
    const plant = { ...PLANT, species: "apple" };
    const review = proposeForPlant(plant, lookup({ genus: "Malus", species: "domestica", kind: "common" }));
    const deps = makeDeps({ readPlant: vi.fn(async () => plant) });

    expect(await applyProposal(review, deps, BATCH)).toMatchObject({ result: "updated" });
    expect(deps.updatePlant).toHaveBeenCalledWith("plant-1", expect.anything(), {
      genus: "Malus",
      species: "domestica",
      cultivar: null,
      species_input: "apple",
    });
  });

  it("a named medium-confidence proposal is applied: naming the id is the sign-off", async () => {
    const plant = { ...PLANT, species: "guaranitica" };
    const medium = proposeForPlant(plant, lookup({ genus: "Salvia", species: "guaranitica", confidence: "medium" }));
    expect(medium.decision).toBe("skip");
    const deps = makeDeps({ readPlant: vi.fn(async () => plant) });

    expect(await applyProposal(medium, deps, BATCH)).toMatchObject({ result: "updated", new_key: "salvia|guaranitica" });
  });

  it("a named proposal with no name to write is still not applied", async () => {
    const deps = makeDeps();
    const noName = proposeForPlant({ ...PLANT, species: "officinalis" }, lookup(null));
    expect(await applyProposal(noName, deps, BATCH)).toMatchObject({ result: "untouched" });
    expect(deps.enrich).not.toHaveBeenCalled();
  });

  it("removed plants are left alone unless included", async () => {
    const removed = { ...PLANT, status: "removed" as const };
    const removedProposal = proposeForPlant(removed, lookup({}));

    const deps = makeDeps({ readPlant: vi.fn(async () => removed) });
    expect(await applyProposal(removedProposal, deps, BATCH)).toMatchObject({ result: "untouched" });
    expect(deps.enrich).not.toHaveBeenCalled();

    expect(
      await applyProposal(removedProposal, makeDeps({ readPlant: vi.fn(async () => removed) }), { ...BATCH, includeRemoved: true })
    ).toMatchObject({ result: "updated" });
  });
});

describe("withNameSetByHand", () => {
  it("uses the given name exactly, as a review proposal, for both spellings of one plant", () => {
    const name = { genus: "Cytisus", species: "scoparius", cultivar: "Boskoop Ruby" };
    for (const cultivar of ["Boskoop Ruby", "Boskoop ruby"]) {
      const plant = { ...PLANT, species: "cytisus", cultivar };
      const set = withNameSetByHand(proposeForPlant(plant, lookup({ genus: "Cytisus", species: null, cultivar })), name);
      expect(set).toMatchObject({ proposed: name, decision: "review", new_key: "cytisus|scoparius|boskoop ruby" });
      expect(set.reason).toContain("name set by hand");
      expect(plantUpdateFor(set)).toEqual(name);
    }
  });
});

describe("undo", () => {
  const plant = { ...PLANT, species: "apple" };
  const proposal = proposeForPlant(plant, lookup({ genus: "Malus", species: "domestica", kind: "common" }));
  const entry = undoEntryFor(proposal, plant);

  it("records the previous values of every field the apply writes", () => {
    expect(entry).toEqual({
      plant_id: "plant-1",
      previous: { genus: "", species: "apple", cultivar: null, species_input: null },
      applied: { genus: "Malus", species: "domestica", cultivar: null, species_input: "apple" },
    });
  });

  it("restores the previous values, conditional on the plant still holding what was applied", async () => {
    const restorePlant = vi.fn(async () => true);
    expect(await undoEntry(entry, { restorePlant })).toMatchObject({ result: "updated", new_key: "|apple" });
    expect(restorePlant).toHaveBeenCalledWith("plant-1", entry.applied, entry.previous);
  });

  it("leaves species_input alone when the apply did not write it", async () => {
    const split = undoEntryFor(proposeForPlant(PLANT, lookup({})), { ...PLANT, species_input: null });
    const restorePlant = vi.fn(async () => true);
    await undoEntry(split, { restorePlant });
    expect(restorePlant).toHaveBeenCalledWith(
      "plant-1",
      { genus: "Verbena", species: "bonariensis", cultivar: null },
      { genus: "", species: "verbena bonariensis", cultivar: null }
    );
  });

  it("reports a plant edited since the apply as untouched", async () => {
    expect(await undoEntry(entry, { restorePlant: vi.fn(async () => false) })).toMatchObject({ result: "untouched" });
  });

  it("the restored row satisfies the name constraints", () => {
    expect(
      constraintViolations({ genus: entry.previous.genus, species: entry.previous.species, identification_status: "identified" })
    ).toEqual([]);
  });
});

describe("batch helpers", () => {
  it("resolveIds accepts full ids and unique 8-character prefixes, and reports the rest", () => {
    const known = ["07c707d7-aaaa", "07c7ffff-bbbb", "6069b90c-cccc"];
    expect(resolveIds(["6069b90c", "07c707d7-aaaa"], known)).toEqual({
      ids: new Set(["6069b90c-cccc", "07c707d7-aaaa"]),
      problems: [],
    });
    expect(resolveIds(["07c7", "ffffffff"], known).problems).toEqual([
      "07c7 matches 2 plants",
      "ffffffff is not in the report",
    ]);
  });

  it("storedNameKey ignores case and spacing, so identical plants share one lookup", () => {
    expect(storedNameKey({ species: "cytisus", cultivar: "Boskoop Ruby" })).toBe(
      storedNameKey({ species: "Cytisus ", cultivar: "boskoop  ruby" })
    );
    expect(storedNameKey({ species: "cytisus", cultivar: null })).not.toBe(
      storedNameKey({ species: "cytisus", cultivar: "Boskoop Ruby" })
    );
  });

  it("changedProposals flags plants whose proposal, confidence or decision moved", () => {
    const same = proposeForPlant(PLANT, lookup({}));
    const before = proposeForPlant({ ...PLANT, id: "plant-2", species: "lychnis" }, null);
    const after = proposeForPlant({ ...PLANT, id: "plant-2", species: "lychnis" }, lookup({ genus: "Silene", species: "chalcedonica" }));
    const changed = changedProposals([same, before], [same, after]);
    expect(changed.map((c) => c.plant_id)).toEqual(["plant-2"]);
    expect(changed[0].after?.proposed?.genus).toBe("Silene");
  });
});

describe("orphanedReferenceKeys", () => {
  it("lists rows no active plant computes to, marking those a removed plant still matches", () => {
    const plants = [
      { genus: "Verbena", species: "bonariensis", cultivar: null, status: "active" as const },
      { genus: "", species: "apple", cultivar: null, status: "removed" as const },
    ];
    expect(orphanedReferenceKeys(["verbena|bonariensis", "|apple", "|officinalis"], plants)).toEqual([
      { match_key: "|apple", matched_by_removed: true },
      { match_key: "|officinalis", matched_by_removed: false },
    ]);
  });
});
