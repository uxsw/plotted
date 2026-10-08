"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sanitizePlantName } from "@/lib/sanitize";
import { createPlantWithLookup } from "@/lib/plant-create";
import {
  parseLookupCandidates,
  plantNameFromShoppingItem,
  toShoppingListItemData,
  validateManualItemInput,
  type ManualItemInput,
  type ShoppingListItemData,
} from "@/lib/shopping-list";
import {
  claimLookup,
  resolvedFields,
  runAcceptedCandidate,
  runClaimedLookup,
  userClientForBackground,
  type ClaimedLookup,
} from "@/lib/shopping-lookup/run";
import { LOOKUP_PENDING_STALE_MS } from "@/lib/shopping-lookup/timing";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Starts the background name lookup for a manual item, if the user has a
 * lookup slot free; otherwise the item keeps its null status and the
 * shopping list page picks it up on a later load. Never throws: capturing,
 * editing or retrying an item must not depend on the lookup starting.
 *
 * The lookup runs in after(), once the response has gone. It does not (and
 * cannot) push its result to an open page — the list polls for that; see
 * CLAUDE.md on revalidatePath inside after().
 */
async function startLookup(
  supabase: SupabaseServerClient,
  userId: string,
  itemId: string
): Promise<ClaimedLookup | null> {
  try {
    const db = await userClientForBackground(supabase);
    if (!db) return null;
    const claim = await claimLookup(supabase, userId, itemId);
    if (!claim) return null;
    after(() => runClaimedLookup(db, userId, claim));
    return claim;
  } catch (err) {
    console.error("[shopping-list] lookup start failed:", err);
    return null;
  }
}

// Everything a lookup writes, blanked — for when the name it was based on
// changes, or the lookup is run again from scratch.
const CLEARED_LOOKUP = {
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
} as const;

export async function markShoppingListNoticeSeen(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_flags")
    .upsert(
      { user_id: user.id, shopping_list_notice_seen_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}

export async function deleteShoppingListItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: item } = await supabase
    .from("shopping_list_items")
    .select("thumbnail_storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!item) return { error: "Not found" };

  // Best-effort storage delete — a dangling file is preferable to blocking the
  // row delete on a storage error.
  if (item.thumbnail_storage_path) {
    const { error: storageError } = await supabase.storage
      .from("plant-photos")
      .remove([item.thumbnail_storage_path]);
    if (storageError) {
      console.error("[shopping-list] storage delete failed:", storageError);
    }
  }

  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * Add a plant to the shopping list by name (docs/specs/shopping-list-manual-add.md §2).
 *
 * Capture never waits on the lookup: the row is inserted and returned, and
 * the name lookup (§3) is started in after(). If it can't start now (no
 * lookup slot free), lookup_status stays null and the shopping list page
 * picks the item up later. Duplicates are allowed, so there is no existence
 * check.
 */
export async function createManualShoppingListItem(
  input: ManualItemInput
): Promise<{ item: ShoppingListItemData } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const validated = validateManualItemInput(input ?? {});
  if (!validated.ok) return { error: validated.error };

  const { data: row, error } = await supabase
    .from("shopping_list_items")
    .insert({
      user_id: user.id,
      source: "manual",
      ...validated.value,
    })
    .select("*")
    .single();

  if (error || !row) {
    console.error("[shopping-list] manual insert failed:", error);
    return { error: "Couldn't add that to your shopping list — please try again." };
  }

  const claim = await startLookup(supabase, user.id, row.id);

  revalidatePath("/shopping-list");
  revalidatePath("/dashboard");

  return {
    item: toShoppingListItemData(
      claim ? { ...row, lookup_status: "pending", lookup_requested_at: claim.token } : row,
      null
    ),
  };
}

/**
 * Change what a manual item is called. This is the user rewriting their own
 * note, so entered_name does change here — and everything the previous
 * lookup worked out from the old text (names, summary, image, suggestions)
 * is cleared before the lookup runs again from the new text.
 */
