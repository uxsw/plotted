"use client";

import { useState, useEffect } from "react";
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

type Props = {
  initialGarden: Garden | null;
};

export function WeatherLocation({ initialGarden }: Props) {
  const [location, setLocation] = useState<ResolvedLocation | null>(
    resolveFromGarden(initialGarden)
  );
  const [isSearching, setIsSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"pending" | "granted" | "denied" | "idle">(
    location ? "idle" : "pending"
  );

  useEffect(() => {
    if (location) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({ latitude: EXETER_LAT, longitude: EXETER_LNG, label: EXETER_LABEL });
      setGeoStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = "Current location";
        setLocation({ latitude, longitude, label });
        setGeoStatus("granted");
        saveGardenLocation(latitude, longitude, label).catch(console.error);
      },
      () => {
        setLocation({ latitude: EXETER_LAT, longitude: EXETER_LNG, label: EXETER_LABEL });
        setGeoStatus("denied");
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLocationSelect(latitude: number, longitude: number, label: string) {
    setLocation({ latitude, longitude, label });
    setIsSearching(false);
    await saveGardenLocation(latitude, longitude, label);
  }

  return (
    <div className="flex flex-col gap-4">
      {geoStatus === "pending" && !isSearching && (
        <p className="font-sans text-sm text-ink-soft">Detecting location…</p>
      )}

      {isSearching && (
        <LocationSearch
          onSelect={handleLocationSelect}
          onCancel={() => setIsSearching(false)}
        />
      )}

      {geoStatus === "denied" && !isSearching && location?.label === EXETER_LABEL && (
        <p className="font-sans text-xs text-ink-soft">
          Location access was denied — showing Exeter as default. Use the Change button to set your location.
        </p>
      )}

      {location && !isSearching && (
        <WeatherForecast
          location={location}
          onChangeLocation={() => setIsSearching(true)}
        />
      )}
    </div>
  );
}
