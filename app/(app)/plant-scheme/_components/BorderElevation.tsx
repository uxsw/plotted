"use client";

/**
 * The border in cross-section — an engraved elevation sketch at the head of the
 * scheme list that grows as the scheme does. Each tiered plant draws one
 * silhouette on a shared ground line: tall canes and spires at the back of the
 * border, mounds and flower spikes mid, mats and creepers along the front.
 * While a tier is empty a dashed ghost holds its space (the schedule's
 * ghost-row idea carried into the sketch), so "nothing at ground level yet" is
 * something you can see rather than a stat.
 *
 * Purely presentational. Strokes are keyed by plant id so an existing
 * silhouette never redraws; a new plant's silhouette draws itself in
 * (stroke-dashoffset, the emphasis curve — part of the workspace's one
 * authored moment, silent under prefers-reduced-motion). Garden-origin plants
 * (tier: null) have no resolved structural role and are not sketched.
 *
 * Styles: `.c-scheme-elevation` in styles/components/_scheme-chat.scss.
 */

import { useState } from "react";
import type { SchemePlant, SchemeTier } from "./PlantSchemeContext";
import { GROUND_Y, TIER_VARIANTS as VARIANTS } from "./plantMarks";

/* Horizontal slots per tier, in planting order — spread so early additions
   already compose, later ones fill in between. Cycles past eight. */
const SLOTS: Record<SchemeTier, number[]> = {
  back: [64, 186, 118, 244, 90, 216, 146, 40],
  mid: [116, 244, 58, 200, 152, 86, 32, 176],
  ground: [86, 226, 132, 40, 182, 108, 258, 158],
};

/* Dashed ghosts holding empty tiers — one representative silhouette each. */
const GHOSTS = {
  back: VARIANTS.back[0](58),
  mid: VARIANTS.mid[0](150),
  ground: VARIANTS.ground[0](236),
};

const TIER_ORDER: SchemeTier[] = ["back", "mid", "ground"];

function tierWord(count: number, phrase: string): string {
  return count === 0 ? `nothing ${phrase} yet` : `${count} ${phrase}`;
}

export default function BorderElevation({ plants }: { plants: SchemePlant[] }) {
  /* Plants present on first render draw in as a staggered planting; anything
     added later draws alone, immediately. Lazy state, captured once at mount. */
  const [initialIds] = useState(() => new Set(plants.map((p) => p.id)));

  const byTier: Record<SchemeTier, SchemePlant[]> = {
    back: plants.filter((p) => p.tier === "back"),
    mid: plants.filter((p) => p.tier === "mid"),
    ground: plants.filter((p) => p.tier === "ground"),
  };

  let drawOrder = 0;

  return (
    <div className="c-scheme-elevation">
      <svg viewBox="0 0 280 88" aria-hidden="true">
        {/* The ground line the whole border stands on. */}
        <path className="c-scheme-elevation__ground" d={`M8 ${GROUND_Y} H272`} />

        {TIER_ORDER.map((tier) =>
          byTier[tier].length === 0 ? (
            <g key={`ghost-${tier}`} className="c-scheme-elevation__ghost">
              {GHOSTS[tier].paths.map((d, i) => (
                <path key={i} d={d} pathLength={1} />
              ))}
            </g>
          ) : (
            byTier[tier].map((plant, i) => {
              const { paths, dots } = VARIANTS[tier][i % 3](
                SLOTS[tier][i % SLOTS[tier].length] + Math.floor(i / SLOTS[tier].length) * 12
              );
              const delay = initialIds.has(plant.id) ? drawOrder++ * 0.09 : 0;
              return (
                <g
                  key={plant.id}
                  className="c-scheme-elevation__plant"
                  style={{ "--_delay": `${delay}s` } as React.CSSProperties}
                >
                  {paths.map((d, j) => (
                    <path key={j} d={d} pathLength={1} />
                  ))}
                  {dots.map((dot, j) => (
                    <circle key={j} cx={dot.cx} cy={dot.cy} r={dot.r} />
                  ))}
                </g>
              );
            })
          )
        )}
      </svg>
      <p className="u-visually-hidden">
        Border shape so far: {tierWord(byTier.back.length, "at the back")},{" "}
        {tierWord(byTier.mid.length, "mid-border")}, {tierWord(byTier.ground.length, "at ground level")}.
      </p>
    </div>
  );
}