export async function updateManualItemName(
  itemId: string,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const validated = validateManualItemInput({ name });
  if (!validated.ok) return { error: validated.error };
  const enteredName = validated.value.entered_name;

  const { data: item } = await supabase
    .from("shopping_list_items")
    .select("id, entered_name, thumbnail_storage_path")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("source", "manual")
    .maybeSingle();
  if (!item) return { error: "Item not found" };
  if (item.entered_name === enteredName) return {};

  const { error } = await supabase
    .from("shopping_list_items")
    .update({
      entered_name: enteredName,
      ...CLEARED_LOOKUP,
      thumbnail_storage_path: null,
      wikimedia_attribution: null,
    })
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) {
    console.error("[shopping-list] rename failed:", error);
    return { error: "Couldn't change that name — please try again." };
  }

  if (item.thumbnail_storage_path) {
    const { error: storageError } = await supabase.storage
      .from("plant-photos")
      .remove([item.thumbnail_storage_path]);
    if (storageError) console.error("[shopping-list] old image delete failed:", storageError);
  }

  await startLookup(supabase, user.id, itemId);
  revalidatePath("/shopping-list");
  revalidatePath("/dashboard");
  return {};
}

/**
 * Run the lookup again for an item whose lookup failed, or has been pending
 * so long it must have died. Starts from scratch, from the typed name.
 */
export async function retryShoppingItemLookup(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const cutoff = new Date(Date.now() - LOOKUP_PENDING_STALE_MS).toISOString();
  const { data: reset, error } = await supabase
    .from("shopping_list_items")
    .update(CLEARED_LOOKUP)
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("source", "manual")
    .or(`lookup_status.eq.failed,and(lookup_status.eq.pending,lookup_requested_at.lt."${cutoff}")`)
    .select("id");
  if (error) {
    console.error("[shopping-list] retry reset failed:", error);
    return { error: "Couldn't retry — please try again." };
  }

  // Nothing matched: the item isn't in a retryable state (already running,
  // already done, or gone). Not an error worth showing.
  if (reset?.length) await startLookup(supabase, user.id, itemId);
  revalidatePath("/shopping-list");
  return {};
}

/**
 * "Could this be…?" → yes, that one. The chosen plant's names are written
 * straight away (this is the user's explicit choice; entered_name is left as
 * it was), and its summary and image are fetched in the background.
 */
