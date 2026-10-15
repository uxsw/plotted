"use client";

import { useEffect } from "react";

/**
 * The wind: brush the pointer through a planting and the plants bend the way
 * it is moving, then spring back once it stops. Fine pointers only, and never
 * under reduced motion. It writes `--_lean` on the plants it reaches; the
 * spring back is the transition on `.c-walk__plant` in _home.scss.
 */

/** How far either side of the pointer a plant still feels it, in px. */
const REACH = 220;
/** The furthest a plant bends, in degrees. */
const MAX_LEAN = 16;
/** How long the pointer has to be still before the plants straighten, in ms. */
const SETTLE_MS = 140;

type Plant = { el: SVGElement; x: number; top: number };

export default function Wind() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
      return;
    }

    const horizons = Array.from(document.querySelectorAll<HTMLElement>(".c-walk__horizon"));
    /* Plant positions relative to their horizon, measured once and again on resize, so a
       frame only ever reads one rect per horizon and never interleaves reads and writes. */
    const plants = new Map<HTMLElement, Plant[]>();
    const measure = (horizon: HTMLElement) => {
      const box = horizon.getBoundingClientRect();
      const found = Array.from(horizon.querySelectorAll<SVGElement>(".c-walk__plant")).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left + r.width / 2 - box.left, top: r.top - box.bottom };
      });
      plants.set(horizon, found);
      return found;
    };

    let leaning = new Set<SVGElement>();
    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let px = 0;
    let py = 0;
    let push = 0;

    const release = () => {
      leaning.forEach((el) => el.style.setProperty("--_lean", "0deg"));
      leaning = new Set();
    };

    const blow = () => {
      frame = 0;
      const next = new Map<SVGElement, number>();
      for (const horizon of horizons) {
        const box = horizon.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) continue;
        if (py > box.bottom + 8 || py < box.top - 8) continue;
        for (const plant of plants.get(horizon) ?? measure(horizon)) {
          const dx = Math.abs(box.left + plant.x - px);
          /* Only a plant the pointer is actually down among, not one it passes over. */
          if (dx > REACH || py < box.bottom + plant.top - 12) continue;
          const falloff = 1 - dx / REACH;
          next.set(plant.el, push * falloff * falloff);
        }
      }
      leaning.forEach((el) => {
        if (!next.has(el)) el.style.setProperty("--_lean", "0deg");
      });
      next.forEach((lean, el) => el.style.setProperty("--_lean", `${lean.toFixed(2)}deg`));
      leaning = new Set(next.keys());
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      push = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, e.movementX * 1.1));
      if (!frame) frame = requestAnimationFrame(blow);
      clearTimeout(settle);
      settle = setTimeout(release, SETTLE_MS);
    };

    const onResize = () => plants.clear();

    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(settle);
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
