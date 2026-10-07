"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import clsx from "clsx";
import {
  acceptShoppingItemCandidate,
  createManualShoppingListItem,
  deleteShoppingListItem,
  keepShoppingItemAsTyped,
  purchaseShoppingListItem,
  retryShoppingItemLookup,
  updateManualItemName,
} from "@/app/actions/shopping-list";
import { Icon } from "@/components/ui/Icon";
import { SpecimenPlate } from "@/components/plants/SpecimenPlate";
import {
  MANUAL_ITEM_LIMITS,
  formatLatinName,
  isResolvedManualItem,
  manualItemNames,
  parseHttpUrl,
  shoppingItemDisplayName,
  shoppingItemLatinName,
  validateManualItemInput,
  type ManualItemInput,
  type ShoppingListCandidate,
  type ShoppingListItemData,
} from "@/lib/shopping-list";
import { LOOKUP_PENDING_STALE_MS, LOOKUP_POLL_INTERVAL_MS } from "@/lib/shopping-lookup/timing";


function SproutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

// An item added in this session that the server hasn't confirmed yet.
const OPTIMISTIC_PREFIX = "optimistic-";

function isUnsaved(item: ShoppingListItemData): boolean {
  return item.id.startsWith(OPTIMISTIC_PREFIX);
}

/** The name dialogs and labels refer to an item by — the one its card leads
 *  with. Scheme items go by their Latin name; manual items by what the user
 *  typed, or by the resolved name once a lookup has put one to it. */
function itemLabel(item: ShoppingListItemData): string {
  return (
    (item.source === "scheme" && shoppingItemLatinName(item)) || shoppingItemDisplayName(item)
  );
}

function hasLatinLabel(item: ShoppingListItemData): boolean {
  if (item.source === "scheme") return !!shoppingItemLatinName(item);
  return isResolvedManualItem(item) && manualItemNames(item).primaryIsLatin;
}

/** A lookup is running for this item, or is about to (waiting for a slot). */
function isLookingUp(item: ShoppingListItemData): boolean {
  return (
    item.source === "manual" &&
    !isUnsaved(item) &&
    (item.lookup_status === "pending" || item.lookup_status === null)
  );
}

function EmptyState() {
  return (
    <div className="c-shopping-item-list__empty">
      <div className="is-illustration">
        <SproutIcon />
      </div>
      <p className="brevier">
        Your shopping list is empty — add a plant by name above, or from your planting schemes using the cart icon.
      </p>
    </div>
  );
}

type AddResult = { ok: true } | { ok: false; error: string };

/**
 * Quick capture. The fields are deliberately uncontrolled and plain
 * (type="text", no inputMode, nothing rewriting the value as it changes):
 * phone keyboard dictation streams text into the field, and a controlled
 * input that re-renders on every change is what tends to interrupt it.
 * Autocorrect/autocomplete are off because they mangle plant names.
 */
function AddItemForm({ onAdd }: { onAdd: (input: ManualItemInput) => Promise<AddResult> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const typed = {
      name: String(data.get("name") ?? ""),
      whereToBuy: String(data.get("whereToBuy") ?? ""),
      notes: String(data.get("notes") ?? ""),
    };

    const validated = validateManualItemInput(typed);
    if (!validated.ok) {
      setError(validated.error);
      nameRef.current?.focus();
      return;
    }

    // Clear straight away and keep the caret in the name field, so several
    // plants can be added in a row without waiting on the server.
    setError(null);
    form.reset();
    nameRef.current?.focus();

    const result = await onAdd({
      name: validated.value.entered_name,
      whereToBuy: validated.value.where_to_buy,
      notes: validated.value.notes,
    });
    if (result.ok) return;

    // Put back what was typed — unless the next plant is already being
    // entered, in which case just say which one failed.
    const fields = formRef.current?.elements;
    const nameInput = fields?.namedItem("name") as HTMLInputElement | null;
    if (nameInput && !nameInput.value) {
      nameInput.value = typed.name;
      const whereInput = fields?.namedItem("whereToBuy") as HTMLInputElement | null;
      const notesInput = fields?.namedItem("notes") as HTMLTextAreaElement | null;
      if (whereInput) whereInput.value = typed.whereToBuy;
      if (notesInput) notesInput.value = typed.notes;
      if (typed.whereToBuy || typed.notes) setShowDetails(true);
      setError(result.error);
    } else {
      setError(`Couldn't add "${validated.value.entered_name}". ${result.error}`);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="c-shopping-add" noValidate>
      <label htmlFor="shopping-add-name" className="o-type-label">
        Add a plant
      </label>
      <div className="c-shopping-add__row">
        <input
          ref={nameRef}
          id="shopping-add-name"
          name="name"
          type="text"
          className="o-text-input"
          placeholder="Plant name"
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "shopping-add-error" : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
        />
        <Button type="submit">Add</Button>
      </div>

      {error && (
        <p id="shopping-add-error" role="alert" className="c-shopping-add__error minion">
          {error}
        </p>
      )}

      <button
        type="button"
        className="c-shopping-add__toggle o-button--text minion"
        aria-expanded={showDetails}
        aria-controls="shopping-add-details"
        onClick={() => setShowDetails((open) => !open)}
      >
        {showDetails ? "Hide details" : "Add details"}
      </button>

      <div id="shopping-add-details" className="c-shopping-add__details" hidden={!showDetails}>
        <div className="c-shopping-add__field">
          <label htmlFor="shopping-add-where" className="o-type-label">
            Where to buy
          </label>
          <input
            id="shopping-add-where"
            name="whereToBuy"
            type="text"
            className="o-text-input"
            placeholder="A nursery, a shop or a link"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <div className="c-shopping-add__field">
          <label htmlFor="shopping-add-notes" className="o-type-label">
            Notes
          </label>
          <textarea id="shopping-add-notes" name="notes" className="o-text-input" rows={3} />
        </div>
      </div>
    </form>
  );
}

function WhereToBuy({ value }: { value: string }) {
  const href = parseHttpUrl(value);
  return (
    <p className="c-shopping-item__where minion">
      <span className="o-type-label">Where to buy</span>{" "}
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        value
      )}
    </p>
  );
}

