import type { CSSProperties } from "react";
import {
  PLANT_MARKS,
  BIRD_MARK,
  BUTTERFLY_MARK,
} from "@/components/shopping/borderMarks";

/**
 * The planting that stands on each band's ground line, in two hands. The near
 * row is the brush-drawn plants (design/plotted-plants, gathered into
 * public/walk-plants.svg by scripts/build-plant-art.mjs) in full ink; the far
 * row is the app's engraved marks (single strokes, dots for flower heads) in a
 * tint of the band, so the two read as depth rather than as a clash. Each
 * plant is its own svg so the row can overflow and clip from the centre at any
 * width without rescaling. Marks are only imported from borderMarks; nothing
 * is added there.
 *
 * Styles: `.c-walk__horizon` in styles/pages/_home.scss.
 */

/* Every mark is drawn in a 44-wide frame, ground at y = 78, top at y = 18. */
const FRAME_TOP = 16;
const FRAME_H = 62;
const STROKE_PX = 2;

type Visitor = "bird" | "butterfly";

/* Deterministic, so server and client agree and a band always grows the same border. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const WALK_ORDER = [11, 0, 3, 9, 14, 5, 1, 12, 7, 2, 10, 4, 13, 8, 6];

/* The symbols in public/walk-plants.svg, dealt so tall and low alternate. */
const BRUSH_PLANTS = [
  "cotinus", "thyme", "allium", "alchemilla", "rose", "carex",
  "euphorbia", "fern", "teasel", "thyme", "echinacea", "carex",
  "calamagrostis", "alchemilla", "verbena",
];

export default function Horizon({
  seed,
  blooms,
  count = 46,
  visitors = [],
  immediate = false,
  reach = 1,
}: {
  seed: number;
  /** Flower-head colours, dealt along the row. */
  blooms: string[];
  count?: number;
  /** Positions (0–count) where a bird or butterfly keeps the plants company. */
  visitors?: [number, Visitor][];
  /** Draw on load rather than when scrolled to (the first band only). */
  immediate?: boolean;
  /** Scales every plant's height; under 1 keeps a planting low. */
  reach?: number;
}) {
  const rand = lcg(seed);
  const visitorAt = new Map(visitors);

  let dealt = Math.floor(rand() * BRUSH_PLANTS.length);
  const plants = Array.from({ length: count }, (_, i) => {
    const visitor = visitorAt.get(i);
    const far = !visitor && rand() > 0.56;
    const brush = visitor || far ? null : BRUSH_PLANTS[dealt++ % BRUSH_PLANTS.length];
    const mark = visitor
      ? visitor === "bird"
        ? BIRD_MARK
        : BUTTERFLY_MARK
      : PLANT_MARKS[WALK_ORDER[(i + Math.floor(rand() * 3)) % WALK_ORDER.length]];
    /* Brush plants share one artboard, so one frame height keeps their true sizes. */
    const height = (visitor ? 11 : brush ? 21 + rand() * 5 : 18 + rand() * 7) * reach;
    return {
      mark,
      visitor,
      brush,
      far,
      height,
      bloom: blooms[Math.floor(rand() * blooms.length)],
      sway: !visitor && rand() > 0.55,
      /* Plants crowd one another: each gives up about half its frame or more. */
      overlap: ((height * 44) / FRAME_H) * (brush ? 0.5 + rand() * 0.14 : 0.62 + rand() * 0.18),
    };
  });

  return (
    <div
      className={`c-walk__horizon${immediate ? " is-in" : ""}`}
      data-horizon={immediate ? undefined : ""}
      aria-hidden="true"
    >
      <div className="c-walk__horizon-row">
        {plants.map((p, i) => {
          const style = {
            "--_h": p.height.toFixed(2),
            "--_bloom": p.bloom,
            "--_delay": `${(Math.abs(i - count / 2) * 0.05).toFixed(2)}s`,
            "--_overlap": `${p.overlap.toFixed(2)}rem`,
          } as CSSProperties;
          const sway = p.sway ? " is-sway" : "";

          if (p.brush) {
            return (
              <svg key={i} className={`c-walk__plant is-brush${sway}`} viewBox="0 0 440 620" style={style}>
                <use href={`/walk-plants.svg#${p.brush}`} />
              </svg>
            );
          }

          return (
            <svg
              key={i}
              className={`c-walk__plant${p.far ? " is-far" : ""}${
                p.visitor ? ` is-visitor is-${p.visitor}` : ""
              }${sway}`}
              viewBox={`0 ${FRAME_TOP} 44 ${FRAME_H}`}
              style={style}
              strokeWidth={((FRAME_H * STROKE_PX) / (p.height * 16)).toFixed(3)}
            >
              {p.mark.paths.map((d, j) => (
                <path key={j} d={d} pathLength={1} />
              ))}
              {p.mark.dots.map((dot, j) => (
                <circle key={j} cx={dot.cx} cy={dot.cy} r={dot.r * 2.1} />
              ))}
            </svg>
          );
        })}
      </div>
    </div>
  );
}
