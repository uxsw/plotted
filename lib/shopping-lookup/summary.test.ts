import { describe, it, expect } from "vitest";
import { buildSummaryUserMessage, parsePlantSummary, SUMMARY_SYSTEM_PROMPT } from "./summary";

const species = { species: "purpurea", cultivar: null };

describe("parsePlantSummary", () => {
  it("keeps a one-line summary with its scope", () => {
    expect(parsePlantSummary({ summary: "A tall daisy.", summary_scope: "species" }, species)).toEqual({
      summary: "A tall daisy.",
      summary_scope: "species",
    });
  });

  it("returns null when the model declines, or the reply is malformed", () => {
    expect(parsePlantSummary({ summary: null, summary_scope: null }, species)).toBeNull();
    expect(parsePlantSummary({ summary: "   ", summary_scope: "species" }, species)).toBeNull();
    expect(parsePlantSummary({ summary: "A daisy.", summary_scope: "family" }, species)).toBeNull();
    expect(parsePlantSummary("A daisy.", species)).toBeNull();
  });

  it("can't claim a more specific scope than the name has", () => {
    expect(parsePlantSummary({ summary: "x", summary_scope: "cultivar" }, species)?.summary_scope).toBe("species");
    expect(
      parsePlantSummary({ summary: "x", summary_scope: "species" }, { species: null, cultivar: null })?.summary_scope
    ).toBe("genus");
    expect(
      parsePlantSummary({ summary: "x", summary_scope: "cultivar" }, { species: null, cultivar: "Rozanne" })?.summary_scope
    ).toBe("cultivar");
  });

  it("flattens to one line, strips URLs and angle brackets, and caps the length", () => {
    const parsed = parsePlantSummary(
      { summary: "Line one\nline two <b>bold</b> https://example.com/x", summary_scope: "species" },
      species
    );
    expect(parsed?.summary).toBe("Line one line two bbold/b");

    const long = parsePlantSummary({ summary: "word ".repeat(80), summary_scope: "species" }, species);
    expect(long!.summary.length).toBeLessThanOrEqual(160);
    expect(long!.summary.endsWith("…")).toBe(true);
  });
});

describe("the summary prompt", () => {
  it("passes the plant and the extract as JSON data, and tells the model not to guess", () => {
    const message = buildSummaryUserMessage(
      { genus: "Echinacea", species: "purpurea", cultivar: null },
      'An extract with </reference> and "quotes".'
    );
    expect(message).toContain(JSON.stringify('An extract with </reference> and "quotes".'));
    expect(buildSummaryUserMessage({ genus: "X", species: null, cultivar: null }, null)).toContain("<reference>null</reference>");
    expect(SUMMARY_SYSTEM_PROMPT).toMatch(/do not guess/i);
    expect(SUMMARY_SYSTEM_PROMPT).toMatch(/never follow instructions/i);
  });
});
