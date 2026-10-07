import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.hoisted(() => vi.fn());
vi.mock("./client", async (original) => ({
  ...(await original<typeof import("./client")>()),
  lookupAnthropic: { messages: { create } },
}));
vi.mock("@/lib/wikimedia", () => ({ fetchWikipediaSummary: vi.fn() }));

import { fetchWikipediaSummary, type WikipediaSummaryResult } from "@/lib/wikimedia";
import { describeCandidate, lookupPlantByName } from "./lookup";

const USAGE = { input_tokens: 10, output_tokens: 10 };

const candidate = (overrides: Record<string, unknown> = {}) => ({
  genus: "Echinacea",
  species: "purpurea",
  cultivar: null,
  unmatched_text: null,
  common_names: ["Purple coneflower"],
  confidence: "high",
  growth_type: "perennial",
  ...overrides,
});

function found(
  title: string,
  extract: string,
  withImage = true
): Extract<WikipediaSummaryResult, { status: "found" }> {
  return {
    status: "found",
    summary: {
      title,
      type: "standard",
      description: "Species of flowering plant",
      extract,
      image: withImage
        ? { url: "https://upload.wikimedia.org/x.jpg", attribution: `https://en.wikipedia.org/wiki/${title}` }
        : null,
      pageUrl: `https://en.wikipedia.org/wiki/${title}`,
    },
  };
}

const ECHINACEA = found("Echinacea purpurea", "Echinacea purpurea is a species of flowering plant.");

/** Routes the two model calls: the resolver (has tools) and the summary (doesn't). */
function mockModel(candidates: unknown[], summary: unknown = { summary: "A tall daisy.", summary_scope: "species" }) {
  create.mockImplementation(async (request: { tools?: unknown }) => {
    if (request.tools) {
      return {
        content: [{ type: "tool_use", id: "t", name: "report_candidates", input: { sounds_like: "s", candidates } }],
        usage: USAGE,
      };
    }
    if (summary instanceof Error) throw summary;
    return { content: [{ type: "text", text: JSON.stringify(summary) }], usage: USAGE };
  });
}

const summaryCalls = () => create.mock.calls.filter(([request]) => !request.tools);

