import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LookupResult } from "@/lib/plant-lookup";
import type { PlantInsert } from "@/lib/types";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn((cb: () => void) => cb()) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/plant-lookup", () => ({ performLookup: vi.fn() }));
vi.mock("@/lib/species-reference-enrichment", () => ({ enrichSpeciesReference: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { performLookup } from "@/lib/plant-lookup";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";
import { after } from "next/server";
import { purchaseShoppingListItem } from "@/app/actions/shopping-list";
import { createPlantWithLookup } from "@/lib/plant-create";

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

// A scheme-sourced item: the full binomial lives in `species`, cultivar is
// always null (see app/api/shopping-list/route.ts).
const SCHEME_ITEM = {
  id: "item-1",
  user_id: "user-123",
  scheme_id: "scheme-1",
  species: "Verbena bonariensis",
  cultivar: null,
  common_names: ["Purpletop vervain"],
  thumbnail_url: "https://example.test/thumb.jpg",
  thumbnail_storage_path: "user-123/shopping-list/abc.jpg",
  wikimedia_attribution: "Jane Doe, CC BY-SA 4.0",
};

// Builds a supabase client mock for purchaseShoppingListItem: the item read
// and delete on shopping_list_items, the insert + lookup update on plants,
// and the storage copy/remove. Returns refs for inspecting what was written.
function setupPurchaseSupabase(
  item: Record<string, unknown> | null,
  opts: { insertError?: boolean } = {}
) {
  let plantInsert: Record<string, unknown> | null = null;
  const plantUpdates: Record<string, unknown>[] = [];

  const itemDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  });
  const itemsTable = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: item, error: null }),
        }),
      }),
    }),
    delete: itemDelete,
  };

  const plantsTable = {
    insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      plantInsert = payload;
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            opts.insertError
              ? { data: null, error: { message: "boom" } }
              : { data: { id: "new-plant-id" }, error: null }
          ),
        }),
      };
    }),
    update: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
      plantUpdates.push(updates);
      return { eq: vi.fn().mockResolvedValue({ error: null }) };
    }),
  };

  const bucket = {
    copy: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn((path: string) => ({
      data: { publicUrl: `https://storage.test/${path}` },
    })),
  };

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
    from: vi.fn((table: string) => (table === "plants" ? plantsTable : itemsTable)),
    storage: { from: vi.fn().mockReturnValue(bucket) },
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return {
    plantInsert: () => plantInsert,
    plantUpdates: () => plantUpdates,
    itemDelete,
    bucket,
  };
}

beforeEach(() => {
  vi.mocked(performLookup).mockReset().mockResolvedValue({ ...BASE_LOOKUP });
  vi.mocked(enrichSpeciesReference).mockReset().mockResolvedValue(undefined);
  vi.mocked(after).mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ─── purchase from a scheme item ──────────────────────────────────────────────

describe("purchaseShoppingListItem – scheme item", () => {
  it("splits the stored binomial into genus and species on insert", async () => {
    const db = setupPurchaseSupabase(SCHEME_ITEM);
    const result = await purchaseShoppingListItem("item-1");

    expect(result).toEqual({ plantId: "new-plant-id" });
    expect(db.plantInsert()).toMatchObject({
      genus: "Verbena",
      species: "bonariensis",
      cultivar: null,
      common_names: ["Purpletop vervain"],
    });
  });

  it("sets identification_status and species_source like a typed-in garden add", async () => {
    const db = setupPurchaseSupabase(SCHEME_ITEM);
    await purchaseShoppingListItem("item-1");

    expect(db.plantInsert()).toMatchObject({
      identification_status: "identified",
      species_source: "manual",
    });
  });

  it("runs the AI lookup with the split name and writes lookup_status", async () => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP, sun_needs: "full sun" });
    const db = setupPurchaseSupabase(SCHEME_ITEM);
    await purchaseShoppingListItem("item-1");

    expect(performLookup).toHaveBeenCalledWith("Verbena", "bonariensis", null);
    expect(db.plantUpdates()).toEqual([{ sun_needs: "full sun", lookup_status: "success" }]);
  });

  it("enriches species_reference with genus and species in their own slots", async () => {
    setupPurchaseSupabase(SCHEME_ITEM);
    await purchaseShoppingListItem("item-1");

    expect(enrichSpeciesReference).toHaveBeenCalledTimes(1);
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Verbena", "bonariensis", null);
  });

  it("marks lookup_status 'error' but still creates the plant when the lookup throws", async () => {
    vi.mocked(performLookup).mockRejectedValue(new Error("network"));
    const db = setupPurchaseSupabase(SCHEME_ITEM);
    const result = await purchaseShoppingListItem("item-1");

    expect(result).toEqual({ plantId: "new-plant-id" });
    expect(db.plantUpdates()).toEqual([{ lookup_status: "error" }]);
  });

  it("keeps the image copy and item deletion behaviour", async () => {
    const db = setupPurchaseSupabase(SCHEME_ITEM);
    await purchaseShoppingListItem("item-1");

    expect(db.bucket.copy).toHaveBeenCalledWith(
      "user-123/shopping-list/abc.jpg",
      expect.stringMatching(/^user-123\/\d+\.jpg$/)
    );
    expect(db.plantInsert()).toMatchObject({
      photo_url: expect.stringMatching(/^https:\/\/storage\.test\/user-123\/\d+\.jpg$/),
      image_source: "wikimedia",
      image_attribution: "Jane Doe, CC BY-SA 4.0",
    });
    expect(db.bucket.remove).toHaveBeenCalledWith(["user-123/shopping-list/abc.jpg"]);
    expect(db.itemDelete).toHaveBeenCalledTimes(1);
  });

  it("rolls back the copied image and keeps the item when the insert fails", async () => {
    const db = setupPurchaseSupabase(SCHEME_ITEM, { insertError: true });
    const result = await purchaseShoppingListItem("item-1");

    expect(result).toEqual({ error: expect.any(String) });
    expect(db.bucket.remove).toHaveBeenCalledTimes(1);
    expect(db.bucket.remove).toHaveBeenCalledWith([expect.stringMatching(/^user-123\/\d+\.jpg$/)]);
    expect(db.itemDelete).not.toHaveBeenCalled();
    expect(performLookup).not.toHaveBeenCalled();
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
  });
});

