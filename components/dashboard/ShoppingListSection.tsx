import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ShoppingListItemData } from "@/components/ShoppingList";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";

function SproutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

function ShoppingItemCard({ item }: { item: ShoppingListItemData }) {
  const nameLabel = item.common_names?.[0] ?? (item.cultivar ? `'${item.cultivar}'` : null);

  const inner = (
    <div className="flex items-center gap-2.5 bg-white p-2.5 shrink-0 hover:shadow-sm transition-shadow duration-150">
      <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.species}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sand-line">
            <SproutIcon />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-display italic text-xs leading-snug truncate">{item.species}</p>
        {nameLabel && (
          <p className="font-sans text-[11px] text-ink-soft leading-snug truncate">{nameLabel}</p>
        )}
      </div>
    </div>
  );

  if (item.scheme_id) {
    return <Link href={`/schemes/${item.scheme_id}`}>{inner}</Link>;
  }
  return inner;
}

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

  if (!plantCount || !items?.length) return null;

  const mapped: ShoppingListItemData[] = items.map((item) => {
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
    <section aria-label="Shopping list">
      <div className="o-row space-between">
        <h2 className="pica o-type-display kirk">Shopping list</h2>
        <Link
          href="/shopping-list"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"]
          )}
        >
          View all
        </Link>
      </div>
      <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {mapped.map((item) => (
          <ShoppingItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
