"use client";

import { useRef, useState, useCallback } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { PlantName } from "@/components/plants/PlantName";
import type { Plant } from "@/lib/types";
import carouselStyles from "@/components/ui/Carousel.module.css";
import { Icon } from "@/components/ui/Icon";
type PlantSummary = Pick<
  Plant,
  "id" | "genus" | "species" | "cultivar" | "common_names" | "photo_url" | "identification_status"
>;

export function GardenCardScroller({ plants }: { plants: PlantSummary[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Measure the real card + gap rather than assuming a fixed ratio — the
    // item is 60% wide but clamps at max-width, so a ratio drifts on wide screens.
    const firstCard = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 8;
    const cardWidth = firstCard ? firstCard.offsetWidth + gap : el.clientWidth * 0.6 + gap;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, plants.length - 1));
  }, [plants.length]);

  return (
    <div>
      <div className="c-dash-heading">
        <h2 className="pica o-type-display kirk">Lately in your garden</h2>
        <p className="brevier">The plants you&apos;ve added or updated most recently.</p>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="c-plant-scroller o-scroller"
      >
        {plants.map((plant) => (
          <Link
            key={plant.id}
            href={`/plants/${plant.id}`}
            data-identification-status={plant.identification_status}
            className="c-plant-scroller__item"
          >
            <div className="c-plant-scroller__media">
              {plant.photo_url ? (
                <Image
                  src={plant.photo_url}
                  alt={plant.species ?? ""}
                  fill
                  sizes="80vw"
                  className="is-plant-image"
                />
              ) : (
                <div className="is-placeholder">
                  <Icon name="sprout" size={32} />
                </div>
              )}
            </div>
            <div className="o-stack--compact u-island">
              <p className="o-type-display long-primer o-type--italic kirk">
                <PlantName genus={plant.genus} species={plant.species} cultivar={plant.cultivar} variant="card" />
              </p>
              {plant.common_names?.[0] && (
                <p className="brevier">
                  {plant.common_names[0]}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {plants.length > 1 && (
        <div className="c-plant-scroller__dots flex justify-center gap-1.5 mt-1" aria-hidden="true">
          {plants.map((_, i) => (
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
