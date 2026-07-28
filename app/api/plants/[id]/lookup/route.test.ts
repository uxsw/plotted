import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/plant-lookup", () => ({ performLookup: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { performLookup } from "@/lib/plant-lookup";
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
