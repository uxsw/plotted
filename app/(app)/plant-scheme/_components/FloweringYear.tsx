"use client";

/**
 * The flowering year — a twelve-month band under the scheme list's letterhead
 * that fills in as plants are added, showing when the border will be in flower
 * and where it goes quiet. Months take their flowering-season colour from the
 * `--sem-flowering-*` families; the current month carries a small tick, since
 * the gardening year is the product's clock.
 *
 * Purely presentational: aggregates `months` across the scheme's plants. A
 * cell's fill is an incidental transition (default curve) — the strip reacts,
 * it doesn't perform.
 *
 * Styles: `.c-scheme-year` in styles/components/_scheme-chat.scss.
 */

import type { SchemePlant } from "./PlantSchemeContext";

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Month (1–12) → the flowering-season badge family it belongs to. */
const MONTH_SEASON: Record<number, string> = {
  1: "winter",
  2: "winter",
  3: "spring",
  4: "spring",
  5: "spring",
  6: "early-summer",
  7: "summer",
  8: "summer",
  9: "autumn",
  10: "autumn",
  11: "autumn",
  12: "winter",
};

/** "In flower May to October" / "quiet November to April" for screen readers. */
function describeCoverage(covered: Set<number>): string {
  if (covered.size === 0) return "No flowering months covered yet.";
  if (covered.size === 12) return "In flower all year round.";
  const runs: string[] = [];
  let start: number | null = null;
  for (let m = 1; m <= 13; m++) {
    const inFlower = m <= 12 && covered.has(m);
    if (inFlower && start === null) start = m;
    if (!inFlower && start !== null) {
      runs.push(
        start === m - 1
          ? MONTH_NAMES[start - 1]
          : `${MONTH_NAMES[start - 1]} to ${MONTH_NAMES[m - 2]}`
      );
      start = null;
    }
  }
  return `In flower ${runs.join(", ")}.`;
}

export default function FloweringYear({ plants }: { plants: SchemePlant[] }) {
  const covered = new Set(plants.flatMap((p) => p.months));
  const nowMonth = new Date().getMonth() + 1;

  return (
    <div className="c-scheme-year">
      <div className="c-scheme-year__strip" aria-hidden="true">
        {MONTH_LETTERS.map((letter, i) => {
          const month = i + 1;
          const inFlower = covered.has(month);
          return (
            <span
              key={month}
              className={[
                "c-scheme-year__month",
                "minion",
                inFlower ? `is-covered is-${MONTH_SEASON[month]}` : "",
                month === nowMonth ? "is-now" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={inFlower ? `${MONTH_NAMES[i]} — in flower` : MONTH_NAMES[i]}
            >
              {letter}
            </span>
          );
        })}
      </div>
      <p className="u-visually-hidden">{describeCoverage(covered)}</p>
    </div>
  );
}
