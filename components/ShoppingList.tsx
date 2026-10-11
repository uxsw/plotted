"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
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
  type ShoppingListItemData,
} from "@/lib/shopping-list";
import { LOOKUP_PENDING_STALE_MS, LOOKUP_POLL_INTERVAL_MS } from "@/lib/shopping-lookup/timing";
import type { Silhouette } from "@/app/(app)/plant-scheme/_components/plantMarks";
import {
  BIRD_MARK,
  BUTTERFLY_MARK,
  GHOST_ORDER,
  PLANT_MARKS,
} from "@/components/shopping/borderMarks";


/* The engraved border in the letterhead: one silhouette per plant on the
   list (borderMarks.ts), each in its own small frame so they can stand in a
   row, with dashed ghosts and a couple of garden visitors holding the ground
   beyond them. Purely decorative. */
const GHOST_FILL = 28;
const BLOOM_TINTS = 4;

// Which places along the border the visitors take, counted from its start.
const VISITORS: Record<number, Silhouette> = { 3: BIRD_MARK, 8: BUTTERFLY_MARK };

/** A small stable number from a name — which mark, which tint. */
function seedNumber(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function BorderMark({
  mark,
  kind = "plant",
  bloom,
  active = false,
  delay = 0,
}: {
  mark: Silhouette;
  kind?: "plant" | "ghost" | "visitor";
  /** Which tint its flower heads take. */
  bloom?: number;
  active?: boolean;
  delay?: number;
}) {
  return (
    <svg
      className={clsx(
        "c-order-book__mark",
        kind === "ghost" && "is-ghost",
        kind === "visitor" && "is-visitor",
        active && "is-active"
      )}
      viewBox="0 18 44 60"
      data-bloom={bloom}
      style={{ "--_delay": `${delay}s` } as React.CSSProperties}
    >
      {mark.paths.map((d, i) => (
        <path key={i} d={d} pathLength={1} />
      ))}
      {mark.dots.map((dot, i) => (
        <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} />
      ))}
    </svg>
  );
}

/**
 * The letterhead's border, start to far edge: the plants newest first, then
 * ghosts, with the visitors in their places among them. A plant's shape and
 * tint come from how many were on the list before it, walking a curated
 * order, so neighbours always differ and adding a plant never redraws the
 * others. Plants there on arrival draw in as a staggered planting; a fresh
 * one draws alone, at once.
 */
export function OrderBookBorder({
  plants,
  activeKey = null,
}: {
  plants: { key: string; fresh?: boolean }[];
  activeKey?: string | null;
}) {
  const row: React.ReactNode[] = [];
  for (let slot = 0, next = 0; slot < plants.length + GHOST_FILL; slot++) {
    if (VISITORS[slot]) {
      row.push(<BorderMark key={`visitor-${slot}`} mark={VISITORS[slot]} kind="visitor" />);
      continue;
    }
    const index = next++;
    const plant = plants[index];
    if (plant) {
      const order = plants.length - 1 - index;
      row.push(
        <BorderMark
          key={plant.key}
          mark={PLANT_MARKS[GHOST_ORDER[order % GHOST_ORDER.length]]}
          bloom={(order % BLOOM_TINTS) + 1}
          active={plant.key === activeKey}
          delay={plant.fresh ? 0 : Math.min(index, 24) * 0.07}
        />
      );
    } else {
      // carry on the same order past the oldest plant, so no shape repeats nearby
      const order = index + GHOST_ORDER.length - (plants.length % GHOST_ORDER.length);
      row.push(
        <BorderMark
          key={`ghost-${index}`}
          mark={PLANT_MARKS[GHOST_ORDER[(order + 7) % GHOST_ORDER.length]]}
          kind="ghost"
        />
      );
    }
  }

  return (
    <div className="c-order-book__border" aria-hidden="true">
      <div className="c-order-book__marks">{row}</div>
    </div>
  );
}

const NUMBER_WORDS = [
  "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen",
  "Nineteen", "Twenty",
];

