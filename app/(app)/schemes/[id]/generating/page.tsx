"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Status = "generating" | "complete" | "failed";

const CAROUSEL_IMAGES = [
  "/carousel/carousel-1.webp",
  "/carousel/carousel-2.webp",
  "/carousel/carousel-3.webp",
  "/carousel/carousel-4.webp",
  "/carousel/carousel-5.webp",
  "/carousel/carousel-6.webp",
  "/carousel/carousel-7.webp",
  "/carousel/carousel-8.webp",
  "/carousel/carousel-9.webp",
  "/carousel/carousel-10.webp",
  "/carousel/carousel-11.webp",
  "/carousel/carousel-12.webp",
];

const POLL_INTERVAL_MS = 4000;

function LoadingSpinner() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-marigold animate-spin"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function GeneratingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("generating");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    async function poll() {
      if (!activeRef.current) return;
      try {
        const res = await fetch(`/api/schemes/${id}/status`);
        if (!activeRef.current) return;
        if (res.status === 404) {
          router.replace("/schemes");
          return;
        }
        if (!res.ok) return;
        const { status: s } = (await res.json()) as { status: Status };
        if (!activeRef.current) return;
        setStatus(s);
        if (s !== "generating") {
          activeRef.current = false;
        }
      } catch {
        // network error — keep polling
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, [id, router]);

  const prev = useCallback(() => {
    setCarouselIndex((i) => (i - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  }, []);

  const next = useCallback(() => {
    setCarouselIndex((i) => (i + 1) % CAROUSEL_IMAGES.length);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div aria-live="polite" aria-atomic="true">
        {status === "generating" && (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <LoadingSpinner />
            <div>
              <h1 className="font-display font-medium text-2xl text-ink">
                Planting scheme being generated
              </h1>
              <p className="font-sans text-sm text-ink-soft mt-1">
                This usually takes around 30 seconds.
              </p>
            </div>
          </div>
        )}

        {status === "complete" && (
          <Link
            href={`/schemes/${id}`}
            className="block rounded-xl border border-marigold bg-marigold px-6 py-6 text-center hover:bg-marigold transition-colors"
          >
            <h1 className="font-display font-medium text-2xl text-ink">
              Your planting scheme is ready.
            </h1>
            <p className="font-sans text-sm text-ink/80 mt-1">View now →</p>
          </Link>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <h1 className="font-display font-medium text-2xl text-ink">
              Planting scheme couldn&apos;t be generated
            </h1>
            <Link href="/schemes" className="font-sans text-sm text-marigold hover:underline">
              View details →
            </Link>
          </div>
        )}
      </div>

      <div
        role="region"
        aria-label="Garden photos"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") prev();
          if (e.key === "ArrowRight") next();
        }}
        className="relative overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3]">
          <Image
            src={CAROUSEL_IMAGES[carouselIndex]}
            alt=""
            fill
            sizes="(max-width: 500px) 100vw, 500px"
            className="object-cover"
            priority={carouselIndex === 0}
          />
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white text-lg flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white text-lg flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          ›
        </button>

        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5"
          aria-hidden="true"
        >
          {CAROUSEL_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCarouselIndex(i)}
              tabIndex={-1}
              className={[
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === carouselIndex ? "bg-white" : "bg-white/50",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
