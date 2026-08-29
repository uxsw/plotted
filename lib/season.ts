// A plain temporal label for the gardening calendar — one phrase per month,
// read against the UK's own timezone. This is date framing for the dashboard
// masthead, not horticultural advice: it names *when* we are, nothing more.
const SEASON_BY_MONTH = [
  "Midwinter", // Jan
  "Late winter", // Feb
  "Early spring", // Mar
  "Mid spring", // Apr
  "Late spring", // May
  "Early summer", // Jun
  "Midsummer", // Jul
  "Late summer", // Aug
  "Early autumn", // Sep
  "Mid autumn", // Oct
  "Late autumn", // Nov
  "Early winter", // Dec
] as const;

const LONDON = "Europe/London";

export function ukSeasonLabel(date: Date = new Date()): string {
  const month = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: LONDON, month: "numeric" }).format(date)
  );
  return SEASON_BY_MONTH[month - 1];
}

// "Friday, 29 August" — weekday and date, no year, in the UK's timezone.
export function ukDateLine(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
