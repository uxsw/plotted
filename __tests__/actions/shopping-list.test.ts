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
import { createManualShoppingListItem, purchaseShoppingListItem } from "@/app/actions/shopping-list";
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

// ─── purchase from a manual item ──────────────────────────────────────────────

// A manual item as Phase 1 creates it: only what the user typed, no image,
// no lookup started.
const MANUAL_ITEM = {
  id: "item-2",
  user_id: "user-123",
  source: "manual",
  scheme_id: null,
  species: null,
  genus: null,
  cultivar: null,
  common_names: null,
  entered_name: "Bugle",
  notes: "From the podcast",
  where_to_buy: "https://example.test/nursery",
  thumbnail_storage_path: null,
  wikimedia_attribution: null,
  lookup_status: null,
  lookup_requested_at: null,
};

describe("purchaseShoppingListItem – manual item", () => {
  it("unresolved: inserts the typed name with a blank genus, runs the lookup, skips enrichment", async () => {
    vi.mocked(performLookup).mockResolvedValue({ ...BASE_LOOKUP, corrected_species: "ajuga reptans" });
    const db = setupPurchaseSupabase(MANUAL_ITEM);

    const result = await purchaseShoppingListItem("item-2");

    expect(result).toEqual({ plantId: "new-plant-id" });
    expect(db.plantInsert()).toMatchObject({
      genus: "",
      species: "bugle",
      cultivar: null,
      common_names: [],
      identification_status: "identified",
      species_source: "manual",
    });
    expect(performLookup).toHaveBeenCalledWith("", "bugle", null);
    expect(db.plantUpdates()[0]).toMatchObject({ species: "ajuga reptans" });
    // The genus guard: blank genus, so no species_reference work at all.
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(db.itemDelete).toHaveBeenCalled();
  });

  it("resolved: uses the item's genus, species and cultivar, and enriches", async () => {
    const db = setupPurchaseSupabase({
      ...MANUAL_ITEM,
      genus: "Ajuga",
      species: "reptans",
      cultivar: "Black Scallop",
      common_names: ["Bugle"],
    });

    const result = await purchaseShoppingListItem("item-2");

    expect(result).toEqual({ plantId: "new-plant-id" });
    expect(db.plantInsert()).toMatchObject({
      genus: "Ajuga",
      species: "reptans",
      cultivar: "Black Scallop",
      common_names: ["Bugle"],
    });
    expect(performLookup).toHaveBeenCalledWith("Ajuga", "reptans", "Black Scallop");
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Ajuga", "reptans", "Black Scallop");
  });

  it("resolved hybrid: the epithet goes in species, the genus in genus, never a binomial in either", async () => {
    const db = setupPurchaseSupabase({
      ...MANUAL_ITEM,
      entered_name: "euphorbia mar tinny",
      genus: "Euphorbia",
      species: "×martini",
      cultivar: null,
      common_names: ["Martin's spurge"],
      lookup_status: "complete",
    });

    await purchaseShoppingListItem("item-2");

    expect(db.plantInsert()).toMatchObject({ genus: "Euphorbia", species: "×martini", cultivar: null });
    expect(performLookup).toHaveBeenCalledWith("Euphorbia", "×martini", null);
    expect(enrichSpeciesReference).toHaveBeenCalledWith("Euphorbia", "×martini", null);
  });

  it("resolved genus-only: a genus and no species, and the typed text is not used as the name", async () => {
    const db = setupPurchaseSupabase({
      ...MANUAL_ITEM,
      entered_name: "hew kera",
      genus: "Heuchera",
      species: null,
      common_names: ["Coral bells"],
      lookup_status: "complete",
    });

    await purchaseShoppingListItem("item-2");

    expect(db.plantInsert()).toMatchObject({ genus: "Heuchera", species: null });
    expect(JSON.stringify(db.plantInsert())).not.toContain("hew kera");
  });

  it("a suggestion not yet accepted is still unresolved: the typed name goes in, genus blank", async () => {
    const db = setupPurchaseSupabase({
      ...MANUAL_ITEM,
      entered_name: "sal via car a dona",
      lookup_status: "complete",
      lookup_candidates: [{ genus: "Salvia", species: "nemorosa", cultivar: "Caradonna", common_names: [] }],
    });

    await purchaseShoppingListItem("item-2");

    expect(db.plantInsert()).toMatchObject({ genus: "", species: "sal via car a dona" });
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
  });

  it("carries notes to the plant; where_to_buy is not written anywhere", async () => {
    const db = setupPurchaseSupabase(MANUAL_ITEM);
    await purchaseShoppingListItem("item-2");

    const insert = db.plantInsert()!;
    expect(insert.notes).toBe("From the podcast");
    expect(JSON.stringify(insert)).not.toContain("example.test/nursery");
    expect(insert).not.toHaveProperty("where_to_buy");
  });

  it("copes with no thumbnail: no storage copy or cleanup, plant has no photo", async () => {
    const db = setupPurchaseSupabase(MANUAL_ITEM);
    const result = await purchaseShoppingListItem("item-2");

    expect(result).toEqual({ plantId: "new-plant-id" });
    expect(db.bucket.copy).not.toHaveBeenCalled();
    expect(db.bucket.remove).not.toHaveBeenCalled();
    expect(db.plantInsert()).toMatchObject({
      photo_url: null,
      image_source: null,
      image_attribution: null,
    });
  });

  it("refuses a manual item with no usable name before writing anything", async () => {
    const db = setupPurchaseSupabase({ ...MANUAL_ITEM, entered_name: "   " });
    const result = await purchaseShoppingListItem("item-2");

    expect(result).toEqual({ error: expect.any(String) });
    expect(db.plantInsert()).toBeNull();
    expect(performLookup).not.toHaveBeenCalled();
  });
});

