import type { SeasonBand } from "@/components/ui/FloweringSeasonBadge";

/**
 * The photo-less plant card's media well, treated as a nursery-catalogue
 * specimen plate rather than an empty state: a matted hairline frame, an
 * oversized botanical monogram (the genus initial, set italic per the
 * Latin-in-Italic Rule), and a mono plate number where the illustration
 * caption would sit. It reads as "catalogued, illustration pending" instead
 * of "broken", and it stays calm across a whole grid of them.
 *
 * Passed to <Card> through its `placeholder` slot.
 */

const LETTER = /\p{L}/u;

function monogramFrom(...candidates: (string | null | undefined)[]): string | null {
  for (const value of candidates) {
    if (!value) continue;
    for (const char of value) {
      if (LETTER.test(char)) return char.toUpperCase();
    }
  }
  return null;
}

export function SpecimenPlate({
  genus,
  species,
  cultivar,
  commonName,
  plateNumber,
  seasonBand,
}: {
  genus?: string | null;
  species?: string | null;
  cultivar?: string | null;
  commonName?: string | null;
  /** 1-based position in the full portfolio, stable across search/filter. */
  plateNumber: number;
  /** Tints the mat a hair toward the plant's flowering season, when known. */
  seasonBand?: SeasonBand;
}) {
  const monogram = monogramFrom(genus, species, cultivar, commonName);
  const label = `Pl. ${String(plateNumber).padStart(2, "0")}`;

  return (
    <div
      className="c-specimen-plate"
      data-season={seasonBand ?? undefined}
      aria-hidden="true"
    >
      <div className="c-specimen-plate__frame">
        <span className="c-specimen-plate__number o-type-label">{label}</span>
        {monogram ? (
          <span className="c-specimen-plate__monogram o-type-display">{monogram}</span>
        ) : (
          <SeedheadMark />
        )}
      </div>
    </div>
  );
}

/** Fallback when there is no letter to draw a monogram from — a plain
 *  engraving-style seed head, in the same faint ink as the monogram. */
function SeedheadMark() {
  return (
    <svg
      className="c-specimen-plate__mark"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M24 42V20" />
      <path d="M24 20c0-6 3-10 3-10s3 4 3 10-3 10-3 10-3-4-3-10Z" />
      <path d="M24 24c-1-5-5-8-5-8s-1 5 1 9 4 6 4 6" />
      <path d="M24 24c1-5 5-8 5-8s1 5-1 9-4 6-4 6" />
      <path d="M18 42h12" />
    </svg>
  );
}
