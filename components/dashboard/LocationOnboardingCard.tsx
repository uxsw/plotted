"use client";

import { useState, useTransition } from "react";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { saveGardenLocation } from "@/app/actions/garden";
import { markOnboardingLocationSeen } from "@/app/actions/onboarding";

export function LocationOnboardingCard() {
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
    <section aria-label="Garden location" className="c-set-location">
      <h2 className="pica o-type-display kirk">Where&apos;s your garden?</h2>
      {/* Placeholder copy — for Natalie's review */}
      <p className="brevier">
        So we can show accurate weather and planting advice for your area.
      </p>

      {error && <p className="o-surface--error u-island">{error}</p>}

      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <LocationSearch
          key={searchResetKey}
          onSelect={handleSelect}
          onCancel={() => setSearchResetKey((n) => n + 1)}
        />
      </div>

      <button
        type="button"
        onClick={handleSkip}
        disabled={isPending}
        className="self-start text-sm font-sans text-ink-soft underline underline-offset-2 hover:text-ink transition-colors duration-100 disabled:opacity-50"
      >
        {/* Placeholder copy — for Natalie's review */}
        Skip for now
      </button>
    </section>
  );
}
