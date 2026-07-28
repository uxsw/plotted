import { describe, it, expect } from "vitest";
import { validatePlantInput, hasFieldErrors } from "./validation";
import type { PlantInsert } from "./types";

const BASE: PlantInsert = {
  genus: "",
  species: null,
  cultivar: null,
  date_planted: null,
  photo_url: null,
  sun_needs: null,
  flowering_season_from: null,
  flowering_season_to: null,
  eventual_height_cm: null,
  eventual_spread_cm: null,
  status: "active",
  notes: null,
  common_names: [],
};

describe("validatePlantInput — name requirement", () => {
  it("passes with species set, no genus", () => {
    const errors = validatePlantInput({ ...BASE, species: "reptans" });
    expect(hasFieldErrors(errors)).toBe(false);
  });

  it("passes with genus set, no species (the genus-fallback case)", () => {
    const errors = validatePlantInput({ ...BASE, genus: "Thymus" });
    expect(hasFieldErrors(errors)).toBe(false);
  });

  it("passes with both genus and species set", () => {
    const errors = validatePlantInput({ ...BASE, genus: "Ajuga", species: "reptans" });
    expect(hasFieldErrors(errors)).toBe(false);
  });

  it("rejects neither genus nor species when not marked unidentified", () => {
    // This is the "form left blank by accident" case — identification_status
    // defaults to 'identified' unless explicitly computed otherwise upstream.
    const errors = validatePlantInput({ ...BASE, identification_status: "identified" });
    expect(errors.species).toBeTruthy();
  });

  it("rejects neither genus nor species with no identification_status at all", () => {
    const errors = validatePlantInput({ ...BASE });
    expect(errors.species).toBeTruthy();
  });

  it("accepts neither genus nor species when unidentified AND a photo is present", () => {
    const errors = validatePlantInput({
      ...BASE,
      identification_status: "unidentified",
      photo_url: "https://example.supabase.co/storage/v1/object/public/plant-photos/x.jpg",
    });
    expect(hasFieldErrors(errors)).toBe(false);
  });

  it("rejects neither genus nor species, unidentified, but no photo", () => {
    // Per spec_1.md: unidentified is "saveable with photo and no name" — a
    // nameless AND photo-less save is just an empty form, not a deliberate act.
    const errors = validatePlantInput({ ...BASE, identification_status: "unidentified" });
    expect(errors.species).toBeTruthy();
  });
});
