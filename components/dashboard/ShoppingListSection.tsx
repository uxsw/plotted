import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  manualItemNames,
  shoppingItemDisplayName,
  shoppingItemLatinName,
  toShoppingListItemData,
  type ShoppingListItemData,
} from "@/lib/shopping-list";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

function ShoppingItemCard({ item }: { item: ShoppingListItemData }) {
  const isManual = item.source === "manual";
  const displayName = shoppingItemDisplayName(item);
  const manualNames = manualItemNames(item);
  const nameLabel = item.common_names?.[0] ?? (item.cultivar ? `'${item.cultivar}'` : null);

  const inner = (
    <div className="c-shopping-list__card">
      <div className="c-shopping-list__media">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={displayName}
            fill
            sizes="40px"
            className="is-image"
          />
        ) : (
          <div className="is-placeholder">
            <Icon name="sprout" />
          </div>
        )}
      </div>
      <div>
        {isManual ? (
          <p className="o-type-display brevier">
            {/* Italic only for a Latin name a lookup has resolved; typed text never is. */}
            <span className={manualNames.primaryIsLatin ? "o-type--italic" : undefined}>
              {manualNames.primary}
            </span>
            {manualNames.primaryIsLatin && manualNames.cultivar && (
              <> &lsquo;{manualNames.cultivar}&rsquo;</>
            )}
          </p>
        ) : (
          <>
            <p className="o-type-display brevier o-type--italic">{shoppingItemLatinName(item)}</p>
            {nameLabel && (
              <p className="minion">{nameLabel}</p>
            )}
          </>
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
    const thumbnailUrl = item.thumbnail_storage_path
      ? supabase.storage.from("plant-photos").getPublicUrl(item.thumbnail_storage_path).data.publicUrl
      : null;

    return toShoppingListItemData(item, thumbnailUrl);
  });

  return (
    <section aria-label="Shopping list" className="c-shopping-list">
      <h2 className="pica o-type-display kirk">Shopping list</h2>
      <div className="c-shopping-list__grid">
        {mapped.map((item) => (
          <ShoppingItemCard key={item.id} item={item} />
        ))}
      </div>
      <div className="c-shopping-list__footer">
        <Link
          href="/shopping-list"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >
          View all
          <Icon name="right" size={16} />
        </Link>
      </div>
    </section>
  );
}
