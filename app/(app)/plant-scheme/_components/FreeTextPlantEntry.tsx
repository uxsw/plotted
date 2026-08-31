"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import buttonStyles from "@/components/ui/Button.module.css";
import { usePlantScheme } from "./PlantSchemeContext";

/**
 * Path B: type the plants you're considering as free text. No matching against
 * Plotted's plant records — whatever the user types is kept verbatim.
 */
export default function FreeTextPlantEntry() {
  const router = useRouter();
  const { path, choosePath, freeTextPlants, setFreeTextPlants } = usePlantScheme();
  const [names, setNames] = useState<string[]>(freeTextPlants);
  const [draft, setDraft] = useState("");

  // Make this path usable on a direct link too, not only via the entry page.
  useEffect(() => {
    if (path !== "scratch") choosePath("scratch");
  }, [path, choosePath]);

  function addDraft() {
    const value = draft.trim();
    if (!value) return;
    if (names.some((n) => n.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setNames((prev) => [...prev, value]);
    setDraft("");
  }

  function removeName(name: string) {
    setNames((prev) => prev.filter((n) => n !== name));
  }

  function handleContinue() {
    setFreeTextPlants(names);
    router.push("/plant-scheme/chat");
  }

  return (
    <div className="o-stack">
      <div className="o-stack">
        <p className="minion">Placeholder · step 1</p>
        <h1 className="long-primer o-type-display kirk">What are you thinking of planting?</h1>
        <p className="primer">
          Placeholder: type one or more plants you&apos;re considering. They don&apos;t need to be
          in your garden — press Enter after each.
        </p>
      </div>

      <div className="o-stack--compact">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="e.g. Salvia nemorosa"
          aria-label="Plant name"
          className="w-full bg-paper border border-sand-line px-3 py-2 primer outline-none focus:border-marigold"
        />
        <Button variant="secondary" onClick={addDraft} disabled={!draft.trim()}>
          + Add plant
        </Button>
      </div>

      {names.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {names.map((name) => (
            <span
              key={name}
              className="o-badge is-sm flex items-center gap-1.5"
            >
              {name}
              <button
                type="button"
                onClick={() => removeName(name)}
                aria-label={`Remove ${name}`}
                className="leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <Button
        className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
        disabled={names.length === 0}
        onClick={handleContinue}
      >
        Continue with {names.length} plant{names.length === 1 ? "" : "s"} →
      </Button>

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
    </div>
  );
}
