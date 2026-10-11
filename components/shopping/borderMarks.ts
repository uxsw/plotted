/**
 * Silhouettes for the engraved border in the shopping list's letterhead
 * (ShoppingList.tsx). The scheme journey's nine plant marks
 * (plant-scheme/_components/plantMarks.ts) come first, so both borders are
 * drawn in one hand; the rest are authored here in the same vocabulary —
 * single strokes on a ground line, small dots for flower heads.
 *
 * Every mark is centred on x = 22 in a 44-wide frame, standing on the ground
 * at y = 78 and reaching no higher than y = 18 (BorderMark's viewBox).
 */

import {
  GROUND_Y as G,
  TIER_VARIANTS,
  type Silhouette,
} from "@/app/(app)/plant-scheme/_components/plantMarks";

const X = 22;

const SCHEME_MARKS: Silhouette[] = [
  ...TIER_VARIANTS.back,
  ...TIER_VARIANTS.mid,
  ...TIER_VARIANTS.ground,
].map((variant) => variant(X));

const EXTRA_MARKS: Silhouette[] = [
  // An allium — a globe of spokes on a bare stem.
  {
    paths: [
      `M22 ${G} C 22 64 23 52 22 41`,
      "M12 31 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0",
      "M22 31 L22 24 M22 31 L28 27.5 M22 31 L28 34.5 M22 31 L22 38 M22 31 L16 34.5 M22 31 L16 27.5",
    ],
    dots: [
      { cx: 22, cy: 23, r: 1.1 },
      { cx: 29, cy: 27, r: 1.1 },
      { cx: 29, cy: 35, r: 1.1 },
      { cx: 15, cy: 35, r: 1.1 },
      { cx: 15, cy: 27, r: 1.1 },
    ],
  },
  // A fern — two arching fronds, pinnae shortening toward the tips.
  {
    paths: [
      `M22 ${G} C 22 62 24 44 32 30`,
      "M22 70 l-6 -3 M22 70 l6 -2 M22.6 62 l-6 -3 M22.6 62 l6 -2 M23.8 54 l-5 -3 M23.8 54 l5 -1.5 M25.6 46 l-4.5 -3 M25.6 46 l4.5 -1 M28 39 l-3.5 -2.5 M28 39 l3.5 -0.5 M30.5 33 l-2.5 -2 M30.5 33 l2.5 0",
      `M22 ${G} C 21 68 17 56 9 49`,
      "M20.6 68 l-4.5 -1 M20.6 68 l2.5 -4.5 M17.4 59 l-4 -0.5 M17.4 59 l2 -4 M13.4 52.5 l-3 0.5 M13.4 52.5 l1 -3.5",
    ],
    dots: [],
  },
  // A foxglove — a leaning spire hung with bells down one side.
  {
    paths: [
      `M22 ${G} C 22 60 21 40 23 23`,
      "M22 64 c4 -1 7 1 7 5 M21.8 56 c4 -1 6.5 1 6.5 4.5 M21.8 48 c3.5 -1 6 1 6 4 M22 40 c3 -1 5 0.5 5 3.5 M22.4 33 c2.5 -1 4 0.5 4 3",
      `M22 ${G} C 16 73 12 73 8 76`,
      `M22 ${G} C 28 73 32 73 36 76`,
    ],
    dots: [{ cx: 23.2, cy: 20.5, r: 1.5 }],
  },
  // A daisy — one flower on a stem with a single leaf.
  {
    paths: [
      `M22 ${G} C 21 68 23 58 22 47`,
      "M22 66 C 17 62 13 62 11 65",
      "M22 36 L22 31.5 M24.8 37.2 L28 34 M26 40 L30.5 40 M24.8 42.8 L28 46 M19.2 42.8 L16 46 M18 40 L13.5 40 M19.2 37.2 L16 34",
    ],
    dots: [{ cx: 22, cy: 40, r: 2.4 }],
  },
  // Poppy seed heads — two pods, one tall, one nodding aside.
  {
    paths: [
      `M22 ${G} C 23 66 21 54 22 43`,
      "M16.5 42 C 16.5 33 27.5 33 27.5 42 C 27.5 46 16.5 46 16.5 42 M17.5 35 L26.5 35",
      `M22 ${G} C 26 70 30 64 31 58`,
      "M28 57 C 28 51.5 35 51.5 35 57 C 35 60 28 60 28 57 M28.8 53 L34.2 53",
    ],
    dots: [],
  },
  // Plumed grass — two tall stems bending under their plumes.
  {
    paths: [
      `M22 ${G} C 22 60 20 40 13 24`,
      "M13 24 C 9 28 8 34 9 39 M13 24 C 15.5 30 15 36 13 41",
      `M22 ${G} C 23 62 26 46 31 35`,
      "M31 35 C 35 39 35.5 44 34.5 48 M31 35 C 31.5 40 30.5 45 29 48",
      `M22 ${G} C 18 70 14 66 8 65`,
      `M22 ${G} C 26 70 31 68 36 68`,
    ],
    dots: [],
  },
];

/** One per plant on the list. */
export const PLANT_MARKS: Silhouette[] = [...SCHEME_MARKS, ...EXTRA_MARKS];

/** The order the border walks the shapes in — tall, mid and low mixed. */
export const GHOST_ORDER = [1, 9, 4, 12, 7, 0, 10, 5, 14, 2, 11, 8, 3, 13, 6];

/* Garden visitors: not plants on the list, just company along the border. */

/** A small bird perched on a cane. */
export const BIRD_MARK: Silhouette = {
  paths: [
    `M21 ${G} L21 47`,
    "M13 43 C 15 34 26 33 29 39 C 30 42.5 27 46.5 22 46.5 C 18 46.5 14.5 45.5 13 43",
    "M13.5 43 L7 47.5",
    "M29 38.6 L33.5 39.6 L29.6 41",
    "M17.5 41 C 20.5 38.8 24 39.8 25 43",
  ],
  dots: [{ cx: 26.4, cy: 37.8, r: 0.9 }],
};

/** A butterfly lifting off a seedling. */
export const BUTTERFLY_MARK: Silhouette = {
  paths: [
    `M20 ${G} C 20 72 19 66 20 60`,
    "M20 68 C 16 65 13 65 11 67",
    "M27 42 C 21 32 16 35 19.5 40 C 21 42.5 24.5 43 27 42",
    "M27 42 C 33 32 38 35 34.5 40 C 33 42.5 29.5 43 27 42",
    "M27 42 C 23.5 44 23 48.5 25.8 47.5 C 27 47 27 44.5 27 42",
    "M27 42 C 30.5 44 31 48.5 28.2 47.5",
    "M27 40.5 L25 36 M27 40.5 L29 36",
  ],
  dots: [{ cx: 20, cy: 58.5, r: 1.3 }],
};