function ImageCredit({ attribution }: { attribution: string }) {
  const href = parseHttpUrl(attribution);
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="c-shopping-item__credit minion"
    >
      Image: Wikimedia Commons
    </a>
  ) : (
    <p className="c-shopping-item__credit minion">Image: Wikimedia Commons</p>
  );
}

/** One suggested plant, as a button. Latin in italic; anything the lookup
 *  couldn't place from the user's own note is called out, not hidden. */
function CandidateChoice({
  candidate,
  disabled,
  onChoose,
}: {
  candidate: ShoppingListCandidate;
  disabled: boolean;
  onChoose: () => void;
}) {
  const commonName = candidate.common_names[0];
  return (
    <button type="button" className="c-shopping-item__choice minion" disabled={disabled} onClick={onChoose}>
      <span>
        <span className="is-latin">{formatLatinName(candidate.genus, candidate.species)}</span>
        {candidate.cultivar && <> &lsquo;{candidate.cultivar}&rsquo;</>}
        {commonName && <span className="is-common"> ({commonName})</span>}
      </span>
      {candidate.unmatched_text && (
        <span className="is-unmatched">
          &ldquo;{candidate.unmatched_text}&rdquo; not recognised
        </span>
      )}
    </button>
  );
}

function EditNameForm({
  item,
  onDone,
}: {
  item: ShoppingListItemData;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const inputId = `shopping-item-name-${item.id}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    const validated = validateManualItemInput({ name });
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    setError(null);
    startSaving(async () => {
      const result = await updateManualItemName(item.id, validated.value.entered_name);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form className="c-shopping-item__edit" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className="o-type-label">
        Plant name
      </label>
      <input
        id={inputId}
        name="name"
        type="text"
        className="o-text-input"
        defaultValue={item.entered_name ?? ""}
        maxLength={MANUAL_ITEM_LIMITS.name}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone();
        }}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="c-shopping-item__problem minion">
          {error}
        </p>
      )}
      <div className="c-shopping-item__edit-actions">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <button type="button" className="o-button--text minion" disabled={isSaving} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** A manual item's names, summary and lookup state. */
function ManualItemDetails({ item }: { item: ShoppingListItemData }) {
  const [problem, setProblem] = useState<string | null>(null);
  const [isWorking, startWork] = useTransition();
  const names = manualItemNames(item);
  const unsaved = isUnsaved(item);

  function run(action: () => Promise<{ error?: string }>) {
    setProblem(null);
    startWork(async () => {
      try {
        const result = await action();
        if (result.error) setProblem(result.error);
      } catch {
        setProblem("Something went wrong — please try again.");
      }
    });
  }

  // A species- or genus-level line under a more specific name says so,
  // rather than passing as a description of the cultivar.
  const summaryScope =
    item.summary_scope === "species" && item.cultivar
      ? "About the species: "
      : item.summary_scope === "genus" && (item.species || item.cultivar)
        ? "About the genus: "
        : null;

  const cultivar = names.cultivar ? <> &lsquo;{names.cultivar}&rsquo;</> : null;

  return (
    <>
      <p
        className={clsx(
          "c-shopping-item__name o-type-display brevier o-type-leading--snug",
          names.primaryIsLatin && "is-resolved"
        )}
      >
        <span className={names.primaryIsLatin ? "o-type--italic" : undefined}>{names.primary}</span>
        {names.primaryIsLatin && cultivar}
      </p>
      {names.secondary && (
        <p className="c-shopping-item__subname minion o-type-leading--snug">
          <span className={names.secondaryIsLatin ? "o-type--italic" : undefined}>
            {names.secondary}
          </span>
          {names.secondaryIsLatin && cultivar}
        </p>
      )}
      {names.notedAs && (
        <p className="c-shopping-item__noted minion">Noted as: {names.notedAs}</p>
      )}

      {item.summary && (
        <p className="c-shopping-item__summary minion">
          {summaryScope}
          {item.summary}
        </p>
      )}

      {!unsaved && item.lookup_status === "pending" && (
        <p className="c-shopping-item__status minion" role="status">
          Looking this up…
        </p>
      )}

      {item.lookup_status === "failed" && (
        <p className="c-shopping-item__status minion">
          Couldn&rsquo;t look this one up.{" "}
          <button
            type="button"
            className="c-shopping-item__retry o-button--text"
            disabled={isWorking}
            onClick={() => run(() => retryShoppingItemLookup(item.id))}
          >
            {isWorking ? "Retrying…" : "Retry"}
          </button>
        </p>
      )}

      {item.lookup_candidates.length > 0 && (
        <div className="c-shopping-item__suggest" role="group" aria-label={`Possible matches for ${names.primary}`}>
          <p className="minion">Not sure about this one. It might be:</p>
          <div className="c-shopping-item__choices">
            <button
              type="button"
              className="c-shopping-item__choice minion"
              disabled={isWorking}
              onClick={() => run(() => keepShoppingItemAsTyped(item.id))}
            >
              Keep as typed
            </button>
            {item.lookup_candidates.map((candidate, index) => (
              <CandidateChoice
                key={`${candidate.genus}-${candidate.species}-${candidate.cultivar}`}
                candidate={candidate}
                disabled={isWorking}
                onChoose={() => run(() => acceptShoppingItemCandidate(item.id, index))}
              />
            ))}
          </div>
        </div>
      )}

      {problem && (
        <p role="alert" className="c-shopping-item__problem minion">
          {problem}
        </p>
      )}
    </>
  );
}

function ItemCard({
  item,
  plateNumber,
  onPurchase,
  onDelete,
}: {
  item: ShoppingListItemData;
  /** 1-based position in the list — the fallback tile's plate number. */
  plateNumber: number;
  onPurchase: () => void;
  onDelete: () => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const isManual = item.source === "manual";
  const displayName = shoppingItemDisplayName(item);
  const unsaved = isUnsaved(item);

  const nameLabel = [
    item.common_names?.join(", "),
    item.cultivar ? `'${item.cultivar}'` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clsx("c-shopping-item", isManual && "c-shopping-item--manual")}>
      <div className="c-shopping-item__media">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={displayName}
            fill
            sizes="64px"
            className="is-image"
          />
        ) : isManual ? (
          <SpecimenPlate
            variant={isResolvedManualItem(item) ? "latin" : "plain"}
            compact
            genus={item.genus}
            name={displayName}
            plateNumber={plateNumber}
          />
        ) : (
          <div className="is-placeholder">
            <SproutIcon />
          </div>
        )}
      </div>

      <div className="c-shopping-item__body">
        {isManual ? (
          isEditingName ? (
            <EditNameForm item={item} onDone={() => setIsEditingName(false)} />
          ) : (
            <ManualItemDetails item={item} />
          )
        ) : (
          <>
            <p className="c-shopping-item__name o-type-display o-type--italic brevier o-type-leading--snug">
              {shoppingItemLatinName(item)}
            </p>
            {nameLabel && (
              <p className="c-shopping-item__subname minion o-type-leading--snug">{nameLabel}</p>
            )}
          </>
        )}

        {isManual && item.where_to_buy && <WhereToBuy value={item.where_to_buy} />}
        {isManual && item.notes && (
          <p className="c-shopping-item__notes minion">{item.notes}</p>
        )}

        {!isManual && (
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
        )}

        {item.thumbnail_url && item.wikimedia_attribution && (
          <ImageCredit attribution={item.wikimedia_attribution} />
        )}

        <div className="c-shopping-item__actions">
          <button
            type="button"
            onClick={onPurchase}
            disabled={unsaved}
            className="c-shopping-item__purchase o-button--text minion"
          >
            Mark as purchased
          </button>
          {isManual && !isEditingName && (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              disabled={unsaved}
              className="c-shopping-item__purchase o-button--text minion"
            >
              Edit name
            </button>
          )}
        </div>
      </div>

      <div className="c-shopping-item__remove">
        <button
          type="button"
          onClick={onDelete}
          disabled={unsaved}
          aria-label={`Remove ${itemLabel(item)} from shopping list`}
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
            Do you want to add{" "}
            <span className={item && hasLatinLabel(item) ? "is-latin" : undefined}>
              {item ? itemLabel(item) : null}
            </span>{" "}
            to your garden?
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

  // The server's list (initialItems) is the source of truth and is re-read on
  // every render, so a refreshed prop always shows through. Local state holds
  // only what the server doesn't know yet: items added here that haven't
  // arrived in the props, and ids removed optimistically.
  const [added, setAdded] = useState<ShoppingListItemData[]>([]);
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(new Set());

  const items = useMemo(() => {
    const fromServer = new Set(initialItems.map((item) => item.id));
    return [...added.filter((item) => !fromServer.has(item.id)), ...initialItems].filter(
      (item) => !removedIds.has(item.id)
    );
  }, [initialItems, added, removedIds]);

  // Polling, not server push: a lookup finishes in after(), long after the
  // response that started it has gone, so nothing the server does then can
  // reach this page (CLAUDE.md, "revalidatePath inside after()"). While any
  // item is being looked up — or is queued behind the per-user limit, which
  // the page's own load picks up — re-fetch the server list every few
  // seconds. The server reports a pending lookup that has gone stale as
  // failed, which ends the poll for it; the tick limit is a backstop for a
  // queued item that never gets started.
  const lookupActive = items.some(isLookingUp);
  useEffect(() => {
    if (!lookupActive) return;
    let ticksLeft = Math.ceil(LOOKUP_PENDING_STALE_MS / LOOKUP_POLL_INTERVAL_MS);
    const interval = setInterval(() => {
      if (ticksLeft-- <= 0) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, LOOKUP_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lookupActive, router]);

  const [deleteTarget, setDeleteTarget] = useState<ShoppingListItemData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [purchaseTarget, setPurchaseTarget] = useState<ShoppingListItemData | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // --- add flow: show it immediately, then swap in the server's row ---
  async function handleAdd(input: ManualItemInput): Promise<{ ok: true } | { ok: false; error: string }> {
    const tempId = `${OPTIMISTIC_PREFIX}${crypto.randomUUID()}`;
    const optimistic: ShoppingListItemData = {
      id: tempId,
      source: "manual",
      scheme_id: null,
      genus: null,
      species: null,
      cultivar: null,
      common_names: null,
      summary: null,
      summary_scope: null,
      lookup_candidates: [],
      entered_name: input.name,
      notes: input.notes ?? null,
      where_to_buy: input.whereToBuy ?? null,
      lookup_status: null,
      thumbnail_url: null,
      thumbnail_storage_path: null,
      wikimedia_attribution: null,
      created_at: new Date().toISOString(),
      scheme_name: null,
    };
    setAdded((prev) => [optimistic, ...prev]);

    let result: Awaited<ReturnType<typeof createManualShoppingListItem>>;
    try {
      result = await createManualShoppingListItem(input);
    } catch {
      result = { error: "Couldn't add that to your shopping list — please try again." };
    }

    if ("error" in result) {
      setAdded((prev) => prev.filter((item) => item.id !== tempId));
      return { ok: false, error: result.error };
    }

    const saved = result.item;
    setAdded((prev) => prev.map((item) => (item.id === tempId ? saved : item)));
    return { ok: true };
  }

  function hide(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id));
  }

  function unhide(id: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // --- delete flow ---
  async function doDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleteError(null);
    hide(target.id);

    const result = await deleteShoppingListItem(target.id);
    if (result.error) {
      unhide(target.id);
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
    hide(target.id);

    const result = await deleteShoppingListItem(target.id);
    if (result.error) {
      unhide(target.id);
      setDeleteError("Couldn't remove that item — please try again.");
    }
  }

  return (
    <div className="c-shopping-item-list">
      <AddItemForm onAdd={handleAdd} />

      {deleteError && <p className="c-shopping-item-list__error brevier">{deleteError}</p>}

      {items.length === 0 && <EmptyState />}

      {items.map((item, index) => (
        <ItemCard
          key={item.id}
          item={item}
          plateNumber={index + 1}
          onPurchase={() => { setPurchaseTarget(item); setPurchaseError(null); }}
          onDelete={() => setDeleteTarget(item)}
        />
      ))}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Remove from shopping list?"
        message={`"${deleteTarget ? itemLabel(deleteTarget) : ""}" will be removed. This can't be undone.`}
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
