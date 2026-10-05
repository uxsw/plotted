import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShoppingList from "@/components/ShoppingList";
import { toShoppingListItemData, type ShoppingListItemData } from "@/lib/shopping-list";

export const metadata: Metadata = {
  title: "Shopping list | Plotted",
};

export default async function ShoppingListPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("*, schemes(id, name)")
    .order("created_at", { ascending: false });

  const mapped: ShoppingListItemData[] = (items ?? []).map((item) => {
    const thumbnailUrl = item.thumbnail_storage_path
      ? supabase.storage.from("plant-photos").getPublicUrl(item.thumbnail_storage_path).data.publicUrl
      : null;

    return toShoppingListItemData(item, thumbnailUrl);
  });

  return (
    <div className="o-stack">
      <h1 className="pica o-type-display kirk">Shopping list</h1>
      <ShoppingList initialItems={mapped} />
    </div>
  );
}
