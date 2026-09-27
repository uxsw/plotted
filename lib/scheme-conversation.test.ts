import { describe, it, expect } from "vitest";
import {
  buildConversationContext,
  buildConversationPrompt,
  CONVERSATION_RESPONSE_SCHEMA,
  CONVERSATION_SYSTEM_PROMPT,
  ConversationResponseError,
  INITIAL_SUGGESTIONS_ENTRY_ID,
  mergeConversationResponse,
  parseConversationTurn,
  resolveDirectionChoice,
  SOMETHING_ELSE_OPTION,
  speciesKey,
} from "./scheme-conversation";
import type { GardenPlantRow } from "./scheme-selection";
import type {
  ChatEntry,
  PersistedDraftState,
  SchemePlant,
} from "@/app/(app)/plant-scheme/_components/PlantSchemeContext";

function schemePlant(over: Partial<SchemePlant>): SchemePlant {
  return {
    id: "x",
    origin: "suggestion",
    sourceEntryId: "entry-1",
    plantId: "p1",
    commonName: "Foxglove",
    latinName: "Digitalis purpurea",
    tier: "back",
    note: "Tall spires for shade.",
    badges: [],
    months: [5, 6, 7],
    photoUrl: null,
    addedToShoppingList: false,
    ...over,
  };
}

const GARDEN_ROW: GardenPlantRow = {
  id: "plant-1",
  genus: "Geranium",
  species: "macrorrhizum",
  cultivar: null,
  common_names: ["Bigroot geranium"],
  sun_needs: "partial shade",
  flowering_season_from: 11,
  flowering_season_to: 2,
  eventual_height_cm: 35,
};

function state(over: Partial<PersistedDraftState> = {}): Partial<PersistedDraftState> {
  return {
    selectedGardenPlants: [],
    freeTextPlants: [],
    questionIndex: 4,
    outcomes: [
      { questionId: "aspect", type: "answered", answer: "Partial shade" },
      { questionId: "soil", type: "skipped" },
      { questionId: "intent", type: "answered", answer: "Pollinators" },
    ],
    quickAnswered: false,
    finished: true,
    transcript: [],
    schemePlants: [],
    ...over,
  };
}

let idCounter = 0;
const mkId = (prefix: string) => `${prefix}-${++idCounter}`;

function rawPlant(over: Record<string, unknown> = {}) {
  return {
    common_name: "Knautia",
    latin_name: "Knautia macedonica",
    tier: "mid",
    note: "Pincushion flowers all summer.",
    badges: ["Pollinators"],
    flowering_months: [6, 7, 8],
    match_note: "",
    ...over,
  };
}

function rawResponse(over: Record<string, unknown> = {}) {
  return {
    reply: "Here are some more.",
    response_type: "suggestions",
    suggestions_title: "Shade lovers",
    plants: [rawPlant()],
    direction_options: [],
    ...over,
  };
}

describe("speciesKey", () => {
  it("reduces to genus + species epithet, lowercased", () => {
    expect(speciesKey("Salvia nemorosa")).toBe("salvia nemorosa");
    expect(speciesKey("Salvia nemorosa 'Caradonna'")).toBe("salvia nemorosa");
    expect(speciesKey("Salvia nemorosa ‘Caradonna’")).toBe("salvia nemorosa");
  });

  it("keeps different species of one genus distinct", () => {
    expect(speciesKey("Salvia yangii")).not.toBe(speciesKey("Salvia nemorosa"));
  });

  it("treats a capitalised second word as a cultivar, not an epithet", () => {
    expect(speciesKey("Geum 'Mrs Bradshaw'")).toBe("geum");
    expect(speciesKey("Rosa Munstead Wood")).toBe("rosa");
  });

  it("handles an apostrophe inside a cultivar name", () => {
    expect(speciesKey("Helenium 'Sahin's Early Flowerer'")).toBe("helenium");
    expect(speciesKey("Helenium ‘Sahin’s Early Flowerer’")).toBe("helenium");
    expect(speciesKey("Erysimum 'Bowles's Mauve'")).toBe("erysimum");
    expect(speciesKey("Rosa 'Gertrude Jekyll's Rose'")).toBe("rosa");
    expect(speciesKey("Salvia nemorosa 'Sahin's Early'")).toBe("salvia nemorosa");
  });

  it("drops hybrid markers and infraspecific ranks", () => {
    expect(speciesKey("Salvia × sylvestris")).toBe("salvia sylvestris");
    expect(speciesKey("Echinacea var. alba")).toBe("echinacea");
  });
});

