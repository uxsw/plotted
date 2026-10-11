/**
 * Pure derivations for the scheme page (components/SchemeResults.tsx): what
 * the figures and sentences are built from. No React, no I/O.
 */

import { jobMonths, type SchemeJob } from "@/lib/scheme-article";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The flowering-season colour family a month belongs to (`--sem-flowering-*`). */
export type SeasonBand = "winter" | "spring" | "early-summer" | "summer" | "autumn";

const MONTH_BAND: SeasonBand[] = [
  "winter", "winter", "spring", "spring", "spring", "early-summer",
  "summer", "summer", "autumn", "autumn", "autumn", "winter",
];

export function seasonBand(month: number): SeasonBand {
  return MONTH_BAND[month - 1];
}

/**
 * Consecutive runs of months, as [from, to] pairs. A run that crosses the new
 * year (Nov–Feb) comes back as one pair with `to < from`, listed first.
 */
export function monthRuns(months: number[] | null | undefined): [number, number][] {
  const set = new Set((months ?? []).filter((m) => m >= 1 && m <= 12));
  if (set.size === 0) return [];
  if (set.size === 12) return [[1, 12]];

  const runs: [number, number][] = [];
  let start: number | null = null;
  for (let m = 1; m <= 13; m++) {
    const on = m <= 12 && set.has(m);
    if (on && start === null) start = m;
    if (!on && start !== null) {
      runs.push([start, m - 1]);
      start = null;
    }
  }
  // December and January both in flower: the last run carries on into the first.
  if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) {
    const last = runs.pop()!;
    const first = runs.shift()!;
    runs.unshift([last[0], first[1]]);
  }
  return runs;
}

/** "May–Jul", "Nov–Feb", "May–Jun, Sep", "All year". Null when nothing is known. */
export function formatMonthRuns(months: number[] | null | undefined): string | null {
  const runs = monthRuns(months);
  if (runs.length === 0) return null;
  if (runs.length === 1 && runs[0][0] === 1 && runs[0][1] === 12) return "All year";
  return runs
    .map(([from, to]) => (from === to ? MONTH_ABBR[from - 1] : `${MONTH_ABBR[from - 1]}–${MONTH_ABBR[to - 1]}`))
    .join(", ");
}

/** The same, in full words for a sentence: "May to July". */
export function describeMonthRuns(months: number[] | null | undefined): string | null {
  const runs = monthRuns(months);
  if (runs.length === 0) return null;
  if (runs.length === 1 && runs[0][0] === 1 && runs[0][1] === 12) return "all year";
  return runs
    .map(([from, to]) => (from === to ? MONTH_NAMES[from - 1] : `${MONTH_NAMES[from - 1]} to ${MONTH_NAMES[to - 1]}`))
    .join(", ");
}

/**
 * The scheme's own season: the band with the most plant-months in flower. It
 * picks the page's accent, so two schemes rarely look alike. Spring when
 * nothing is known.
 */
export function peakSeason(plants: { flowering_months: number[] | null }[]): SeasonBand {
  const counts = new Map<SeasonBand, number>();
  for (const p of plants) {
    for (const m of p.flowering_months ?? []) {
      if (m < 1 || m > 12) continue;
      const band = seasonBand(m);
      counts.set(band, (counts.get(band) ?? 0) + 1);
    }
  }
  // Early summer is a single month, so it never wins on count; fold it into
  // summer for the purpose of choosing an accent.
  const summer = (counts.get("summer") ?? 0) + (counts.get("early-summer") ?? 0);
  counts.set("summer", summer);
  counts.delete("early-summer");

  let best: SeasonBand = "spring";
  let bestCount = 0;
  for (const band of ["spring", "summer", "autumn", "winter"] as const) {
    const count = counts.get(band) ?? 0;
    if (count > bestCount) {
      best = band;
      bestCount = count;
    }
  }
  return best;
}

export type YearSeason = "spring" | "summer" | "autumn" | "winter";

const YEAR_SEASONS: { season: YearSeason; label: string; months: number[] }[] = [
  { season: "spring", label: "Spring", months: [3, 4, 5] },
  { season: "summer", label: "Summer", months: [6, 7, 8] },
  { season: "autumn", label: "Autumn", months: [9, 10, 11] },
  { season: "winter", label: "Winter", months: [12, 1, 2] },
];

export type SeasonJobs = {
  season: YearSeason;
  label: string;
  /** "Mar–May" */
  span: string;
  isNow: boolean;
  jobs: SchemeJob[];
};

/**
 * Jobs grouped into the four seasons, the current season first: the gardening
 * year is read from today, not from January. A job sits in the season it
 * starts in; within a season, jobs run in month order.
 */
export function jobsBySeason(jobs: SchemeJob[], nowMonth: number): SeasonJobs[] {
  const nowIndex = YEAR_SEASONS.findIndex((s) => s.months.includes(nowMonth));
  const ordered = [...YEAR_SEASONS.slice(nowIndex), ...YEAR_SEASONS.slice(0, nowIndex)];
  return ordered.map(({ season, label, months }, i) => ({
    season,
    label,
    span: `${MONTH_ABBR[months[0] - 1]}–${MONTH_ABBR[months[2] - 1]}`,
    isNow: i === 0,
    jobs: jobs
      .filter((j) => months.includes(j.from))
      .sort((a, b) => months.indexOf(a.from) - months.indexOf(b.from)),
  }));
}

/** "Mar" or "Feb–Mar" for a job's label. */
export function formatJobSpan(job: Pick<SchemeJob, "from" | "to">): string {
  return job.from === job.to ? MONTH_ABBR[job.from - 1] : `${MONTH_ABBR[job.from - 1]}–${MONTH_ABBR[job.to - 1]}`;
}

export function jobsInMonth(jobs: SchemeJob[], month: number): SchemeJob[] {
  return jobs.filter((j) => jobMonths(j).includes(month));
}

/** The next job to start after this month, looking up to a year ahead. */
export function nextJob(jobs: SchemeJob[], month: number): SchemeJob | null {
  for (let i = 1; i <= 11; i++) {
    const m = ((month - 1 + i) % 12) + 1;
    const found = jobs.find((j) => j.from === m);
    if (found) return found;
  }
  return null;
}

const NUMBER_WORDS = [
  "no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

/** Words to twenty, numerals beyond — the same convention as the shopping list's letterhead. */
export function numberWord(n: number): string {
  return n >= 0 && n <= 20 ? NUMBER_WORDS[n] : String(n);
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "40cm", "40–120cm"; null when no height is known. */
export function heightRange(plants: { height_cm: number | null }[]): string | null {
  const heights = plants.map((p) => p.height_cm).filter((h): h is number => h != null);
  if (heights.length === 0) return null;
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  return min === max ? `${min}cm` : `${min}–${max}cm`;
}
