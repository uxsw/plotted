"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";
import { createManualShoppingListItem } from "@/app/actions/shopping-list";
import { CommonNames, ItemPlate, OrderBookBorder, wantedLine } from "@/components/ShoppingList";
import {
  isResolvedManualItem,
  manualItemNames,
  shoppingItemLatinName,
  validateManualItemInput,
  type ShoppingListItemData,
} from "@/lib/shopping-list";

/**
 * The dashboard's shopping list: the order book (/shopping-list) at glance
 * size. The same letterhead and engraved border, a one-field quick add, and
 * the most recent few plants, each a way through to the full list. Shown
 * when the list is empty too, as the way in.
 *
 * Presentational plus the quick add; ShoppingListSection.tsx fetches.
 */

const SHOWN = 6;

function Entry({ item }: { item: ShoppingListItemData }) {
  const isManual = item.source === "manual";
  const names = manualItemNames(item);
  const resolved = isManual && isResolvedManualItem(item);

  return (
    <li>
      <Link href="/shopping-list" className="c-shopping-list__entry">
        <span className="c-shopping-list__plate">
          <ItemPlate item={item} decorative />
        </span>
        <span className="c-shopping-list__text">
          {isManual ? (
            <span className="c-shopping-list__name o-type-display long-primer kirk">
              {/* Italic only for a Latin name a lookup has resolved; typed text never is. */}
              <span className={names.primaryIsLatin ? "o-type--italic" : undefined}>
                {names.primary}
              </span>
              {names.primaryIsLatin && names.cultivar && <> &lsquo;{names.cultivar}&rsquo;</>}
            </span>
          ) : (
            <span className="c-shopping-list__name o-type-display long-primer kirk">
              <span className="o-type--italic">{shoppingItemLatinName(item)}</span>
              {item.cultivar && <> &lsquo;{item.cultivar}&rsquo;</>}
            </span>
          )}
          {isManual && names.secondaryIsLatin && (
            <span className="c-shopping-list__sub minion o-type--italic">{names.secondary}</span>
          )}
          {(!isManual || (resolved && !names.secondaryIsLatin)) && (
            <CommonNames names={item.common_names?.slice(0, 1) ?? null} />
          )}
        </span>
      </Link>
    </li>
  );
}

/**
 * The list page's add form (ShoppingList.tsx, AddItemForm), at the
 * dashboard's size: the same three fields and the same classes, so the two
 * can't drift apart. Uncontrolled and plain for the same reason: phone
 * dictation. It waits for the server rather than adding optimistically,
 * because the entries below are the server's own list.
 */
function QuickAdd() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const validated = validateManualItemInput({
      name: String(data.get("name") ?? ""),
      whereToBuy: String(data.get("whereToBuy") ?? ""),
      notes: String(data.get("notes") ?? ""),
    });
    if (!validated.ok) {
      setError(validated.error);
      setAdded(null);
      nameRef.current?.focus();
      return;
    }
    const { entered_name: name, where_to_buy: whereToBuy, notes } = validated.value;
    setError(null);
    setAdded(null);

    startAdding(async () => {
      let result: Awaited<ReturnType<typeof createManualShoppingListItem>>;
      try {
        result = await createManualShoppingListItem({ name, whereToBuy, notes });
      } catch {
        result = { error: "Couldn\u2019t add that to your shopping list. Please try again." };
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Cleared only once it is saved, so a failure never loses what was typed.
      formRef.current?.reset();
      setAdded(name);
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      className="c-shopping-add"
      onSubmit={handleSubmit}
      aria-labelledby="dashboard-shopping-add-title"
      noValidate
    >
      <div className="c-shopping-add__intro">
        <h3 id="dashboard-shopping-add-title" className="o-type-display long-primer kirk">
          Add a plant to your list
        </h3>
        <p className="brevier">Type it or say it as you remember it. Plotted looks up the rest.</p>
      </div>

      <div className="c-shopping-add__fields">
        <div className="c-shopping-add__field is-name">
          <label htmlFor="dashboard-shopping-add-name" className="o-type-label">
            Plant name
          </label>
          <input
            ref={nameRef}
            id="dashboard-shopping-add-name"
            name="name"
            type="text"
            className="o-text-input"
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby="dashboard-shopping-add-status"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          <p
            id="dashboard-shopping-add-status"
            className={clsx("c-shopping-add__status minion", error && "is-error")}
            role={error ? "alert" : "status"}
          >
            {error ??
              (added ? (
                <>
                  <Icon name="check" size={14} />
                  Added &ldquo;{added}&rdquo;. Plotted is looking it up.
                </>
              ) : null)}
          </p>
        </div>

        <div className="c-shopping-add__field is-where">
          <label htmlFor="dashboard-shopping-add-where" className="o-type-label">
            Where to buy <span className="c-shopping-add__optional">(optional)</span>
          </label>
          <input
            id="dashboard-shopping-add-where"
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

        <div className="c-shopping-add__field is-notes">
          <label htmlFor="dashboard-shopping-add-notes" className="o-type-label">
            Notes <span className="c-shopping-add__optional">(optional)</span>
          </label>
          <textarea id="dashboard-shopping-add-notes" name="notes" className="o-text-input" rows={1} />
        </div>

        <Button type="submit" className="c-shopping-add__submit" disabled={isAdding}>
          {isAdding ? "Adding\u2026" : "Add to list"}
        </Button>
      </div>
    </form>
  );
}

export default function ShoppingListPanel({ items }: { items: ShoppingListItemData[] }) {
  const shown = items.slice(0, SHOWN);

  return (
    <section aria-labelledby="dashboard-shopping-title" className="c-order-book c-order-book--compact">
      <header className="c-order-book__band">
        <div className="c-order-book__head">
          <h2 id="dashboard-shopping-title" className="c-order-book__title o-type-display paragon">
            Shopping list
          </h2>
          {items.length > 0 && (
            <p className="c-order-book__aside o-type-display primer">{wantedLine(items.length)}</p>
          )}
        </div>
        <OrderBookBorder plants={items.map((item) => ({ key: item.id }))} />
      </header>

      <QuickAdd />

      {items.length === 0 ? (
        <p className="c-shopping-list__empty brevier">
          Nothing on the list yet. Add the plants you want however you remember them, and Plotted
          looks up their proper names.
        </p>
      ) : (
        <ul className="c-shopping-list__entries" role="list">
          {shown.map((item) => (
            <Entry key={item.id} item={item} />
          ))}
        </ul>
      )}

      <div className="c-shopping-list__footer">
        <Link
          href="/shopping-list"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >
          {items.length > SHOWN ? `View all ${items.length}` : "Open shopping list"}
          <Icon name="right" size={16} />
        </Link>
      </div>
    </section>
  );
}
