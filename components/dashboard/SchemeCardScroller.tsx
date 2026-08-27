"use client";

import { useRef, useState, useCallback } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import type { SchemeSummary } from "@/components/SchemeList";
import carouselStyles from "@/components/ui/Carousel.module.css";

function ThumbnailStack({ photos }: { photos: string[] }) {
  const shown = photos.slice(0, 5);
  return (
    <div className="flex w-full items-center justify-center">
      {shown.map((url, i) => (
        <div
          key={i}
          className="relative aspect-square rounded-full overflow-hidden border-2 border-paper shadow-sm"
          style={{ width: "19%", marginLeft: i === 0 ? 0 : "-5%", zIndex: shown.length - i }}
        >
          <Image src={url} alt="" fill sizes="15vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function SchemeIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path
        d="M24 78V50M24 50C24 50 17 44 17 34M24 50C24 50 31 44 31 34"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M48 78V38M48 38C48 38 39 30 39 18M48 38C48 38 57 30 57 18"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M72 78V54M72 54C72 54 65 48 65 40M72 54C72 54 79 48 79 40"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M12 78h72" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SchemeCardScroller({ schemes }: { schemes: SchemeSummary[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth * 0.8 + 12; // 80% width + gap-3
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, schemes.length - 1));
  }, [schemes.length]);

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="c-carousel o-scroller"
      >
        {schemes.map((scheme) => (
          <Link
            key={scheme.id}
            href={`/schemes/${scheme.id}`}
            className="c-carousel__item"
          >
            <div className="c-carousel__media">
              {scheme.source_plant_photos[0] && (
                <Image
                  src={scheme.source_plant_photos[0]}
                  alt=""
                  fill
                  sizes="80vw"
                  className="is-scheme-image"
                />
              )}
              <div className="c-carousel__scheme-stack">
                {scheme.source_plant_photos.length > 0 ? (
                  <ThumbnailStack photos={scheme.source_plant_photos} />
                ) : (
                  <div className="w-12 h-12 text-sand-line">
                    <SchemeIllustration />
                  </div>
                )}
              </div>
            </div>
            <div className="o-stack--compact u-island--compact">
              <h3 className="o-type-display primer kirk">
                {scheme.name ?? "Unnamed scheme"}
              </h3>
              {scheme.narrative_intro && (
                <p className="brevier o-type-line-clamp-2">{scheme.narrative_intro}</p>
              )}
              <p className="minion">{formatDate(scheme.created_at)}</p>
              <div>
                <span className="o-badge is-suggestion-count is-sm">
                  {scheme.suggestion_count} suggestion{scheme.suggestion_count === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {schemes.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1" aria-hidden="true">
          {schemes.map((_, i) => (
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
