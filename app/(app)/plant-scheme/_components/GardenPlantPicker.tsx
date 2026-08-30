"use client";

/**
 * Path A: pick plants already in the user's garden as the starting point.
 *
 * The picker markup and CSS classes (`c-scheme-scroller`, etc.) are copied from
 * components/SchemeNewForm.tsx's select step rather than shared, to keep this
 * feature a wholly isolated code path (see the segment layout comment). If both
 * features settle on the same picker long-term, extract it then.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { plantDisplayTitle } from "@/lib/plantName";
import { Button } from "@/components/ui/Button";
import buttonStyles from "@/components/ui/Button.module.css";
import type { Plant } from "@/lib/types";
import { usePlantScheme } from "./PlantSchemeContext";

const MAX_PLANTS = 5;

export type PickerPlant = Pick<
  Plant,
  "id" | "photo_url" | "genus" | "species" | "cultivar" | "common_names"
>;

function SproutIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 8c-4 0-8 4-8 8s4 8 8 8c0 4-2 8-8 12h16c-6-4-8-8-8-12 4 0 8-4 8-8s-4-8-8-8z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1,5.5 4,8.5 10,2" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
    </svg>
  );
}

export default function GardenPlantPicker({ plants }: { plants: PickerPlant[] }) {
  const router = useRouter();
  const { path, choosePath, setSelectedPlants } = usePlantScheme();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Make this path usable on a direct link too, not only via the entry page.
  useEffect(() => {
    if (path !== "existing") choosePath("existing");
  }, [path, choosePath]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PLANTS) return prev;
      return [...prev, id];
    });
  }

  function handleContinue() {
    const labels = selectedIds
      .map((id) => plants.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => plantDisplayTitle(p as PickerPlant));
    setSelectedPlants(selectedIds, labels);
    router.push("/plant-scheme/chat");
  }

  if (plants.length === 0) {
    return (
      <div className="o-surface--info island o-stack">
        <div className="text-marigold">
          <SproutIcon />
        </div>
        <h2 className="font-display pica">No plants in your garden yet</h2>
        <p className="brevier">
          Placeholder: this path builds a scheme around plants Plotted already knows you&apos;re
          growing. Add a plant first, or start from scratch instead.
        </p>
        <Link
          href="/plant-scheme/scratch"
          className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
        >
          Start from scratch instead
        </Link>
      </div>
    );
  }

  const selectedPlants = selectedIds
    .map((id) => plants.find((p) => p.id === id))
    .filter(Boolean) as PickerPlant[];

  return (
    <div className="o-stack">
      <div className="o-stack">
        <p className="minion">Placeholder · step 1</p>
        <h1 className="long-primer o-type-display kirk">Pick up to 5 plants</h1>
        <p className="primer">
          Placeholder: choose the plants you&apos;d like the new scheme built around.
        </p>
      </div>

      <div
        className="c-scheme-scroller o-scroller"
        style={{ paddingLeft: 24, paddingRight: 24 }}
      >
        {plants.map((plant) => {
          const selected = selectedIds.includes(plant.id);
          const disabled = !selected && selectedIds.length >= MAX_PLANTS;
          return (
            <button
              key={plant.id}
              type="button"
              onClick={() => toggleSelect(plant.id)}
              disabled={disabled}
              aria-pressed={selected}
              className={[
                "c-scheme-scroller__card",
                selected ? "is-selected" : "default",
                disabled ? "is-disabled" : "",
              ].join(" ")}
            >
              {plant.photo_url ? (
                <Image src={plant.photo_url} alt="" fill sizes="min(60vw, 280px)" className="is-image" />
              ) : (
                <div className="missing-image">
                  <SproutIcon />
                </div>
              )}
              {selected && (
                <div className="c-scheme-scroller__check">
                  <span className="is-icon">
                    <CheckIcon />
                  </span>
                </div>
              )}
              <div className="overlay-text">
                <span className="minion">{plantDisplayTitle(plant)}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="c-scheme-scroller__selected">
        <span className="minion">Selected ({selectedIds.length}/5)</span>
        <div className="c-scheme-scroller__selected-list">
          {Array.from({ length: MAX_PLANTS }).map((_, i) => {
            const plant = selectedPlants[i];
            if (plant) {
              return (
                <div key={plant.id} className="scheme-scroller__selected-item">
                  <div className="is-inner">
                    {plant.photo_url ? (
                      <Image src={plant.photo_url} alt={plantDisplayTitle(plant)} fill sizes="100px" className="is-image" />
                    ) : (
                      <div className="missing-image">
                        <SproutIcon />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelect(plant.id)}
                    aria-label={`Remove ${plantDisplayTitle(plant)}`}
                    className="is-remove"
                  >
                    <XSmallIcon />
                  </button>
                </div>
              );
            }
            return <div key={i} className="scheme-scroller__placeholder" />;
          })}
        </div>
      </div>

      <Button
        className={clsx(buttonStyles["o-button"], buttonStyles["o-button--primary"])}
        disabled={selectedIds.length === 0}
        onClick={handleContinue}
      >
        Continue with {selectedIds.length} plant{selectedIds.length === 1 ? "" : "s"} →
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
