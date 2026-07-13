"use client";

import { useState } from "react";
import Image from "next/image";
import { markSpeciesSpotted, unmarkSpeciesSpotted } from "@/app/actions/wildlife";

export type SpeciesRow = {
  id: string;
  name: string;
  image_path: string;
  description: string;
  sort_order: number;
};

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1.5,6.5 4.5,9.5 11.5,2.5" />
    </svg>
  );
}

function BirdCard({
  species,
  spotted,
  onToggle,
  error,
}: {
  species: SpeciesRow;
  spotted: boolean;
  onToggle: () => void;
  error: string | null;
}) {
  return (
    <div
      className={[
        "flex gap-3 rounded-lg border bg-paper p-3 transition-colors duration-150",
        spotted ? "border-moss/40" : "border-sand-line",
      ].join(" ")}
    >
      {/* Image — fixed dimensions; no position:absolute inside a button */}
      <div className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-paper-deep">
        <Image
          src={species.image_path}
          alt={species.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="font-display font-medium text-base text-ink leading-snug">
          {species.name}
        </p>
        <p className="font-sans text-xs text-ink-soft leading-relaxed">
          {species.description}
        </p>
        {error && (
          <p className="font-sans text-xs text-clay mt-0.5">{error}</p>
        )}
        <div className="mt-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={spotted ? `Unmark ${species.name} as spotted` : `Mark ${species.name} as spotted`}
            className={[
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium font-sans transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              spotted
                ? "bg-moss text-white hover:bg-moss-deep"
                : "bg-moss-tint text-moss hover:bg-moss hover:text-white",
            ].join(" ")}
          >
            {spotted && <CheckIcon />}
            {spotted ? "Spotted" : "Mark as spotted"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WildlifeGrid({
  initialSpecies,
  initialSpottedIds,
}: {
  initialSpecies: SpeciesRow[];
  initialSpottedIds: string[];
}) {
  const [spottedIds, setSpottedIds] = useState(() => new Set(initialSpottedIds));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = initialSpecies.length;
  const count = spottedIds.size;

  async function handleToggle(speciesId: string) {
    const wasSpotted = spottedIds.has(speciesId);

    // Optimistic update
    setSpottedIds((prev) => {
      const next = new Set(prev);
      if (wasSpotted) next.delete(speciesId); else next.add(speciesId);
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[speciesId];
      return next;
    });

    const result = wasSpotted
      ? await unmarkSpeciesSpotted(speciesId)
      : await markSpeciesSpotted(speciesId);

    if (result.error) {
      // Revert optimistic update
      setSpottedIds((prev) => {
        const next = new Set(prev);
        if (wasSpotted) next.add(speciesId); else next.delete(speciesId);
        return next;
      });
      setErrors((prev) => ({
        ...prev,
        [speciesId]: wasSpotted
          ? "Couldn't unmark — please try again."
          : "Couldn't mark as spotted — please try again.",
      }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-sm text-ink-soft -mt-2">
        <span className="font-medium text-ink">{count}</span>/{total} spotted
      </p>
      {initialSpecies.map((species) => (
        <BirdCard
          key={species.id}
          species={species}
          spotted={spottedIds.has(species.id)}
          onToggle={() => handleToggle(species.id)}
          error={errors[species.id] ?? null}
        />
      ))}
    </div>
  );
}
