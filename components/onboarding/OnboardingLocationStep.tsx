"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LocationSearch } from "@/components/weather/LocationSearch";
import { saveGardenLocation } from "@/app/actions/garden";
import { markOnboardingLocationSeen } from "@/app/actions/onboarding";

export function OnboardingLocationStep() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSelect(latitude: number, longitude: number, label: string) {
    setError(null);
    startTransition(async () => {
      const result = await saveGardenLocation(latitude, longitude, label);
      if (result.error) {
        setError(result.error);
        return;
      }
      await markOnboardingLocationSeen();
      router.push("/plants");
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await markOnboardingLocationSeen();
      router.push("/plants");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-medium text-2xl text-ink">
          Where&apos;s your garden?
        </h1>
        <p className="text-sm font-sans text-ink-soft">
          Used for local weather forecasts. You can change this later in your
          account settings.
        </p>
      </div>

      {error && (
        <p className="text-sm font-sans text-clay">{error}</p>
      )}

      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <LocationSearch onSelect={handleSelect} onCancel={handleSkip} />
      </div>

      <button
        type="button"
        onClick={handleSkip}
        disabled={isPending}
        className="self-start text-sm font-sans text-ink-soft underline underline-offset-2 hover:text-ink transition-colors duration-100 disabled:opacity-50"
      >
        Skip for now
      </button>
    </div>
  );
}