// ─── lookup correction never moves the genus ─────────────────────────────────

describe("purchaseShoppingListItem – lookup correction with a genus present", () => {
  it("applies an epithet correction to species only", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "bonariensis",
    });
    const db = setupPurchaseSupabase({ ...SCHEME_ITEM, species: "Verbena bonarensis" });
    await purchaseShoppingListItem("item-1");

    expect(db.plantInsert()).toMatchObject({ genus: "Verbena", species: "bonarensis" });
    const update = db.plantUpdates()[0];
    expect(update.species).toBe("bonariensis");
    expect(update).not.toHaveProperty("genus");
    expect(update).not.toHaveProperty("cultivar");
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Verbena", "bonariensis", null);
  });

  it("strips the genus when the correction comes back as a full binomial", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "Verbena bonariensis",
    });
    const db = setupPurchaseSupabase({ ...SCHEME_ITEM, species: "Verbena bonarensis" });
    await purchaseShoppingListItem("item-1");

    expect(db.plantUpdates()[0].species).toBe("bonariensis");
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Verbena", "bonariensis", null);
  });

  it("writes no species change when a full-binomial 'correction' matches what was searched", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_species: "Verbena bonariensis",
    });
    const db = setupPurchaseSupabase(SCHEME_ITEM);
    await purchaseShoppingListItem("item-1");

    expect(db.plantUpdates()[0]).not.toHaveProperty("species");
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Verbena", "bonariensis", null);
  });

  it("discards a cultivar correction that carries the genus", async () => {
    vi.mocked(performLookup).mockResolvedValue({
      ...BASE_LOOKUP,
      corrected_cultivar: "Verbena bonariensis 'Lollipop'",
    });
    const db = setupPurchaseSupabase(SCHEME_ITEM);
    await purchaseShoppingListItem("item-1");

    expect(db.plantUpdates()[0]).not.toHaveProperty("cultivar");
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Verbena", "bonariensis", null);
  });
});

// ─── genus guard ──────────────────────────────────────────────────────────────

// The scheme path can't actually produce a blank genus alongside a species —
// parseScientificName always takes the first token as the genus — so the
// blank-genus case is exercised directly on the shared helper, with the same
// requireGenus option purchase passes. It's what protects the manual-item
// path once that exists.
describe("purchase path – genus guard", () => {
  const BLANK_GENUS_ROW: PlantInsert = {
    genus: "",
    species: "oficinalis",
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

  async function client() {
    return (await createClient()) as Awaited<ReturnType<typeof createClient>>;
  }

  it("blank genus after lookup: no enrichment call, so no species_reference write", async () => {
    // The lookup corrects the species but can't supply a genus.
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP, corrected_species: "officinalis" });
    const db = setupPurchaseSupabase(null);

    const result = await createPlantWithLookup(await client(), BLANK_GENUS_ROW, { requireGenus: true });

    expect(result).toEqual({ id: "new-plant-id" });
    expect(db.plantUpdates()[0]).toMatchObject({ species: "officinalis" });
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("the same row without requireGenus still enriches (garden add is unguarded for now)", async () => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP, corrected_species: "officinalis" });
    setupPurchaseSupabase(null);

    await createPlantWithLookup(await client(), BLANK_GENUS_ROW);

    expect(enrichSpeciesReference).toHaveBeenCalledWith("", "officinalis", null);
  });

  it("refuses an item with no parseable name before writing anything", async () => {
    const db = setupPurchaseSupabase({ ...SCHEME_ITEM, species: "" });
    const result = await purchaseShoppingListItem("item-1");

    expect(result).toEqual({ error: expect.any(String) });
    expect(db.bucket.copy).not.toHaveBeenCalled();
    expect(db.plantInsert()).toBeNull();
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
  });

  it("still enriches a genus-only name (well-formed key), without running the lookup", async () => {
    const db = setupPurchaseSupabase({ ...SCHEME_ITEM, species: "Geranium 'Rozanne'" });
    await purchaseShoppingListItem("item-1");

    expect(db.plantInsert()).toMatchObject({ genus: "Geranium", species: null });
    expect(performLookup).not.toHaveBeenCalled();
    expect(db.plantUpdates()).toEqual([{ lookup_status: "skipped" }]);
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Geranium", null, null);
  });
});
