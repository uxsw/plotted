"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePlantName } from "@/lib/sanitize";
import { createPlantWithLookup } from "@/lib/plant-create";
import {
  plantNameFromShoppingItem,
  toShoppingListItemData,
  validateManualItemInput,
  type ManualItemInput,
  type ShoppingListItemData,
} from "@/lib/shopping-list";

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
 * Capture only: nothing is looked up here, and lookup_status /
 * lookup_requested_at stay null — the Phase 2 lookup sets 'pending' itself
 * when it starts, and picks up manual items whose status is still null.
 * Duplicates are allowed, so there is no existence check.
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

  revalidatePath("/shopping-list");
  revalidatePath("/dashboard");

  return { item: toShoppingListItemData(row, null) };
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

  // requireGenus: purchase must not add blank-genus keys to
  // species_reference — see hasGenusForEnrichment. An unresolved manual item
  // has a blank genus, so it gets the plant lookup but no enrichment.
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
    },
    { requireGenus: true }
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
