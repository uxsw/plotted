"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { usePlantScheme } from "./PlantSchemeContext";
import { Icon } from "@/components/ui/Icon";

/**
 * Path B, step 2 of the "from scratch" journey — draft a plant schedule as
 * free text. Nothing is matched against Plotted's records; whatever the user
 * types is kept verbatim and handed to the conversation step
 * (/plant-scheme/chat) as its starting context.
 *
 * Visual language follows the entry screen: the spring-green "from scratch"
 * accent carried through, the catalogue folio device turned into a journey
 * step marker, and the bare-plot engraving reused as the list's watermark.
 * The list is drawn as a numbered plant schedule with faint upcoming rows,
 * so a growing list feels like something taking shape.
 */

const MIN_ROWS = 4; // the blank schedule always shows at least this many lines
const MAX_GHOSTS = 3; // …and never trails more than this many empty ones

export default function FreeTextPlantEntry() {
  const router = useRouter();
  const { path, choosePath, freeTextPlants, setFreeTextPlants } = usePlantScheme();
  const [names, setNames] = useState<string[]>(freeTextPlants);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Usable on a direct link too, not only via the entry page.
  useEffect(() => {
    if (path !== "scratch") choosePath("scratch");
  }, [path, choosePath]);

  // Keep the list in cross-route state so stepping Back and forward doesn't lose it.
  useEffect(() => {
    setFreeTextPlants(names);
  }, [names, setFreeTextPlants]);

  function addDraft() {
    const value = draft.trim();
    if (!value) return;
    if (names.some((n) => n.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setNames((prev) => [...prev, value]);
    setDraft("");
    inputRef.current?.focus();
  }

  function removeName(target: string) {
    setNames((prev) => prev.filter((n) => n !== target));
  }

  function handleContinue() {
    setFreeTextPlants(names);
    router.push("/plant-scheme/chat");
  }

  const ghostCount =
    names.length === 0
      ? MIN_ROWS
      : Math.min(MAX_GHOSTS, Math.max(1, MIN_ROWS - names.length));

  return (
    <div className="c-scheme-scratch">
      <div className="c-scheme-journey" aria-label="Step 2 of 3: list your plants">
        <span className="o-type-label">From scratch</span>
        <span className="c-scheme-journey__track" aria-hidden="true">
          <span className="is-done" />
          <span className="is-current" />
          <span />
        </span>
        <span className="o-type-label c-scheme-journey__count">Step 2 / 3</span>
      </div>

      <div className="o-stack">
        <h1 className="paragon o-type-display kirk">What would you like to grow?</h1>
        <p className="primer o-measure">
          A few plants you&apos;re considering — they don&apos;t need to be in your garden
          yet.
        </p>
      </div>

      <form
        className="c-scheme-scratch__add"
        onSubmit={(e) => {
          e.preventDefault();
          addDraft();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Salvia nemorosa"
          aria-label="Add a plant"
          autoComplete="off"
          className="c-scheme-scratch__field primer"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--secondary"])}
        >
          Add
        </button>
      </form>

      <div className="c-scheme-schedule">
        <div className="c-scheme-schedule__head">
          <span className="o-type-label">Your plant list</span>
          <span className="o-type-label c-scheme-schedule__count">
            {names.length} plant{names.length === 1 ? "" : "s"}
          </span>
        </div>

        <ol className="c-scheme-schedule__rows">
          {names.map((name, i) => (
            <li key={name} className="c-scheme-schedule__row">
              <span className="c-scheme-schedule__no o-type-label">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="c-scheme-schedule__name">{name}</span>
              <button
                type="button"
                onClick={() => removeName(name)}
                aria-label={`Remove ${name}`}
                className="c-scheme-schedule__remove"
              >
                <Icon name="close" size={12} />
              </button>
            </li>
          ))}

          {Array.from({ length: ghostCount }).map((_, i) => (
            <li
              key={`ghost-${i}`}
              className="c-scheme-schedule__row is-ghost"
              aria-hidden="true"
            >
              <span className="c-scheme-schedule__no o-type-label">
                {String(names.length + i + 1).padStart(2, "0")}
              </span>
              <span className="c-scheme-schedule__name">
                {names.length === 0 && i === 0 ? "Add your first plant above" : ""}
              </span>
            </li>
          ))}
        </ol>

        <Icon name="sprout" className="c-scheme-schedule__watermark" />
      </div>

      <p className="long-primer o-type-display o-type--italic c-scheme-scratch__next">
        Next, you&apos;ll talk it through with Plotted and shape these into a full
        planting scheme.
      </p>

      <div className="c-scheme-scratch__footer">
        <Link
          href="/plant-scheme"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >
          ← Back
        </Link>
        <button
          type="button"
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
          disabled={names.length === 0}
          onClick={handleContinue}
        >
          Continue with {names.length} plant{names.length === 1 ? "" : "s"} →
        </button>
      </div>
    </div>
  );
}
