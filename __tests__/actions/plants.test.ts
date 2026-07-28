import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PlantInsert } from "@/lib/types";
import type { LookupResult } from "@/lib/plant-lookup";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn((cb: () => void) => cb()) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/plant-lookup", () => ({ performLookup: vi.fn() }));
vi.mock("@/lib/species-reference-enrichment", () => ({ enrichSpeciesReference: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { performLookup } from "@/lib/plant-lookup";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";
import { updatePlantField, upsertPlant } from "@/app/actions/plants";

// A minimal valid plant that passes sanitization and validation
const BASE_PLANT: PlantInsert = {
  genus: "Rosa",
  species: "canina",
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

const BASE_LOOKUP: LookupResult = {
  common_names: [],
  sun_needs: null,
  flowering_season_from: null,
  flowering_season_to: null,
  eventual_height_cm: null,
  eventual_spread_cm: null,
  corrected_species: null,
  corrected_cultivar: null,
};

// Builds a supabase client mock sufficient for updatePlantField:
// auth.getUser returns a user; from("plants").update().eq().eq() resolves cleanly.
function setupBasicSupabase() {
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
    from: vi.fn().mockReturnValue({ update: mockUpdate }),
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

// Builds a supabase client mock sufficient for the upsertPlant AI-lookup path.
// Returns a ref so tests can inspect what was written in the AI update call.
function setupAISupabase(): { capturedAIUpdate: () => Record<string, unknown> | null } {
  let captured: Record<string, unknown> | null = null;

  const plantsTable = {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "new-plant-id" }, error: null }),
      }),
    }),
    update: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
      captured = updates;
      return { eq: vi.fn().mockResolvedValue({ error: null }) };
    }),
  };

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
    from: vi.fn().mockReturnValue(plantsTable),
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { capturedAIUpdate: () => captured };
}

// Builds a supabase client mock that also captures the initial insert payload
// (not just the follow-up AI-lookup update), for asserting on computed fields
// like identification_status.
function setupInsertCapture(): { capturedInsert: () => Record<string, unknown> | null } {
  let captured: Record<string, unknown> | null = null;

  const plantsTable = {
    insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      captured = payload;
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "new-plant-id" }, error: null }),
        }),
      };
    }),
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  };

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
    from: vi.fn().mockReturnValue(plantsTable),
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { capturedInsert: () => captured };
}

// ─── updatePlantField ─────────────────────────────────────────────────────────

describe("updatePlantField", () => {
  describe("notes length limits", () => {
    it("accepts exactly 5000 characters", async () => {
      setupBasicSupabase();
      const result = await updatePlantField("plant-1", {
        notes: "a".repeat(5000),
      });
      expect(result).toBeUndefined();
    });

    it("rejects 5001 characters", async () => {
      setupBasicSupabase();
      const result = await updatePlantField("plant-1", {
        notes: "a".repeat(5001),
      });
      expect(result).toEqual({ error: expect.stringContaining("5000") });
    });
  });
});

// ─── upsertPlant – AI lookup validation ──────────────────────────────────────

describe("upsertPlant – AI lookup validation", () => {
  let capturedAIUpdate: () => Record<string, unknown> | null;

  beforeEach(() => {
    ({ capturedAIUpdate } = setupAISupabase());
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP });
  });

  describe("sun_needs", () => {
    it("does not write an invalid value to DB", async () => {
      vi.mocked(performLookup).mockResolvedValue({
        ...BASE_LOOKUP,
        sun_needs: "full moonlight",
      });
      await upsertPlant(null, BASE_PLANT);
      expect(capturedAIUpdate()).not.toHaveProperty("sun_needs");
    });

    it("writes a valid value to DB", async () => {
      vi.mocked(performLookup).mockResolvedValue({
        ...BASE_LOOKUP,
        sun_needs: "full sun",
      });
      await upsertPlant(null, BASE_PLANT);
      expect(capturedAIUpdate()).toMatchObject({ sun_needs: "full sun" });
    });
  });

  describe("flowering_season_from", () => {
    it("excludes out-of-range value 13", async () => {
      vi.mocked(performLookup).mockResolvedValue({
        ...BASE_LOOKUP,
        flowering_season_from: 13,
      });
      await upsertPlant(null, BASE_PLANT);
      expect(capturedAIUpdate()).not.toHaveProperty("flowering_season_from");
    });

    it("includes valid value 6", async () => {
      vi.mocked(performLookup).mockResolvedValue({
        ...BASE_LOOKUP,
        flowering_season_from: 6,
      });
      await upsertPlant(null, BASE_PLANT);
      expect(capturedAIUpdate()).toMatchObject({ flowering_season_from: 6 });
    });
  });

  describe("eventual_height_cm", () => {
    it("excludes negative value -5", async () => {
      vi.mocked(performLookup).mockResolvedValue({
        ...BASE_LOOKUP,
        eventual_height_cm: -5,
      });
      await upsertPlant(null, BASE_PLANT);
      expect(capturedAIUpdate()).not.toHaveProperty("eventual_height_cm");
    });

    it("includes valid value 100", async () => {
      vi.mocked(performLookup).mockResolvedValue({
        ...BASE_LOOKUP,
        eventual_height_cm: 100,
      });
      await upsertPlant(null, BASE_PLANT);
      expect(capturedAIUpdate()).toMatchObject({ eventual_height_cm: 100 });
    });
  });
});

