import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/plant-lookup", () => ({ performLookup: vi.fn() }));
vi.mock("@/lib/species-reference-enrichment", () => ({ enrichSpeciesReference: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// after() needs a request scope; run its callback inline, as the action tests do.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn((cb: () => unknown) => cb()),
}));

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { performLookup } from "@/lib/plant-lookup";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";
import { POST } from "./route";
import type { LookupResult } from "@/lib/plant-lookup";

const BASE_LOOKUP: LookupResult = {
  common_names: [],
  sun_needs: null,
  flowering_season_from: null,
  flowering_season_to: null,
  eventual_height_cm: null,
  eventual_spread_cm: null,
  corrected_species: null,
  corrected_cultivar: null,
  resolved_name: null,
};

// Mocks the exact chain the route calls: .from("plants").select(...).eq().eq().eq().single()
// for the read, and .from("plants").update(...).eq().eq() for the write. Captures
// the update payload so tests can assert on what was actually persisted.
function setupSupabase(plantRow: Record<string, unknown>) {
  let capturedUpdate: Record<string, unknown> | null = null;

  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: plantRow }),
            }),
          }),
        }),
      }),
      update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        capturedUpdate = payload;
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }),
    }),
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { capturedUpdate: () => capturedUpdate };
}

function callRoute() {
  return POST({} as NextRequest, { params: Promise.resolve({ id: "plant-1" }) });
}

describe("POST /api/plants/[id]/lookup — species_source gate", () => {
  beforeEach(() => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP });
  });

  it("passes genus through to performLookup", async () => {
    setupSupabase({
      genus: "Thymus",
      species: "praecox",
      cultivar: null,
      common_names: [],
      species_source: null,
    });
    await callRoute();
    expect(performLookup).toHaveBeenCalledWith("Thymus", "praecox", null);
  });

  it("identification-sourced plant: retry does not let corrected_species overwrite the species", async () => {
    // The exact regression this closes: a photo-identified plant hitting
    // the retry route (lookup_status = 'error' → user clicks Retry) used to
    // get the full, uncritical correction/overwrite treatment again.
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "thapsus",
    });
    const { capturedUpdate } = setupSupabase({
      genus: "Digitalis",
      species: "thapsi",
      cultivar: null,
      common_names: ["Spanish foxglove"],
      species_source: "identification",
    });
    await callRoute();
    expect(capturedUpdate()).not.toHaveProperty("species");
  });

  it("identification-sourced plant: retry does not let AI common names overwrite the provider's", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      common_names: ["Winter jasmine"],
    });
    const { capturedUpdate } = setupSupabase({
      genus: "Thymus",
      species: "praecox",
      cultivar: null,
      common_names: ["Mother of thyme", "Creeping thyme", "Wild thyme"],
      species_source: "identification",
    });
    await callRoute();
    expect(capturedUpdate()).not.toHaveProperty("common_names");
  });

  it("manually-entered plant (species_source: 'manual'): retry keeps full correction/overwrite behaviour", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "canina",
      common_names: ["Dog rose"],
    });
    const { capturedUpdate } = setupSupabase({
      genus: "Rosa",
      species: "canna",
      cultivar: null,
      common_names: [],
      species_source: "manual",
    });
    await callRoute();
    expect(capturedUpdate()).toMatchObject({ species: "canina", common_names: ["Dog rose"] });
  });

  it("scopes both the read and the write to the requesting user (defense-in-depth alongside RLS)", async () => {
    const selectEq = vi.fn().mockReturnThis();
    const updateEq = vi.fn().mockReturnThis();
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: selectEq,
          single: vi.fn().mockResolvedValue({
            data: {
              genus: "Thymus",
              species: "praecox",
              cultivar: null,
              common_names: [],
              species_source: null,
            },
          }),
        }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await callRoute();

    expect(selectEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(updateEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("existing row with species_source: null behaves exactly like 'manual' — no regression", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "canina",
      common_names: ["Dog rose"],
    });
    const { capturedUpdate } = setupSupabase({
      genus: "Rosa",
      species: "canna",
      cultivar: null,
      common_names: [],
      species_source: null,
    });
    await callRoute();
    expect(capturedUpdate()).toMatchObject({ species: "canina", common_names: ["Dog rose"] });
  });
});

