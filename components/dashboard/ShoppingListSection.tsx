import { createClient } from "@/lib/supabase/server";
import { toShoppingListItemData, type ShoppingListItemData } from "@/lib/shopping-list";
import ShoppingListPanel from "@/components/shopping/ShoppingListPanel";

// Fetches; ShoppingListPanel draws. Shown once the garden has a plant in it,
// whether or not the list has anything on it: an empty list is the way in.
export default async function ShoppingListSection() {
  const supabase = await createClient();

  const [{ count: plantCount }, { data: items }] = await Promise.all([
    supabase
      .from("plants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("shopping_list_items")
      .select("*, schemes(id, name)")
      .order("created_at", { ascending: false }),
  ]);

  if (!plantCount) return null;

  const mapped: ShoppingListItemData[] = (items ?? []).map((item) => {
    const thumbnailUrl = item.thumbnail_storage_path
      ? supabase.storage.from("plant-photos").getPublicUrl(item.thumbnail_storage_path).data.publicUrl
      : null;

    return toShoppingListItemData(item, thumbnailUrl);
  });

  return <ShoppingListPanel items={mapped} />;
}