describe("parseConversationTurn", () => {
  it("accepts the three turn kinds", () => {
    expect(parseConversationTurn({ kind: "initial" })).toEqual({ kind: "initial" });
    expect(parseConversationTurn({ kind: "message", text: "  more please " })).toEqual({
      kind: "message",
      text: "more please",
    });
    expect(parseConversationTurn({ kind: "direction", directionsEntryId: "d", optionId: "opt-1" })).toEqual({
      kind: "direction",
      directionsEntryId: "d",
      optionId: "opt-1",
    });
  });

  it("rejects anything else", () => {
    expect(parseConversationTurn(null)).toBeNull();
    expect(parseConversationTurn({ kind: "message", text: "   " })).toBeNull();
    expect(parseConversationTurn({ kind: "direction", optionId: "x" })).toBeNull();
    expect(parseConversationTurn({ kind: "regenerate" })).toBeNull();
  });
});

describe("buildConversationContext", () => {
  it("separates answered from skipped questions", () => {
    const ctx = buildConversationContext(state(), []);
    expect(ctx.answers).toEqual([
      { label: "Aspect and sun", answer: "Partial shade" },
      { label: "What they want the planting to add", answer: "Pollinators" },
    ]);
    expect(ctx.skipped).toEqual(["Soil"]);
  });

  it("enriches garden-origin list plants from their rows", () => {
    const ctx = buildConversationContext(
      state({
        schemePlants: [
          schemePlant({ origin: "garden", plantId: "plant-1", commonName: "Bigroot geranium", latinName: "Geranium macrorrhizum", tier: null, months: [] }),
        ],
      }),
      [GARDEN_ROW]
    );
    expect(ctx.listPlants[0]).toMatchObject({
      origin: "garden",
      sunNeeds: "partial shade",
      heightCm: 35,
      months: [11, 12, 1, 2],
    });
  });

  it("builds the avoid-list from the list and every plant already shown", () => {
    const transcript: ChatEntry[] = [
      {
        kind: "suggestions",
        id: "e1",
        title: "t",
        plants: [
          { plantId: "p1", commonName: "Foxglove", latinName: "Digitalis purpurea", tier: "back", note: "", badges: [], months: [] },
          { plantId: "p2", commonName: "Lungwort", latinName: "Pulmonaria officinalis", tier: "ground", note: "", badges: [], months: [] },
        ],
      },
    ];
    const ctx = buildConversationContext(
      state({ transcript, schemePlants: [schemePlant({ latinName: "Digitalis purpurea 'Alba'" })] }),
      []
    );
    expect(ctx.avoidKeys).toEqual(new Set(["digitalis purpurea", "pulmonaria officinalis"]));
    // On the list → not also listed as "previously suggested".
    expect(ctx.previouslySuggested).toEqual([{ commonName: "Lungwort", latinName: "Pulmonaria officinalis" }]);
  });

  it("compacts the transcript into short lines rather than raw entries", () => {
    const transcript: ChatEntry[] = [
      { kind: "text", id: "t1", role: "user", text: "x".repeat(1000) },
      {
        kind: "directions",
        id: "d1",
        title: "Which direction?",
        options: [
          { id: "opt-1", label: "Woodland edge", blurb: "" },
          { id: "opt-2", label: "Cottage", blurb: "" },
          SOMETHING_ELSE_OPTION,
        ],
        chosenOptionId: "opt-2",
      },
    ];
    const ctx = buildConversationContext(state({ transcript }), []);
    expect(ctx.exchange[0].text.length).toBeLessThanOrEqual(300);
    expect(ctx.exchange[1].text).toBe('[Offered directions: Woodland edge; Cottage — they chose "Cottage"]');
  });

  it("tolerates malformed client state", () => {
    const ctx = buildConversationContext(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { outcomes: "nope", schemePlants: [null, { commonName: 3 }], transcript: [null, 7], freeTextPlants: [1] } as any,
      []
    );
    expect(ctx.answers).toEqual([]);
    expect(ctx.listPlants).toEqual([]);
    expect(ctx.exchange).toEqual([]);
    expect(ctx.typedPlants).toEqual([]);
  });
});

