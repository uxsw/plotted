import { describe, it, expect } from "vitest";
import { applyLookupResult } from "./lookup-apply";
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
