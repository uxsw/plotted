import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShoppingListCandidate } from "@/lib/shopping-list";
import { createBearerClient, type createClient } from "@/lib/supabase/server";
import { WIKIMEDIA_USER_AGENT, type WikimediaImage } from "@/lib/wikimedia";
import {
  LOOKUP_BUDGET_MS,
  describeCandidate,
  lookupPlantByName,
  type CandidateDetails,
  type VerifiedCandidate,
} from "./lookup";
import { MAX_KNOWN_PLANTS, type ResolverCandidate } from "./resolver";
import { LOOKUP_PENDING_STALE_MS, MAX_CONCURRENT_LOOKUPS } from "./timing";

// The database half of the shopping list name lookup: claim an item, run the
// lookup, write what it found. Called from after() — nothing here throws, and
// nothing here waits on the user's request.
//
// Deliberately NOT in app/actions/shopping-list.ts: every export of a
// "use server" file becomes a client-callable Server Function.
//
// Isolation: this path never reads or writes species_reference and never
// calls performLookup or enrichSpeciesReference.

const TABLE = "shopping_list_items";
const IMAGE_FETCH_TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Any Supabase client acting as the user (RLS applies). Callers running in
// after() pass a bearer-token client: it needs no cookie store, which a
// Server Component's after() callback is not allowed to touch.
type Db = SupabaseClient;

/**
 * A client for work that outlives the request (after()). Same user, same
 * RLS, but authenticated by the session's access token rather than the
 * cookie store. Null if there is no session to borrow.
 */
export async function userClientForBackground(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Db | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? createBearerClient(data.session.access_token) : null;
}

/** An item whose lookup this process now owns. `token` is the lookup_requested_at it wrote. */
export type ClaimedLookup = { id: string; entered_name: string; token: string };

function staleCutoff(): string {
  return new Date(Date.now() - LOOKUP_PENDING_STALE_MS).toISOString();
}

/**
 * How many more lookups this user may start right now. Abuse and cost guard:
 * adding fifty names at once queues them rather than running fifty lookups.
 */
export async function lookupSlotsFree(db: Db, userId: string): Promise<number> {
  const { count, error } = await db
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("lookup_status", "pending")
    .gt("lookup_requested_at", staleCutoff());
  if (error) return 0;
  return Math.max(0, MAX_CONCURRENT_LOOKUPS - (count ?? 0));
}

/**
 * Marks a not-yet-looked-up manual item as pending, atomically: the update
 * only matches while lookup_status is still null, so two requests racing for
 * the same item (a page load and a poll, say) can't both start a lookup.
 * Returns null if there is no room, or someone else got there first.
 */
export async function claimLookup(
  db: Db,
  userId: string,
  itemId: string
): Promise<ClaimedLookup | null> {
  if ((await lookupSlotsFree(db, userId)) === 0) return null;

  const token = new Date().toISOString();
  const { data, error } = await db
    .from(TABLE)
    .update({ lookup_status: "pending", lookup_requested_at: token })
    .eq("id", itemId)
    .eq("user_id", userId)
    .eq("source", "manual")
    .is("lookup_status", null)
    .select("id, entered_name, lookup_requested_at")
    .maybeSingle();

  if (error || !data?.entered_name) return null;
  return { id: data.id, entered_name: data.entered_name, token: data.lookup_requested_at };
}

function nameOf(plant: {
  genus?: string | null;
  species?: string | null;
  cultivar?: string | null;
}): string {
  return [plant.genus, plant.species, plant.cultivar ? `'${plant.cultivar}'` : null]
    .filter(Boolean)
    .join(" ");
}

