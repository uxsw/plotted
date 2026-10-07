import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFakeDb } from "../helpers/fake-supabase";

// The shopping list name lookup, from the server actions down to the rows:
// claim → run in after() → write. The lookup itself (model + Wikipedia) is
// mocked at lib/shopping-lookup/lookup; its own behaviour is covered in
// lib/shopping-lookup/*.test.ts.

const background = vi.hoisted(() => ({ callbacks: [] as (() => unknown)[] }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({
  after: vi.fn((callback: () => unknown) => {
    background.callbacks.push(callback);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(), createBearerClient: vi.fn() }));
vi.mock("@/lib/shopping-lookup/lookup", () => ({
  LOOKUP_BUDGET_MS: 40_000,
  lookupPlantByName: vi.fn(),
  describeCandidate: vi.fn(),
}));
// Isolation: the shopping list lookup must never reach the garden's lookup
// or the species_reference cache.
vi.mock("@/lib/plant-lookup", () => ({ performLookup: vi.fn() }));
vi.mock("@/lib/species-reference-enrichment", () => ({ enrichSpeciesReference: vi.fn() }));

import { createBearerClient, createClient } from "@/lib/supabase/server";
import { describeCandidate, lookupPlantByName, type LookupOutcome, type VerifiedCandidate } from "@/lib/shopping-lookup/lookup";
import { performLookup } from "@/lib/plant-lookup";
import { enrichSpeciesReference } from "@/lib/species-reference-enrichment";
import {
  acceptShoppingItemCandidate,
  createManualShoppingListItem,
  keepShoppingItemAsTyped,
  retryShoppingItemLookup,
  updateManualItemName,
} from "@/app/actions/shopping-list";
import { claimLookup, claimWaitingLookups, runClaimedLookup } from "@/lib/shopping-lookup/run";
import { toShoppingListItemData, type ShoppingListItemRow } from "@/lib/shopping-list";

type Row = Record<string, unknown>;
type Db = ReturnType<typeof createFakeDb>;

const USER = "user-123";
const ITEMS = "shopping_list_items";

function manualItem(overrides: Row = {}): Row {
  return {
    id: "item-1",
    user_id: USER,
    source: "manual",
    scheme_id: null,
    entered_name: "echinaysha purpyoorea",
    genus: null,
    species: null,
    cultivar: null,
    common_names: null,
    summary: null,
    summary_scope: null,
    growth_type: null,
    lookup_confidence: null,
    lookup_candidates: null,
    lookup_status: null,
    lookup_requested_at: null,
    thumbnail_storage_path: null,
    wikimedia_attribution: null,
    notes: null,
    where_to_buy: null,
    created_at: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function setup(items: Row[], plants: Row[] = []): Db {
  const db = createFakeDb({ [ITEMS]: items, plants });
  vi.mocked(createClient).mockResolvedValue(db.client as unknown as Awaited<ReturnType<typeof createClient>>);
  vi.mocked(createBearerClient).mockReturnValue(db.client as unknown as ReturnType<typeof createBearerClient>);
  return db;
}

const client = (db: Db) => db.client as unknown as Parameters<typeof claimLookup>[0];

/** Runs whatever was scheduled with after(), as the platform would once the response has gone. */
async function runBackground() {
  const callbacks = background.callbacks.splice(0);
  for (const callback of callbacks) await callback();
}

function verified(overrides: Partial<VerifiedCandidate> = {}): VerifiedCandidate {
  return {
    genus: "Echinacea",
    species: "purpurea",
    cultivar: null,
    common_names: ["Purple coneflower"],
    confidence: "high",
    growth_type: "perennial",
    partial_match: false,
    unmatched_text: null,
    verification: "verified",
    final_confidence: "high",
    ...overrides,
  };
}

const RESOLVED: LookupOutcome = {
  kind: "resolved",
  candidate: verified(),
  details: {
    summary: { summary: "A tall purple daisy for late summer.", summary_scope: "species" },
    image: { url: "https://upload.wikimedia.org/echinacea.jpg", attribution: "https://en.wikipedia.org/wiki/Echinacea_purpurea" },
  },
};

const CARADONNA = verified({
  genus: "Salvia",
  species: "nemorosa",
  cultivar: "Caradonna",
  common_names: ["Balkan clary"],
  final_confidence: "medium",
});

function mockOutcome(outcome: LookupOutcome) {
  vi.mocked(lookupPlantByName).mockResolvedValue({
    outcome,
    trace: { candidates: [], sounds_like: "never stored", resolver: null, summary: null, wikipedia_ms: 0 },
  });
}

function mockImageFetch(ok = true) {
  const fetchMock = vi.fn(async () =>
    ok
      ? new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg" } })
      : Promise.reject(new Error("image host down"))
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  background.callbacks.length = 0;
  vi.mocked(lookupPlantByName).mockReset();
  vi.mocked(describeCandidate).mockReset().mockResolvedValue({ summary: null, image: null });
  vi.mocked(performLookup).mockReset();
  vi.mocked(enrichSpeciesReference).mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockImageFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ─── capture starts a lookup without waiting for it ───────────────────────────

describe("createManualShoppingListItem → lookup", () => {
  it("returns the item as pending straight away; the lookup runs afterwards", async () => {
    const db = setup([]);
    mockOutcome(RESOLVED);

    const result = await createManualShoppingListItem({ name: "echinaysha purpyoorea" });

    expect("item" in result && result.item).toMatchObject({
      entered_name: "echinaysha purpyoorea",
      lookup_status: "pending",
      genus: null,
    });
    expect(lookupPlantByName).not.toHaveBeenCalled();
    expect(db.tables[ITEMS][0]).toMatchObject({ lookup_status: "pending" });
    expect(db.tables[ITEMS][0].lookup_requested_at).toEqual(expect.any(String));

    await runBackground();
    expect(lookupPlantByName).toHaveBeenCalledWith("echinaysha purpyoorea", expect.any(Array), expect.anything());
    expect(db.tables[ITEMS][0]).toMatchObject({ lookup_status: "complete", genus: "Echinacea" });
  });

  it("still captures the item when the lookup can't be started", async () => {
    const db = setup([]);
    db.client.auth.getSession = async () => {
      throw new Error("auth down");
    };

    const result = await createManualShoppingListItem({ name: "bugle" });
    expect("item" in result && result.item).toMatchObject({ entered_name: "bugle", lookup_status: null });
    expect(background.callbacks).toHaveLength(0);
  });
});

// ─── each confidence path ─────────────────────────────────────────────────────

describe("runClaimedLookup", () => {
  async function claimAndRun(db: Db, outcome: LookupOutcome) {
    mockOutcome(outcome);
    const claim = await claimLookup(client(db), USER, "item-1");
    expect(claim).not.toBeNull();
    await runClaimedLookup(client(db), USER, claim!);
    return db.tables[ITEMS][0];
  }

  it("high: writes the resolved names, summary, scope, growth type and image", async () => {
    const db = setup([manualItem()]);
    const row = await claimAndRun(db, RESOLVED);

    expect(row).toMatchObject({
      genus: "Echinacea",
      species: "purpurea",
      cultivar: null,
      common_names: ["Purple coneflower"],
      growth_type: "perennial",
      summary: "A tall purple daisy for late summer.",
      summary_scope: "species",
      lookup_confidence: "high",
      lookup_candidates: null,
      lookup_status: "complete",
      wikimedia_attribution: "https://en.wikipedia.org/wiki/Echinacea_purpurea",
    });
    expect(row.thumbnail_storage_path).toMatch(/^user-123\/shopping-list\/.+\.jpg$/);
    expect(db.uploaded).toEqual([row.thumbnail_storage_path]);
  });

  it("high: keeps the epithet and genus in separate columns", async () => {
    const db = setup([manualItem({ entered_name: "euphorbia mar tinny" })]);
    const row = await claimAndRun(db, {
      ...RESOLVED,
      candidate: verified({ genus: "Euphorbia", species: "×martini", common_names: [] }),
    } as LookupOutcome);
    expect(row).toMatchObject({ genus: "Euphorbia", species: "×martini" });
  });

  it("medium: stores the candidates and writes no resolved fields", async () => {
    const db = setup([manualItem({ entered_name: "sal via car a dona" })]);
    const row = await claimAndRun(db, { kind: "suggest", candidates: [CARADONNA] });

    expect(row).toMatchObject({
      genus: null,
      species: null,
      summary: null,
      thumbnail_storage_path: null,
      lookup_confidence: "medium",
      lookup_status: "complete",
    });
    expect(row.lookup_candidates).toEqual([
      {
        genus: "Salvia",
        species: "nemorosa",
        cultivar: "Caradonna",
        common_names: ["Balkan clary"],
        growth_type: "perennial",
        unmatched_text: null,
      },
    ]);
  });

  it("low: complete, with nothing written and nothing suggested", async () => {
    const db = setup([manualItem()]);
    const row = await claimAndRun(db, { kind: "low" });
    expect(row).toMatchObject({ genus: null, lookup_candidates: null, lookup_confidence: "low", lookup_status: "complete" });
  });

  it("no candidates: not_found", async () => {
    const db = setup([manualItem({ entered_name: "remember to buy milk" })]);
    const row = await claimAndRun(db, { kind: "none" });
    expect(row).toMatchObject({ genus: null, lookup_candidates: null, lookup_status: "not_found" });
  });

  it("an exception: failed, and the item is otherwise untouched", async () => {
    const db = setup([manualItem()]);
    vi.mocked(lookupPlantByName).mockRejectedValue(new Error("Anthropic timeout"));
    const claim = await claimLookup(client(db), USER, "item-1");
    await runClaimedLookup(client(db), USER, claim!);

    expect(db.tables[ITEMS][0]).toMatchObject({
      lookup_status: "failed",
      entered_name: "echinaysha purpyoorea",
      genus: null,
    });
  });

  it("never writes entered_name, on any path", async () => {
    for (const outcome of [RESOLVED, { kind: "suggest", candidates: [CARADONNA] }, { kind: "low" }, { kind: "none" }] as LookupOutcome[]) {
      const db = setup([manualItem()]);
      const row = await claimAndRun(db, outcome);
      expect(row.entered_name).toBe("echinaysha purpyoorea");
      expect(db.writesTo(ITEMS).some((payload) => "entered_name" in payload)).toBe(false);
    }
  });

  it("never stores the resolver's sounds_like line", async () => {
    const db = setup([manualItem()]);
    await claimAndRun(db, RESOLVED);
    expect(JSON.stringify(db.tables[ITEMS])).not.toContain("never stored");
    expect(JSON.stringify(db.writesTo(ITEMS))).not.toContain("sounds_like");
  });

  it("passes the user's other plants as priors, by source, without the item itself", async () => {
    const db = setup(
      [
        manualItem(),
        manualItem({ id: "item-2", entered_name: "bugle" }),
        manualItem({ id: "item-3", genus: "Salvia", species: "nemorosa", cultivar: "Caradonna", entered_name: "sal via" }),
        { id: "item-4", user_id: USER, source: "scheme", species: "Verbena bonariensis", cultivar: null },
      ],
      [{ user_id: USER, genus: "Geranium", species: "phaeum", cultivar: null }]
    );
    await claimAndRun(db, { kind: "none" });

    const priors = vi.mocked(lookupPlantByName).mock.calls[0][1];
    expect(priors).toEqual(
      expect.arrayContaining(["Geranium phaeum", "bugle", "Salvia nemorosa 'Caradonna'", "Verbena bonariensis"])
    );
    expect(priors).not.toContain("echinaysha purpyoorea");
  });
});

// ─── image and summary failures never fail the item ───────────────────────────

describe("partial failures", () => {
  it("image fetch fails: the item still completes with its names and summary", async () => {
    const db = setup([manualItem()]);
    mockImageFetch(false);
    mockOutcome(RESOLVED);
    const claim = await claimLookup(client(db), USER, "item-1");
    await runClaimedLookup(client(db), USER, claim!);

    expect(db.tables[ITEMS][0]).toMatchObject({
      lookup_status: "complete",
      genus: "Echinacea",
      summary: "A tall purple daisy for late summer.",
      thumbnail_storage_path: null,
      wikimedia_attribution: null,
    });
  });

  it("image upload fails: same", async () => {
    const db = setup([manualItem()]);
    db.state.failUpload = true;
    mockOutcome(RESOLVED);
    const claim = await claimLookup(client(db), USER, "item-1");
    await runClaimedLookup(client(db), USER, claim!);
    expect(db.tables[ITEMS][0]).toMatchObject({ lookup_status: "complete", genus: "Echinacea", thumbnail_storage_path: null });
  });

  it("no summary and no image: complete, with just the names", async () => {
    const db = setup([manualItem()]);
    mockOutcome({ ...RESOLVED, details: { summary: null, image: null } } as LookupOutcome);
    const claim = await claimLookup(client(db), USER, "item-1");
    await runClaimedLookup(client(db), USER, claim!);
    expect(db.tables[ITEMS][0]).toMatchObject({ lookup_status: "complete", genus: "Echinacea", summary: null, summary_scope: null });
  });

  it("sends the image request with the Wikimedia User-Agent and a timeout", async () => {
    const db = setup([manualItem()]);
    const fetchMock = mockImageFetch();
    mockOutcome(RESOLVED);
    const claim = await claimLookup(client(db), USER, "item-1");
    await runClaimedLookup(client(db), USER, claim!);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["User-Agent"]).toMatch(/^Plotted\//);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

// ─── claiming, the per-user cap, and results that arrive too late ─────────────

describe("claiming", () => {
  it("only one of two racing claims wins", async () => {
    const db = setup([manualItem()]);
    const first = await claimLookup(client(db), USER, "item-1");
    const second = await claimLookup(client(db), USER, "item-1");
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("never claims a scheme item", async () => {
    const db = setup([{ id: "item-1", user_id: USER, source: "scheme", species: "Verbena bonariensis", lookup_status: null }]);
    expect(await claimLookup(client(db), USER, "item-1")).toBeNull();
  });

  it("caps concurrent lookups at three per user; the rest keep a null status", async () => {
    const db = setup([1, 2, 3, 4, 5].map((n) => manualItem({ id: `item-${n}`, entered_name: `plant ${n}` })));
    const claims = await claimWaitingLookups(client(db), USER, ["item-1", "item-2", "item-3", "item-4", "item-5"]);

    expect(claims.map((claim) => claim.id)).toEqual(["item-1", "item-2", "item-3"]);
    expect(db.tables[ITEMS].map((row) => row.lookup_status)).toEqual(["pending", "pending", "pending", null, null]);
    expect(await claimLookup(client(db), USER, "item-4")).toBeNull();
  });

  it("a stale pending lookup doesn't hold a slot", async () => {
    const stale = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    const db = setup([
      ...[1, 2, 3].map((n) => manualItem({ id: `old-${n}`, lookup_status: "pending", lookup_requested_at: stale })),
      manualItem(),
    ]);
    expect(await claimLookup(client(db), USER, "item-1")).not.toBeNull();
  });

  it("picks up Phase 1 items (manual, null status) when the page asks", async () => {
    const db = setup([manualItem({ id: "old-1", entered_name: "bugle" }), manualItem({ id: "old-2", entered_name: "hosta" })]);
    const claims = await claimWaitingLookups(client(db), USER, ["old-1", "old-2"]);
    expect(claims.map((claim) => claim.entered_name)).toEqual(["bugle", "hosta"]);
  });

  it("drops a result whose claim has been superseded, and removes its image", async () => {
    const db = setup([manualItem()]);
    mockOutcome(RESOLVED);
    const claim = await claimLookup(client(db), USER, "item-1");

    // The user renames the item while the lookup is in flight.
    Object.assign(db.tables[ITEMS][0], {
      entered_name: "hosta",
      lookup_status: "pending",
      lookup_requested_at: "2030-01-01T00:00:00.000Z",
    });
    await runClaimedLookup(client(db), USER, claim!);

    expect(db.tables[ITEMS][0]).toMatchObject({ entered_name: "hosta", genus: null, lookup_status: "pending" });
    expect(db.uploaded).toHaveLength(1);
    expect(db.removed).toEqual(db.uploaded);
  });

  it("copes with the item being deleted mid-lookup", async () => {
    const db = setup([manualItem()]);
    mockOutcome(RESOLVED);
    const claim = await claimLookup(client(db), USER, "item-1");
    db.tables[ITEMS].length = 0;
    await expect(runClaimedLookup(client(db), USER, claim!)).resolves.toBeUndefined();
    expect(db.removed).toEqual(db.uploaded);
  });
});

// ─── stale pending ────────────────────────────────────────────────────────────

describe("stale pending", () => {
  const row = (requestedAt: string | null): ShoppingListItemRow =>
    manualItem({ lookup_status: "pending", lookup_requested_at: requestedAt }) as unknown as ShoppingListItemRow;
  const NOW = Date.parse("2026-10-07T12:00:00.000Z");

  it("a pending lookup under ten minutes old is still pending", () => {
    expect(toShoppingListItemData(row("2026-10-07T11:51:00.000Z"), null, NOW).lookup_status).toBe("pending");
  });

  it("a pending lookup over ten minutes old is shown as failed", () => {
    expect(toShoppingListItemData(row("2026-10-07T11:49:00.000Z"), null, NOW).lookup_status).toBe("failed");
    expect(toShoppingListItemData(row(null), null, NOW).lookup_status).toBe("failed");
  });

  it("retry restarts a stale pending lookup from the typed name", async () => {
    const stale = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    const db = setup([manualItem({ lookup_status: "pending", lookup_requested_at: stale })]);
    mockOutcome(RESOLVED);

    expect(await retryShoppingItemLookup("item-1")).toEqual({});
    expect(db.tables[ITEMS][0].lookup_status).toBe("pending");
    expect(db.tables[ITEMS][0].lookup_requested_at).not.toBe(stale);

    await runBackground();
    expect(db.tables[ITEMS][0]).toMatchObject({ lookup_status: "complete", genus: "Echinacea" });
  });
});

// ─── retry ────────────────────────────────────────────────────────────────────

describe("retryShoppingItemLookup", () => {
  it("re-runs a failed lookup", async () => {
    const db = setup([manualItem({ lookup_status: "failed", lookup_requested_at: "2026-10-01T10:00:00.000Z" })]);
    mockOutcome({ kind: "none" });

    await retryShoppingItemLookup("item-1");
    await runBackground();

    expect(lookupPlantByName).toHaveBeenCalledTimes(1);
    expect(db.tables[ITEMS][0].lookup_status).toBe("not_found");
  });

  it("does nothing to a lookup that is running, finished, or belongs to a scheme item", async () => {
    const fresh = new Date().toISOString();
    for (const item of [
      manualItem({ lookup_status: "pending", lookup_requested_at: fresh }),
      manualItem({ lookup_status: "complete", genus: "Echinacea" }),
      manualItem({ lookup_status: "not_found" }),
      { id: "item-1", user_id: USER, source: "scheme", species: "Verbena bonariensis", lookup_status: "failed" },
    ]) {
      const db = setup([item]);
      const before = { ...db.tables[ITEMS][0] };
      await retryShoppingItemLookup("item-1");
      await runBackground();
      expect(db.tables[ITEMS][0]).toEqual(before);
    }
    expect(lookupPlantByName).not.toHaveBeenCalled();
  });
});

// ─── accepting a suggestion ───────────────────────────────────────────────────

describe("acceptShoppingItemCandidate", () => {
  const stored = [
    { genus: "Salvia", species: "nemorosa", cultivar: "Caradonna", common_names: ["Balkan clary"], growth_type: "perennial", unmatched_text: null },
    { genus: "Salvia", species: "officinalis", cultivar: null, common_names: ["Sage"], growth_type: "shrub", unmatched_text: null },
  ];
  const suggested = () =>
    manualItem({ entered_name: "sal via car a dona", lookup_status: "complete", lookup_confidence: "medium", lookup_candidates: stored });

  it("writes the chosen plant's fields at once, clears the suggestions and keeps entered_name", async () => {
    const db = setup([suggested()]);
    expect(await acceptShoppingItemCandidate("item-1", 0)).toEqual({});

    expect(db.tables[ITEMS][0]).toMatchObject({
      entered_name: "sal via car a dona",
      genus: "Salvia",
      species: "nemorosa",
      cultivar: "Caradonna",
      common_names: ["Balkan clary"],
      growth_type: "perennial",
      lookup_confidence: "high",
      lookup_candidates: null,
      lookup_status: "pending",
    });
    expect(describeCandidate).not.toHaveBeenCalled();
  });

  it("then fetches the summary and image for that candidate in the background", async () => {
    const db = setup([suggested()]);
    vi.mocked(describeCandidate).mockResolvedValue({
      summary: { summary: "Violet spikes on near-black stems.", summary_scope: "cultivar" },
      image: { url: "https://upload.wikimedia.org/salvia.jpg", attribution: "https://en.wikipedia.org/wiki/Salvia_nemorosa" },
    });

    await acceptShoppingItemCandidate("item-1", 0);
    await runBackground();

    expect(vi.mocked(describeCandidate).mock.calls[0][0]).toMatchObject({ genus: "Salvia", species: "nemorosa", cultivar: "Caradonna" });
    expect(db.tables[ITEMS][0]).toMatchObject({
      lookup_status: "complete",
      summary: "Violet spikes on near-black stems.",
      summary_scope: "cultivar",
      wikimedia_attribution: "https://en.wikipedia.org/wiki/Salvia_nemorosa",
    });
    expect(db.tables[ITEMS][0].thumbnail_storage_path).toMatch(/^user-123\/shopping-list\//);
    expect(lookupPlantByName).not.toHaveBeenCalled();
  });

  it("completes the item even when the summary and image both fail", async () => {
    const db = setup([suggested()]);
    vi.mocked(describeCandidate).mockRejectedValue(new Error("everything is down"));

    await acceptShoppingItemCandidate("item-1", 1);
    await runBackground();

    expect(db.tables[ITEMS][0]).toMatchObject({ genus: "Salvia", species: "officinalis", lookup_status: "complete", summary: null });
  });

  it("rejects an index that isn't one of the stored suggestions", async () => {
    const db = setup([suggested()]);
    expect(await acceptShoppingItemCandidate("item-1", 5)).toEqual({ error: expect.any(String) });
    expect(db.tables[ITEMS][0]).toMatchObject({ genus: null, lookup_candidates: stored });
  });

  it("keep as typed: clears the suggestions and changes nothing else", async () => {
    const db = setup([suggested()]);
    expect(await keepShoppingItemAsTyped("item-1")).toEqual({});
    expect(db.tables[ITEMS][0]).toMatchObject({
      entered_name: "sal via car a dona",
      genus: null,
      lookup_candidates: null,
      lookup_status: "complete",
    });
    expect(background.callbacks).toHaveLength(0);
  });
});

// ─── renaming ─────────────────────────────────────────────────────────────────

describe("updateManualItemName", () => {
  const resolved = () =>
    manualItem({
      genus: "Echinacea",
      species: "purpurea",
      common_names: ["Purple coneflower"],
      summary: "A tall purple daisy.",
      summary_scope: "species",
      growth_type: "perennial",
      lookup_confidence: "high",
      lookup_status: "complete",
      lookup_requested_at: "2026-10-01T10:00:00.000Z",
      thumbnail_storage_path: "user-123/shopping-list/old.jpg",
      wikimedia_attribution: "https://en.wikipedia.org/wiki/Echinacea_purpurea",
    });

  it("clears everything the old name resolved to, removes its image, and looks the new name up", async () => {
    const db = setup([resolved()]);
    mockOutcome({ kind: "suggest", candidates: [CARADONNA] });

    expect(await updateManualItemName("item-1", "  sal via car a dona ")).toEqual({});
    expect(db.tables[ITEMS][0]).toMatchObject({
      entered_name: "sal via car a dona",
      genus: null,
      species: null,
      common_names: null,
      summary: null,
      summary_scope: null,
      growth_type: null,
      lookup_confidence: null,
      thumbnail_storage_path: null,
      wikimedia_attribution: null,
      lookup_status: "pending",
    });
    expect(db.removed).toEqual(["user-123/shopping-list/old.jpg"]);

    await runBackground();
    expect(lookupPlantByName).toHaveBeenCalledWith("sal via car a dona", expect.any(Array), expect.anything());
    expect(db.tables[ITEMS][0]).toMatchObject({ lookup_status: "complete", lookup_confidence: "medium" });
    expect(db.tables[ITEMS][0].lookup_candidates).toHaveLength(1);
  });

  it("does nothing when the name hasn't changed", async () => {
    const db = setup([resolved()]);
    await updateManualItemName("item-1", "echinaysha purpyoorea");
    expect(db.tables[ITEMS][0]).toMatchObject({ genus: "Echinacea", lookup_status: "complete" });
    expect(background.callbacks).toHaveLength(0);
  });

  it("validates the new name like a new item", async () => {
    const db = setup([resolved()]);
    expect(await updateManualItemName("item-1", "   ")).toEqual({ error: "Enter a plant name." });
    expect(await updateManualItemName("item-1", "x".repeat(121))).toEqual({ error: expect.stringContaining("120") });
    expect(db.tables[ITEMS][0].entered_name).toBe("echinaysha purpyoorea");
  });

  it("won't rename a scheme item", async () => {
    const db = setup([{ id: "item-1", user_id: USER, source: "scheme", species: "Verbena bonariensis" }]);
    expect(await updateManualItemName("item-1", "hosta")).toEqual({ error: "Item not found" });
    expect(db.tables[ITEMS][0].species).toBe("Verbena bonariensis");
  });
});

// ─── isolation ────────────────────────────────────────────────────────────────

describe("isolation from the garden lookup", () => {
  it("no path reads or writes species_reference, or calls performLookup / enrichSpeciesReference", async () => {
    const db = setup([
      manualItem(),
      manualItem({ id: "item-2", lookup_status: "failed" }),
      manualItem({
        id: "item-3",
        lookup_status: "complete",
        lookup_candidates: [{ genus: "Salvia", species: "nemorosa", cultivar: "Caradonna", common_names: [], growth_type: null, unmatched_text: null }],
      }),
    ]);
    mockOutcome(RESOLVED);

    await createManualShoppingListItem({ name: "digital this ferina" });
    await retryShoppingItemLookup("item-2");
    await acceptShoppingItemCandidate("item-3", 0);
    await updateManualItemName("item-1", "the bina ben orients");
    const claims = await claimWaitingLookups(client(db), USER, ["item-1"]);
    await Promise.all(claims.map((claim) => runClaimedLookup(client(db), USER, claim)));
    await runBackground();

    expect(db.tablesTouched()).not.toContain("species_reference");
    expect(db.tablesTouched().sort()).toEqual(["plants", ITEMS].sort());
    expect(db.writesTo("plants")).toEqual([]);
    expect(performLookup).not.toHaveBeenCalled();
    expect(enrichSpeciesReference).not.toHaveBeenCalled();
  });
});
