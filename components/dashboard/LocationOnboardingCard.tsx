"use client";

import { useState, useTransition } from "react";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { saveGardenLocation } from "@/app/actions/garden";
import { markOnboardingLocationSeen } from "@/app/actions/onboarding";

export function LocationOnboardingCard() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "skipped">("idle");

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
    <section aria-label="Garden location">
      <h2 className="pica o-type-display kirk">Where&apos;s your garden?</h2>
      {/* Placeholder copy — for Natalie's review */}
      <p className="font-sans text-sm text-ink-soft">
        So we can show accurate weather and planting advice for your area.
      </p>

      {error && <p className="text-sm font-sans text-clay">{error}</p>}

      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <LocationSearch onSelect={handleSelect} onCancel={handleSkip} />
      </div>

      <button
        type="button"
        onClick={handleSkip}
        disabled={isPending}
        className="self-start text-sm font-sans text-ink-soft underline underline-offset-2 hover:text-ink transition-colors duration-100 disabled:opacity-50"
      >
        {/* Placeholder copy — for Natalie's review */}
        Skip for now, use Exeter as default
      </button>
    </section>
  );
}