/** The user's own plants and wants, as weak priors for the resolver. Capped; never fails the lookup. */
async function loadKnownPlants(db: Db, userId: string, excludeItemId: string): Promise<string[]> {
  try {
    const [plants, items] = await Promise.all([
      db
        .from("plants")
        .select("genus, species, cultivar")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      db
        .from(TABLE)
        .select("id, source, genus, species, cultivar, entered_name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const names = new Set<string>();
    for (const plant of plants.data ?? []) names.add(nameOf(plant));
    for (const item of items.data ?? []) {
      if (item.id === excludeItemId) continue;
      // Scheme items keep the whole binomial in `species`; manual items keep
      // genus and epithet apart, and have only the typed text until resolved.
      if (item.source === "manual") names.add(item.genus ? nameOf(item) : (item.entered_name ?? ""));
      else names.add(nameOf({ species: item.species, cultivar: item.cultivar }));
    }
    names.delete("");
    return [...names].slice(0, MAX_KNOWN_PLANTS);
  } catch {
    return [];
  }
}

/**
 * Copies a Wikimedia thumbnail into the user's folder of the plant-photos
 * bucket, as the scheme "add to shopping list" route does. Returns the
 * storage path, or null on any failure — a missing image never fails an item.
 */
async function snapshotImage(
  db: Db,
  userId: string,
  image: WikimediaImage,
  timeoutMs: number
): Promise<string | null> {
  if (timeoutMs < 500) return null;
  try {
    const res = await fetch(image.url, {
      headers: { "User-Agent": WIKIMEDIA_USER_AGENT },
      signal: AbortSignal.timeout(Math.min(IMAGE_FETCH_TIMEOUT_MS, timeoutMs)),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

    const ext = contentType.includes("png") ? "png" : "jpg";
    const path = `${userId}/shopping-list/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await db.storage
      .from("plant-photos")
      .upload(path, buffer, { contentType, upsert: false });
    if (error) {
      console.error("[shopping-lookup] image upload failed:", error.message);
      return null;
    }
    return path;
  } catch (err) {
    console.error("[shopping-lookup] image fetch failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function storedCandidate(candidate: VerifiedCandidate): ShoppingListCandidate {
  return {
    genus: candidate.genus,
    species: candidate.species,
    cultivar: candidate.cultivar,
    common_names: candidate.common_names,
    growth_type: candidate.growth_type,
    unmatched_text: candidate.unmatched_text,
  };
}

/** The columns a resolved plant fills in. */
export function resolvedFields(
  candidate: Pick<ShoppingListCandidate, "genus" | "species" | "cultivar" | "common_names" | "growth_type">
) {
  return {
    genus: candidate.genus,
    species: candidate.species,
    cultivar: candidate.cultivar,
    common_names: candidate.common_names,
    growth_type: candidate.growth_type,
  };
}

/**
 * Writes a lookup's result — but only if this lookup still owns the item:
 * the row must still be pending with the same lookup_requested_at the claim
 * wrote. If the user has since edited the name, retried, bought or deleted
 * the item, the write matches nothing and the result is dropped.
 */
async function finish(
  db: Db,
  userId: string,
  claim: Pick<ClaimedLookup, "id" | "token">,
  fields: Record<string, unknown>
): Promise<boolean> {
  const { data, error } = await db
    .from(TABLE)
    .update(fields)
    .eq("id", claim.id)
    .eq("user_id", userId)
    .eq("lookup_status", "pending")
    .eq("lookup_requested_at", claim.token)
    .select("id");
  if (error) console.error("[shopping-lookup] result write failed:", error.message);
  return !error && (data?.length ?? 0) > 0;
}

async function finishWithDetails(
  db: Db,
  userId: string,
  claim: Pick<ClaimedLookup, "id" | "token">,
  fields: Record<string, unknown>,
  details: CandidateDetails,
  deadline: number
): Promise<void> {
  const path = details.image
    ? await snapshotImage(db, userId, details.image, deadline - Date.now())
    : null;

  const written = await finish(db, userId, claim, {
    ...fields,
    summary: details.summary?.summary ?? null,
    summary_scope: details.summary?.summary_scope ?? null,
    ...(path
      ? { thumbnail_storage_path: path, wikimedia_attribution: details.image!.attribution }
      : {}),
    lookup_status: "complete",
  });

  // The item moved on while we were working: don't leave the snapshot behind.
  if (!written && path) await db.storage.from("plant-photos").remove([path]);
}

/**
 * Runs the lookup for a claimed item and writes the outcome.
 *
 * - One confident match: the resolved fields, summary and image are written.
 * - Plausible matches: stored as lookup_candidates for the user to choose from.
 * - Only guesses: complete, nothing shown.
 * - Nothing: not_found.
 * - An exception: failed (the user gets a quiet Retry).
 * entered_name is never written by any of them.
 */
export async function runClaimedLookup(db: Db, userId: string, claim: ClaimedLookup): Promise<void> {
  const deadline = Date.now() + LOOKUP_BUDGET_MS;
  try {
    const known = await loadKnownPlants(db, userId, claim.id);
    const { outcome } = await lookupPlantByName(claim.entered_name, known, {
      budgetMs: deadline - Date.now(),
    });

    if (outcome.kind === "resolved") {
      await finishWithDetails(
        db,
        userId,
        claim,
        { ...resolvedFields(outcome.candidate), lookup_confidence: "high", lookup_candidates: null },
        outcome.details,
        deadline
      );
    } else if (outcome.kind === "suggest") {
      await finish(db, userId, claim, {
        lookup_candidates: outcome.candidates.map(storedCandidate),
        lookup_confidence: "medium",
        lookup_status: "complete",
      });
    } else if (outcome.kind === "low") {
      await finish(db, userId, claim, { lookup_confidence: "low", lookup_status: "complete" });
    } else {
      await finish(db, userId, claim, { lookup_status: "not_found" });
    }
  } catch (err) {
    // The message only: an SDK error object can carry request details.
    console.error("[shopping-lookup] lookup failed:", err instanceof Error ? err.message : err);
    await finish(db, userId, claim, { lookup_status: "failed" });
  }
}

/**
 * After the user accepts a suggestion: its fields are already on the row
 * (written by the action, with the item set pending); this fetches the
 * summary and image for it. A failure here still completes the item.
 */
export async function runAcceptedCandidate(
  db: Db,
  userId: string,
  claim: Pick<ClaimedLookup, "id" | "token">,
  candidate: ShoppingListCandidate
): Promise<void> {
  const deadline = Date.now() + LOOKUP_BUDGET_MS;
  let details: CandidateDetails = { summary: null, image: null };
  try {
    details = await describeCandidate(
      { ...candidate, confidence: "high", partial_match: false } as ResolverCandidate,
      { budgetMs: LOOKUP_BUDGET_MS }
    );
  } catch (err) {
    console.error("[shopping-lookup] describe failed:", err instanceof Error ? err.message : err);
  }
  try {
    await finishWithDetails(db, userId, claim, {}, details, deadline);
  } catch (err) {
    console.error("[shopping-lookup] accept write failed:", err instanceof Error ? err.message : err);
    await finish(db, userId, claim, { lookup_status: "complete" });
  }
}

/**
 * Page-load pickup: starts lookups for manual items that have never had one
 * (everything captured before lookup shipped, anything queued behind the
 * concurrency cap, anything whose after() never ran). Returns the claims;
 * the caller runs them in after().
 */
export async function claimWaitingLookups(
  db: Db,
  userId: string,
  itemIds: string[]
): Promise<ClaimedLookup[]> {
  const claims: ClaimedLookup[] = [];
  for (const id of itemIds.slice(0, MAX_CONCURRENT_LOOKUPS)) {
    const claim = await claimLookup(db, userId, id);
    if (!claim) break;
    claims.push(claim);
  }
  return claims;
}