export async function acceptShoppingItemCandidate(
  itemId: string,
  candidateIndex: number
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: item } = await supabase
    .from("shopping_list_items")
    .select("id, lookup_candidates")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("source", "manual")
    .maybeSingle();
  const candidate = parseLookupCandidates(item?.lookup_candidates)[candidateIndex];
  if (!item || !candidate) return { error: "That suggestion is no longer available." };

  const db = await userClientForBackground(supabase);
  const { data: updated, error } = await supabase
    .from("shopping_list_items")
    .update({
      ...resolvedFields(candidate),
      lookup_confidence: "high",
      lookup_candidates: null,
      summary: null,
      summary_scope: null,
      // With a background client: pending while the summary and image are
      // fetched. Without one there is nothing to wait for.
      lookup_status: db ? "pending" : "complete",
      lookup_requested_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .not("lookup_candidates", "is", null)
    .select("id, lookup_requested_at")
    .maybeSingle();
  if (error || !updated) {
    if (error) console.error("[shopping-list] accept failed:", error);
    return { error: "Couldn't save that — please try again." };
  }

  if (db) {
    const claim = { id: updated.id, token: updated.lookup_requested_at };
    after(() => runAcceptedCandidate(db, user.id, claim, candidate));
  }
  revalidatePath("/shopping-list");
  revalidatePath("/dashboard");
  return {};
}

/** "Could this be…?" → no, keep what I typed. Clears the suggestions; nothing else changes. */
export async function keepShoppingItemAsTyped(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("shopping_list_items")
    .update({ lookup_candidates: null })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("source", "manual");
  if (error) {
    console.error("[shopping-list] keep-as-typed failed:", error);
    return { error: "Couldn't save that — please try again." };
  }
  revalidatePath("/shopping-list");
  return {};
}

type PurchaseResult =
  | { plantId: string }
  | { error: string };

/**
 * "Yes, add to garden" path.
 *
 * Order: copy image → insert plant (+ AI lookup, background frost
 * enrichment — same sequence as adding to the garden) → delete item.
 * The shopping list item is only deleted once both image copy and plant insert
 * succeed, so a partial failure always leaves the item available to retry.
 * If the item delete itself fails (step 3), we log it but don't surface an
 * error — the plant was created, which is the user-visible success.
 */
export async function purchaseShoppingListItem(itemId: string): Promise<PurchaseResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: item } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!item) return { error: "Item not found" };

  // Scheme items are split from their stored binomial; manual items use a
  // lookup-resolved genus/species if they have one, otherwise the typed name
  // with a blank genus — see plantNameFromShoppingItem.
  const { genus, species } = plantNameFromShoppingItem(item);
  const cultivar = item.cultivar ? sanitizePlantName(item.cultivar) || null : null;
  if (!genus && !species) return { error: "This item has no plant name to add." };

  // --- Step 1: copy the snapshotted thumbnail into the plant-photos location ---
  let photoUrl: string | null = null;
  let copiedPath: string | null = null;

  if (item.thumbnail_storage_path) {
    const ext = item.thumbnail_storage_path.split(".").pop() ?? "jpg";
    const newPath = `${user.id}/${Date.now()}.${ext}`;

    const { error: copyError } = await supabase.storage
      .from("plant-photos")
      .copy(item.thumbnail_storage_path, newPath);

    if (copyError) {
      console.error("[purchase] image copy failed:", copyError);
      return { error: "Couldn't copy the plant image — please try again." };
    }

    copiedPath = newPath;
    photoUrl = supabase.storage.from("plant-photos").getPublicUrl(newPath).data.publicUrl;
  }

  // --- Step 2: insert the plant record ---
  // Pull image metadata into explicit variables so the intent is clear and
  // the values are easy to inspect in a debugger or log.
  const imageSource: "wikimedia" | null = photoUrl ? "wikimedia" : null;
  const imageAttribution: string | null = photoUrl
    ? (item.wikimedia_attribution ?? null)
    : null;

  // The helper's genus guard keeps blank-genus keys out of species_reference
  // (see hasGenusForEnrichment). An unresolved manual item arrives with a
  // blank genus: the plant lookup resolves one where it confidently can, and
  // otherwise the plant is saved without enrichment.
  const plant = await createPlantWithLookup(
    supabase,
    {
      genus,
      species,
      cultivar,
      common_names: item.common_names ?? [],
      photo_url: photoUrl,
      image_source: imageSource,
      image_attribution: imageAttribution,
      status: "active",
      date_planted: null,
      sun_needs: null,
      flowering_season_from: null,
      flowering_season_to: null,
      eventual_height_cm: null,
      eventual_spread_cm: null,
      // Only manual items have notes. where_to_buy has no plants column and
      // is not carried over.
      notes: item.notes ?? null,
      // Same values upsertPlant computes for a typed-in plant: neither a
      // scheme name nor a typed one is a photo identification, so the lookup
      // may correct it.
      identification_status: "identified",
      species_source: "manual",
    }
  );

  if ("error" in plant) {
    // Roll back the copied image so storage doesn't accumulate orphans.
    if (copiedPath) {
      await supabase.storage.from("plant-photos").remove([copiedPath]);
    }
    console.error("[purchase] plant insert failed:", plant.error);
    return { error: "Couldn't create the plant record — please try again." };
  }

  revalidatePath("/plants");

  // --- Step 3: delete the shopping list item (best-effort) ---
  if (item.thumbnail_storage_path) {
    const { error: storageError } = await supabase.storage
      .from("plant-photos")
      .remove([item.thumbnail_storage_path]);
    if (storageError) {
      console.error("[purchase] snapshot cleanup failed:", storageError);
    }
  }

  const { error: deleteError } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[purchase] item delete failed:", deleteError);
  }

  return { plantId: plant.id };
}