export function wantedLine(count: number): string {
  const number = NUMBER_WORDS[count] ?? String(count);
  return `${number} ${count === 1 ? "plant" : "plants"} to look out for.`;
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

// Names to try from the empty sheet. Deliberately rough: the point they make
// is that a half-remembered name is enough.
const STARTER_NAMES = ["that purple salvia", "foxglove", "geum totally tangerine", "the tall verbena"];

// The empty sheet's border, start to end: PLANT_MARKS indices, or a visitor.
const EMPTY_SCENE: (number | Silhouette)[] = [0, 9, BIRD_MARK, 11, 4, 12, BUTTERFLY_MARK, 10];

function EmptyState({ onPickName }: { onPickName: (name: string) => void }) {
  return (
    <div className="c-order-book__empty">
      <div className="is-illustration" aria-hidden="true">
        {EMPTY_SCENE.map((entry, i) =>
          typeof entry === "number" ? (
            <BorderMark key={i} mark={PLANT_MARKS[entry]} bloom={(i % BLOOM_TINTS) + 1} delay={i * 0.12} />
          ) : (
            <BorderMark key={i} mark={entry} kind="visitor" />
          )
        )}
      </div>

      <h2 className="is-heading o-type-display pica kirk">Nothing on the list yet</h2>
      <p className="primer">
        This is where the plants you want are kept: the one in a friend&rsquo;s border, the name
        on a label you meant to remember. Add it however you remember it and Plotted finds its
        proper name.
      </p>

      <div className="c-order-book__starters" role="group" aria-labelledby="shopping-starters-label">
        <p id="shopping-starters-label" className="brevier">
          Rough names are fine. Try one:
        </p>
        <div className="is-names">
          {STARTER_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              className="c-order-book__starter brevier"
              onClick={() => onPickName(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <p className="c-order-book__schemes brevier">
        <Icon name="flower" size={16} />
        <span>
          Planning a border? Plants in a{" "}
          <Link href="/plant-scheme">planting scheme</Link> can be added here with the cart icon.
        </span>
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
      setError(result.error);
    } else {
      setError(`Couldn't add "${validated.value.entered_name}". ${result.error}`);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="c-shopping-add"
      aria-labelledby="shopping-add-title"
      noValidate
    >
      <div className="c-shopping-add__intro">
        <h2 id="shopping-add-title" className="o-type-display pica kirk">
          Add a plant to your list
        </h2>
        <p className="brevier">Type it or say it as you remember it. Plotted looks up the rest.</p>
      </div>

      <div className="c-shopping-add__fields">
        <div className="c-shopping-add__field is-name">
          <label htmlFor="shopping-add-name" className="o-type-label">
            Plant name
          </label>
          <input
            ref={nameRef}
            id="shopping-add-name"
            name="name"
            type="text"
            className="o-text-input"
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "shopping-add-error" : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          {error && (
            <p id="shopping-add-error" role="alert" className="c-shopping-add__error minion">
              {error}
            </p>
          )}
        </div>

        <div className="c-shopping-add__field is-where">
          <label htmlFor="shopping-add-where" className="o-type-label">
            Where to buy <span className="c-shopping-add__optional">(optional)</span>
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

        <div className="c-shopping-add__field is-notes">
          <label htmlFor="shopping-add-notes" className="o-type-label">
            Notes <span className="c-shopping-add__optional">(optional)</span>
          </label>
          <textarea id="shopping-add-notes" name="notes" className="o-text-input" rows={1} />
        </div>

        <Button type="submit" className="c-shopping-add__submit">
          Add to list
        </Button>
      </div>
    </form>
  );
}

const NAME_TINTS = 5;

/** A plant's common names as badges. The tint is decorative: picked from the
 *  name so it stays put, and carrying no meaning. */
export function CommonNames({ names }: { names: (string | null | undefined)[] | null }) {
  const list = (names ?? []).map((name) => name?.trim()).filter((name): name is string => !!name);
  if (list.length === 0) return null;
  return (
    <ul className="c-shopping-item__names" role="list" aria-label="Common names">
      {list.map((name) => (
        <li key={name} className="o-badge" data-tint={(seedNumber(name) % NAME_TINTS) + 1}>
          {name}
        </li>
      ))}
    </ul>
  );
}

function WhereToBuy({ value }: { value: string }) {
  const href = parseHttpUrl(value);
  return (
    <p className="c-shopping-item__where brevier">
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

/**
 * One answer to "it might be…", as a full-width row: what it is on the left,
 * a choose mark on the right. Picking acts at once (it is a button, not a
 * radio), and while that is saving the picked row shows as chosen and the
 * others stand down.
 */
function SuggestChoice({
  state,
  onChoose,
  children,
}: {
  state: "open" | "chosen" | "passed";
  onChoose: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={clsx("c-shopping-item__choice", state === "chosen" && "is-chosen")}
      disabled={state !== "open"}
      aria-busy={state === "chosen" || undefined}
      onClick={onChoose}
    >
      <span className="c-shopping-item__choice-text">{children}</span>
      <span className="c-shopping-item__choice-mark" aria-hidden="true">
        <Icon name="square" size={20} className="is-empty" />
        <Icon name="squareCheck" size={20} className="is-checked" />
      </span>
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

  // Saving a different name clears whatever the last lookup found and starts
  // another (updateManualItemName). Say so, when there is something to lose.
  const hasMatch = isResolvedManualItem(item) || !!item.summary || !!item.thumbnail_url;

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
        aria-describedby={error ? `${inputId}-error ${inputId}-note` : `${inputId}-note`}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone();
        }}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="c-shopping-item__problem minion">
          {error}
        </p>
      )}
      <p id={`${inputId}-note`} className="c-shopping-item__edit-note minion">
        {hasMatch
          ? "Plotted looks the new name up again. The current match, its summary and its picture will be replaced."
          : "Plotted looks the new name up again."}
      </p>
      <div className="c-shopping-item__edit-actions">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save name"}
        </Button>
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** A manual item's two cells: its names, then its summary and lookup state. */
function ManualItemDetails({
  item,
  editing,
  credit,
  onEditName,
}: {
  item: ShoppingListItemData;
  /** The rename form, shown in place of the names while it is open. */
  editing: React.ReactNode;
  credit: React.ReactNode;
  onEditName: () => void;
}) {
  const [problem, setProblem] = useState<string | null>(null);
  const [isWorking, startWork] = useTransition();
  const names = manualItemNames(item);
  const unsaved = isUnsaved(item);

  // Which answer to "it might be…" was picked, while it is being saved.
  const [picked, setPicked] = useState<number | "typed" | null>(null);
  const choiceState = (choice: number | "typed") =>
    !isWorking ? "open" : picked === choice ? "chosen" : "passed";

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
      <div className="c-shopping-item__plant">
        {editing ?? (
          <>
            <p
              className={clsx(
                "c-shopping-item__name o-type-display pica kirk",
                names.primaryIsLatin && "is-resolved"
              )}
            >
              <span className={names.primaryIsLatin ? "o-type--italic" : undefined}>{names.primary}</span>
              {names.primaryIsLatin && cultivar}
            </p>
            {names.secondary &&
              (names.secondaryIsLatin ? (
                <p className="c-shopping-item__subname brevier">
                  <span className="o-type--italic">{names.secondary}</span>
                  {cultivar}
                </p>
              ) : (
                <CommonNames names={item.common_names} />
              ))}
            {names.notedAs && (
              <p className="c-shopping-item__noted minion">Noted as: {names.notedAs}</p>
            )}
            {credit}
          </>
        )}
      </div>

      <div className={clsx("c-shopping-item__about", editing && "is-editing")}>
        {/* The summary stays in view (stepped back) while the name is edited. */}
        {item.summary && (
          <p className="c-shopping-item__summary brevier">
            {summaryScope}
            {item.summary}
          </p>
        )}
        {!editing && (
          <>

            {/* Being looked up, queued for it, or not yet saved: say so, and
                hold the place where what it finds will land. */}
            {(unsaved || isLookingUp(item)) && (
              <div className="c-shopping-item__looking">
                <p className="c-shopping-item__status brevier" role="status">
                  {unsaved ? "Adding to your list" : "Looking this up"}
                  <span className="c-shopping-item__dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </p>
                <div className="c-shopping-item__placeholder" aria-hidden="true">
                  <i />
                  <i />
                </div>
              </div>
            )}

            {/* Recoverable, not broken: what happened and the way on. */}
            {item.lookup_status === "failed" && (
              <div className="c-shopping-item__outcome">
                <p className="brevier">
                  <Icon name="alertTriangle" size={16} />
                  <span>Couldn&rsquo;t look this one up. It&rsquo;s kept as you typed it.</span>
                </p>
                <button
                  type="button"
                  className="c-shopping-item__small-button"
                  disabled={isWorking}
                  onClick={() => run(() => retryShoppingItemLookup(item.id))}
                >
                  <Icon name="retry" size={16} />
                  {isWorking ? "Trying again…" : "Try again"}
                </button>
              </div>
            )}

            {/* Looked up and nothing found: a normal outcome, so said plainly,
                with the one thing that might help. */}
            {item.lookup_status === "not_found" &&
              item.lookup_candidates.length === 0 &&
              !isResolvedManualItem(item) && (
                <div className="c-shopping-item__outcome">
                  <p className="brevier">
                    <Icon name="search" size={16} />
                    <span>No match found, so it&rsquo;s kept as you typed it.</span>
                  </p>
                  <button type="button" className="c-shopping-item__small-button" onClick={onEditName}>
                    <Icon name="pencil" size={16} />
                    Edit name
                  </button>
                </div>
              )}

            {item.lookup_candidates.length > 0 && (
              <div className="c-shopping-item__suggest" role="group" aria-labelledby={`suggest-${item.id}`}>
                <p id={`suggest-${item.id}`} className="c-shopping-item__suggest-lead brevier">
                  Not sure about this one. It might be:
                </p>
                <div className="c-shopping-item__choices">
                  <SuggestChoice
                    state={choiceState("typed")}
                    onChoose={() => {
                      setPicked("typed");
                      run(() => keepShoppingItemAsTyped(item.id));
                    }}
                  >
                    <span className="is-title">Keep as typed</span>
                    <span className="is-detail">&ldquo;{names.primary}&rdquo;</span>
                  </SuggestChoice>
                  {item.lookup_candidates.map((candidate, index) => (
                    <SuggestChoice
                      key={`${candidate.genus}-${candidate.species}-${candidate.cultivar}`}
                      state={choiceState(index)}
                      onChoose={() => {
                        setPicked(index);
                        run(() => acceptShoppingItemCandidate(item.id, index));
                      }}
                    >
                      <span className="is-title o-type-display">
                        <span className="o-type--italic">
                          {formatLatinName(candidate.genus, candidate.species)}
                        </span>
                        {candidate.cultivar && <> &lsquo;{candidate.cultivar}&rsquo;</>}
                      </span>
                      {candidate.common_names[0] && (
                        <span className="is-detail">{candidate.common_names[0]}</span>
                      )}
                      {/* Anything the lookup couldn't place from the user's own
                          note is called out, not hidden. */}
                      {candidate.unmatched_text && (
                        <span className="is-unmatched">
                          <Icon name="alertTriangle" size={14} />
                          &ldquo;{candidate.unmatched_text}&rdquo; not recognised
                        </span>
                      )}
                    </SuggestChoice>
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
        )}
      </div>
    </>
  );
}

/** An item's picture: its photograph, or the monogram plate standing in for
 *  one. Fills its positioned parent. */
export function ItemPlate({ item, decorative = false }: { item: ShoppingListItemData; decorative?: boolean }) {
  const displayName = shoppingItemDisplayName(item);
  if (item.thumbnail_url) {
    return (
      <Image
        src={item.thumbnail_url}
        alt={decorative ? "" : displayName}
        fill
        sizes="88px"
        className="is-image"
      />
    );
  }
  return item.source === "manual" ? (
    <SpecimenPlate
      variant={isResolvedManualItem(item) ? "latin" : "plain"}
      genus={item.genus}
      name={displayName}
    />
  ) : (
    <SpecimenPlate genus={shoppingItemLatinName(item)} commonName={displayName} />
  );
}

function ItemCard({
  item,
  arriving,
  onPurchase,
  onDelete,
  onActive,
}: {
  item: ShoppingListItemData;
  /** Added in this session: the line settles in rather than just appearing. */
  arriving: boolean;
  onPurchase: () => void;
  onDelete: () => void;
  /** Pointer or focus is on this line (or has left it). */
  onActive: (active: boolean) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);

  // The pencil is unmounted while the form is open; when the form closes,
  // put the caret back on it rather than dropping focus to the page.
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !isEditingName) editButtonRef.current?.focus();
    wasEditing.current = isEditingName;
  }, [isEditingName]);
  const isManual = item.source === "manual";
  const unsaved = isUnsaved(item);

  const credit =
    item.thumbnail_url && item.wikimedia_attribution ? (
      <ImageCredit attribution={item.wikimedia_attribution} />
    ) : null;

  // The moment a lookup finishes with a plant: remembered from the render
  // where "looking" turned false, so the entry can ease its new name, summary
  // and picture in (state adjusted during render, not in an effect).
  const looking = isManual && (unsaved || isLookingUp(item));
  const [wasLooking, setWasLooking] = useState(looking);
  const [justResolved, setJustResolved] = useState(false);
  if (wasLooking !== looking) {
    setWasLooking(looking);
    if (!looking && isResolvedManualItem(item)) setJustResolved(true);
  }

  return (
    <li
      className={clsx(
        "c-shopping-item",
        isManual && "c-shopping-item--manual",
        arriving && "is-arriving",
        looking && "is-looking-up",
        justResolved && "is-just-resolved"
      )}
      onPointerEnter={() => onActive(true)}
      onPointerLeave={() => onActive(false)}
      onFocus={() => onActive(true)}
      onBlur={() => onActive(false)}
    >
      <div className="c-shopping-item__media">
        <ItemPlate item={item} />
      </div>

      <div className="c-shopping-item__body">
        {isManual ? (
          <ManualItemDetails
            item={item}
            editing={
              isEditingName ? (
                <EditNameForm item={item} onDone={() => setIsEditingName(false)} />
              ) : null
            }
            credit={credit}
            onEditName={() => setIsEditingName(true)}
          />
        ) : (
          <>
            <div className="c-shopping-item__plant">
              <p className="c-shopping-item__name o-type-display pica kirk">
                <span className="o-type--italic">{shoppingItemLatinName(item)}</span>
                {item.cultivar && <> &lsquo;{item.cultivar}&rsquo;</>}
              </p>
              <CommonNames names={item.common_names} />
              {credit}
            </div>
            <div className="c-shopping-item__about">
              {item.scheme_id ? (
                <p className="c-shopping-item__scheme brevier">
                  <Icon name="flower" size={16} />
                  <span>
                    For{" "}
                    <Link href={`/schemes/${item.scheme_id}`}>
                      {item.scheme_name ?? "Planting scheme"}
                    </Link>
                  </span>
                </p>
              ) : (
                <p className="c-shopping-item__scheme is-deleted brevier">
                  <Icon name="flower" size={16} />
                  This planting scheme has been deleted
                </p>
              )}
            </div>
          </>
        )}

        {isManual && item.where_to_buy && <WhereToBuy value={item.where_to_buy} />}
        {isManual && item.notes && (
          <p className="c-shopping-item__notes brevier">
            <span className="o-type-label">Notes</span>{" "}
            {item.notes}
          </p>
        )}

        <div className="c-shopping-item__actions">
          <button
            type="button"
            onClick={onPurchase}
            disabled={unsaved}
            className="c-shopping-item__purchase"
            aria-label={`Mark ${itemLabel(item)} as bought`}
          >
            <span className="is-ring">
              <Icon name="check" size={14} />
            </span>
            Mark as bought
          </button>
          {isManual && !isEditingName && (
            <button
              type="button"
              ref={editButtonRef}
              onClick={() => setIsEditingName(true)}
              disabled={unsaved}
              className="c-shopping-item__icon"
              aria-label={`Edit the name of ${itemLabel(item)}`}
              title="Edit name"
            >
              <Icon name="pencil" size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={unsaved}
            className="c-shopping-item__icon is-remove"
            aria-label={`Remove ${itemLabel(item)} from shopping list`}
            title="Remove"
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      </div>
    </li>
  );
}

// The purchase dialog's border, start to end: PLANT_MARKS indices, or a visitor.
const PURCHASE_SCENE: (number | Silhouette)[] = [12, 0, BUTTERFLY_MARK, 9, 4];

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
    <Modal
      isOpen={isOpen}
      onClose={onDismiss}
      panelClassName="c-purchase-dialog-panel"
      labelledBy="purchase-dialog-title"
      initialFocusSelector=".c-purchase-dialog__yes"
    >
      <div className="c-purchase-dialog">
        {/* The letterhead's dusk again, with a few plants drawing themselves
            in: buying one is this page's happy ending. */}
        <div className="c-purchase-dialog__band" aria-hidden="true">
          {PURCHASE_SCENE.map((entry, i) =>
            typeof entry === "number" ? (
              <BorderMark key={i} mark={PLANT_MARKS[entry]} bloom={(i % BLOOM_TINTS) + 1} delay={0.15 + i * 0.12} />
            ) : (
              <BorderMark key={i} mark={entry} kind="visitor" />
            )
          )}
        </div>

        <div className="c-purchase-dialog__body">
          {item && (
            <div className="c-purchase-dialog__plate">
              <ItemPlate item={item} decorative />
            </div>
          )}

          <div className="c-purchase-dialog__text">
            <h2 id="purchase-dialog-title" className="c-purchase-dialog__title o-type-display pica kirk">
              Plant purchased!
            </h2>
            <p className="c-purchase-dialog__name o-type-display long-primer">
              <span className={item && hasLatinLabel(item) ? "is-latin" : undefined}>
                {item ? itemLabel(item) : null}
              </span>
            </p>
            <p className="c-purchase-dialog__message brevier">
              Add it to your garden and Plotted starts its record, filling in its flowering
              season, sun needs and size. Either way, it comes off your shopping list.
            </p>
          </div>

          {isPurchasing && (
            <p className="c-purchase-dialog__status brevier" role="status">
              Adding it to your garden
              <span className="c-shopping-item__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </p>
          )}

          {error && !isPurchasing && (
            <p className="c-purchase-dialog__error brevier" role="alert">
              <Icon name="alertTriangle" size={16} />
              <span>
                Couldn&rsquo;t add it to your garden. {/[.!?]$/.test(error) ? error : `${error}.`}{" "}
                It&rsquo;s still on your list.
              </span>
            </p>
          )}

          <div className="c-purchase-dialog__actions">
            <Button type="button" variant="ghost" disabled={isPurchasing} onClick={onNo}>
              Just remove it
            </Button>
            <Button
              type="button"
              variant="primary"
              className="c-purchase-dialog__yes"
              disabled={isPurchasing}
              onClick={onYes}
            >
              {error && !isPurchasing ? "Try again" : "Add to my garden"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** What else goes with a removed item, for the dialog to say so. */
function lostWithItem(item: ShoppingListItemData): string {
  if (item.notes && item.where_to_buy) return ", along with your notes and where to buy it";
  if (item.notes) return ", along with your notes";
  if (item.where_to_buy) return ", along with where to buy it";
  return "";
}

// The purchase dialog's quiet sibling: the same plate and name, no letterhead,
// and it opens with the caret on "Keep it" (the first control), so Enter
// can't remove by accident.
function RemoveDialog({
  item,
  isRemoving,
  error,
  onRemove,
  onKeep,
}: {
  item: ShoppingListItemData | null;
  isRemoving: boolean;
  error: string | null;
  onRemove: () => void;
  onKeep: () => void;
}) {
  return (
    <Modal isOpen={item !== null} onClose={onKeep} labelledBy="remove-dialog-title">
      {item && (
        <div className="c-remove-dialog">
          <div className="c-remove-dialog__plant">
            <div className="c-remove-dialog__plate">
              <ItemPlate item={item} decorative />
            </div>
            <div className="c-remove-dialog__text">
              <h2 id="remove-dialog-title" className="o-type-display long-primer kirk">
                Remove from your list?
              </h2>
              <p className="c-remove-dialog__name o-type-display primer">
                <span className={hasLatinLabel(item) ? "is-latin" : undefined}>{itemLabel(item)}</span>
              </p>
            </div>
          </div>

          <p className="c-remove-dialog__message brevier">
            It will be taken off your shopping list{lostWithItem(item)}. This can&rsquo;t be undone.
          </p>

          {error && !isRemoving && (
            <p className="c-purchase-dialog__error brevier" role="alert">
              <Icon name="alertTriangle" size={16} />
              <span>{error} It&rsquo;s still on your list.</span>
            </p>
          )}

          <div className="c-remove-dialog__actions">
            <Button type="button" variant="ghost" disabled={isRemoving} onClick={onKeep}>
              Keep it
            </Button>
            <Button type="button" variant="danger" disabled={isRemoving} onClick={onRemove}>
              {isRemoving ? "Removing…" : error ? "Try again" : "Remove from list"}
            </Button>
          </div>
        </div>
      )}
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

  // An item added here is first shown under a temporary id, then under the
  // server's. Its line and its mark in the border keep the temporary id as
  // their key, so the swap doesn't remount them and replay their entrance.
  const [tempKeys, setTempKeys] = useState<ReadonlyMap<string, string>>(new Map());
  const keyFor = (item: ShoppingListItemData) => tempKeys.get(item.id) ?? item.id;

  // Marks for the plants here on arrival draw in as a staggered planting;
  // one added later draws alone, at once.
  const [initialIds] = useState(() => new Set(initialItems.map((item) => item.id)));
  const [activeKey, setActiveKey] = useState<string | null>(null);
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
  // Keyed on which items are in flight, so the tick limit restarts whenever
  // that set changes (a new item added, one finishing).
  const lookupsInFlight = items.filter(isLookingUp).map((item) => item.id).join(",");
  useEffect(() => {
    if (!lookupsInFlight) return;
    let ticksLeft = Math.ceil(LOOKUP_PENDING_STALE_MS / LOOKUP_POLL_INTERVAL_MS);
    const interval = setInterval(() => {
      if (ticksLeft-- <= 0) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, LOOKUP_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lookupsInFlight, router]);

  const [deleteTarget, setDeleteTarget] = useState<ShoppingListItemData | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

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
    setTempKeys((prev) => new Map(prev).set(saved.id, tempId));
    setAdded((prev) => prev.map((item) => (item.id === tempId ? saved : item)));
    return { ok: true };
  }

  // A starter name from the empty sheet goes into the form's name field, for
  // the user to add or change. The field is uncontrolled (see AddItemForm), so
  // it is written to directly.
  function pickStarterName(name: string) {
    const input = document.getElementById("shopping-add-name");
    if (!(input instanceof HTMLInputElement)) return;
    input.value = name;
    input.focus();
    input.scrollIntoView({ block: "center", behavior: "smooth" });
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

  // --- delete flow: the dialog stays open while it removes, so a failure is
  // reported there, beside the plant it is about ---
  async function doDelete() {
    if (!deleteTarget || isRemoving) return;
    const target = deleteTarget;
    setIsRemoving(true);
    setRemoveError(null);

    let result: { error?: string };
    try {
      result = await deleteShoppingListItem(target.id);
    } catch {
      result = { error: "failed" };
    }
    setIsRemoving(false);

    if (result.error) {
      setRemoveError("Couldn’t remove it.");
      return;
    }
    hide(target.id);
    setDeleteTarget(null);
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
    <div className="c-order-book">
      <header className="c-order-book__band">
        <div className="c-order-book__head">
          <h1 className="c-order-book__title o-type-display canon">Shopping list</h1>
          {items.length > 0 && (
            <p className="c-order-book__aside o-type-display long-primer">
              {wantedLine(items.length)}
            </p>
          )}
        </div>
        <OrderBookBorder
          plants={items.map((item) => ({ key: keyFor(item), fresh: !initialIds.has(item.id) }))}
          activeKey={activeKey}
        />
      </header>

      <AddItemForm onAdd={handleAdd} />

      <div className="c-order-book__ledger">
        {deleteError && (
          <p className="c-order-book__error brevier" role="alert">
            {deleteError}
          </p>
        )}

        {items.length === 0 ? (
          <EmptyState onPickName={pickStarterName} />
        ) : (
          <ul className="c-shopping-item-list" role="list">
            {items.map((item) => {
              const key = keyFor(item);
              return (
                <ItemCard
                  key={key}
                  item={item}
                  arriving={key.startsWith(OPTIMISTIC_PREFIX)}
                  onPurchase={() => { setPurchaseTarget(item); setPurchaseError(null); }}
                  onDelete={() => { setDeleteTarget(item); setRemoveError(null); }}
                  onActive={(active) =>
                    setActiveKey((current) => (active ? key : current === key ? null : current))
                  }
                />
              );
            })}
          </ul>
        )}
      </div>

      <RemoveDialog
        item={deleteTarget}
        isRemoving={isRemoving}
        error={removeError}
        onRemove={doDelete}
        onKeep={() => { if (!isRemoving) { setDeleteTarget(null); setRemoveError(null); } }}
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
