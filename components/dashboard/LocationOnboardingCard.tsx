"use client";

import { useState, useTransition } from "react";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { saveGardenLocation } from "@/app/actions/garden";
import { markOnboardingLocationSeen } from "@/app/actions/onboarding";
import clsx from "clsx";
import buttonStyles from "@/components/ui/Button.module.css";
import { Icon } from "@/components/ui/Icon";

type Props = {
  // Only read on mount. This is deliberate: the section that computes this
  // is a server component whose gate can re-evaluate on any incidental
  // re-render of /dashboard (e.g. a cookie mutated by a Server Action).
  // Reading it once here means this card can't unmount mid-action — it
  // only ever reflects the visibility computed at page-load time, and a
  // genuinely resolved location disappears on the next real navigation.
  initiallyVisible: boolean;
};

export function LocationOnboardingCard({ initiallyVisible }: Props) {
  const [isVisible] = useState(initiallyVisible);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "skipped">("idle");
  // Remounts LocationSearch to clear its internal query/results on
  // Escape or the search box's own Cancel button — those are low-stakes,
  // reversible actions and must never trigger handleSkip (which writes
  // onboarding_location_seen_at and permanently dismisses this card).
  const [searchResetKey, setSearchResetKey] = useState(0);

  function handleSelect(latitude: number, longitude: number, label: string) {
    setError(null);
    startTransition(async () => {
      const result = await saveGardenLocation(latitude, longitude, label);
      if (result.error) {
        setError(result.error);
        return;
      }
      await markOnboardingLocationSeen();
      setStatus("success");
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await markOnboardingLocationSeen();
      setStatus("skipped");
    });
  }

  if (!isVisible) return null;

  if (status === "success" || status === "skipped") {
    return (
      <section aria-label="Garden location">
        {/* Placeholder copy — for Natalie's review */}
        <p className="font-sans text-sm text-ink-soft">
          {status === "success" ? "Location saved." : "No problem — you can add this later in settings."}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Garden location" className="c-set-location o-stack">
      <div className="o-row align-top">
        <Icon name="mappin" aria-label="Add plant" />
        <div>
          <h2 className="pica o-type-display kirk o-row">
            
            Where&apos;s your garden?</h2>
          {/* Placeholder copy — for Natalie's review */}
          <p className="brevier">
            So we can show accurate weather and planting advice for your area.
          </p>
          {error && <p className="o-surface--error u-island">{error}</p>}
        </div>
        
      </div>

      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <LocationSearch
          key={searchResetKey}
          onSelect={handleSelect}
          onCancel={() => setSearchResetKey((n) => n + 1)}
        />
      </div>

      <div className="u-justify-end">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className={clsx(
            buttonStyles["o-button"],
            buttonStyles["o-button--ghost"],
            buttonStyles["o-button--flush-start"]
          )}
        >
          {/* Placeholder copy — for Natalie's review */}
          Skip for now
        </button>
      </div>
    </section>
  );
}
