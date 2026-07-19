"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SchemeSummary } from "@/components/SchemeList";

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
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar"
      >
        {schemes.map((scheme) => (
          <Link
            key={scheme.id}
            href={`/schemes/${scheme.id}`}
            className="flex-none w-[80%] snap-start rounded-lg overflow-hidden border border-sand-line bg-paper hover:shadow-md active:scale-[0.98] active:opacity-75 transition-all duration-75 flex flex-col"
          >
            <div className="relative h-[130px] shrink-0 w-full overflow-hidden bg-paper-deep">
              {scheme.source_plant_photos[0] && (
                <Image
                  src={scheme.source_plant_photos[0]}
                  alt=""
                  fill
                  sizes="80vw"
                  className="object-cover scale-110 blur-md"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                {scheme.source_plant_photos.length > 0 ? (
                  <ThumbnailStack photos={scheme.source_plant_photos} />
                ) : (
                  <div className="w-12 h-12 text-sand-line">
                    <SchemeIllustration />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 px-4 py-3">
              <h3 className="font-display font-medium text-base text-ink leading-snug truncate">
                {scheme.name ?? "Unnamed scheme"}
              </h3>
              {scheme.narrative_intro && (
                <p className="font-sans text-xs text-ink-soft leading-snug line-clamp-2">{scheme.narrative_intro}</p>
              )}
              <p className="font-sans text-xs text-ink-soft leading-snug">{formatDate(scheme.created_at)}</p>
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-sans leading-none bg-moss-tint text-moss-deep">
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
