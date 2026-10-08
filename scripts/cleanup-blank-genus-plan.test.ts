import { describe, it, expect, vi } from "vitest";
import type { LookupResult, ResolvedName } from "@/lib/plant-lookup";
import {
  applyProposal,
  constraintViolations,
  orphanedReferenceKeys,
  plantUpdateFor,
  proposeForPlant,
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
    const outcome = await applyProposal(proposal, deps);
    expect(outcome).toMatchObject({ result: "untouched", why: expect.stringContaining("plants_identified_requires_name_check") });
    expect(deps.enrich).not.toHaveBeenCalled();
    expect(deps.updatePlant).not.toHaveBeenCalled();
  });
});

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
    const outcome = await applyProposal(proposal, deps);

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
    const outcome = await applyProposal(proposal, deps);

    expect(deps.updatePlant).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ result: "untouched", why: expect.stringContaining("not complete") });
  });

  it("does nothing if the plant's name changed since the report", async () => {
    const deps = makeDeps({ readPlant: vi.fn(async () => ({ ...PLANT, species: "verbena hastata" })) });
    const outcome = await applyProposal(proposal, deps);

    expect(deps.enrich).not.toHaveBeenCalled();
    expect(deps.updatePlant).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ result: "untouched" });
  });

  it("a review proposal is applied only when its id is named", async () => {
    const review = proposeForPlant({ ...PLANT, species: "apple" }, lookup({ genus: "Malus", species: "domestica", kind: "common" }));
    const plant = { ...PLANT, species: "apple" };

    const unnamed = makeDeps({ readPlant: vi.fn(async () => plant) });
    expect(await applyProposal(review, unnamed)).toMatchObject({ result: "untouched" });
    expect(unnamed.enrich).not.toHaveBeenCalled();

    const named = makeDeps({ readPlant: vi.fn(async () => plant) });
    expect(await applyProposal(review, named, { reviewedIds: new Set(["plant-1"]) })).toMatchObject({ result: "updated" });
    expect(named.updatePlant).toHaveBeenCalledWith("plant-1", expect.anything(), {
      genus: "Malus",
      species: "domestica",
      cultivar: null,
      species_input: "apple",
    });
  });

  it("removed plants are left alone unless included", async () => {
    const removed = { ...PLANT, status: "removed" as const };
    const removedProposal = proposeForPlant(removed, lookup({}));

    const deps = makeDeps({ readPlant: vi.fn(async () => removed) });
    expect(await applyProposal(removedProposal, deps)).toMatchObject({ result: "untouched" });
    expect(deps.enrich).not.toHaveBeenCalled();

    expect(await applyProposal(removedProposal, makeDeps({ readPlant: vi.fn(async () => removed) }), { includeRemoved: true })).toMatchObject({
      result: "updated",
    });
  });

  it("skipped proposals are never applied", async () => {
    const deps = makeDeps();
    const skipped = proposeForPlant({ ...PLANT, species: "officinalis" }, lookup({ confidence: "low" }));
    expect(await applyProposal(skipped, deps, { reviewedIds: new Set(["plant-1"]) })).toMatchObject({ result: "untouched" });
    expect(deps.enrich).not.toHaveBeenCalled();
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
