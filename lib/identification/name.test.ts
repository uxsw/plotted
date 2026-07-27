import { describe, it, expect } from "vitest";
import { parseScientificName, candidateToPlantFields, genusFallbackToPlantFields } from "./name";
import { computeSpeciesMatchKey } from "@/lib/species-match-key";

describe("parseScientificName", () => {
  // Every name here was returned by the live Pl@ntNet API during stage 2 testing.
  it.each([
    ["Ajuga genevensis L.", "Ajuga", "genevensis"],
    ["Thymus praecox Opiz", "Thymus", "praecox"],
    ["Thymus serpyllum L.", "Thymus", "serpyllum"],
    ["Thymus herba-barona Loisel.", "Thymus", "herba-barona"],
    ["Thymus polytrichus A.Kern. ex Borbás", "Thymus", "polytrichus"],
    ["Clinopodium alpinum (L.) Kuntze", "Clinopodium", "alpinum"],
    ["Vaccinium microcarpum (Turcz. ex Rupr.) Schmalh.", "Vaccinium", "microcarpum"],
    ["Larix laricina (Du Roi) K.Koch", "Larix", "laricina"],
    ["Hammarbya paludosa (L.) Kuntze", "Hammarbya", "paludosa"],
  ])("strips authorship from %s", (input, genus, species) => {
    expect(parseScientificName(input)).toEqual({ genus, species });
  });

  it("returns species null for a genus-only name with authorship", () => {
    // The failure this guards: naively taking token[1] would store species "l.".
    expect(parseScientificName("Hydrangea L.")).toEqual({ genus: "Hydrangea", species: null });
  });

  it("returns species null for a bare genus", () => {
    expect(parseScientificName("Hydrangea")).toEqual({ genus: "Hydrangea", species: null });
  });

  it("normalises casing to the columns' existing conventions", () => {
    expect(parseScientificName("AJUGA GENEVENSIS")).toEqual({
      genus: "Ajuga",
      species: null, // uppercase epithet is indistinguishable from authorship
    });
    expect(parseScientificName("ajuga genevensis")).toEqual({
      genus: "Ajuga",
      species: "genevensis",
    });
  });

  it("folds a standalone hybrid marker into the epithet", () => {
    expect(parseScientificName("Salix × fragilis L.")).toEqual({
      genus: "Salix",
      species: "×fragilis",
    });
    expect(parseScientificName("Platanus x hispanica")).toEqual({
      genus: "Platanus",
      species: "×hispanica",
    });
  });

  it("handles empty and whitespace input without throwing", () => {
    expect(parseScientificName("")).toEqual({ genus: "", species: null });
    expect(parseScientificName("   ")).toEqual({ genus: "", species: null });
  });
});

describe("candidateToPlantFields", () => {
  const ajuga = {
    scientificName: "Ajuga genevensis L.",
    commonNames: ["Blue bugle", "Geneva bugleweed"],
  };

  it("maps a candidate to plant columns", () => {
    expect(candidateToPlantFields(ajuga)).toEqual({
      genus: "Ajuga",
      species: "genevensis",
      cultivar: null,
      common_names: ["Blue bugle", "Geneva bugleweed"],
      species_input: null,
    });
  });

  it("dedupes common names case-insensitively, keeping first casing", () => {
    const fields = candidateToPlantFields({
      scientificName: "Thymus praecox Opiz",
      commonNames: ["Wild Thyme", "wild thyme", "Creeping thyme", "  ", "Creeping Thyme"],
    });
    expect(fields.common_names).toEqual(["Wild Thyme", "Creeping thyme"]);
  });

  it("tolerates an empty common names list", () => {
    expect(candidateToPlantFields({ scientificName: "Thymus nervosus J.Gay ex Willk.", commonNames: [] }).common_names).toEqual([]);
  });

  it("keeps the user's original input when it differs from the canonical name", () => {
    expect(candidateToPlantFields(ajuga, "bugle").species_input).toBe("bugle");
  });

  it("discards the original input when it just restates the canonical name", () => {
    expect(candidateToPlantFields(ajuga, "Ajuga genevensis").species_input).toBeNull();
    expect(candidateToPlantFields(ajuga, "ajuga genevensis").species_input).toBeNull();
    expect(candidateToPlantFields(ajuga, "genevensis").species_input).toBeNull();
    expect(candidateToPlantFields(ajuga, "Ajuga").species_input).toBeNull();
  });

  it("treats absent original input as null", () => {
    expect(candidateToPlantFields(ajuga, null).species_input).toBeNull();
    expect(candidateToPlantFields(ajuga, "   ").species_input).toBeNull();
  });
});

describe("genusFallbackToPlantFields", () => {
  it("puts the genus in the genus slot and leaves species null", () => {
    // The bug this guards: an earlier version wrote genus:"" and stuffed the
    // genus name into species instead, inverting "genus known, species
    // unknown" into "species known, genus unknown".
    expect(genusFallbackToPlantFields("Thymus")).toEqual({
      genus: "Thymus",
      species: null,
      cultivar: null,
      common_names: [],
      species_input: null,
    });
  });

  it("keys as the bare genus, not a species-shaped key", () => {
    const f = genusFallbackToPlantFields("Thymus");
    // Genus is the first segment of computeSpeciesMatchKey; a null species
    // and null cultivar are omitted entirely rather than leaving empty
    // segments, so this must be "thymus" — not "|thymus".
    expect(computeSpeciesMatchKey(f.genus, f.species, f.cultivar)).toBe("thymus");
  });

  it("matches the key from equivalent manual entry of a bare genus", () => {
    const f = genusFallbackToPlantFields("Thymus");
    expect(computeSpeciesMatchKey(f.genus, f.species, f.cultivar)).toBe(
      computeSpeciesMatchKey("Thymus", null, null)
    );
  });

  it("normalises casing via sanitizeGenus", () => {
    expect(genusFallbackToPlantFields("thymus").genus).toBe("Thymus");
    expect(genusFallbackToPlantFields("THYMUS").genus).toBe("Thymus");
  });

  it("keeps the user's original input when it differs from the genus", () => {
    expect(genusFallbackToPlantFields("Thymus", "some weedy herb").species_input).toBe(
      "some weedy herb"
    );
  });

  it("discards the original input when it just restates the genus", () => {
    expect(genusFallbackToPlantFields("Thymus", "Thymus").species_input).toBeNull();
    expect(genusFallbackToPlantFields("Thymus", "thymus").species_input).toBeNull();
  });
});

describe("match_key produced by a photo-identified plant", () => {
  // The load-bearing assertion for this stage: a photo-identified plant with no
  // cultivar must key identically to the same plant typed by hand, or every
  // photo-sourced record misses the cache.
  it("produces ajuga|genevensis for Ajuga genevensis with no cultivar", () => {
    const f = candidateToPlantFields({ scientificName: "Ajuga genevensis L.", commonNames: [] });
    expect(computeSpeciesMatchKey(f.genus, f.species, f.cultivar)).toBe("ajuga|genevensis");
  });

  it("matches the key from equivalent manual entry, for null and empty cultivar alike", () => {
    const f = candidateToPlantFields({ scientificName: "Ajuga genevensis L.", commonNames: [] });
    const photoKey = computeSpeciesMatchKey(f.genus, f.species, f.cultivar);

    expect(photoKey).toBe(computeSpeciesMatchKey("Ajuga", "genevensis", null));
    expect(photoKey).toBe(computeSpeciesMatchKey("Ajuga", "genevensis", ""));
    expect(photoKey).toBe(computeSpeciesMatchKey("ajuga", "genevensis", undefined));
  });
});
