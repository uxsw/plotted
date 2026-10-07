import { describe, it, expect } from "vitest";
import {
  formatLatinName,
  isStalePending,
  manualItemNames,
  parseLookupCandidates,
  shoppingItemLatinName,
  MANUAL_ITEM_LIMITS,
  parseHttpUrl,
  plantNameFromShoppingItem,
  shoppingItemDisplayName,
  toShoppingListItemData,
  validateManualItemInput,
} from "@/lib/shopping-list";

describe("shoppingItemDisplayName", () => {
  it("prefers what the user typed", () => {
    expect(
      shoppingItemDisplayName({
        entered_name: "bugle",
        common_names: ["Carpet bugle"],
        species: "Ajuga reptans",
      })
    ).toBe("bugle");
  });

  it("falls back to the first common name, then the species", () => {
    expect(
      shoppingItemDisplayName({
        entered_name: null,
        common_names: ["Purpletop vervain", "Tall verbena"],
        species: "Verbena bonariensis",
      })
    ).toBe("Purpletop vervain");
    expect(
      shoppingItemDisplayName({ entered_name: null, common_names: [], species: "Verbena bonariensis" })
    ).toBe("Verbena bonariensis");
    expect(
      shoppingItemDisplayName({ entered_name: null, common_names: null, species: "Verbena bonariensis" })
    ).toBe("Verbena bonariensis");
  });

  it("skips blank values rather than returning them", () => {
    expect(
      shoppingItemDisplayName({ entered_name: "   ", common_names: ["", " Bugle "], species: "Ajuga reptans" })
    ).toBe("Bugle");
    expect(shoppingItemDisplayName({ entered_name: null, common_names: null, species: null })).toBe("");
  });
});

describe("parseHttpUrl", () => {
  it("links http and https URLs", () => {
    expect(parseHttpUrl("http://example.com/plants")).toBe("http://example.com/plants");
    expect(parseHttpUrl("https://example.com/plants?id=1")).toBe("https://example.com/plants?id=1");
    expect(parseHttpUrl("  HTTPS://Example.com  ")).toBe("https://example.com/");
  });

  it("never links any other scheme", () => {
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("JavaScript:alert(1)")).toBeNull();
    expect(parseHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(parseHttpUrl("mailto:someone@example.com")).toBeNull();
    expect(parseHttpUrl("ftp://example.com/file")).toBeNull();
    expect(parseHttpUrl("//example.com")).toBeNull();
    expect(parseHttpUrl(" javascript:https://example.com")).toBeNull();
  });

  it("leaves plain text as text, including text that merely contains a URL", () => {
    expect(parseHttpUrl("RHS Wisley plant centre")).toBeNull();
    expect(parseHttpUrl("example.com")).toBeNull();
    expect(parseHttpUrl("RHS Wisley https://example.com")).toBeNull();
    expect(parseHttpUrl("https://example.com ask for Sam")).toBeNull();
    expect(parseHttpUrl("https://")).toBeNull();
    expect(parseHttpUrl("")).toBeNull();
    expect(parseHttpUrl(null)).toBeNull();
    expect(parseHttpUrl(undefined)).toBeNull();
  });
});

describe("validateManualItemInput", () => {
  it("requires a name", () => {
    expect(validateManualItemInput({ name: "" })).toEqual({ ok: false, error: expect.any(String) });
    expect(validateManualItemInput({ name: "   \n " })).toEqual({ ok: false, error: expect.any(String) });
    expect(validateManualItemInput({})).toEqual({ ok: false, error: expect.any(String) });
    expect(validateManualItemInput({ name: 42 })).toEqual({ ok: false, error: expect.any(String) });
  });

  it("trims, and turns empty optional fields into null", () => {
    expect(
      validateManualItemInput({ name: "  Salvia   'Amistad' ", whereToBuy: "   ", notes: "" })
    ).toEqual({
      ok: true,
      value: { entered_name: "Salvia 'Amistad'", where_to_buy: null, notes: null },
    });
  });

  it("keeps line breaks in notes", () => {
    const result = validateManualItemInput({
      name: "bugle",
      whereToBuy: " https://example.com ",
      notes: "  line one\nline two  ",
    });
    expect(result).toEqual({
      ok: true,
      value: { entered_name: "bugle", where_to_buy: "https://example.com", notes: "line one\nline two" },
    });
  });

  it("enforces each limit at the boundary, after trimming", () => {
    const { name, whereToBuy, notes } = MANUAL_ITEM_LIMITS;
    expect(validateManualItemInput({ name: `  ${"a".repeat(name)}  ` }).ok).toBe(true);
    expect(validateManualItemInput({ name: "a".repeat(name + 1) }).ok).toBe(false);

    expect(validateManualItemInput({ name: "x", whereToBuy: "a".repeat(whereToBuy) }).ok).toBe(true);
    expect(validateManualItemInput({ name: "x", whereToBuy: "a".repeat(whereToBuy + 1) }).ok).toBe(false);

    expect(validateManualItemInput({ name: "x", notes: "a".repeat(notes) }).ok).toBe(true);
    expect(validateManualItemInput({ name: "x", notes: "a".repeat(notes + 1) }).ok).toBe(false);
  });
});