// ─── createManualShoppingListItem ─────────────────────────────────────────────

function setupCreateSupabase(opts: { user?: boolean; insertError?: boolean } = {}) {
  let inserted: Record<string, unknown> | null = null;

  const itemsTable = {
    insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      inserted = payload;
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            opts.insertError
              ? { data: null, error: { message: "boom" } }
              : {
                  data: {
                    id: "new-item-id",
                    scheme_id: null,
                    species: null,
                    cultivar: null,
                    common_names: null,
                    thumbnail_storage_path: null,
                    wikimedia_attribution: null,
                    lookup_status: null,
                    lookup_requested_at: null,
                    created_at: "2026-10-05T12:00:00Z",
                    ...payload,
                  },
                  error: null,
                }
          ),
        }),
      };
    }),
  };

  const from = vi.fn().mockReturnValue(itemsTable);
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user === false ? null : { id: "user-123" } },
      }),
    },
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { inserted: () => inserted, insert: itemsTable.insert, from };
}

describe("createManualShoppingListItem", () => {
  it("rejects an empty or whitespace-only name without inserting", async () => {
    const db = setupCreateSupabase();

    expect(await createManualShoppingListItem({ name: "" })).toEqual({ error: expect.any(String) });
    expect(await createManualShoppingListItem({ name: "   " })).toEqual({ error: expect.any(String) });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects over-length fields without inserting", async () => {
    const db = setupCreateSupabase();

    expect(await createManualShoppingListItem({ name: "a".repeat(121) })).toEqual({ error: expect.any(String) });
    expect(
      await createManualShoppingListItem({ name: "bugle", whereToBuy: "a".repeat(201) })
    ).toEqual({ error: expect.any(String) });
    expect(
      await createManualShoppingListItem({ name: "bugle", notes: "a".repeat(1001) })
    ).toEqual({ error: expect.any(String) });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("accepts fields exactly at their limits", async () => {
    const db = setupCreateSupabase();
    const result = await createManualShoppingListItem({
      name: "a".repeat(120),
      whereToBuy: "b".repeat(200),
      notes: "c".repeat(1000),
    });

    expect(result).toHaveProperty("item");
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("trims before inserting, as a manual item for the signed-in user", async () => {
    const db = setupCreateSupabase();
    await createManualShoppingListItem({
      name: "  Salvia  'Amistad'  ",
      whereToBuy: "  RHS Wisley ",
      notes: "  dry shade\n",
    });

    expect(db.inserted()).toEqual({
      user_id: "user-123",
      source: "manual",
      entered_name: "Salvia 'Amistad'",
      where_to_buy: "RHS Wisley",
      notes: "dry shade",
    });
  });

  // Starting the lookup is covered in shopping-list-lookup.test.ts. This
  // client has no session to hand to a background client, so none starts —
  // which is also the "capture must not depend on the lookup" case.
  it("inserts with no lookup fields set, and touches nothing but shopping_list_items", async () => {
    const db = setupCreateSupabase();
    await createManualShoppingListItem({ name: "bugle" });

    expect(db.inserted()).not.toHaveProperty("lookup_status");
    expect(db.inserted()).not.toHaveProperty("lookup_requested_at");
    expect(db.inserted()).toMatchObject({ where_to_buy: null, notes: null });
    expect(db.from.mock.calls.every(([table]) => table === "shopping_list_items")).toBe(true);
    expect(performLookup).not.toHaveBeenCalled();
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("returns the created row in the shape the list renders", async () => {
    setupCreateSupabase();
    const result = await createManualShoppingListItem({ name: "bugle", whereToBuy: "https://example.test" });

    expect(result).toEqual({
      item: expect.objectContaining({
        id: "new-item-id",
        source: "manual",
        entered_name: "bugle",
        where_to_buy: "https://example.test",
        notes: null,
        species: null,
        lookup_status: null,
        thumbnail_url: null,
        scheme_name: null,
      }),
    });
  });

  it("allows duplicates: the same name twice inserts twice, with no existence check", async () => {
    const db = setupCreateSupabase();
    await createManualShoppingListItem({ name: "bugle" });
    await createManualShoppingListItem({ name: "bugle" });

    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("returns an error when not signed in or when the insert fails", async () => {
    const anon = setupCreateSupabase({ user: false });
    expect(await createManualShoppingListItem({ name: "bugle" })).toEqual({ error: expect.any(String) });
    expect(anon.insert).not.toHaveBeenCalled();

    setupCreateSupabase({ insertError: true });
    expect(await createManualShoppingListItem({ name: "bugle" })).toEqual({ error: expect.any(String) });
  });
});
