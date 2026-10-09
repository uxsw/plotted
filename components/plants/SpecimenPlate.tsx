import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * The media well for a plant (or scheme) with no image: one of three gradient
 * grounds with an oversized monogram, the plant's first letter, on top. Purely
 * decorative. It fills its positioned parent (absolute, inset 0) and sizes the
 * letter from its own width, so the same plate works in a card, a list row or
 * a 40px thumbnail.
 *
 * `variant="plain"` is for a name that isn't known to be Latin — a shopping
 * list item someone typed or dictated ("bugle", "that red salvia"). The
 * monogram is drawn from `name` and set upright: italic is reserved for
 * Latin, and a free-text name must not borrow it.
 *
 * Pass `children` to show something other than a letter (a scheme's
 * illustration, say) on the same ground.
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

/**
 * Which of the three grounds a plate gets. Only there for variety across a
 * page, so a cheap sum of the seed's characters is enough. Derived rather
 * than random so server and client render the same one.
 */
export function plateGradient(seed: string): 1 | 2 | 3 {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return ((sum % 3) + 1) as 1 | 2 | 3;
}

export function SpecimenPlate({
  genus,
  species,
  cultivar,
  commonName,
  name,
  variant = "latin",
  seed,
  children,
}: {
  genus?: string | null;
  species?: string | null;
  cultivar?: string | null;
  commonName?: string | null;
  /** Free-text name; the only monogram source when variant is "plain". */
  name?: string | null;
  variant?: "latin" | "plain";
  /** Picks the gradient. Defaults to the plant's names. */
  seed?: string;
  /** Replaces the monogram. */
  children?: ReactNode;
}) {
  const monogram =
    variant === "plain"
      ? monogramFrom(name)
      : monogramFrom(genus, species, cultivar, commonName);

  return (
    <div
      className={clsx("c-specimen-plate", variant === "plain" && "c-specimen-plate--plain")}
      data-gradient={plateGradient(seed ?? [genus, species, cultivar, commonName, name].join(""))}
      aria-hidden="true"
    >
      {children ??
        (monogram ? (
          <span className="c-specimen-plate__monogram o-type-display">{monogram}</span>
        ) : (
          <SeedheadMark />
        ))}
    </div>
  );
}

/** Fallback when there is no letter to draw a monogram from — a plain
 *  engraving-style seed head, in the same ink as the monogram. */
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
