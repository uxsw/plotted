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
import { shoppingItemDisplayName, type ShoppingListItemData } from "@/lib/shopping-list";


function SproutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="c-shopping-item-list__empty">
      <div className="is-illustration">
        <SproutIcon />
      </div>
      <p className="brevier">
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
    <div className="c-shopping-item">
      <div className="c-shopping-item__media">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={shoppingItemDisplayName(item)}
            fill
            sizes="64px"
            className="is-image"
          />
        ) : (
          <div className="is-placeholder">
            <SproutIcon />
          </div>
        )}
      </div>

      <div className="c-shopping-item__body">
        <p className="c-shopping-item__name o-type-display o-type--italic brevier o-type-leading--snug">{item.species}</p>
        {nameLabel && (
          <p className="c-shopping-item__subname minion o-type-leading--snug">{nameLabel}</p>
        )}
        <div className="c-shopping-item__source">
          {item.scheme_id ? (
            <Link
              href={`/schemes/${item.scheme_id}`}
              className="c-shopping-item__scheme-link minion"
            >
              {item.scheme_name ?? "Planting scheme"}
            </Link>
          ) : (
            <p className="c-shopping-item__scheme-deleted minion o-type--italic">
              This planting scheme has been deleted
            </p>
          )}
        </div>
        <div className="c-shopping-item__actions">
          <button
            type="button"
            onClick={onPurchase}
            className="o-button--text minion"
          >
            Purchased
          </button>
        </div>
      </div>

      <div className="c-shopping-item__remove">
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove ${item.species} from shopping list`}
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
      <div className="c-purchase-dialog">
        <div className="c-purchase-dialog__text">
          <h2 className="c-purchase-dialog__title o-type-display pica kirk">Plant purchased!</h2>
          <p className="c-purchase-dialog__message brevier">
            Do you want to add <span className="is-latin">{item?.species}</span> to your garden?
          </p>
          {error && <p className="c-purchase-dialog__error minion">{error}</p>}
        </div>
        <div className="c-purchase-dialog__actions">
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
    <div className="c-shopping-item-list">
      {deleteError && <p className="c-shopping-item-list__error brevier">{deleteError}</p>}
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
