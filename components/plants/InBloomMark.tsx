import type { SeasonBand } from "@/components/ui/FloweringSeasonBadge";

/**
 * A quiet "flowering right now" stamp for the plant card's media well —
 * shown only when the current month falls inside the plant's flowering
 * window. This is the plant list's one piece of live seasonal truth: at a
 * glance across the grid you can see what the garden is doing this week.
 * Deliberately not a score or a count — just a mark on the plate.
 *
 * Passed to <Card> through its `marker` slot (top-left of the media well).
 */
export function InBloomMark({ seasonBand }: { seasonBand: SeasonBand }) {
  return (
    <span className="c-bloom-mark" data-season={seasonBand}>
      <span className="c-bloom-mark__dot" aria-hidden="true" />
      <span className="c-bloom-mark__text o-type-label">In bloom</span>
    </span>
  );
}
