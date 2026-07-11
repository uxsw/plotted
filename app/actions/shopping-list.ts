"use server";

import { createClient } from "@/lib/supabase/server";
import { sanitizeSpecies } from "@/lib/sanitize";

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

type PurchaseResult =
  | { plantId: string }
  | { error: string };

/**
 * "Yes, add to garden" path.
 *
 * Order: copy image → insert plant → delete item.
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
  // Convention matches PlantForm: genus is always "", species holds the full
  // latin name (e.g. "verbena bonariensis"), cultivar is a separate field.
  const genus = "";
  const species = sanitizeSpecies(item.species);
  const cultivar = item.cultivar ?? null;

  // Pull image metadata into explicit variables so the intent is clear and
  // the values are easy to inspect in a debugger or log.
  const imageSource: "wikimedia" | null = photoUrl ? "wikimedia" : null;
  const imageAttribution: string | null = photoUrl
    ? (item.wikimedia_attribution ?? null)
    : null;

  const { data: plant, error: insertError } = await supabase
    .from("plants")
    .insert({
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
      notes: null,
    })
    .select("id")
    .single();

  if (insertError || !plant) {
    // Roll back the copied image so storage doesn't accumulate orphans.
    if (copiedPath) {
      await supabase.storage.from("plant-photos").remove([copiedPath]);
    }
    console.error("[purchase] plant insert failed:", insertError);
    return { error: "Couldn't create the plant record — please try again." };
  }

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
