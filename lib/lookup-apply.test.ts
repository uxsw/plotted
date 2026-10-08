import { describe, it, expect } from "vitest";
import { applyLookupResult, hasGenusForEnrichment } from "./lookup-apply";
import type { LookupResult } from "./plant-lookup";

const BASE_LOOKUP: LookupResult = {
  common_names: [],
  sun_needs: null,
  flowering_season_from: null,
  flowering_season_to: null,
  eventual_height_cm: null,
  eventual_spread_cm: null,
  corrected_species: null,
  corrected_cultivar: null,
  resolved_name: null,
};

describe("applyLookupResult — default behaviour (manual entry, unaffected)", () => {
  it("applies common names, sun/flowering/size, and a spelling correction as before", () => {
    const result: LookupResult = {
      ...BASE_LOOKUP,
      common_names: ["Wild thyme"],
      sun_needs: "full sun",
      corrected_species: "reptans",
    };
    const { updates } = applyLookupResult(result, { species: "reptns", cultivar: null });
    expect(updates).toEqual({
      common_names: ["Wild thyme"],
      sun_needs: "full sun",
      species: "reptans",
    });
  });
});

describe("applyLookupResult — skipCorrection", () => {
  it("suppresses corrected_species even when the model returns one", () => {
    // The exact failure this guards: Digitalis thapsi (correct) getting
    // "corrected" to thapsus (Verbascum thapsus — a different plant).
    const result: LookupResult = { ...BASE_LOOKUP, corrected_species: "thapsus" };
    const { updates } = applyLookupResult(
      result,
      { species: "thapsi", cultivar: null },
      { skipCorrection: true }
    );
    expect(updates).not.toHaveProperty("species");
  });

  it("suppresses corrected_cultivar too", () => {
    const result: LookupResult = { ...BASE_LOOKUP, corrected_cultivar: "Golden King" };
    const { updates } = applyLookupResult(
      result,
      { species: "ivy", cultivar: "golden king" },
      { skipCorrection: true }
    );
    expect(updates).not.toHaveProperty("cultivar");
  });

  it("still applies non-correction fields when skipCorrection is set", () => {
    const result: LookupResult = {
      ...BASE_LOOKUP,
      sun_needs: "full sun",
      flowering_season_from: 5,
      flowering_season_to: 7,
      corrected_species: "praecox", // should still be suppressed
    };
    const { updates } = applyLookupResult(
      result,
      { species: "praecox", cultivar: null },
      { skipCorrection: true }
    );
    expect(updates).toEqual({ sun_needs: "full sun", flowering_season_from: 5, flowering_season_to: 7 });
  });
});

describe("applyLookupResult — existingCommonNames", () => {
  it("does not overwrite provider-supplied common names with an AI guess", () => {
    // The exact failure this guards: Pl@ntNet's real
    // ["Mother of thyme","Creeping thyme","Wild thyme"] getting clobbered by
    // enrichment's hallucinated ["Winter jasmine"].
    const result: LookupResult = { ...BASE_LOOKUP, common_names: ["Winter jasmine"] };
    const { updates } = applyLookupResult(
      result,
      { species: "praecox", cultivar: null },
      { existingCommonNames: ["Mother of thyme", "Creeping thyme", "Wild thyme"] }
    );
    expect(updates).not.toHaveProperty("common_names");
  });

  it("fills in AI common names when the provider supplied none", () => {
    const result: LookupResult = { ...BASE_LOOKUP, common_names: ["Bugle"] };
    const { updates } = applyLookupResult(
      result,
      { species: "reptans", cultivar: null },
      { existingCommonNames: [] }
    );
    expect(updates).toEqual({ common_names: ["Bugle"] });
  });

  it("fills in when existingCommonNames is undefined (manual-entry shape)", () => {
    const result: LookupResult = { ...BASE_LOOKUP, common_names: ["Bugle"] };
    const { updates } = applyLookupResult(result, { species: "reptans", cultivar: null }, {});
    expect(updates).toEqual({ common_names: ["Bugle"] });
  });

  it("lookup_status reflects what the AI found, not what was withheld", () => {
    // Withholding common_names because the provider already had them isn't
    // the same as the lookup finding nothing — status should still be
    // "success" since the AI did return usable data.
    const result: LookupResult = { ...BASE_LOOKUP, common_names: ["Winter jasmine"] };
    const { lookup_status } = applyLookupResult(
      result,
      { species: "praecox", cultivar: null },
      { existingCommonNames: ["Mother of thyme"] }
    );
    expect(lookup_status).toBe("success");
  });
});

describe("applyLookupResult — both options combined (the actual identification-save path)", () => {
  it("neither overwrites common names nor corrects the species", () => {
    const result: LookupResult = {
      ...BASE_LOOKUP,
      common_names: ["Winter jasmine"],
      sun_needs: "full sun",
      corrected_species: "praecoxxx",
    };
    const { updates } = applyLookupResult(
      result,
      { species: "praecox", cultivar: null },
      { skipCorrection: true, existingCommonNames: ["Mother of thyme"] }
    );
    expect(updates).toEqual({ sun_needs: "full sun" });
  });
});

// ─── Name resolution (blank genus) ───────────────────────────────────────────

const resolved = (
  genus: string,
  species: string | null,
  cultivar: string | null = null,
  confidence: "high" | "medium" | "low" = "high",
  kind: "latin" | "common" = "latin"
) => ({ genus, species, cultivar, confidence, kind });

