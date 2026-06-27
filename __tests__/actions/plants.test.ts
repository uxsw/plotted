import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PlantInsert } from "@/lib/types";
import type { LookupResult } from "@/lib/plant-lookup";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/plant-lookup", () => ({ performLookup: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { performLookup } from "@/lib/plant-lookup";
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
  purchased_from: null,
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
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "user_flags") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { ai_lookup_enabled: true } }),
            }),
          }),
        };
      }
      return plantsTable;
    }),
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { capturedAIUpdate: () => captured };
}

// ─── updatePlantField ─────────────────────────────────────────────────────────

describe("updatePlantField", () => {
  describe("purchased_from length limits", () => {
    it("accepts exactly 500 characters", async () => {
      setupBasicSupabase();
      const result = await updatePlantField("plant-1", {
        purchased_from: "a".repeat(500),
      });
      expect(result).toBeUndefined();
    });

    it("rejects 501 characters", async () => {
      setupBasicSupabase();
      const result = await updatePlantField("plant-1", {
        purchased_from: "a".repeat(501),
      });
      expect(result).toEqual({ error: expect.stringContaining("500") });
    });
  });

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
      expect(capturedAIUpdate()).toBeNull();
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
      expect(capturedAIUpdate()).toBeNull();
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
      expect(capturedAIUpdate()).toBeNull();
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