// ─── upsertPlant – identification_status computation ─────────────────────────

describe("upsertPlant – identification_status", () => {
  beforeEach(() => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP });
    vi.mocked(enrichSpeciesReference).mockClear();
  });

  it("computes 'identified' for a normal species submission", async () => {
    const { capturedInsert } = setupInsertCapture();
    await upsertPlant(null, BASE_PLANT); // genus "Rosa", species "canina"
    expect(capturedInsert()).toMatchObject({ identification_status: "identified" });
  });

  it("computes 'identified' for a genus-only submission (the genus-fallback case)", async () => {
    const { capturedInsert } = setupInsertCapture();
    await upsertPlant(null, { ...BASE_PLANT, genus: "Thymus", species: null });
    expect(capturedInsert()).toMatchObject({ identification_status: "identified" });
  });

  it("computes 'unidentified' when neither genus nor species is set, given a photo", async () => {
    const { capturedInsert } = setupInsertCapture();
    await upsertPlant(null, {
      ...BASE_PLANT,
      genus: "",
      species: null,
      photo_url: "https://example.supabase.co/storage/v1/object/public/plant-photos/x.jpg",
    });
    expect(capturedInsert()).toMatchObject({ identification_status: "unidentified" });
  });

  it("rejects neither genus nor species with no photo, rather than silently saving unidentified", async () => {
    setupInsertCapture();
    const result = await upsertPlant(null, { ...BASE_PLANT, genus: "", species: null, photo_url: null });
    expect(result).toMatchObject({ fieldErrors: { species: expect.any(String) } });
  });

  it("still triggers enrichment for a genus-only save", async () => {
    setupInsertCapture();
    await upsertPlant(null, { ...BASE_PLANT, genus: "Thymus", species: null });
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Thymus", null, null);
  });

  it("does not trigger enrichment for a fully unidentified save — nothing to describe", async () => {
    setupInsertCapture();
    await upsertPlant(null, {
      ...BASE_PLANT,
      genus: "",
      species: null,
      photo_url: "https://example.supabase.co/storage/v1/object/public/plant-photos/x.jpg",
    });
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
  });
});

// ─── upsertPlant – fromIdentification trust boundary ─────────────────────────

describe("upsertPlant – fromIdentification trust boundary", () => {
  let capturedAIUpdate: () => Record<string, unknown> | null;

  beforeEach(() => {
    ({ capturedAIUpdate } = setupAISupabase());
  });

  it("passes genus through to performLookup (the actual bug fix)", async () => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP });
    await upsertPlant(null, BASE_PLANT); // genus "Rosa", species "canina"
    expect(performLookup).toHaveBeenCalledWith("Rosa", "canina", null);
  });

  it("identification-sourced save: does not let a spelling correction overwrite the species", async () => {
    // The exact live failure: Digitalis thapsi (correct, Pl@ntNet-supplied)
    // "corrected" to thapsus (Verbascum thapsus — a different plant).
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "thapsus",
    });
    await upsertPlant(
      null,
      { ...BASE_PLANT, genus: "Digitalis", species: "thapsi", common_names: ["Spanish foxglove"] },
      { fromIdentification: true }
    );
    expect(capturedAIUpdate()).not.toHaveProperty("species");
  });

  it("identification-sourced save: does not let AI common names overwrite the provider's", async () => {
    // The exact live failure: Pl@ntNet's real
    // ["Mother of thyme","Creeping thyme","Wild thyme"] clobbered by
    // enrichment's hallucinated ["Winter jasmine"].
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      common_names: ["Winter jasmine"],
    });
    await upsertPlant(
      null,
      {
        ...BASE_PLANT,
        genus: "Thymus",
        species: "praecox",
        common_names: ["Mother of thyme", "Creeping thyme", "Wild thyme"],
      },
      { fromIdentification: true }
    );
    expect(capturedAIUpdate()).not.toHaveProperty("common_names");
  });

  it("manual entry (no fromIdentification): correction and common names still apply as before", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "canina",
      common_names: ["Dog rose"],
    });
    await upsertPlant(null, { ...BASE_PLANT, species: "canna" });
    expect(capturedAIUpdate()).toMatchObject({ species: "canina", common_names: ["Dog rose"] });
  });
});

// ─── upsertPlant – species_source persistence ────────────────────────────────

describe("upsertPlant – species_source", () => {
  beforeEach(() => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP });
  });

  it("persists 'identification' when fromIdentification is true", async () => {
    const { capturedInsert } = setupInsertCapture();
    await upsertPlant(null, BASE_PLANT, { fromIdentification: true });
    expect(capturedInsert()).toMatchObject({ species_source: "identification" });
  });

  it("persists 'manual' when fromIdentification is not set", async () => {
    const { capturedInsert } = setupInsertCapture();
    await upsertPlant(null, BASE_PLANT);
    expect(capturedInsert()).toMatchObject({ species_source: "manual" });
  });

  it("persists 'manual' when fromIdentification is explicitly false", async () => {
    const { capturedInsert } = setupInsertCapture();
    await upsertPlant(null, BASE_PLANT, { fromIdentification: false });
    expect(capturedInsert()).toMatchObject({ species_source: "manual" });
  });
});