describe("resolveDirectionChoice", () => {
  const transcript: ChatEntry[] = [
    {
      kind: "directions",
      id: "d1",
      title: "Which direction?",
      options: [
        { id: "opt-1", label: "Woodland edge", blurb: "Dappled and loose." },
        { id: "opt-2", label: "Cottage", blurb: "Informal and full." },
        SOMETHING_ELSE_OPTION,
      ],
    },
  ];

  it("finds the chosen option and the ones passed over", () => {
    const res = resolveDirectionChoice(state({ transcript }), { kind: "direction", directionsEntryId: "d1", optionId: "opt-2" });
    expect(res?.chosen.label).toBe("Cottage");
    expect(res?.others.map((o) => o.label)).toEqual(["Woodland edge"]);
  });

  it("is null for unknown panels/options and for the local-only 'something else'", () => {
    const s = state({ transcript });
    expect(resolveDirectionChoice(s, { kind: "direction", directionsEntryId: "nope", optionId: "opt-1" })).toBeNull();
    expect(resolveDirectionChoice(s, { kind: "direction", directionsEntryId: "d1", optionId: "opt-9" })).toBeNull();
    expect(
      resolveDirectionChoice(s, { kind: "direction", directionsEntryId: "d1", optionId: SOMETHING_ELSE_OPTION.id })
    ).toBeNull();
  });
});

describe("buildConversationPrompt", () => {
  it("wraps context as information and puts the new message in its own tag", () => {
    const ctx = buildConversationContext(state(), []);
    const prompt = buildConversationPrompt(ctx, { kind: "message", text: "Anything scented?" });
    expect(prompt).toContain("<gardener_context>");
    expect(prompt).toContain("Skipped (don't assume): Soil");
    expect(prompt).toContain("<latest_message>\nAnything scented?\n</latest_message>");
  });

  it("never mentions images — image availability must not steer recommendations", () => {
    const ctx = buildConversationContext(state(), []);
    expect(CONVERSATION_SYSTEM_PROMPT.toLowerCase()).not.toMatch(/image|photo|wikimedia|wikipedia/);
    for (const turn of [{ kind: "initial" } as const, { kind: "message", text: "hi" } as const]) {
      expect(buildConversationPrompt(ctx, turn).toLowerCase()).not.toMatch(/image|photo|wikimedia|wikipedia/);
    }
  });

  it("steers a direction turn with the chosen option", () => {
    const ctx = buildConversationContext(state(), []);
    const prompt = buildConversationPrompt(ctx, { kind: "direction", directionsEntryId: "d1", optionId: "opt-2" }, {
      chosen: { id: "opt-2", label: "Cottage", blurb: "Informal and full." },
      others: [{ id: "opt-1", label: "Woodland edge", blurb: "" }],
    });
    expect(prompt).toContain('They chose the direction "Cottage"');
    expect(prompt).toContain('They passed over: "Woodland edge"');
  });
});

