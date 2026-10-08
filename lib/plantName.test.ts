import { describe, it, expect } from "vitest";
import { latinNameString, plantDisplayTitle, plantPageTitle, typedPlantName } from "./plantName";

describe("plantDisplayTitle", () => {
  it("uses the first common name when set", () => {
    expect(
      plantDisplayTitle({
        common_names: ["Mother of thyme", "Wild thyme"],
        genus: "Thymus",
        species: "praecox",
        cultivar: null,
      })
    ).toBe("Mother of thyme");
  });

  it("falls back to the full binomial when there is no common name", () => {
    // The bug this guards: this used to return the bare epithet "serpyllum"
    // alone — botanically meaningless and unsearchable without its genus.
    expect(
      plantDisplayTitle({
        common_names: [],
        genus: "Thymus",
        species: "serpyllum",
        cultivar: null,
      })
    ).toBe("Thymus serpyllum");
  });

  it("treats a null common_names list the same as empty", () => {
    expect(
      plantDisplayTitle({
        common_names: null as unknown as string[],
        genus: "Thymus",
        species: "serpyllum",
        cultivar: null,
      })
    ).toBe("Thymus serpyllum");
  });

  it("includes genus alongside a cultivar too", () => {
    expect(
      plantDisplayTitle({
        common_names: [],
        genus: "Ajuga",
        species: "reptans",
        cultivar: "Burgundy Glow",
      })
    ).toBe("Ajuga reptans 'Burgundy Glow'");
  });

  it("shows the bare genus for a genus-only record (species null, genus set)", () => {
    // e.g. the photo-identification genus-fallback case.
    expect(
      plantDisplayTitle({ common_names: [], genus: "Thymus", species: null, cultivar: null })
    ).toBe("Thymus");
  });

  it("falls back to cultivar alone when there is no genus or species", () => {
    expect(
      plantDisplayTitle({ common_names: [], genus: "", species: null, cultivar: "Burgundy Glow" })
    ).toBe("Burgundy Glow");
  });

  it("returns 'Unnamed plant' when nothing at all is set (the unidentified case)", () => {
    expect(
      plantDisplayTitle({ common_names: [], genus: "", species: null, cultivar: null })
    ).toBe("Unnamed plant");
  });

  it("does not regress existing rows with blank genus and a bare species", () => {
    // Stage 3 noted existing species_reference/plants rows sometimes have
    // genus blank or a stray letter — must not surface that as "undefined
    // serpyllum" or similar; blank genus is simply omitted, same as before.
    expect(
      plantDisplayTitle({ common_names: [], genus: "", species: "allium", cultivar: null })
    ).toBe("allium");
  });
});

// A plant typed as a common name keeps that name as its primary one, with the
// Latin name secondary; typed Latin leaves the Latin name primary.
describe("typed common names", () => {
  const apple = { genus: "Malus", species: "domestica", cultivar: null, common_names: ["Apple", "Eating apple"], species_input: "apple" };
  const latin = { ...apple, species_input: null };

  it("typedPlantName capitalises what was typed, and is null when nothing was kept", () => {
    expect(typedPlantName(apple)).toBe("Apple");
    expect(typedPlantName({ species_input: "dwarf bean" })).toBe("Dwarf bean");
    expect(typedPlantName(latin)).toBeNull();
    expect(typedPlantName({ species_input: "  " })).toBeNull();
    expect(typedPlantName({})).toBeNull();
  });

  it("plantDisplayTitle leads with the typed name, ahead of the lookup's common names", () => {
    expect(plantDisplayTitle({ ...apple, species_input: "dwarf apple", common_names: ["Apple"] })).toBe("Dwarf apple");
    expect(plantDisplayTitle(latin)).toBe("Apple");
    expect(plantDisplayTitle({ ...latin, common_names: [] })).toBe("Malus domestica");
  });

  it("plantPageTitle: typed name first with the Latin after it; Latin alone otherwise", () => {
    expect(plantPageTitle(apple)).toBe("Apple (Malus domestica)");
    expect(plantPageTitle(latin)).toBe("Malus domestica");
    expect(plantPageTitle({ genus: "Rosa", species: null, cultivar: null, species_input: "climbing rose" })).toBe("Climbing rose (Rosa)");
    expect(plantPageTitle({ genus: "", species: null, cultivar: null })).toBeNull();
  });

  it("latinNameString gives the binomial with a quoted cultivar", () => {
    expect(latinNameString({ genus: "Malus", species: "domestica", cultivar: "Bramley" })).toBe("Malus domestica 'Bramley'");
    expect(latinNameString({ genus: "Rosa", species: null, cultivar: null })).toBe("Rosa");
    expect(latinNameString({ genus: "", species: null, cultivar: null })).toBeNull();
  });
});
