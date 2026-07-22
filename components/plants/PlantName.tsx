interface PlantNameProps {
  species?: string | null;
  cultivar?: string | null;
  commonNames?: string[] | null;
  variant?: "card" | "detail";
}

/**
 * Renders plant name in the standard card/detail pattern:
 * species (upright) + 'cultivar' (italic) on the primary line,
 * common names below in muted text (detail variant only).
 */
export function PlantName({ species, cultivar, commonNames, variant = "card" }: PlantNameProps) {
  const hasScientific = !!(species || cultivar);

  if (variant === "detail") {
    return (
      <div>
        <div className="font-display font-semibold text-2xl leading-snug">
          {hasScientific ? (
            <>
              {species && <span>{species[0].toUpperCase() + species.slice(1)}</span>}
              {cultivar && <> <em>&lsquo;{cultivar}&rsquo;</em></>}
            </>
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
  if (!hasScientific) return <span>Unnamed plant</span>;
  return (
    <span>
      {species && <span>{species[0].toUpperCase() + species.slice(1)}</span>}
      {cultivar && <> <em>&apos;{cultivar}&apos;</em></>}
    </span>
  );
}
