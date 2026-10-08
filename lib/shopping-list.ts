import { sanitizeGenus, sanitizePlantName, sanitizeSpecies } from "@/lib/sanitize";
import { parseScientificName } from "@/lib/identification/name";
import { LOOKUP_PENDING_STALE_MS } from "@/lib/shopping-lookup/timing";

// No server-only imports here: ShoppingList.tsx (a client component) uses the
// display-name and link helpers, and the server action uses the validation.

export type ShoppingListItemSource = "scheme" | "manual";

export type ShoppingListLookupStatus = "pending" | "complete" | "not_found" | "failed";

export type ShoppingListSummaryScope = "cultivar" | "species" | "genus";

/**
 * A plant the lookup thinks a manual item might be, kept on the row until the
 * user picks one or keeps the name as typed. Same naming rules as a resolved
 * manual item: genus and epithet in separate fields.
 */
export type ShoppingListCandidate = {
  genus: string;
  species: string | null;
  cultivar: string | null;
  common_names: string[];
  growth_type: string | null;
  /** Words from the user's own note that this candidate doesn't account for. */
  unmatched_text: string | null;
};

export type ShoppingListItemData = {
  id: string;
  source: ShoppingListItemSource;
  scheme_id: string | null;
  /** Manual items only: the resolved genus. Null until a lookup resolves one. */
  genus: string | null;
  /**
   * NOT the same thing for both sources. Scheme items: the full binomial
   * ("Verbena bonariensis"). Manual items: the epithet only ("bonariensis",
   * "×martini"), with the genus in `genus`; null until resolved, and null
   * for a genus-level match. Read it through shoppingItemLatinName.
   */
  species: string | null;
  cultivar: string | null;
  common_names: string[] | null;
  summary: string | null;
  summary_scope: ShoppingListSummaryScope | null;
  /** Non-empty only while a "could this be…?" choice is waiting on the user. */
  lookup_candidates: ShoppingListCandidate[];
  /** Manual items only — what the user typed. */
  entered_name: string | null;
  notes: string | null;
  where_to_buy: string | null;
  /**
   * Null until a lookup has been started for the item (never, for scheme
   * items). A pending lookup older than LOOKUP_PENDING_STALE_MS is reported
   * here as "failed": whatever was running is not coming back.
   */
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
  genus?: string | null;
  species: string | null;
  cultivar: string | null;
  common_names: string[] | null;
  entered_name?: string | null;
  notes?: string | null;
  where_to_buy?: string | null;
  summary?: string | null;
  summary_scope?: ShoppingListSummaryScope | null;
  lookup_status?: ShoppingListLookupStatus | null;
  lookup_requested_at?: string | null;
  lookup_candidates?: unknown;
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
  thumbnailUrl: string | null,
  /** Server-side "now", for the stale-pending check. */
  now: number = Date.now()
): ShoppingListItemData {
  const scheme = Array.isArray(row.schemes) ? row.schemes[0] : row.schemes;
  return {
    id: row.id,
    source: row.source ?? "scheme",
    scheme_id: row.scheme_id,
    genus: row.genus ?? null,
    species: row.species,
    cultivar: row.cultivar,
    common_names: row.common_names,
    summary: row.summary ?? null,
    summary_scope: row.summary_scope ?? null,
    lookup_candidates: parseLookupCandidates(row.lookup_candidates),
    entered_name: row.entered_name ?? null,
    notes: row.notes ?? null,
    where_to_buy: row.where_to_buy ?? null,
    lookup_status: isStalePending(row, now) ? "failed" : (row.lookup_status ?? null),
    thumbnail_url: thumbnailUrl,
    thumbnail_storage_path: row.thumbnail_storage_path,
    wikimedia_attribution: row.wikimedia_attribution,
    created_at: row.created_at,
    scheme_name: scheme?.name ?? null,
  };
}