// ─── enrichment after a retry ────────────────────────────────────────────────
//
// The retry used to apply a correction and stop: the plant ended up corrected
// with no frost data, or with frost data under the pre-correction key.
describe("POST /api/plants/[id]/lookup — species_reference enrichment", () => {
  beforeEach(() => {
    vi.mocked(enrichSpeciesReference).mockReset();
    vi.mocked(after).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  const plant = (overrides: Record<string, unknown>) => ({
    genus: "Rosa",
    species: "canna",
    cultivar: null,
    common_names: [],
    species_source: "manual",
    ...overrides,
  });

  it("enriches once, with the post-correction values, then revalidates the plant", async () => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP, corrected_species: "canina" });
    setupSupabase(plant({}));
    await callRoute();
    await Promise.resolve();

    expect(enrichSpeciesReference).toHaveBeenCalledTimes(1);
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Rosa", "canina", null);
    expect(revalidatePath).toHaveBeenCalledWith("/plants/plant-1");
  });

  it("enriches a successful retry even when nothing was corrected", async () => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP });
    setupSupabase(plant({ species: "canina" }));
    await callRoute();

    expect(enrichSpeciesReference).toHaveBeenCalledWith("Rosa", "canina", null);
  });

  it("with a genus present, never moves the genus into species or cultivar", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "verbena bonariensis",
      corrected_cultivar: "Verbena Lollipop",
    });
    const { capturedUpdate } = setupSupabase(plant({ genus: "Verbena", species: "bonarensis", cultivar: "Lolipop" }));
    await callRoute();

    expect(capturedUpdate()).toMatchObject({ species: "bonariensis" });
    expect(capturedUpdate()).not.toHaveProperty("cultivar");
    expect(capturedUpdate()).not.toHaveProperty("genus");
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Verbena", "bonariensis", "Lolipop");
  });

  it("blank genus the lookup resolves: writes the genus and enriches under the resolved key", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      resolved_name: { genus: "Allium", species: "sphaerocephalon", cultivar: null, confidence: "high", kind: "latin" },
    });
    const { capturedUpdate } = setupSupabase(plant({ genus: "", species: "allium", cultivar: "Spherocephalon" }));
    const response = await callRoute();

    expect(capturedUpdate()).toMatchObject({ genus: "Allium", species: "sphaerocephalon", cultivar: null });
    expect(enrichSpeciesReference).toHaveBeenCalledTimes(1);
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Allium", "sphaerocephalon", null);
    const body = await response.json();
    expect(body).toMatchObject({ genus: "Allium", species: "sphaerocephalon", cultivar: null });
    expect(body).not.toHaveProperty("resolved_name");
  });

  it("blank genus the lookup cannot resolve: respects the guard — no enrichment, no after()", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "officinalis",
      resolved_name: { genus: "Salvia", species: "officinalis", cultivar: null, confidence: "low", kind: "latin" },
    });
    const { capturedUpdate } = setupSupabase(plant({ genus: "", species: "oficinalis" }));
    await callRoute();

    expect(capturedUpdate()).not.toHaveProperty("genus");
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("photo-identified plant: enriches under the identified name, ignoring any resolved one", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "thapsus",
      resolved_name: { genus: "Verbascum", species: "thapsus", cultivar: null, confidence: "high", kind: "latin" },
    });
    setupSupabase(plant({ genus: "Digitalis", species: "thapsi", species_source: "identification" }));
    await callRoute();

    expect(enrichSpeciesReference).toHaveBeenCalledWith("Digitalis", "thapsi", null);
  });

  it("a failed lookup enriches nothing", async () => {
    vi.mocked(performLookup).mockRejectedValue(new Error("boom"));
    setupSupabase(plant({}));
    const response = await callRoute();

    expect(response.status).toBe(500);
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
  });
});
