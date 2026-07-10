"use server";

import { createClient } from "@/lib/supabase/server";

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
