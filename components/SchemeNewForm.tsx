"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { plantDisplayTitle } from "@/lib/plantName";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import type { Plant, SchemeSpace } from "@/lib/types";

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

function GenerationLoading() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 min-h-[70vh]">
      <svg width="120" height="150" viewBox="0 0 140 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="38" y="108" width="64" height="10" rx="5" fill="#C4742A" />
        <path d="M44 118 L96 118 L90 168 L50 168 Z" fill="#C4522A" />
        <ellipse cx="70" cy="118" rx="28" ry="6" fill="#3A2E1E" opacity="0.55" />
        <g className="plant-sway">
          <rect x="67" y="54" width="5" height="58" rx="2.5" fill="#2E5239" />
          <ellipse cx="44" cy="88" rx="22" ry="10" fill="#4A7051" stroke="#2E5239" strokeOpacity="0.4" transform="rotate(-38 44 88)" className="leaf-droop" />
          <g className="plant-sway-slow">
            <ellipse cx="98" cy="72" rx="24" ry="10" fill="#4A7051" stroke="#2E5239" strokeOpacity="0.4" transform="rotate(32 98 72)" />
          </g>
          <ellipse cx="62" cy="52" rx="14" ry="7" fill="#4A7051" opacity="0.85" transform="rotate(-18 62 52)" className="leaf-droop" />
        </g>
      </svg>

      <div className="flex flex-col items-center gap-2">
        <h2 className="font-display font-medium text-xl text-ink">Growing your scheme…</h2>
        <p className="font-sans text-sm text-ink-soft max-w-xs">
          We&apos;re pairing your plants with companions suited to your space. This usually takes 5–10 seconds.
        </p>
      </div>

      <span className="flex gap-1.5" aria-hidden="true">
        <span className="mkt-dot-1 w-2 h-2 rounded-full bg-moss inline-block" />
        <span className="mkt-dot-2 w-2 h-2 rounded-full bg-moss inline-block" />
        <span className="mkt-dot-3 w-2 h-2 rounded-full bg-moss inline-block" />
      </span>
    </div>
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

  if (submitting) {
    return <GenerationLoading />;
  }

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-16 px-6 rounded-lg bg-clay-tint/50">
        <div className="text-clay">
          <SproutIcon />
        </div>
        <h2 className="font-display font-medium text-lg text-ink">Add a plant to get started</h2>
        <p className="font-sans text-sm text-ink-soft max-w-xs">
          Companion suggestions are based on what&apos;s already growing in your garden. Add a plant or two, and Plotted will show you what pairs well alongside them.
        </p>
        <Link
          href="/plants/new"
          className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium font-sans bg-clay text-white hover:bg-clay-deep transition-colors"
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
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-soft">Step 1 of 2</p>
          <h1 className="font-display font-medium text-2xl text-ink mt-1">Pick up to 5 plants</h1>
          <p className="font-sans text-sm text-ink-soft mt-1">
            Choose the plants you&apos;d like companion suggestions for.
          </p>
        </div>

        <div
          className="flex gap-3 overflow-x-auto pb-3 -mx-4 snap-x snap-mandatory"
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
                  "relative shrink-0 rounded-xl overflow-hidden snap-center border-2 transition-all duration-150",
                  selected ? "border-moss ring-2 ring-moss ring-offset-2 ring-offset-paper" : "border-sand-line",
                  disabled ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
                style={{ width: "min(60vw, 280px)", height: "min(60vw, 280px)" }}
              >
                {plant.photo_url ? (
                  <Image src={plant.photo_url} alt="" fill sizes="min(60vw, 280px)" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-moss-tint text-moss-deep/60">
                    <SproutIcon />
                  </div>
                )}
                {selected && (
                  <div className="absolute inset-0 bg-moss/20 flex items-start justify-end p-2">
                    <span className="w-6 h-6 rounded-full bg-moss text-white flex items-center justify-center">
                      <CheckIcon />
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1.5">
                  <span className="text-[12px] text-white font-sans block">
                    {plantDisplayTitle(plant)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-sans text-xs font-semibold text-ink-soft">
            Selected ({selectedIds.length}/5)
          </span>
          <div className="flex gap-[10px] overflow-x-auto pb-1">
            {Array.from({ length: MAX_PLANTS }).map((_, i) => {
              const plant = selectedPlants[i];
              if (plant) {
                return (
                  <div key={plant.id} className="relative shrink-0 w-[84px] h-[84px]">
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      {plant.photo_url ? (
                        <Image src={plant.photo_url} alt={plantDisplayTitle(plant)} fill sizes="84px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-moss-tint text-moss-deep/60">
                          <SproutIcon />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSelect(plant.id)}
                      aria-label={`Remove ${plantDisplayTitle(plant)}`}
                      className="absolute -top-[6px] -right-[6px] w-[22px] h-[22px] rounded-full bg-paper border border-sand-line flex items-center justify-center text-ink-soft hover:text-ink hover:border-ink-soft transition-colors"
                    >
                      <XSmallIcon />
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="shrink-0 w-[84px] h-[84px] rounded-xl border-[1.5px] border-dashed border-sand-line"
                />
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-4 z-10 pt-2">
          <Button
            variant="primary"
            className="w-full justify-center"
            disabled={selectedIds.length === 0}
            onClick={() => setStep("preferences")}
          >
            Continue with {selectedIds.length} plant{selectedIds.length === 1 ? "" : "s"} →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={() => setStep("select")}
          className="font-sans text-sm text-ink-soft hover:text-ink transition-colors"
        >
          ← Back to plant selection
        </button>
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-soft mt-3">Step 2 of 2</p>
        <h1 className="font-display font-medium text-2xl text-ink mt-1">Preferences</h1>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-sans text-sm font-medium text-ink">Space available</span>
        <div className="grid grid-cols-3 gap-2">
          {SPACE_OPTIONS.map((opt) => {
            const selected = space === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSpace(opt.value)}
                className={[
                  "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-3 transition-colors",
                  selected
                    ? "border-moss bg-moss-tint text-moss-deep"
                    : "border-sand-line text-ink hover:border-moss/50",
                ].join(" ")}
              >
                <span className="font-display font-medium text-sm">{opt.label}</span>
                <span className="font-sans text-xs text-ink-soft">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-sand-line p-4">
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

      <div className="sticky bottom-4 z-10">
        <Button
          variant="primary"
          className="w-full justify-center"
          disabled={!space}
          onClick={handleGenerate}
        >
          Generate scheme
        </Button>
      </div>
    </div>
  );
}
