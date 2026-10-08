import { describe, it, expect } from "vitest";
import type { WikipediaSummary } from "@/lib/wikimedia";
import {
  finalConfidence,
  isMatchingPlantPage,
  verificationFrom,
  wikipediaTitleFor,
} from "./verify";

function page(overrides: Partial<WikipediaSummary>): WikipediaSummary {
  return {
    title: "Echinacea purpurea",
    type: "standard",
    description: "Species of flowering plant in the daisy family",
    extract: "Echinacea purpurea, the eastern purple coneflower, is a North American species of flowering plant.",
    image: null,
    pageUrl: "https://en.wikipedia.org/wiki/Echinacea_purpurea",
    ...overrides,
  };
}

const plain = { species: "purpurea", cultivar: null, partial_match: false } as const;

describe("wikipediaTitleFor", () => {
  it("uses the binomial, the genus alone, and Wikipedia's spacing for hybrids", () => {
    expect(wikipediaTitleFor({ genus: "Echinacea", species: "purpurea" })).toBe("Echinacea purpurea");
    expect(wikipediaTitleFor({ genus: "Hosta", species: null })).toBe("Hosta");
    expect(wikipediaTitleFor({ genus: "Euphorbia", species: "×martini" })).toBe("Euphorbia × martini");
  });
});

describe("isMatchingPlantPage", () => {
  it("accepts a page about the species", () => {
    expect(isMatchingPlantPage({ genus: "Echinacea", species: "purpurea" }, page({}))).toBe(true);
  });

  it("rejects a disambiguation page", () => {
    expect(
      isMatchingPlantPage(
        { genus: "Iris", species: null },
        page({ title: "Iris", type: "disambiguation", description: "Topics referred to by the same term", extract: "Iris most often refers to: Iris (plant), a genus of flowering plants" })
      )
    ).toBe(false);
  });

  it("rejects a page that isn't about a plant", () => {
    expect(
      isMatchingPlantPage(
        { genus: "Nigella", species: null },
        page({ title: "Nigella Lawson", description: "English food writer", extract: "Nigella Lawson is an English food writer and television cook." })
      )
    ).toBe(false);
  });

  it("rejects a species title that landed on its genus page without naming the species", () => {
    expect(
      isMatchingPlantPage(
        { genus: "Salvia", species: "montifera" },
        page({ title: "Salvia", description: "Largest genus of plants in the mint family", extract: "Salvia is the largest genus of plants in the sage family Lamiaceae, with just under 1,000 species." })
      )
    ).toBe(false);
  });

  it("accepts a genus-page redirect when the text names the epithet, in any case", () => {
    expect(
      isMatchingPlantPage(
        { genus: "Melianthus", species: "major" },
        page({ title: "Melianthus", description: "Genus of flowering plants", extract: "Melianthus is a genus of flowering plants. The best known is MELIANTHUS MAJOR, the honey bush." })
      )
    ).toBe(true);
  });

  // The real response for /page/summary/Fascicularia%20bicolor, 2026-10-07.
  it("accepts a binomial that redirects to a monotypic genus page (Fascicularia bicolor)", () => {
    const fascicularia = page({
      title: "Fascicularia",
      description: "Genus of flowering plant in the pineapple family Bromeliaceae",
      extract:
        "Fascicularia is a monotypic genus of flowering plants in the pineapple family Bromeliaceae, subfamily Bromelioideae. The genus name is from the Latin fasciculus (bundle) and arius.",
    });
    expect(isMatchingPlantPage({ genus: "Fascicularia", species: "bicolor" }, fascicularia)).toBe(true);
    expect(verificationFrom({ genus: "Fascicularia", species: "bicolor" }, { status: "found", summary: fascicularia })).toBe("verified");
  });

  it("treats ph and f spellings of an epithet as the same", () => {
    expect(
      isMatchingPlantPage(
        { genus: "Cosmos", species: "sulfureus" },
        page({ title: "Cosmos sulphureus", extract: "Cosmos sulphureus is a species of flowering plant in the sunflower family." })
      )
    ).toBe(true);
  });
});

describe("verificationFrom", () => {
  it("keeps 'no such page' apart from 'couldn't ask'", () => {
    const candidate = { genus: "Ypsilandra", species: "thibetica" };
    expect(verificationFrom(candidate, { status: "missing" })).toBe("unverified");
    expect(verificationFrom(candidate, { status: "error" })).toBe("unknown");
  });
});

describe("finalConfidence", () => {
  it("high stays high when verified, or when Wikipedia couldn't be asked", () => {
    expect(finalConfidence({ ...plain, confidence: "high" }, "verified", 1)).toBe("high");
    expect(finalConfidence({ ...plain, confidence: "high" }, "unknown", 1)).toBe("high");
  });

  it("high drops to medium when there is no matching page", () => {
    expect(finalConfidence({ ...plain, confidence: "high" }, "unverified", 1)).toBe("medium");
  });

  it("medium is raised only for a verified, sole, species-level candidate", () => {
    expect(finalConfidence({ ...plain, confidence: "medium" }, "verified", 1)).toBe("high");
    expect(finalConfidence({ ...plain, confidence: "medium" }, "verified", 2)).toBe("medium");
    expect(finalConfidence({ ...plain, confidence: "medium" }, "unverified", 1)).toBe("medium");
    expect(finalConfidence({ ...plain, confidence: "medium" }, "unknown", 1)).toBe("medium");
    expect(finalConfidence({ ...plain, species: null, confidence: "medium" }, "verified", 1)).toBe("medium");
  });

  it("low stays low whatever Wikipedia says", () => {
    expect(finalConfidence({ ...plain, confidence: "low" }, "verified", 1)).toBe("low");
  });

  it("a cultivar is capped at medium, even when the model is sure and the species is verified", () => {
    const cultivar = { ...plain, species: "nemorosa", cultivar: "Caradonna" };
    expect(finalConfidence({ ...cultivar, confidence: "high" }, "verified", 1)).toBe("medium");
    expect(finalConfidence({ ...cultivar, confidence: "high" }, "unknown", 1)).toBe("medium");
    expect(finalConfidence({ ...cultivar, confidence: "medium" }, "verified", 1)).toBe("medium");
  });

  it("a partial match is capped at medium", () => {
    expect(finalConfidence({ ...plain, partial_match: true, confidence: "high" }, "verified", 1)).toBe("medium");
  });
});