describe("CONVERSATION_RESPONSE_SCHEMA", () => {
  it("requires every property on every object (structured outputs requirement)", () => {
    const check = (node: Record<string, unknown>) => {
      if (node.type === "object") {
        expect(node.additionalProperties).toBe(false);
        expect([...(node.required as string[])].sort()).toEqual(Object.keys(node.properties as object).sort());
        for (const child of Object.values(node.properties as Record<string, Record<string, unknown>>)) check(child);
      }
      if (node.type === "array") check(node.items as Record<string, unknown>);
    };
    check(CONVERSATION_RESPONSE_SCHEMA as unknown as Record<string, unknown>);
  });
});

describe("mergeConversationResponse", () => {
  const ctx = () => buildConversationContext(state(), []);

  it("initial: a single suggestions entry with the fixed id, reply dropped", () => {
    const entries = mergeConversationResponse(
      rawResponse({ plants: [rawPlant(), rawPlant({ latin_name: "Digitalis purpurea", common_name: "Foxglove", tier: "back" })] }),
      ctx(),
      { kind: "initial" },
      mkId
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: "suggestions", id: INITIAL_SUGGESTIONS_ENTRY_ID, title: "Shade lovers" });
    const plants = (entries[0] as Extract<ChatEntry, { kind: "suggestions" }>).plants;
    expect(plants.map((p) => p.plantId)).toEqual(["p1", "p2"]);
  });

  it("initial: throws when no plants survive, so the client can retry", () => {
    expect(() =>
      mergeConversationResponse(rawResponse({ plants: [] }), ctx(), { kind: "initial" }, mkId)
    ).toThrow(ConversationResponseError);
  });

  it("drops plants already on the list, already shown, or repeated within the reply", () => {
    const c = buildConversationContext(
      state({
        schemePlants: [schemePlant({ latinName: "Digitalis purpurea" })],
        transcript: [
          {
            kind: "suggestions",
            id: "e1",
            title: "t",
            plants: [{ plantId: "p1", commonName: "Lungwort", latinName: "Pulmonaria officinalis", tier: "ground", note: "", badges: [], months: [] }],
          },
        ],
      }),
      []
    );
    const entries = mergeConversationResponse(
      rawResponse({
        plants: [
          rawPlant({ latin_name: "Digitalis purpurea 'Pam's Choice'" }),
          rawPlant({ latin_name: "Pulmonaria officinalis" }),
          rawPlant({ latin_name: "Knautia macedonica" }),
          rawPlant({ latin_name: "Knautia macedonica 'Mars Midget'" }),
        ],
      }),
      c,
      { kind: "message", text: "more" },
      mkId
    );
    const suggestions = entries.find((e) => e.kind === "suggestions") as Extract<ChatEntry, { kind: "suggestions" }>;
    expect(suggestions.plants.map((p) => p.latinName)).toEqual(["Knautia macedonica"]);
  });

  it("blocks a repeat whose cultivar name contains an apostrophe (Helenium regression)", () => {
    const c = buildConversationContext(
      state({
        transcript: [
          {
            kind: "suggestions",
            id: "e1",
            title: "t",
            plants: [{ plantId: "p1", commonName: "Helenium", latinName: "Helenium 'Moerheim Beauty'", tier: "mid", note: "", badges: [], months: [] }],
          },
        ],
      }),
      []
    );
    const entries = mergeConversationResponse(
      rawResponse({
        plants: [
          rawPlant({ common_name: "Sneezeweed", latin_name: "Helenium 'Sahin's Early Flowerer'" }),
          rawPlant({ common_name: "Globe thistle", latin_name: "Echinops ritro" }),
        ],
      }),
      c,
      { kind: "message", text: "more bee plants" },
      mkId
    );
    const suggestions = entries.find((e) => e.kind === "suggestions") as Extract<ChatEntry, { kind: "suggestions" }>;
    expect(suggestions.plants.map((p) => p.latinName)).toEqual(["Echinops ritro"]);
  });

  it("cleans months, keeps only known badges, and omits an empty match note", () => {
    const entries = mergeConversationResponse(
      rawResponse({
        plants: [rawPlant({ flowering_months: [8, 0, 13, 6, 6, 7.5], badges: ["Pollinators", "Magic", "Pollinators"], match_note: "  " })],
      }),
      ctx(),
      { kind: "message", text: "more" },
      mkId
    );
    const plant = (entries[1] as Extract<ChatEntry, { kind: "suggestions" }>).plants[0];
    expect(plant.months).toEqual([6, 8]);
    expect(plant.badges).toEqual(["Pollinators"]);
    expect("matchNote" in plant).toBe(false);
  });

  it("caps follow-up suggestions at 4", () => {
    const plants = ["Aa aa", "Bb bb", "Cc cc", "Dd dd", "Ee ee", "Ff ff"].map((latin_name) => rawPlant({ latin_name }));
    const entries = mergeConversationResponse(rawResponse({ plants }), ctx(), { kind: "message", text: "lots" }, mkId);
    expect((entries[1] as Extract<ChatEntry, { kind: "suggestions" }>).plants).toHaveLength(4);
  });

  it("message: degrades to text when every suggestion is filtered out", () => {
    const c = buildConversationContext(state({ schemePlants: [schemePlant({ latinName: "Knautia macedonica" })] }), []);
    const entries = mergeConversationResponse(rawResponse(), c, { kind: "message", text: "more" }, mkId);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: "text", role: "assistant", text: "Here are some more." });
  });

  it("direction: throws when every suggestion is filtered out", () => {
    const c = buildConversationContext(state({ schemePlants: [schemePlant({ latinName: "Knautia macedonica" })] }), []);
    expect(() =>
      mergeConversationResponse(rawResponse(), c, { kind: "direction", directionsEntryId: "d", optionId: "opt-1" }, mkId)
    ).toThrow(ConversationResponseError);
  });

  it("message: directions get 3 generated options plus the fixed 'something else'", () => {
    const entries = mergeConversationResponse(
      rawResponse({
        response_type: "directions",
        plants: [],
        direction_options: [
          { label: "Woodland edge", blurb: "a" },
          { label: "Cottage", blurb: "b" },
          { label: "Gravel garden", blurb: "c" },
          { label: "Tropical", blurb: "d" },
        ],
      }),
      ctx(),
      { kind: "message", text: "I want something different" },
      mkId
    );
    const panel = entries[1] as Extract<ChatEntry, { kind: "directions" }>;
    expect(panel.kind).toBe("directions");
    expect(panel.options.map((o) => o.id)).toEqual(["opt-1", "opt-2", "opt-3", SOMETHING_ELSE_OPTION.id]);
  });

  it("message: fewer than two usable directions degrades to text", () => {
    const entries = mergeConversationResponse(
      rawResponse({ response_type: "directions", plants: [], direction_options: [{ label: "Only one", blurb: "" }] }),
      ctx(),
      { kind: "message", text: "different" },
      mkId
    );
    expect(entries.map((e) => e.kind)).toEqual(["text"]);
  });

  it("message: a text response ignores any stray plants or options", () => {
    const entries = mergeConversationResponse(
      rawResponse({ response_type: "text", direction_options: [{ label: "A", blurb: "" }, { label: "B", blurb: "" }] }),
      ctx(),
      { kind: "message", text: "Is salvia hardy?" },
      mkId
    );
    expect(entries.map((e) => e.kind)).toEqual(["text"]);
  });

  it("throws on an unusable shape", () => {
    expect(() => mergeConversationResponse(null, ctx(), { kind: "message", text: "x" }, mkId)).toThrow(ConversationResponseError);
    expect(() =>
      mergeConversationResponse(rawResponse({ reply: "" }), ctx(), { kind: "message", text: "x" }, mkId)
    ).toThrow(ConversationResponseError);
  });
});
