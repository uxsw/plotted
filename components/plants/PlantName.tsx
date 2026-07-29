import type { ReactNode } from "react";

interface PlantNameProps {
  genus?: string | null;
  species?: string | null;
  cultivar?: string | null;
  commonNames?: string[] | null;
  variant?: "card" | "detail";
}

/**
 * Renders plant name in the standard card/detail pattern:
 * species (upright) + 'cultivar' (italic) on the primary line,
 * common names below in muted text (detail variant only).
 *
 * Fallback chain: common name (handled by the caller, not here — this
 * component only ever renders the scientific line) → full "Genus species"
 * binomial when both are available → bare species alone when genus is blank
 * (legacy rows only — genus is populated on every current write path) →
 * bare genus alone (a deliberate genus-only identification — see spec's
 * genus-fallback) → "Unnamed plant" when there's truly nothing.
 *
 * Species is only capitalised when standing in alone (no genus to lead the
 * name) — once genus is shown, species reverts to lowercase per normal
 * binomial convention.
 */
function speciesLine(genus: string | null | undefined, species: string): ReactNode {
  if (genus) return <span>{genus} {species}</span>;
  return <span>{species[0].toUpperCase() + species.slice(1)}</span>;
}

export function PlantName({ genus, species, cultivar, commonNames, variant = "card" }: PlantNameProps) {
  const hasScientific = !!(species || cultivar);
  const bareGenus = !hasScientific && genus ? genus : null;

  if (variant === "detail") {
    return (
      <div>
        <div className="font-display font-semibold text-2xl leading-snug">
          {hasScientific ? (
            <>
              {species && speciesLine(genus, species)}
              {cultivar && <> <em>&lsquo;{cultivar}&rsquo;</em></>}
            </>
          ) : bareGenus ? (
            <span>{bareGenus}</span>
          ) : (
            <span>Unnamed plant</span>
          )}
        </div>
        {commonNames && commonNames.length > 0 && (
          <p className="font-sans text-sm text-ink-soft mt-0.5">
            {commonNames.join(", ")}
          </p>
        )}
      </div>
    );
  }

  // card variant — rendered inside Card's h3, no wrapper needed
  if (!hasScientific) return <span>{bareGenus ?? "Unnamed plant"}</span>;
  return (
    <span>
      {species && speciesLine(genus, species)}
      {cultivar && <> <em>&apos;{cultivar}&apos;</em></>}
    </span>
  );
}
