import { describe, it, expect } from "vitest";
import { sanitizePlantName, sanitizeGenus, sanitizeSpecies } from "./sanitize";

describe("sanitizePlantName", () => {
  it("returns empty string unchanged", () => {
    expect(sanitizePlantName("")).toBe("");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizePlantName("  Rosa  ")).toBe("Rosa");
  });

  it("collapses multiple internal spaces to one", () => {
    expect(sanitizePlantName("Rosa  canina")).toBe("Rosa canina");
    expect(sanitizePlantName("Rosa   ×   laevigata")).toBe("Rosa × laevigata");
  });

  it("normalises smart/curly single quotes to straight apostrophe", () => {
    expect(sanitizePlantName("‘Karl Foerster’")).toBe("'Karl Foerster'");
    expect(sanitizePlantName("O’Brien")).toBe("O'Brien");
  });

  it("normalises smart/curly double quotes to straight quotes", () => {
    expect(sanitizePlantName("“Hello”")).toBe('"Hello"');
  });

  it("strips zero-width space (U+200B)", () => {
    expect(sanitizePlantName("Rosa​canina")).toBe("Rosacanina");
  });

  it("strips zero-width joiner (U+200D)", () => {
    expect(sanitizePlantName("Rosa‍canina")).toBe("Rosacanina");
  });

  it("strips BOM / zero-width no-break space (U+FEFF)", () => {
    expect(sanitizePlantName("﻿Rosa")).toBe("Rosa");
  });

  it("preserves the × hybrid symbol (U+00D7)", () => {
    expect(sanitizePlantName("Rosa × hybrida")).toBe("Rosa × hybrida");
  });

  it("preserves plain x (not a hybrid symbol)", () => {
    expect(sanitizePlantName("Crocosmia x crocosmiiflora")).toBe(
      "Crocosmia x crocosmiiflora"
    );
  });

  it("preserves apostrophes", () => {
    expect(sanitizePlantName("O'Brien")).toBe("O'Brien");
  });

  it("preserves hyphens", () => {
    expect(sanitizePlantName("forget-me-not")).toBe("forget-me-not");
  });

  it("preserves accented/diacritic characters", () => {
    expect(sanitizePlantName("Senecio rowleyanus")).toBe("Senecio rowleyanus");
    expect(sanitizePlantName("Matthiola incana")).toBe("Matthiola incana");
  });

  it("preserves numbers", () => {
    expect(sanitizePlantName("Zone 7b")).toBe("Zone 7b");
  });

  it("preserves parentheses", () => {
    expect(sanitizePlantName("Lavandula (stoechas)")).toBe(
      "Lavandula (stoechas)"
    );
  });
});

describe("sanitizeGenus", () => {
  it("capitalises first letter and lowercases the rest", () => {
    expect(sanitizeGenus("rosa")).toBe("Rosa");
    expect(sanitizeGenus("ROSA")).toBe("Rosa");
    expect(sanitizeGenus("Rosa")).toBe("Rosa");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeGenus("")).toBe("");
  });

  it("trims before capitalising", () => {
    expect(sanitizeGenus("  rosa  ")).toBe("Rosa");
  });
});

describe("sanitizeSpecies", () => {
  it("lowercases entirely", () => {
    expect(sanitizeSpecies("Canina")).toBe("canina");
    expect(sanitizeSpecies("ACUTIFLORA")).toBe("acutiflora");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeSpecies("")).toBe("");
  });

  it("trims before lowercasing", () => {
    expect(sanitizeSpecies("  Canina  ")).toBe("canina");
  });
});
