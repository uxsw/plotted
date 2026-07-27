import { describe, it, expect } from "vitest";
import { topCandidates, confidenceRegister, sharedGenus } from "./candidates";
import type { IdentificationCandidate } from "./types";

function candidate(
  scientificName: string,
  genus: string,
  score = 0.5
): IdentificationCandidate {
  return {
    scientificName,
    genus,
    family: "Lamiaceae",
    commonNames: [],
    score,
    referenceImages: ["https://bs.plantnet.org/image/m/abc"],
  };
}

describe("topCandidates", () => {
  it("takes at most three", () => {
    const list = [
      candidate("Thymus praecox Opiz", "Thymus"),
      candidate("Thymus serpyllum L.", "Thymus"),
      candidate("Thymus pulegioides L.", "Thymus"),
      candidate("Thymus drucei Ronniger", "Thymus"),
    ];
    expect(topCandidates(list)).toHaveLength(3);
    expect(topCandidates(list).map((c) => c.scientificName)).toEqual([
      "Thymus praecox Opiz",
      "Thymus serpyllum L.",
      "Thymus pulegioides L.",
    ]);
  });

  it("returns fewer when the provider returned fewer", () => {
    expect(topCandidates([candidate("Thymus praecox Opiz", "Thymus")])).toHaveLength(1);
    expect(topCandidates([])).toHaveLength(0);
  });
});

describe("confidenceRegister", () => {
  it("frames a high score as likely and a low score as a guess", () => {
    expect(confidenceRegister(0.66093)).toBe("likely"); // real top score, thyme photo
    expect(confidenceRegister(0.35947)).toBe("guess"); // same photo, 'all' flora
    expect(confidenceRegister(0.00525)).toBe("guess"); // real top score, degraded photo
  });

  it("treats the threshold itself as a guess", () => {
    expect(confidenceRegister(0.6)).toBe("guess");
    expect(confidenceRegister(0.601)).toBe("likely");
  });
});

describe("sharedGenus", () => {
  it("returns the genus when all shown candidates agree", () => {
    expect(
      sharedGenus([
        candidate("Thymus praecox Opiz", "Thymus"),
        candidate("Thymus serpyllum L.", "Thymus"),
        candidate("Thymus pulegioides L.", "Thymus"),
      ])
    ).toBe("Thymus");
  });

  it("ignores candidates beyond the shown three", () => {
    // The fourth disagrees but is never displayed, so it must not veto.
    expect(
      sharedGenus([
        candidate("Thymus praecox Opiz", "Thymus"),
        candidate("Thymus serpyllum L.", "Thymus"),
        candidate("Thymus pulegioides L.", "Thymus"),
        candidate("Clinopodium alpinum (L.) Kuntze", "Clinopodium"),
      ])
    ).toBe("Thymus");
  });

  it("returns null when the shown candidates disagree", () => {
    expect(
      sharedGenus([
        candidate("Carex pauciflora Lightf.", "Carex"),
        candidate("Lycopodiella inundata (L.) Holub", "Lycopodiella"),
        candidate("Solidago rugosa Mill.", "Solidago"),
      ])
    ).toBeNull();
  });

  it("compares case-insensitively", () => {
    expect(
      sharedGenus([
        candidate("Thymus praecox Opiz", "Thymus"),
        candidate("Thymus serpyllum L.", "thymus"),
      ])
    ).toBe("Thymus");
  });

  it("needs at least two candidates to call it agreement", () => {
    expect(sharedGenus([candidate("Thymus praecox Opiz", "Thymus")])).toBeNull();
    expect(sharedGenus([])).toBeNull();
  });

  it("returns null when the provider gave no genus", () => {
    expect(
      sharedGenus([candidate("Thymus praecox Opiz", ""), candidate("Thymus serpyllum L.", "")])
    ).toBeNull();
  });
});