describe("applyLookupResult — resolving a typed name when genus is blank", () => {
  it("typed binomial: genus and epithet go to their own columns", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Verbena", "bonariensis") },
      { genus: "", species: "verbena bonariensis", cultivar: null }
    );
    expect(updates).toEqual({ genus: "Verbena", species: "bonariensis" });
    expect(names).toEqual({ genus: "Verbena", species: "bonariensis", cultivar: null });
  });

  it("typed common name: resolved, with what was typed kept in species_input", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Malus", "domestica", null, "high", "common") },
      { genus: "", species: "apple", cultivar: null }
    );
    expect(updates).toEqual({ genus: "Malus", species: "domestica", species_input: "apple" });
    expect(names.genus).toBe("Malus");
  });

  it("a common name for a genus resolves to the genus alone", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Rosa", null, null, "high", "common") },
      { genus: "", species: "climbing rose", cultivar: null }
    );
    expect(updates).toEqual({ genus: "Rosa", species: null, species_input: "climbing rose" });
    expect(names).toEqual({ genus: "Rosa", species: null, cultivar: null });
  });

  it.each(["medium", "low"] as const)("%s confidence leaves genus blank", (confidence) => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Salvia", "officinalis", null, confidence) },
      { genus: "", species: "officinalis", cultivar: null }
    );
    expect(updates).not.toHaveProperty("genus");
    expect(names).toEqual({ genus: "", species: "officinalis", cultivar: null });
  });

  it("no resolved name: genus stays blank and the old spelling correction still applies", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, corrected_species: "officinalis" },
      { genus: "", species: "oficinalis", cultivar: null }
    );
    expect(updates).toEqual({ species: "officinalis" });
    expect(names.genus).toBe("");
  });

  it("a name split into the wrong fields is put right, with the misplaced cultivar cleared", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Allium", "sphaerocephalon") },
      { genus: "", species: "allium", cultivar: "Spherocephalon" }
    );
    expect(updates).toMatchObject({ genus: "Allium", species: "sphaerocephalon", cultivar: null });
    expect(names).toEqual({ genus: "Allium", species: "sphaerocephalon", cultivar: null });
  });

  it("keeps the gardener's cultivar when the model returns none", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Lavandula", "angustifolia", null, "high", "common") },
      { genus: "", species: "lavender", cultivar: "Hidcote" }
    );
    expect(updates).not.toHaveProperty("cultivar");
    expect(names.cultivar).toBe("Hidcote");
  });

  it("uses a cultivar the model pulled out of the typed name", () => {
    const { updates } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Solanum", "lycopersicum", "Banana Legs") },
      { genus: "", species: "lycopersicum", cultivar: "banana legs" }
    );
    expect(updates).toMatchObject({ genus: "Solanum", cultivar: "Banana Legs" });
    expect(updates).not.toHaveProperty("species");
  });

  it("skipCorrection (photo identification) ignores a resolved name entirely", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Verbascum", "thapsus") },
      { genus: "", species: "thapsi", cultivar: null },
      { skipCorrection: true }
    );
    expect(updates).toEqual({});
    expect(names).toEqual({ genus: "", species: "thapsi", cultivar: null });
  });
});

describe("applyLookupResult — species_input", () => {
  it("is not set when typed Latin is corrected: the Latin name stays the primary one", () => {
    const { updates } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Dodonaea", "viscosa", null, "high", "latin") },
      { genus: "", species: "dodonea viscosa", cultivar: null }
    );
    expect(updates).toEqual({ genus: "Dodonaea", species: "viscosa" });
  });

  it("is not set when a typed common name is also the genus", () => {
    const { updates } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Hydrangea", null, null, "high", "common") },
      { genus: "", species: "hydrangea", cultivar: null }
    );
    expect(updates).not.toHaveProperty("species_input");
  });
});

describe("applyLookupResult — a plant that already has a genus", () => {
  it("never changes the genus, even when the model resolves a different one", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, resolved_name: resolved("Verbascum", "thapsus") },
      { genus: "Digitalis", species: "thapsi", cultivar: null }
    );
    expect(updates).toEqual({});
    expect(names).toEqual({ genus: "Digitalis", species: "thapsi", cultivar: null });
  });

  it("strips the genus from a species correction that comes back as a binomial", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, corrected_species: "verbena bonariensis" },
      { genus: "Verbena", species: "bonarensis", cultivar: null }
    );
    expect(updates).toEqual({ species: "bonariensis" });
    expect(names.species).toBe("bonariensis");
  });

  it("drops a species correction that is only the genus added to the same epithet", () => {
    const { updates } = applyLookupResult(
      { ...BASE_LOOKUP, corrected_species: "verbena bonariensis" },
      { genus: "Verbena", species: "bonariensis", cultivar: null }
    );
    expect(updates).not.toHaveProperty("species");
  });

  it("discards a cultivar correction that carries the genus", () => {
    const { updates, names } = applyLookupResult(
      { ...BASE_LOOKUP, corrected_cultivar: "Verbena Lollipop" },
      { genus: "Verbena", species: "bonariensis", cultivar: "Lolipop" }
    );
    expect(updates).not.toHaveProperty("cultivar");
    expect(names.cultivar).toBe("Lolipop");
  });
});

describe("hasGenusForEnrichment", () => {
  it("is false for blank, whitespace, null and undefined", () => {
    for (const genus of ["", "   ", null, undefined]) expect(hasGenusForEnrichment(genus)).toBe(false);
    expect(hasGenusForEnrichment("Hydrangea")).toBe(true);
  });
});
