export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatSeason(from: number, to: number): string {
  return `${MONTH_ABBR[from - 1]}–${MONTH_ABBR[to - 1]}`;
}

export function getSeasonBand(from: number, to: number): "winter" | "spring" | "early-summer" | "summer" | "autumn" {
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

export const SEASON_STYLES = {
  "winter":       { background: "#D8E4ED", color: "#3D6278" },
  "spring":       { background: "#D4E8D0", color: "#3A6438" },
  "early-summer": { background: "#E8EDCC", color: "#4E5818" },
  "summer":       { background: "#f3badf", color: "#68124a" },
  "autumn":       { background: "#EDD4BE", color: "#663818" },
} as const;

function FlowerIconSvg({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="1.4" fill={color} stroke="none" />
      <ellipse cx="6" cy="2.5" rx="1.1" ry="1.5" fill={color} stroke="none" />
      <ellipse cx="6" cy="9.5" rx="1.1" ry="1.5" fill={color} stroke="none" />
      <ellipse cx="2.5" cy="6" rx="1.5" ry="1.1" fill={color} stroke="none" />
      <ellipse cx="9.5" cy="6" rx="1.5" ry="1.1" fill={color} stroke="none" />
    </svg>
  );
}

export function FloweringSeasonChip({ from, to }: { from: number; to: number }) {
  const band = getSeasonBand(from, to);
  const style = SEASON_STYLES[band];
  return (
    <span
      style={{ background: style.background, color: style.color }}
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-sans leading-none"
    >
      {formatSeason(from, to)}
    </span>
  );
}

export function FloweringSeasonBadge({ from, to }: { from: number; to: number }) {
  const band = getSeasonBand(from, to);
  const style = SEASON_STYLES[band];
  return (
    <span
      style={{ background: style.background, color: style.color }}
      className="c-flowering-season-chip minion"
    >
      <FlowerIconSvg color={style.color} />
      {formatSeason(from, to)}
    </span>
  );
}
