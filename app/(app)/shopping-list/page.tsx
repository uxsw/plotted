import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShoppingList, { type ShoppingListItemData } from "@/components/ShoppingList";

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
    const scheme = Array.isArray(item.schemes) ? item.schemes[0] : item.schemes;
    const thumbnailUrl = item.thumbnail_storage_path
      ? supabase.storage.from("plant-photos").getPublicUrl(item.thumbnail_storage_path).data.publicUrl
      : null;

    return {
      id: item.id,
      scheme_id: item.scheme_id,
      species: item.species,
      cultivar: item.cultivar,
      common_names: item.common_names,
      thumbnail_url: thumbnailUrl,
      thumbnail_storage_path: item.thumbnail_storage_path,
      wikimedia_attribution: item.wikimedia_attribution,
      created_at: item.created_at,
      scheme_name: scheme?.name ?? null,
    };
  });

  return (
    <div className="o-stack">
      <h1 className="pica o-type-display kirk">Shopping list</h1>
      <ShoppingList initialItems={mapped} />
    </div>
  );
}
