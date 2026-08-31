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

type Dot = { cx: number; cy: number; r: number };
type Silhouette = { paths: string[]; dots: Dot[] };

/* Base of every silhouette sits on the ground line. */
const GROUND_Y = 78;

/* Horizontal slots per tier, in planting order — spread so early additions
   already compose, later ones fill in between. Cycles past eight. */
const SLOTS: Record<SchemeTier, number[]> = {
  back: [64, 186, 118, 244, 90, 216, 146, 40],
  mid: [116, 244, 58, 200, 152, 86, 32, 176],
  ground: [86, 226, 132, 40, 182, 108, 258, 158],
};

/* ---- Engraved silhouettes, three variants per tier -------------------- */

const BACK_VARIANTS: ((x: number) => Silhouette)[] = [
  // A tuft of tall grass — arcs fanning from one crown.
  (x) => ({
    paths: [
      `M${x} ${GROUND_Y} C ${x - 1} 58 ${x - 3} 40 ${x - 10} 26`,
      `M${x} ${GROUND_Y} C ${x} 56 ${x - 1} 36 ${x - 2} 22`,
      `M${x} ${GROUND_Y} C ${x + 1} 58 ${x + 3} 40 ${x + 9} 28`,
      `M${x} ${GROUND_Y} C ${x + 2} 60 ${x + 5} 46 ${x + 14} 34`,
    ],
    dots: [],
  }),
  // A flowering spire — stem, alternating florets, a tip bud.
  (x) => ({
    paths: [
      `M${x} ${GROUND_Y} C ${x} 60 ${x} 42 ${x} 24`,
      `M${x} 62 L ${x - 6} 56`,
      `M${x} 54 L ${x + 6} 48`,
      `M${x} 46 L ${x - 5} 41`,
      `M${x} 38 L ${x + 5} 33`,
    ],
    dots: [{ cx: x, cy: 20, r: 1.6 }],
  }),
  // A tall shrub — open crown, two rising branches, scattered flowers.
  (x) => ({
    paths: [
      `M${x - 4} ${GROUND_Y} C ${x - 14} 66 ${x - 16} 46 ${x - 8} 36 C ${x - 2} 28 ${x + 6} 28 ${x + 10} 36 C ${x + 16} 46 ${x + 12} 66 ${x + 4} ${GROUND_Y}`,
      `M${x} 74 C ${x - 2} 62 ${x - 4} 52 ${x - 6} 44`,
      `M${x} 70 C ${x + 2} 58 ${x + 4} 50 ${x + 7} 42`,
    ],
    dots: [
      { cx: x - 6, cy: 40, r: 1.5 },
      { cx: x + 5, cy: 38, r: 1.5 },
      { cx: x, cy: 32, r: 1.5 },
    ],
  }),
];

const MID_VARIANTS: ((x: number) => Silhouette)[] = [
  // A leafy mound — dome outline with two inner arcs.
  (x) => ({
    paths: [
      `M${x - 16} ${GROUND_Y} C ${x - 14} 62 ${x - 8} 50 ${x} 50 C ${x + 8} 50 ${x + 14} 62 ${x + 16} ${GROUND_Y}`,
      `M${x - 9} ${GROUND_Y} C ${x - 8} 68 ${x - 4} 60 ${x - 1} 59`,
      `M${x + 9} ${GROUND_Y} C ${x + 8} 68 ${x + 4} 61 ${x + 1} 60`,
    ],
    dots: [],
  }),
  // Flower spikes — three stems tipped with buds, basal leaves.
  (x) => ({
    paths: [
      `M${x - 7} ${GROUND_Y} C ${x - 7} 68 ${x - 8} 58 ${x - 9} 52`,
      `M${x} ${GROUND_Y} C ${x} 66 ${x} 54 ${x} 46`,
      `M${x + 7} ${GROUND_Y} C ${x + 7} 68 ${x + 8} 60 ${x + 9} 54`,
      `M${x - 3} ${GROUND_Y} C ${x - 7} 74 ${x - 10} 72 ${x - 12} 72`,
      `M${x + 3} ${GROUND_Y} C ${x + 7} 74 ${x + 10} 72 ${x + 12} 72`,
    ],
    dots: [
      { cx: x - 9, cy: 49, r: 1.4 },
      { cx: x, cy: 43, r: 1.4 },
      { cx: x + 9, cy: 51, r: 1.4 },
    ],
  }),
  // An umbel — one stem, radiating spokes, a flat head of flowers.
  (x) => ({
    paths: [
      `M${x} ${GROUND_Y} C ${x} 70 ${x} 62 ${x} 56`,
      `M${x} 56 L ${x - 8} 48`,
      `M${x} 56 L ${x - 3} 46`,
      `M${x} 56 L ${x + 3} 46`,
      `M${x} 56 L ${x + 8} 48`,
    ],
    dots: [
      { cx: x - 8, cy: 46.5, r: 1.4 },
      { cx: x - 3, cy: 44.5, r: 1.4 },
      { cx: x + 3, cy: 44.5, r: 1.4 },
      { cx: x + 8, cy: 46.5, r: 1.4 },
    ],
  }),
];

const GROUND_VARIANTS: ((x: number) => Silhouette)[] = [
  // A scalloped mat hugging the ground.
  (x) => ({
    paths: [
      `M${x - 16} ${GROUND_Y} C ${x - 13} 71 ${x - 9} 71 ${x - 6} ${GROUND_Y} C ${x - 3} 71 ${x + 1} 71 ${x + 4} ${GROUND_Y} C ${x + 7} 72 ${x + 11} 72 ${x + 14} ${GROUND_Y}`,
    ],
    dots: [],
  }),
  // A low tuft — short arcs from one crown.
  (x) => ({
    paths: [
      `M${x} ${GROUND_Y} C ${x - 2} 73 ${x - 5} 70 ${x - 9} 69`,
      `M${x} ${GROUND_Y} C ${x} 72 ${x - 1} 69 ${x - 1} 66`,
      `M${x} ${GROUND_Y} C ${x + 2} 73 ${x + 5} 70 ${x + 9} 69`,
    ],
    dots: [],
  }),
  // A creeper — a wandering runner with small flowers along it.
  (x) => ({
    paths: [
      `M${x - 14} 76 C ${x - 8} 72 ${x - 2} 75 ${x + 3} 73 C ${x + 8} 71 ${x + 12} 74 ${x + 15} 72`,
    ],
    dots: [
      { cx: x - 6, cy: 71, r: 1.2 },
      { cx: x + 6, cy: 70, r: 1.2 },
    ],
  }),
];

const VARIANTS: Record<SchemeTier, ((x: number) => Silhouette)[]> = {
  back: BACK_VARIANTS,
  mid: MID_VARIANTS,
  ground: GROUND_VARIANTS,
};

/* Dashed ghosts holding empty tiers — one representative silhouette each. */
const GHOSTS: Record<SchemeTier, Silhouette> = {
  back: BACK_VARIANTS[0](58),
  mid: MID_VARIANTS[0](150),
  ground: GROUND_VARIANTS[0](236),
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