describe("plantNameFromShoppingItem", () => {
  it("splits a scheme item's binomial", () => {
    expect(plantNameFromShoppingItem({ source: "scheme", species: "Verbena bonariensis" })).toEqual({
      genus: "Verbena",
      species: "bonariensis",
    });
  });

  it("treats a row with no source (pre-migration) as a scheme item", () => {
    expect(plantNameFromShoppingItem({ species: "Verbena bonariensis" })).toEqual({
      genus: "Verbena",
      species: "bonariensis",
    });
  });

  it("uses a manual item's resolved genus and species", () => {
    expect(
      plantNameFromShoppingItem({ source: "manual", genus: "ajuga", species: "Reptans", entered_name: "bugle" })
    ).toEqual({ genus: "Ajuga", species: "reptans" });
  });

  it("tolerates a resolved species stored as the full binomial", () => {
    expect(
      plantNameFromShoppingItem({ source: "manual", genus: "Ajuga", species: "Ajuga reptans", entered_name: "bugle" })
    ).toEqual({ genus: "Ajuga", species: "reptans" });
  });

  it("allows a genus-only resolution", () => {
    expect(
      plantNameFromShoppingItem({ source: "manual", genus: "Hydrangea", species: null, entered_name: "hydrangea" })
    ).toEqual({ genus: "Hydrangea", species: null });
  });

  it("an unresolved manual item goes in by its typed name with a blank genus", () => {
    expect(
      plantNameFromShoppingItem({ source: "manual", genus: null, species: null, entered_name: "Bugle" })
    ).toEqual({ genus: "", species: "bugle" });
  });
});

describe("toShoppingListItemData", () => {
  const ROW = {
    id: "item-1",
    scheme_id: "scheme-1",
    species: "Verbena bonariensis",
    cultivar: null,
    common_names: ["Purpletop vervain"],
    thumbnail_storage_path: null,
    wikimedia_attribution: null,
    created_at: "2026-10-01T00:00:00Z",
    schemes: { id: "scheme-1", name: "Front border" },
  };

  it("defaults a missing source to 'scheme' and the new fields to null", () => {
    expect(toShoppingListItemData(ROW, null)).toMatchObject({
      source: "scheme",
      entered_name: null,
      notes: null,
      where_to_buy: null,
      lookup_status: null,
      scheme_name: "Front border",
    });
  });

  it("passes a manual row through", () => {
    expect(
      toShoppingListItemData(
        { ...ROW, source: "manual", scheme_id: null, species: null, entered_name: "bugle", schemes: null },
        null
      )
    ).toMatchObject({ source: "manual", species: null, entered_name: "bugle", scheme_name: null });
  });
});

