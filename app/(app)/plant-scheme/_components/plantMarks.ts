/**
 * Hand-authored plant silhouettes, shared by the border elevation sketch
 * (BorderElevation.tsx, many silhouettes on one shared ground line) and the
 * suggestion-card specimen plate (PlantCard.tsx, one silhouette centred in a
 * plate) — the same engraved-mark vocabulary standing in for a photo in both
 * places. Coordinates are tuned for a ~280×88 space with the ground at
 * GROUND_Y; a centred single mark (call a variant with x≈60) reads fine in a
 * narrower box since every shape's spread stays within ~±20 of its x.
 */

import type { SchemeTier } from "./PlantSchemeContext";

type Dot = { cx: number; cy: number; r: number };
export type Silhouette = { paths: string[]; dots: Dot[] };

export const GROUND_Y = 78;

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

export const TIER_VARIANTS: Record<SchemeTier, ((x: number) => Silhouette)[]> = {
  back: BACK_VARIANTS,
  mid: MID_VARIANTS,
  ground: GROUND_VARIANTS,
};

/** Deterministic 0–2 pick so the same plant always draws the same mark. */
export function pickVariantIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 3;
}
