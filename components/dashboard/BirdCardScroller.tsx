"use client";

import { forwardRef, useRef, useState, useCallback, useEffect } from "react";
import clsx from "clsx";
import Image from "next/image";
import { markSpeciesSpotted, unmarkSpeciesSpotted } from "@/app/actions/wildlife";
import type { SpeciesRow } from "@/components/WildlifeGrid";
import carouselStyles from "@/components/ui/Carousel.module.css";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

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
          "c-spotted-count__card",
          spotted ? "is-spotted" : "",
        ].join(" ")}
      >
        <div className="c-spotted-count__media">
          <Image
            src={species.image_path}
            alt={species.name}
            fill
            sizes="60vw"
          />

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
              spotted ? buttonStyles["o-button--is-spotted"] : buttonStyles["o-button--not-spotted"]
            )}
          >
            {spotted && <Icon name="check" />}
            {spotted ? "Spotted" : "Mark as spotted"}
          </button>
        </div>

        <p className="o-type-display pica kirk">
          {species.name}
        </p>

        <div>
          <p
            className={[
              "brevier",
              expanded ? "" : "line-clamp-2",
            ].join(" ")}
          >
            {species.description}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="o-button--text minion"
          >
            {expanded ? "Less" : "More"}
          </button>
          {error && (
            <p className="minion text-marigold mt-1">{error}</p>
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
  const pct = total > 0 ? (count / total) * 100 : 0;

  // The progress fill eases from 0 to its value once the component is mounted,
  // so the collection reads as "filling in" on arrival rather than snapping to
  // a number. The short delay puts the width change on a later frame than mount
  // so the CSS transition catches it; a plain timeout also survives a
  // backgrounded tab, where requestAnimationFrame would stay parked. Under
  // prefers-reduced-motion the width transition is dropped in CSS
  // (_spotted-count.scss), so the bar just snaps to its value with no travel.
  const [barWidth, setBarWidth] = useState("0%");
  useEffect(() => {
    const id = setTimeout(() => setBarWidth(`${pct}%`), 60);
    return () => clearTimeout(id);
  }, [pct]);

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
    <div className="o-stack--compact">
      <div className="o-row u-pad-inline">
        {count === total && total > 0 ? (
          <span className="brevier">You&apos;ve spotted all {total}</span>
        ) : (
          <>
            <span className="c-spotted-count__count paragon kirk">{count}</span>
            <span className="brevier">of {total} spotted</span>
          </>
        )}
      </div>
      <div className="u-pad-inline">
        <div className="c-spotted-count__progress-bar">
          <div
            className="c-spotted-count__progress-bar-complete"
            style={{ width: barWidth }}
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="c-spotted-count-scroller o-scroller"
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
