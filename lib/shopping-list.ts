import { sanitizeGenus, sanitizePlantName, sanitizeSpecies } from "@/lib/sanitize";
import { parseScientificName } from "@/lib/identification/name";

// No server-only imports here: ShoppingList.tsx (a client component) uses the
// display-name and link helpers, and the server action uses the validation.

export type ShoppingListItemSource = "scheme" | "manual";

export type ShoppingListLookupStatus = "pending" | "complete" | "not_found" | "failed";

export type ShoppingListItemData = {
  id: string;
  source: ShoppingListItemSource;
  scheme_id: string | null;
  /** Scheme items: the full binomial. Manual items: null until a lookup resolves one. */
  species: string | null;
  cultivar: string | null;
  common_names: string[] | null;
  /** Manual items only — what the user typed. */
  entered_name: string | null;
  notes: string | null;
  where_to_buy: string | null;
  /** Null until a lookup has been started for the item (never, for scheme items). */
  lookup_status: ShoppingListLookupStatus | null;
  thumbnail_url: string | null;
  thumbnail_storage_path: string | null;
  wikimedia_attribution: string | null;
  created_at: string;
  scheme_name: string | null;
};

type SchemeJoin = { id: string; name: string | null };

/** A shopping_list_items row as selected, optionally with its scheme joined. */
export type ShoppingListItemRow = {
  id: string;
  source?: ShoppingListItemSource | null;
  scheme_id: string | null;
  species: string | null;
  cultivar: string | null;
  common_names: string[] | null;
  entered_name?: string | null;
  notes?: string | null;
  where_to_buy?: string | null;
  lookup_status?: ShoppingListLookupStatus | null;
  thumbnail_storage_path: string | null;
  wikimedia_attribution: string | null;
  created_at: string;
  schemes?: SchemeJoin | SchemeJoin[] | null;
};

/**
 * Row → what the cards render. A missing `source` is read as 'scheme' so the
 * list still renders if this code runs before migration 035 has been applied.
 */
export function toShoppingListItemData(
  row: ShoppingListItemRow,
  thumbnailUrl: string | null
): ShoppingListItemData {
  const scheme = Array.isArray(row.schemes) ? row.schemes[0] : row.schemes;
  return {
    id: row.id,
    source: row.source ?? "scheme",
    scheme_id: row.scheme_id,
    species: row.species,
    cultivar: row.cultivar,
    common_names: row.common_names,
    entered_name: row.entered_name ?? null,
    notes: row.notes ?? null,
    where_to_buy: row.where_to_buy ?? null,
    lookup_status: row.lookup_status ?? null,
    thumbnail_url: thumbnailUrl,
    thumbnail_storage_path: row.thumbnail_storage_path,
    wikimedia_attribution: row.wikimedia_attribution,
    created_at: row.created_at,
    scheme_name: scheme?.name ?? null,
  };
}

/**
 * The one name every shopping list card leads with: what the user typed,
 * then the first common name, then the Latin name.
 */
export function shoppingItemDisplayName(item: {
  entered_name?: string | null;
  common_names?: string[] | null;
  species?: string | null;
}): string {
  return (
    item.entered_name?.trim() ||
    item.common_names?.find((name) => name?.trim())?.trim() ||
    item.species?.trim() ||
    ""
  );
}

/**
 * The href to link `where_to_buy` to, or null when it should stay plain text.
 * Only a value that is, in its entirety, an http(s) URL qualifies — never
 * javascript:, data:, mailto: or anything else, and not a URL buried in a
 * longer note ("RHS Wisley https://…").
 */
export function parseHttpUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname ? url.href : null;
  } catch {
    return null;
  }
}

export const MANUAL_ITEM_LIMITS = {
  name: 120,
  whereToBuy: 200,
  notes: 1000,
} as const;

export type ManualItemInput = {
  name: string;
  whereToBuy?: string | null;
  notes?: string | null;
};

type ManualItemValidation =
  | {
      ok: true;
      value: { entered_name: string; where_to_buy: string | null; notes: string | null };
    }
  | { ok: false; error: string };

/**
 * Trim and bound a manual item. Lengths are checked after trimming. The name
 * and where-to-buy are single-line (invisible characters stripped, runs of
 * spaces collapsed); notes keep their line breaks.
 */
export function validateManualItemInput(raw: {
  name?: unknown;
  whereToBuy?: unknown;
  notes?: unknown;
}): ManualItemValidation {
  const name = typeof raw.name === "string" ? sanitizePlantName(raw.name) : "";
  const whereToBuy = typeof raw.whereToBuy === "string" ? sanitizePlantName(raw.whereToBuy) : "";
  const notes = typeof raw.notes === "string" ? raw.notes.trim() : "";

  if (!name) return { ok: false, error: "Enter a plant name." };
  if (name.length > MANUAL_ITEM_LIMITS.name) {
    return { ok: false, error: `Plant name must be ${MANUAL_ITEM_LIMITS.name} characters or fewer.` };
  }
  if (whereToBuy.length > MANUAL_ITEM_LIMITS.whereToBuy) {
    return { ok: false, error: `Where to buy must be ${MANUAL_ITEM_LIMITS.whereToBuy} characters or fewer.` };
  }
  if (notes.length > MANUAL_ITEM_LIMITS.notes) {
    return { ok: false, error: `Notes must be ${MANUAL_ITEM_LIMITS.notes} characters or fewer.` };
  }

  return {
    ok: true,
    value: { entered_name: name, where_to_buy: whereToBuy || null, notes: notes || null },
  };
}

/**
 * The genus / species a purchased item becomes a plant with.
 *
 * Scheme items store the full binomial in `species` ("Verbena bonariensis");
 * plants keep genus and epithet in separate columns.
 *
 * Manual items: once a lookup has resolved a genus, use it (with the epithet,
 * tolerating a binomial in `species`). Until then there is only free text, so
 * it goes in as the name with a blank genus — exactly what garden manual add
 * sends — and the plant lookup corrects it. The blank genus is what makes the
 * purchase path's requireGenus guard skip species_reference enrichment.
 */
export function plantNameFromShoppingItem(item: {
  source?: ShoppingListItemSource | null;
  genus?: string | null;
  species?: string | null;
  entered_name?: string | null;
}): { genus: string; species: string | null } {
  if (item.source !== "manual") return parseScientificName(item.species ?? "");

  const genus = sanitizeGenus(item.genus ?? "");
  if (!genus) {
    return { genus: "", species: sanitizeSpecies(item.entered_name ?? "") || null };
  }

  let species = sanitizeSpecies(item.species ?? "");
  const prefix = `${genus.toLowerCase()} `;
  if (species.startsWith(prefix)) species = species.slice(prefix.length).trim();
  return { genus, species: species || null };
}
