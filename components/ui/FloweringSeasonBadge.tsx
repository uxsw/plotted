export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatSeason(from: number, to: number): string {
  return `${MONTH_ABBR[from - 1]}–${MONTH_ABBR[to - 1]}`;
}

export type SeasonBand = "winter" | "spring" | "early-summer" | "summer" | "autumn";

export function getSeasonBand(from: number, to: number): SeasonBand {
  let mid: number;
  if (from <= to) {
    mid = Math.round((from + to) / 2);
  } else {
    const span = (to + 12 - from);
    mid = ((from + Math.round(span / 2) - 1) % 12) + 1;
  }
  if (mid === 12 || mid <= 2) return "winter";
  if (mid <= 5) return "spring";
  if (mid === 6) return "early-summer";
  if (mid <= 8) return "summer";
  return "autumn";
}

export const FLOWERING_SEASON_BADGE_MODIFIER: Record<SeasonBand, string> = {
  "winter": "is-flowering-winter",
  "spring": "is-flowering-spring",
  "early-summer": "is-flowering-early-summer",
  "summer": "is-flowering-summer",
  "autumn": "is-flowering-autumn",
};

function FlowerIconSvg() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <ellipse cx="6" cy="2.5" rx="1.1" ry="1.5" fill="currentColor" stroke="none" />
      <ellipse cx="6" cy="9.5" rx="1.1" ry="1.5" fill="currentColor" stroke="none" />
      <ellipse cx="2.5" cy="6" rx="1.5" ry="1.1" fill="currentColor" stroke="none" />
      <ellipse cx="9.5" cy="6" rx="1.5" ry="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FloweringSeasonBadge({ from, to }: { from: number; to: number }) {
  const band = getSeasonBand(from, to);
  return (
    <span className={`o-badge ${FLOWERING_SEASON_BADGE_MODIFIER[band]}`}>
      <FlowerIconSvg />
      {formatSeason(from, to)}
    </span>
  );
}
