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
 * Fallback chain when there's no species: genus alone (a deliberate
 * genus-only identification — see spec's genus-fallback), then "Unnamed
 * plant" only when there's truly nothing (the fully unidentified state).
 * Genus is never shown alongside species here — that binomial form lives in
 * lib/plantName.tsx's plantDisplayTitle; this component's job is the
 * card/detail heading specifically, where species-with-genus hasn't been
 * the existing convention and isn't being introduced by this fix.
 */
export function PlantName({ genus, species, cultivar, commonNames, variant = "card" }: PlantNameProps) {
  const hasScientific = !!(species || cultivar);
  const bareGenus = !hasScientific && genus ? genus : null;

  if (variant === "detail") {
    return (
      <div>
        <div className="font-display font-semibold text-2xl leading-snug">
          {hasScientific ? (
            <>
              {species && <span>{species[0].toUpperCase() + species.slice(1)}</span>}
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
      {species && <span>{species[0].toUpperCase() + species.slice(1)}</span>}
      {cultivar && <> <em>&apos;{cultivar}&apos;</em></>}
    </span>
  );
}
