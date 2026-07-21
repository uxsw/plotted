"use client";

import { forwardRef, useRef, useState, useCallback, useEffect } from "react";
import clsx from "clsx";
import Image from "next/image";
import { markSpeciesSpotted, unmarkSpeciesSpotted } from "@/app/actions/wildlife";
import type { SpeciesRow } from "@/components/WildlifeGrid";
import carouselStyles from "@/components/ui/Carousel.module.css";
import buttonStyles from "@/components/ui/Button.module.css";
import progressbarStyles from "@/components/ui/ProgressBar.module.css";

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

type BirdCardProps = {
  species: SpeciesRow;
  spotted: boolean;
  onToggle: () => void;
  error: string | null;
};

const BirdCard = forwardRef<HTMLDivElement, BirdCardProps>(
  ({ species, spotted, onToggle, error }, ref) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div
        ref={ref}
        className={[
          "flex-none w-[60%] snap-center bg-white",
          spotted ? "border-moss/40" : "border-sand-line",
        ].join(" ")}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={species.image_path}
            alt={species.name}
            fill
            sizes="60vw"
            className="object-cover"
          />
          {spotted && <StampBadge />}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-4 pt-3 pb-1">
          <p className="font-display font-medium text-base leading-snug">
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
            className={clsx(
              buttonStyles["o-button"],
              spotted ? buttonStyles["o-button--primary"] : buttonStyles["o-button--ghost"]
            )}
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
);
BirdCard.displayName = "BirdCard";

export function BirdCardScroller({
  initialSpecies,
  initialSpottedIds,
}: {
  initialSpecies: SpeciesRow[];
  initialSpottedIds: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [spottedIds, setSpottedIds] = useState(() => new Set(initialSpottedIds));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Frozen partition — computed once on mount, never re-sorted during the session.
  const [{ sortedSpecies, firstUnspottedIndex }] = useState(() => {
    const spottedSet = new Set(initialSpottedIds);
    const spotted = initialSpecies.filter((s) => spottedSet.has(s.id));
    const unspotted = initialSpecies.filter((s) => !spottedSet.has(s.id));
    return {
      sortedSpecies: [...spotted, ...unspotted],
      firstUnspottedIndex: unspotted.length > 0 ? spotted.length : -1,
    };
  });

  const total = initialSpecies.length;
  const count = spottedIds.size;

  // On mount, instantly scroll to center the first unspotted card (boundary between groups).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || firstUnspottedIndex === -1) return;
    const card = cardRefs.current[firstUnspottedIndex];
    if (!card) return;
    const target = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
    el.scrollLeft = target;
    setActiveIndex(firstUnspottedIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive active index from which card's center is closest to the scroll container's center.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const containerCenter = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - containerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, []);

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
          <span className="font-display font-medium text-3xl">{count}</span>
          <span className="font-sans text-sm">of {total} spotted</span>
        </div>
        <div className={clsx(progressbarStyles["o-progress-bar"])}>
          <div
            className={clsx(progressbarStyles["o-progress-bar__complete"])}
            style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ scrollPaddingInline: "20%" }}
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar"
      >
        {sortedSpecies.map((species, i) => (
          <BirdCard
            key={species.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            species={species}
            spotted={spottedIds.has(species.id)}
            onToggle={() => handleToggle(species.id)}
            error={errors[species.id] ?? null}
          />
        ))}
      </div>

      {sortedSpecies.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1" aria-hidden="true">
          {sortedSpecies.map((_, i) => (
            <span
              key={i}
              className={clsx(
                carouselStyles["o-carousel__position"],
                i === activeIndex ? carouselStyles["o-carousel__position--current"] : carouselStyles["o-carousel__position--default"]
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