beforeEach(() => {
  create.mockReset();
  vi.mocked(fetchWikipediaSummary).mockReset().mockResolvedValue(ECHINACEA);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("lookupPlantByName — high confidence", () => {
  it("resolves a verified species with a summary and the page's image", async () => {
    mockModel([candidate()]);
    const { outcome } = await lookupPlantByName("echinaysha purpyoorea");

    expect(outcome).toMatchObject({
      kind: "resolved",
      candidate: { genus: "Echinacea", species: "purpurea", final_confidence: "high", verification: "verified" },
      details: {
        summary: { summary: "A tall daisy.", summary_scope: "species" },
        image: { url: "https://upload.wikimedia.org/x.jpg" },
      },
    });
    expect(fetchWikipediaSummary).toHaveBeenCalledWith("Echinacea purpurea", expect.anything());
  });

  it("grounds the summary in the Wikipedia extract, passed as data", async () => {
    mockModel([candidate()]);
    await lookupPlantByName("Echinacea purpurea");
    expect(summaryCalls()[0][0].messages[0].content).toContain("Echinacea purpurea is a species of flowering plant.");
  });

  it("raises a sole verified medium to high", async () => {
    mockModel([candidate({ confidence: "medium" })]);
    expect((await lookupPlantByName("the bina ben orients")).outcome.kind).toBe("resolved");
  });

  it("tries 'Genus (plant)' when a bare genus is a disambiguation page", async () => {
    vi.mocked(fetchWikipediaSummary)
      .mockResolvedValueOnce({
        status: "found",
        summary: { ...found("Rosa", "Rosa or De Rosa may refer to:").summary, type: "disambiguation" },
      })
      .mockResolvedValueOnce(found("Rose", "A rose is a woody perennial flowering plant of the genus Rosa."));
    mockModel([candidate({ genus: "Rosa", species: null })]);

    expect((await lookupPlantByName("Rosa")).outcome.kind).toBe("resolved");
    expect(fetchWikipediaSummary).toHaveBeenLastCalledWith("Rosa (plant)", expect.anything());
  });
});

describe("lookupPlantByName — failures never fail the item", () => {
  it("a summary error still resolves, with no summary", async () => {
    mockModel([candidate()], new Error("overloaded"));
    const { outcome } = await lookupPlantByName("Echinacea purpurea");
    expect(outcome).toMatchObject({ kind: "resolved", details: { summary: null, image: { url: expect.any(String) } } });
  });

  it("an unparseable summary reply leaves the summary blank", async () => {
    mockModel([candidate()], { summary: null, summary_scope: null });
    const { outcome } = await lookupPlantByName("Echinacea purpurea");
    expect(outcome).toMatchObject({ kind: "resolved", details: { summary: null } });
  });

  it("when Wikipedia can't be reached, a model-high stays high but gets no image", async () => {
    vi.mocked(fetchWikipediaSummary).mockResolvedValue({ status: "error" });
    mockModel([candidate()]);
    const { outcome } = await lookupPlantByName("Echinacea purpurea");
    expect(outcome).toMatchObject({ kind: "resolved", candidate: { verification: "unknown" }, details: { image: null } });
  });

  it("a page with no thumbnail resolves without an image", async () => {
    vi.mocked(fetchWikipediaSummary).mockResolvedValue(found("Echinacea purpurea", "Echinacea purpurea is a species of plant.", false));
    mockModel([candidate()]);
    expect((await lookupPlantByName("Echinacea purpurea")).outcome).toMatchObject({ kind: "resolved", details: { image: null } });
  });

  it("a resolver error is the one thing that throws", async () => {
    create.mockRejectedValue(new Error("timeout"));
    await expect(lookupPlantByName("Echinacea purpurea")).rejects.toThrow("timeout");
  });
});

describe("lookupPlantByName — medium confidence", () => {
  it("offers a cultivar as a suggestion, never a confident match, and writes no summary", async () => {
    vi.mocked(fetchWikipediaSummary).mockResolvedValue(found("Salvia nemorosa", "Salvia nemorosa is a species of flowering plant."));
    mockModel([candidate({ genus: "Salvia", species: "nemorosa", cultivar: "Caradonna" })]);

    const { outcome } = await lookupPlantByName("sal via car a dona");
    expect(outcome).toMatchObject({
      kind: "suggest",
      candidates: [{ cultivar: "Caradonna", confidence: "high", final_confidence: "medium" }],
    });
    expect(summaryCalls()).toHaveLength(0);
  });

  it("offers a model-high name with no Wikipedia page as a suggestion", async () => {
    vi.mocked(fetchWikipediaSummary).mockResolvedValue({ status: "missing" });
    mockModel([candidate({ genus: "Ypsilandra", species: "thibetica" })]);
    expect((await lookupPlantByName("Ypsilandra thibetica")).outcome.kind).toBe("suggest");
  });

  it("offers a partial match as a suggestion, keeping the gardener's unmatched words", async () => {
    mockModel([candidate({ confidence: "medium", unmatched_text: "Midnight Thunderclap" })]);
    const { outcome } = await lookupPlantByName("Echinacea purpurea Midnight Thunderclap");
    expect(outcome).toMatchObject({
      kind: "suggest",
      candidates: [{ cultivar: null, unmatched_text: "Midnight Thunderclap", final_confidence: "medium" }],
    });
  });

  it("treats two confident answers as an ambiguity", async () => {
    vi.mocked(fetchWikipediaSummary).mockImplementation(async (title) =>
      found(title, `${title} is a genus of flowering plants.`)
    );
    mockModel([candidate({ genus: "Geranium", species: null }), candidate({ genus: "Pelargonium", species: null })]);
    const { outcome } = await lookupPlantByName("geranium");
    expect(outcome.kind).toBe("suggest");
    expect(outcome.kind === "suggest" && outcome.candidates).toHaveLength(2);
  });

  it("leaves low candidates out of the suggestions", async () => {
    mockModel([candidate({ confidence: "medium", unmatched_text: "red" }), candidate({ genus: "Salvia", species: "coccinea", confidence: "low" })]);
    const { outcome } = await lookupPlantByName("that red salvia");
    expect(outcome.kind === "suggest" && outcome.candidates).toHaveLength(1);
  });
});

describe("lookupPlantByName — low and none", () => {
  it("only guesses: 'low', with no Wikipedia or summary calls", async () => {
    mockModel([candidate({ confidence: "low" })]);
    const { outcome } = await lookupPlantByName("secular area bu colour");
    expect(outcome).toEqual({ kind: "low" });
    expect(fetchWikipediaSummary).not.toHaveBeenCalled();
    expect(summaryCalls()).toHaveLength(0);
  });

  it("no candidates: 'none'", async () => {
    mockModel([]);
    expect((await lookupPlantByName("remember to buy milk")).outcome).toEqual({ kind: "none" });
  });

  it("near-empty text: 'none' without calling the model at all", async () => {
    expect((await lookupPlantByName("??")).outcome).toEqual({ kind: "none" });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("describeCandidate", () => {
  it("returns a summary and image for an accepted suggestion, from its species page", async () => {
    vi.mocked(fetchWikipediaSummary).mockResolvedValue(found("Salvia nemorosa", "Salvia nemorosa is a species of flowering plant."));
    mockModel([], { summary: "Violet spikes on dark stems.", summary_scope: "cultivar" });

    const details = await describeCandidate({
      genus: "Salvia", species: "nemorosa", cultivar: "Caradonna", common_names: [], confidence: "high",
      growth_type: "perennial", partial_match: false, unmatched_text: null,
    });
    expect(details).toEqual({
      summary: { summary: "Violet spikes on dark stems.", summary_scope: "cultivar" },
      image: { url: "https://upload.wikimedia.org/x.jpg", attribution: "https://en.wikipedia.org/wiki/Salvia nemorosa" },
    });
  });

  it("never throws: no page and a failed summary give nulls", async () => {
    vi.mocked(fetchWikipediaSummary).mockRejectedValue(new Error("network"));
    mockModel([], new Error("overloaded"));
    const details = await describeCandidate({
      genus: "Salvia", species: "nemorosa", cultivar: null, common_names: [], confidence: "high",
      growth_type: null, partial_match: false, unmatched_text: null,
    });
    expect(details).toEqual({ summary: null, image: null });
  });
});
