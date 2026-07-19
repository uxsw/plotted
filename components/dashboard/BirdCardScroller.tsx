"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { markSpeciesSpotted, unmarkSpeciesSpotted } from "@/app/actions/wildlife";
import type { SpeciesRow } from "@/components/WildlifeGrid";

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="1.5,6.5 4.5,9.5 11.5,2.5" />
    </svg>
  );
}

function StampBadge() {
  return (
    <div
      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-paper border-2 border-moss-deep flex items-center justify-center text-moss-deep"
      style={{ transform: "rotate(-8deg)" }}
      aria-hidden="true"
    >
      <CheckIcon />
    </div>
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={[
        "flex-none w-[80%] snap-start rounded-lg border bg-paper",
        spotted ? "border-moss/40" : "border-sand-line",
      ].join(" ")}
    >
      <div className="relative h-[160px] w-full overflow-hidden bg-paper-deep rounded-t-lg">
        <Image
          src={species.image_path}
          alt={species.name}
          fill
          sizes="80vw"
          className="object-cover"
        />
        {spotted && <StampBadge />}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
        <p className="font-display font-medium text-base text-ink leading-snug min-w-0 truncate">
          {species.name}
        </p>
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            spotted
              ? `Unmark ${species.name} as spotted`
              : `Mark ${species.name} as spotted`
          }
          className={[
            "flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-sans transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
            spotted
              ? "bg-moss text-white"
              : "border border-moss text-moss bg-transparent",
          ].join(" ")}
        >
          {spotted && <CheckIcon />}
          {spotted ? "Spotted" : "Mark as spotted"}
        </button>
      </div>

      <div className="px-4 pb-4 pt-1">
        <p
          className={[
            "font-sans text-xs text-ink-soft leading-relaxed",
            expanded ? "" : "line-clamp-2",
          ].join(" ")}
        >
          {species.description}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-sans text-xs text-moss mt-1 hover:text-moss-deep focus-visible:outline-none"
        >
          {expanded ? "Less" : "More"}
        </button>
        {error && (
          <p className="font-sans text-xs text-clay mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}

export function BirdCardScroller({
  initialSpecies,
  initialSpottedIds,
}: {
  initialSpecies: SpeciesRow[];
  initialSpottedIds: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [spottedIds, setSpottedIds] = useState(() => new Set(initialSpottedIds));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = initialSpecies.length;
  const count = spottedIds.size;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth * 0.8 + 12; // 80% width + gap-3
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, initialSpecies.length - 1));
  }, [initialSpecies.length]);

  async function handleToggle(speciesId: string) {
    const wasSpotted = spottedIds.has(speciesId);

    setSpottedIds((prev) => {
      const next = new Set(prev);
      if (wasSpotted) next.delete(speciesId);
      else next.add(speciesId);
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
      setSpottedIds((prev) => {
        const next = new Set(prev);
        if (wasSpotted) next.add(speciesId);
        else next.delete(speciesId);
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
    <div>
      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-medium text-3xl text-ink">{count}</span>
          <span className="font-sans text-sm text-ink-soft">of {total} spotted</span>
        </div>
        <div className="h-[5px] rounded-full bg-sand mt-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-moss transition-all duration-300"
            style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar"
      >
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

      {initialSpecies.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1" aria-hidden="true">
          {initialSpecies.map((_, i) => (
            <span
              key={i}
              className={`block h-1 rounded-full transition-all duration-200 ${
                i === activeIndex ? "w-4 bg-moss" : "w-1.5 bg-sand-line"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
