"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The time-of-day rail: the page's one piece of navigation after the header.
 * The sun travels down it as the page scrolls (--walk-p, 0–1, set on the
 * rail), each stop is a tick that links to its band (placed at --_at, the
 * scroll position where that band begins), and the rail takes its
 * ink from whichever band is under the middle of the viewport.
 *
 * Also the page's scroll observer: it adds `.is-in` to each `[data-horizon]`
 * the first time it is reached, which is what draws that band's planting.
 */

export type Stop = { id: string; time: string; label: string; tone: "light" | "dark" };

export default function WalkRail({ stops }: { stops: Stop[] }) {
  const railRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      rail.style.setProperty("--walk-p", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const bands = stops
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    /* Each tick sits where the sun will be when its band reaches the top. */
    const ticks = rail.querySelectorAll<HTMLElement>("li");
    const layout = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bands.forEach((band, i) => {
        const at = max > 0 ? Math.min(1, band.offsetTop / max) : 0;
        ticks[i]?.style.setProperty("--_at", at.toFixed(4));
      });
      onScroll();
    };
    layout();
    window.addEventListener("scroll", onScroll, { passive: true });
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(document.body);
    const bandObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(bands.indexOf(entry.target as HTMLElement));
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    bands.forEach((el) => bandObserver.observe(el));

    const horizonObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            horizonObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    document.querySelectorAll("[data-horizon]").forEach((el) => horizonObserver.observe(el));

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      bandObserver.disconnect();
      horizonObserver.disconnect();
    };
  }, [stops]);

  const tone = stops[active]?.tone ?? "light";

  return (
    <nav
      ref={railRef}
      className={`c-walk__rail is-${tone}`}
      aria-label="The evening round"
    >
      <span className="c-walk__sun" aria-hidden="true" />
      <ol className="c-walk__stops">
        {stops.map((stop, i) => (
          <li key={stop.id}>
            <a
              href={`#${stop.id}`}
              className="c-walk__stop"
              aria-current={i === active ? "location" : undefined}
            >
              <span className="c-walk__stop-time">{stop.time}</span>
              <span className="c-walk__stop-label">{stop.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
