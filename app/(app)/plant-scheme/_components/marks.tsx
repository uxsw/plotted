/**
 * Single-stroke engraving marks for the planting-scheme journey, in the faint
 * ink of SpecimenPlate's monogram. Shared by the entry screen's choice plates
 * and the steps that follow, so a path keeps its motif as the user moves
 * through it.
 *
 * `className` lets each surface place and colour the mark (it draws in
 * `currentColor`); every path stays `aria-hidden`.
 */

type MarkProps = { className?: string };

/** "From your garden" — an established clump already in leaf, rising off a
 *  short ground line. */
export function EstablishedBedMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M28 104 H92" />
      <path d="M60 104 C60 84 60 66 60 44" />
      <path d="M60 88 C44 86 33 76 31 60 C47 60 58 70 60 84" />
      <path d="M60 74 C76 72 87 62 89 46 C73 46 62 56 60 70" />
      <path d="M60 58 C48 56 40 47 39 34 C51 35 59 44 60 55" />
      <path d="M60 50 C71 47 78 39 79 27 C69 29 62 37 60 47" />
    </svg>
  );
}

/** "From scratch" — a bare plot: drawn furrows across the ground, with one
 *  seedling just breaking through. */
export function BarePlotMark({ className }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 74 C42 62 78 62 108 74" />
      <path d="M12 90 C42 78 78 78 108 90" />
      <path d="M12 106 C42 94 78 94 108 106" />
      <path d="M60 70 C60 58 60 50 60 40" />
      <path d="M60 56 C51 55 45 48 44 38 C53 39 59 46 60 55" />
      <path d="M60 52 C69 50 75 43 76 33 C67 34 61 41 60 50" />
    </svg>
  );
}
