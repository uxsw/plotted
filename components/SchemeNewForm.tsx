"use client";

import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { plantDisplayTitle } from "@/lib/plantName";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import type { Plant, SchemeSpace } from "@/lib/types";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

const MAX_PLANTS = 5;

type PickerPlant = Pick<Plant, "id" | "photo_url" | "genus" | "species" | "cultivar" | "common_names">;

const SPACE_OPTIONS: { value: SchemeSpace; label: string; description: string }[] = [
  { value: "small", label: "Small", description: "up to 2m²" },
  { value: "medium", label: "Medium", description: "2–6m²" },
  { value: "large", label: "Large", description: "6m²+" },
];

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


export default function SchemeNewForm({ plants }: { plants: PickerPlant[] }) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "preferences">("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [space, setSpace] = useState<SchemeSpace | null>(null);
  const [successional, setSuccessional] = useState(true);
  const [edible, setEdible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PLANTS) return prev;
      return [...prev, id];
    });
  }

  async function handleGenerate() {
    if (!space) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/schemes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant_ids: selectedIds, space, successional, edible }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      router.push(`/schemes/${json.scheme_id}/generating`);
    } catch {
      router.push("/schemes");
    }
  }

  if (plants.length === 0) {
    return (
      <div className="surface-info island o-stack">
        <div className="text-marigold">
          <SproutIcon />
        </div>
        <h2 className="font-display pica">Add a plant to get started</h2>
        <p className="brevier">
          Companion suggestions are based on what&apos;s already growing in your garden. Add a plant or two, and Plotted will show you what pairs well alongside them.
        </p>
        <Link
          href="/plants/new"
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--primary"],
          )}
        >
          + Add a plant
        </Link>
      </div>
    );
  }

  if (step === "select") {
    const selectedPlants = selectedIds
      .map((id) => plants.find((p) => p.id === id))
      .filter(Boolean) as PickerPlant[];

    return (
      <div className="o-stack">
        <div className="o-stack">
          <p className="minion">Step 1 of 2</p>
          <h1 className="long-primer o-type-display kirk">Pick up to 5 plants</h1>
          <p className="primer">
            Choose the plants you&apos;d like companion suggestions for.
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
                  <span className="minion">
                    {plantDisplayTitle(plant)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="c-scheme-scroller__selected">
          <span className="minion">
            Selected ({selectedIds.length}/5)
          </span>
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
              return (
                <div
                  key={i}
                  className="scheme-scroller__placeholder"
                />
              );
            })}
          </div>
        </div>

        <Button
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--primary"]
          )}
          disabled={selectedIds.length === 0}
          onClick={() => setStep("preferences")}
        >
          Continue with {selectedIds.length} plant{selectedIds.length === 1 ? "" : "s"} →
        </Button>
      </div>
    );
  }

  return (
    <div className="o-stack">
      <div className="o-stack">
        <button
          type="button"
          onClick={() => setStep("select")}
          className={clsx(
              buttonStyles["o-button"],
              buttonStyles["o-button--ghost"],
              buttonStyles["o-button--flush-start"]
            )}
        >
          <Icon name="back" aria-label="Back" />
          Back to plant selection
        </button>
        
        <div className="c-scheme-prefs">
          <p className="minion">Step 2 of 2</p>
          <h1 className="pica o-type-display kirk">Preferences</h1>
          <span className="brevier">Space available</span>
          <div className="c-scheme-prefs__opts">
            {SPACE_OPTIONS.map((opt) => {
              const selected = space === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpace(opt.value)}
                  className={[
                    "c-scheme-prefs__choice",
                    selected
                      ? "is-selected"
                      : "is-default",
                  ].join(" ")}
                >
                  <span className="primer">{opt.label}</span>
                  <span className="minion">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="c-scheme-prefs__toggle">
        <Toggle
          id="successional"
          checked={successional}
          onChange={setSuccessional}
          label="Fill gaps in flowering season"
        />
        <Toggle
          id="edible"
          checked={edible}
          onChange={setEdible}
          label="Include edible and kitchen garden plants"
        />
      </div>

      <Button
        variant="primary"
        className="w-full justify-center"
        disabled={!space || submitting}
        onClick={handleGenerate}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Generating…
          </span>
        ) : (
          "Generate a scheme"
        )}
      </Button>
    </div>
  );
}
