import { ukDateLine, ukSeasonLabel } from "@/lib/season";

// The dashboard masthead: today's date on the left, the season on the right,
// a hairline rule beneath — a running header for a page that is always "today".
// Both parts are pure date framing; nothing here makes a claim about the garden.
export default function DashboardDateline() {
  const now = new Date();

  return (
    <header className="c-dash-dateline">
      <p className="c-dash-dateline__date pica o-type-display kirk">{ukDateLine(now)}</p>
      <p className="c-dash-dateline__season o-type-label">{ukSeasonLabel(now)}</p>
    </header>
  );
}
