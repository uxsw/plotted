"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteShoppingListItem, purchaseShoppingListItem } from "@/app/actions/shopping-list";
import { Icon } from "@/components/ui/Icon";

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
  onPurchase,
  onDelete,
}: {
  item: ShoppingListItemData;
  onPurchase: () => void;
  onDelete: () => void;
}) {
  const nameLabel = [
    item.common_names?.join(", "),
    item.cultivar ? `'${item.cultivar}'` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex gap-3 bg-white p-3">
      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden">
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
              className="font-sans text-[11px] text-marigold hover:text-marigold underline"
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
          <button
            type="button"
            onClick={onPurchase}
            className="o-button--text minion"
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
          className="flex items-center justify-center w-8 h-8 rounded text-ink-soft transition-colors hover:bg-marigold hover:text-marigold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <Icon name="delete" aria-label="Delete" /> 
        </button>
      </div>
    </div>
  );
}

// PurchaseDialog uses Modal directly rather than ConfirmDialog because both
// "Yes" and "No" trigger substantive actions — ConfirmDialog.onClose fires on
// backdrop/Escape too, so we can't use it to distinguish an explicit "No" from
// a plain dismissal.
function PurchaseDialog({
  item,
  isOpen,
  isPurchasing,
  error,
  onYes,
  onNo,
  onDismiss,
}: {
  item: ShoppingListItemData | null;
  isOpen: boolean;
  isPurchasing: boolean;
  error: string | null;
  onYes: () => void;
  onNo: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onDismiss}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold text-ink">Plant purchased!</h2>
          <p className="text-sm font-sans text-ink-soft">
            Do you want to add <span className="italic">{item?.species}</span> to your garden?
          </p>
          {error && <p className="text-xs font-sans text-marigold mt-1">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={isPurchasing}
            onClick={onNo}
          >
            No, just remove
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isPurchasing}
            onClick={onYes}
          >
            {isPurchasing ? "Adding…" : "Yes, add to garden"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ShoppingList({ initialItems }: { initialItems: ShoppingListItemData[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);

  const [deleteTarget, setDeleteTarget] = useState<ShoppingListItemData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [purchaseTarget, setPurchaseTarget] = useState<ShoppingListItemData | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // --- delete flow ---
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

  // --- purchased: Yes ---
  async function handlePurchaseYes() {
    if (!purchaseTarget || isPurchasing) return;
    setIsPurchasing(true);
    setPurchaseError(null);

    const result = await purchaseShoppingListItem(purchaseTarget.id);

    if ("error" in result) {
      setIsPurchasing(false);
      setPurchaseError(result.error);
      return;
    }

    // Success: navigate to the new plant record. The shopping list item was
    // deleted server-side; we don't need to update local state.
    router.push(`/plants/${result.plantId}`);
  }

  // --- purchased: No (remove without adding to garden) ---
  async function handlePurchaseNo() {
    if (!purchaseTarget || isPurchasing) return;
    const target = purchaseTarget;
    setPurchaseTarget(null);
    setPurchaseError(null);
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
      {deleteError && <p className="text-sm text-marigold">{deleteError}</p>}
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onPurchase={() => { setPurchaseTarget(item); setPurchaseError(null); }}
          onDelete={() => setDeleteTarget(item)}
        />
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

      <PurchaseDialog
        item={purchaseTarget}
        isOpen={purchaseTarget !== null}
        isPurchasing={isPurchasing}
        error={purchaseError}
        onYes={handlePurchaseYes}
        onNo={handlePurchaseNo}
        onDismiss={() => { if (!isPurchasing) { setPurchaseTarget(null); setPurchaseError(null); } }}
      />
    </div>
  );
}
