"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteShoppingListItem } from "@/app/actions/shopping-list";

export type ShoppingListItemData = {
  id: string;
  scheme_id: string | null;
  species: string;
  cultivar: string | null;
  common_names: string[] | null;
  thumbnail_url: string | null;
  thumbnail_storage_path: string | null;
  wikimedia_attribution: string | null;
  created_at: string;
  scheme_name: string | null;
};

function SproutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="text-sand-line">
        <SproutIcon />
      </div>
      <p className="font-sans text-sm text-ink-soft">
        Your shopping list is empty — add plants from your planting schemes using the cart icon.
      </p>
    </div>
  );
}

function ItemCard({
  item,
  onDelete,
}: {
  item: ShoppingListItemData;
  onDelete: () => void;
}) {
  const nameLabel = [
    item.common_names?.join(", "),
    item.cultivar ? `'${item.cultivar}'` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex gap-3 rounded-lg border border-sand-line bg-paper p-3">
      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-paper-deep">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.species}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sand-line">
            <SproutIcon />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="font-display italic text-sm text-ink leading-snug truncate">{item.species}</p>
        {nameLabel && (
          <p className="font-sans text-xs text-ink-soft leading-snug truncate">{nameLabel}</p>
        )}
        <div className="mt-1">
          {item.scheme_id ? (
            <Link
              href={`/schemes/${item.scheme_id}`}
              className="font-sans text-[11px] text-moss hover:text-moss-deep underline"
            >
              {item.scheme_name ?? "Planting scheme"}
            </Link>
          ) : (
            <p className="font-sans text-[11px] text-ink-soft/60 italic">
              This planting scheme has been deleted
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {/* Purchased flow — not yet implemented */}
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium font-sans bg-paper-deep text-ink-soft/40 cursor-not-allowed"
            title="Coming soon"
          >
            Purchased
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 self-start">
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove ${item.species} from shopping list`}
          className="flex items-center justify-center w-8 h-8 rounded text-ink-soft transition-colors hover:bg-clay-tint hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

export default function ShoppingList({ initialItems }: { initialItems: ShoppingListItemData[] }) {
  const [items, setItems] = useState(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<ShoppingListItemData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function doDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleteError(null);
    setItems((prev) => prev.filter((i) => i.id !== target.id));

    const result = await deleteShoppingListItem(target.id);
    if (result.error) {
      setItems((prev) =>
        [...prev, target].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setDeleteError("Couldn't remove that item — please try again.");
    }
  }

  if (items.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-3">
      {deleteError && <p className="text-sm text-clay">{deleteError}</p>}
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onDelete={() => setDeleteTarget(item)} />
      ))}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Remove from shopping list?"
        message={`"${deleteTarget?.species}" will be removed. This can't be undone.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