// shopping_list_items.species means different things by source: the whole
// binomial for a scheme item, the epithet only for a manual one.
describe("names by source", () => {
  const scheme = { source: "scheme" as const, species: "Verbena bonariensis", cultivar: null, common_names: ["Purpletop vervain"] };
  const resolved = {
    source: "manual" as const,
    genus: "Salvia",
    species: "nemorosa",
    cultivar: "Caradonna",
    common_names: ["Balkan clary"],
    entered_name: "sal via car a dona",
  };
  const unresolved = { source: "manual" as const, genus: null, species: null, entered_name: "sal via car a dona" };

  it("formatLatinName joins genus and epithet, spacing the hybrid mark", () => {
    expect(formatLatinName("Salvia", "nemorosa")).toBe("Salvia nemorosa");
    expect(formatLatinName("Euphorbia", "×martini")).toBe("Euphorbia × martini");
    expect(formatLatinName("Hosta", null)).toBe("Hosta");
  });

  it("shoppingItemLatinName: scheme items give their species as is", () => {
    expect(shoppingItemLatinName(scheme)).toBe("Verbena bonariensis");
    expect(shoppingItemLatinName({ species: "Verbena bonariensis" })).toBe("Verbena bonariensis");
  });

  it("shoppingItemLatinName: manual items join genus and epithet, and have none until resolved", () => {
    expect(shoppingItemLatinName(resolved)).toBe("Salvia nemorosa");
    expect(shoppingItemLatinName({ source: "manual", genus: "Heuchera", species: null })).toBe("Heuchera");
    expect(shoppingItemLatinName(unresolved)).toBeNull();
    // An epithet with no genus is not a name.
    expect(shoppingItemLatinName({ source: "manual", genus: null, species: "nemorosa" })).toBeNull();
  });

  it("an unresolved manual item leads with what was typed, upright, with nothing else", () => {
    expect(manualItemNames(unresolved)).toEqual({
      primary: "sal via car a dona",
      primaryIsLatin: false,
      cultivar: null,
      secondary: null,
      secondaryIsLatin: false,
      notedAs: null,
    });
  });

  it("a resolved manual item leads with the Latin name and keeps the original as 'noted as'", () => {
    expect(manualItemNames(resolved)).toEqual({
      primary: "Salvia nemorosa",
      primaryIsLatin: true,
      cultivar: "Caradonna",
      secondary: "Balkan clary",
      secondaryIsLatin: false,
      notedAs: "sal via car a dona",
    });
  });

  it("no 'noted as' when what was typed is the resolved name, bar case, spacing, quotes or x for ×", () => {
    const same = (entered: string, item: object) =>
      manualItemNames({ ...resolved, ...item, entered_name: entered }).notedAs;
    expect(same("salvia nemorosa caradonna", {})).toBeNull();
    expect(same("Salvia nemorosa 'Caradonna'", {})).toBeNull();
    expect(same("geranium x magnificum", { genus: "Geranium", species: "×magnificum", cultivar: null })).toBeNull();
    expect(same("Salvia nemorosa", {})).toBe("Salvia nemorosa");
  });

  it("when a common name was typed, it stays the headline with the Latin underneath", () => {
    expect(
      manualItemNames({
        source: "manual",
        genus: "Ajuga",
        species: "reptans",
        cultivar: null,
        common_names: ["Bugle", "Carpet bugle"],
        entered_name: "bugle",
      })
    ).toEqual({
      primary: "Bugle",
      primaryIsLatin: false,
      cultivar: null,
      secondary: "Ajuga reptans",
      secondaryIsLatin: true,
      notedAs: null,
    });
  });

  it("shoppingItemDisplayName follows the card: resolved name for a resolved manual item", () => {
    expect(shoppingItemDisplayName(resolved)).toBe("Salvia nemorosa 'Caradonna'");
    expect(shoppingItemDisplayName(unresolved)).toBe("sal via car a dona");
    expect(
      shoppingItemDisplayName({ source: "manual", genus: "Ajuga", species: "reptans", common_names: ["Bugle"], entered_name: "bugle" })
    ).toBe("Bugle");
    expect(shoppingItemDisplayName(scheme)).toBe("Purpletop vervain");
  });

  it("plantNameFromShoppingItem: scheme binomial is split; manual genus and epithet pass through", () => {
    expect(plantNameFromShoppingItem(scheme)).toEqual({ genus: "Verbena", species: "bonariensis" });
    expect(plantNameFromShoppingItem(resolved)).toEqual({ genus: "Salvia", species: "nemorosa" });
    expect(plantNameFromShoppingItem({ source: "manual", genus: "Euphorbia", species: "×martini" })).toEqual({
      genus: "Euphorbia",
      species: "×martini",
    });
    expect(plantNameFromShoppingItem(unresolved)).toEqual({ genus: "", species: "sal via car a dona" });
  });
});

describe("parseLookupCandidates", () => {
  it("reads stored candidates and ignores anything malformed", () => {
    expect(
      parseLookupCandidates([
        { genus: "Salvia", species: "nemorosa", cultivar: "Caradonna", common_names: ["Balkan clary", 3], growth_type: "perennial", unmatched_text: null },
        { species: "no genus" },
        "nonsense",
        { genus: "Echinacea", species: "purpurea", unmatched_text: "Midnight Thunderclap" },
      ])
    ).toEqual([
      { genus: "Salvia", species: "nemorosa", cultivar: "Caradonna", common_names: ["Balkan clary"], growth_type: "perennial", unmatched_text: null },
      { genus: "Echinacea", species: "purpurea", cultivar: null, common_names: [], growth_type: null, unmatched_text: "Midnight Thunderclap" },
    ]);
  });

  it("treats null, an object or a string as no candidates", () => {
    expect(parseLookupCandidates(null)).toEqual([]);
    expect(parseLookupCandidates(undefined)).toEqual([]);
    expect(parseLookupCandidates({ genus: "Salvia" })).toEqual([]);
    expect(parseLookupCandidates("[]")).toEqual([]);
  });

  it("toShoppingListItemData exposes them, and an empty list when there are none", () => {
    const row = { id: "1", scheme_id: null, species: null, cultivar: null, common_names: null, thumbnail_storage_path: null, wikimedia_attribution: null, created_at: "2026-10-01T00:00:00Z" };
    expect(toShoppingListItemData({ ...row, source: "manual", entered_name: "x", lookup_candidates: [{ genus: "Hosta" }] }, null).lookup_candidates).toHaveLength(1);
    expect(toShoppingListItemData(row, null).lookup_candidates).toEqual([]);
  });
});

describe("isStalePending", () => {
  const now = Date.parse("2026-10-07T12:00:00Z");
  it("is only ever true for a pending lookup past ten minutes", () => {
    expect(isStalePending({ lookup_status: "pending", lookup_requested_at: "2026-10-07T11:55:00Z" }, now)).toBe(false);
    expect(isStalePending({ lookup_status: "pending", lookup_requested_at: "2026-10-07T11:49:59Z" }, now)).toBe(true);
    expect(isStalePending({ lookup_status: "pending", lookup_requested_at: null }, now)).toBe(true);
    expect(isStalePending({ lookup_status: "complete", lookup_requested_at: "2026-10-01T00:00:00Z" }, now)).toBe(false);
    expect(isStalePending({ lookup_status: null }, now)).toBe(false);
  });
});
