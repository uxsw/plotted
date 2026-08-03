"use client";

import { useState } from "react";
import { LocationSearch } from "./LocationSearch";
import { WeatherForecast } from "./WeatherForecast";
import { saveGardenLocation } from "@/app/actions/garden";
import type { Garden } from "@/lib/types";

const EXETER_LAT = 50.7184;
const EXETER_LNG = -3.5339;
const EXETER_LABEL = "Exeter, Devon, United Kingdom";

type ResolvedLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

function resolveFromGarden(garden: Garden | null): ResolvedLocation | null {
  if (garden?.latitude != null && garden?.longitude != null) {
    return {
      latitude: garden.latitude,
      longitude: garden.longitude,
      label: garden.location_label ?? "Saved location",
    };
  }
  return null;
}

// Exeter is a display-only default — never written to garden. A saved
// garden location always wins; nothing here attempts geolocation.
function computeInitialLocation(garden: Garden | null): ResolvedLocation {
  return (
    resolveFromGarden(garden) ?? {
      latitude: EXETER_LAT,
      longitude: EXETER_LNG,
      label: EXETER_LABEL,
    }
  );
}

type Props = {
  initialGarden: Garden | null;
};

export function WeatherLocation({ initialGarden }: Props) {
  const [location, setLocation] = useState<ResolvedLocation>(() =>
    computeInitialLocation(initialGarden)
  );
  const [isSearching, setIsSearching] = useState(false);

  // Render-time adjustment (not a useEffect — see LocationSearch's
  // comparable pattern) that re-syncs when garden's location changes
  // elsewhere on the same page (e.g. the dashboard's onboarding card)
  // without a full reload. Only applies a resolved (non-null) garden
  // location — never reverts to the Exeter default this way, so it can't
  // clobber a location this component just set optimistically in
  // handleLocationSelect below before that write has round-tripped back
  // through props.
  const [prevInitialGarden, setPrevInitialGarden] = useState(initialGarden);
  if (prevInitialGarden !== initialGarden) {
    setPrevInitialGarden(initialGarden);
    const resolved = resolveFromGarden(initialGarden);
    if (resolved) setLocation(resolved);
  }

  async function handleLocationSelect(latitude: number, longitude: number, label: string) {
    setLocation({ latitude, longitude, label });
    setIsSearching(false);
    await saveGardenLocation(latitude, longitude, label);
  }

  const isDefaultLocation = location.label === EXETER_LABEL;

  return (
    <div className="flex flex-col gap-4">
      {isSearching && (
        <LocationSearch
          onSelect={handleLocationSelect}
          onCancel={() => setIsSearching(false)}
        />
      )}

      {isDefaultLocation && !isSearching && (
        // Placeholder copy — for Natalie's review
        <p className="font-sans text-xs text-ink-soft">
          Showing Exeter as a default. Use the Change button to set your garden&apos;s location.
        </p>
      )}

      {!isSearching && (
        <WeatherForecast
          location={location}
          onChangeLocation={() => setIsSearching(true)}
        />
      )}
    </div>
  );
}
