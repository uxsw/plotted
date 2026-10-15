"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";

/**
 * 9.45 pm · the twelve garden birds, as the app shows them. The example
 * garden has seen seven, ticked off one after another when the band is
 * reached; the visitor can tick off or untick any of them to try it.
 */

const BIRDS = [
  ["robin", "Robin", true],
  ["blackbird", "Blackbird", true],
  ["blue-tit", "Blue tit", true],
  ["wren", "Wren", false],
  ["goldfinch", "Goldfinch", true],
  ["sparrow", "House sparrow", true],
  ["starling", "Starling", false],
  ["thrush", "Song thrush", false],
  ["chaffinch", "Chaffinch", true],
  ["magpie", "Magpie", true],
  ["pigeon", "Woodpigeon", false],
  ["crow", "Crow", false],
] as const;

type Bird = (typeof BIRDS)[number][0];

export default function Birds() {
  const [spotted, setSpotted] = useState<Set<Bird>>(
    () => new Set(BIRDS.filter(([, , seen]) => seen).map(([file]) => file))
  );
  /* A bird the visitor has ticked or unticked answers at once, not in the arrival's queue. */
  const [touched, setTouched] = useState<Set<Bird>>(() => new Set());

  function toggle(file: Bird) {
    setSpotted((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
    setTouched((prev) => new Set(prev).add(file));
  }

  let queue = 0;

  return (
    <div className="c-walk-visitors__tally" data-reveal>
      <ul className="c-walk-visitors__birds" aria-label="Twelve garden birds">
        {BIRDS.map(([file, name, seen]) => {
          const isSpotted = spotted.has(file);
          const style =
            seen && !touched.has(file) ? ({ "--_n": queue++ } as CSSProperties) : undefined;
          return (
            <li key={file} className={isSpotted ? "is-spotted" : undefined} style={style}>
              <button
                type="button"
                className="c-walk-visitors__bird"
                aria-pressed={isSpotted}
                onClick={() => toggle(file)}
              >
                <span className="c-walk-visitors__portrait">
                  <Image src={`/birds/${file}.webp`} alt="" width={120} height={120} />
                </span>
                {name}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="c-walk-visitors__count">
        <span className="c-walk__mono" aria-live="polite">
          {spotted.size} of 12 spotted
        </span>
        <span>An example garden. Tap a bird to tick it off.</span>
      </p>
    </div>
  );
}