/** True for a lookup that was started but has been pending too long to still be running. */
export function isStalePending(
  row: { lookup_status?: string | null; lookup_requested_at?: string | null },
  now: number
): boolean {
  if (row.lookup_status !== "pending") return false;
  const requested = row.lookup_requested_at ? Date.parse(row.lookup_requested_at) : NaN;
  return Number.isNaN(requested) || now - requested > LOOKUP_PENDING_STALE_MS;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** shopping_list_items.lookup_candidates (jsonb) → candidates, ignoring anything malformed. */
export function parseLookupCandidates(value: unknown): ShoppingListCandidate[] {
  if (!Array.isArray(value)) return [];
  const candidates: ShoppingListCandidate[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const c = entry as Record<string, unknown>;
    const genus = textOrNull(c.genus);
    if (!genus) continue;
    candidates.push({
      genus,
      species: textOrNull(c.species),
      cultivar: textOrNull(c.cultivar),
      common_names: Array.isArray(c.common_names)
        ? c.common_names.filter((n): n is string => typeof n === "string" && !!n.trim())
        : [],
      growth_type: textOrNull(c.growth_type),
      unmatched_text: textOrNull(c.unmatched_text),
    });
  }
  return candidates;
}

/** "Euphorbia" + "×martini" → "Euphorbia × martini". Genus and epithet in separate fields. */
export function formatLatinName(genus: string, epithet: string | null | undefined): string {
  const species = epithet?.trim();
  return species ? `${genus} ${species.replace(/^×\s*/, "× ")}` : genus;
}

type NamedItem = {
  source?: ShoppingListItemSource | null;
  genus?: string | null;
  species?: string | null;
  cultivar?: string | null;
  common_names?: string[] | null;
  entered_name?: string | null;
};

/** A manual item the lookup (or the user, by accepting a suggestion) has put a plant name to. */
export function isResolvedManualItem(item: NamedItem): boolean {
  return item.source === "manual" && !!item.genus?.trim();
}

/**
 * The item's Latin name, or null if it has none. The one place that knows
 * `species` means different things by source: the whole binomial for a
 * scheme item, only the epithet (genus in its own column) for a manual one.
 */
export function shoppingItemLatinName(item: NamedItem): string | null {
  if (item.source === "manual") {
    const genus = item.genus?.trim();
    return genus ? formatLatinName(genus, item.species) : null;
  }
  return item.species?.trim() || null;
}

// For comparing what was typed with a name: case, spacing, quotes and the
// hybrid mark ("x" or "×") don't make two names different.
function comparable(text: string): string {
  return text
    .toLowerCase()
    .replace(/×/g, " ")
    .replace(/\bx\b/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export type ShoppingItemNames = {
  /** The name the card leads with. */
  primary: string;
  /** Latin is set italic; a common name or typed text is not. */
  primaryIsLatin: boolean;
  /** Shown upright in quotes after whichever line is Latin. */
  cultivar: string | null;
  secondary: string | null;
  secondaryIsLatin: boolean;
  /** What the user originally typed, when the card now leads with something else. */
  notedAs: string | null;
};

/**
 * How a manual item's names are laid out on a card.
 *
 * Unresolved: just what was typed. Resolved: if the user typed one of the
 * plant's common names, that stays the headline with the Latin underneath;
 * otherwise the Latin name leads, with "noted as" keeping the original text
 * in view whenever it differs. entered_name itself is never changed.
 */
export function manualItemNames(item: NamedItem): ShoppingItemNames {
  const entered = item.entered_name?.trim() ?? "";
  const latin = shoppingItemLatinName(item);
  const cultivar = item.cultivar?.trim() || null;

  if (!isResolvedManualItem(item) || !latin) {
    return {
      primary: entered,
      primaryIsLatin: false,
      cultivar: null,
      secondary: null,
      secondaryIsLatin: false,
      notedAs: null,
    };
  }

  const commonNames = (item.common_names ?? []).map((n) => n?.trim()).filter(Boolean);
  const typedCommon = commonNames.find((n) => comparable(n) === comparable(entered));
  if (typedCommon) {
    return {
      primary: typedCommon,
      primaryIsLatin: false,
      cultivar,
      secondary: latin,
      secondaryIsLatin: true,
      notedAs: null,
    };
  }

  const full = cultivar ? `${latin} ${cultivar}` : latin;
  return {
    primary: latin,
    primaryIsLatin: true,
    cultivar,
    secondary: commonNames.length ? commonNames.join(", ") : null,
    secondaryIsLatin: false,
    notedAs: entered && comparable(entered) !== comparable(full) ? entered : null,
  };
}

/**
 * The one plain-text name for an item: alt text, dialogs, the dashboard.
 *
 * A resolved manual item goes by the name its card leads with (the Latin
 * name with its cultivar, or the common name the user typed). Everything
 * else: what the user typed, then the first common name, then the Latin name.
 */
export function shoppingItemDisplayName(item: NamedItem): string {
  if (isResolvedManualItem(item)) {
    const names = manualItemNames(item);
    return names.primaryIsLatin && names.cultivar
      ? `${names.primary} '${names.cultivar}'`
      : names.primary;
  }
  return (
    item.entered_name?.trim() ||
    item.common_names?.find((name) => name?.trim())?.trim() ||
    shoppingItemLatinName(item) ||
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
