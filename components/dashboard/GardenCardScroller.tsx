"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlantName } from "@/components/plants/PlantName";
import type { Plant } from "@/lib/types";

type PlantSummary = Pick<Plant, "id" | "species" | "cultivar" | "common_names" | "photo_url">;

function BotanicalPlaceholder() {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-14 h-14 text-clay"
      aria-hidden="true"
    >
      <path
        d="M48 82V46M48 46C48 46 37 38 37 24M48 46C48 46 59 38 59 24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 58C48 58 33 54 26 42M48 58C48 58 63 54 70 42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 82h40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GardenCardScroller({ plants }: { plants: PlantSummary[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth * 0.8 + 12; // 80% width + gap-3
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, plants.length - 1));
  }, [plants.length]);

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar"
      >
        {plants.map((plant) => (
          <Link
            key={plant.id}
            href={`/plants/${plant.id}`}
            className="flex-none w-[80%] snap-start rounded-lg overflow-hidden border border-sand-line bg-paper hover:shadow-md active:scale-[0.98] active:opacity-75 transition-all duration-75 h-[280px] flex flex-col"
          >
            <div className="relative h-[160px] shrink-0 w-full overflow-hidden bg-paper-deep">
              {plant.photo_url ? (
                <Image
                  src={plant.photo_url}
                  alt={plant.species ?? ""}
                  fill
                  sizes="80vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BotanicalPlaceholder />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center flex-1 px-4 py-3 min-h-0">
              <p className="font-display font-medium text-base text-ink leading-snug line-clamp-2">
                <PlantName species={plant.species} cultivar={plant.cultivar} variant="card" />
              </p>
              {plant.common_names?.[0] && (
                <p className="font-sans text-xs text-ink-soft leading-snug mt-1 truncate">
                  {plant.common_names[0]}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {plants.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1" aria-hidden="true">
          {plants.map((_, i) => (
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
