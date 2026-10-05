import { describe, it, expect } from "vitest";
import {
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
