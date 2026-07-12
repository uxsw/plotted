"use client";

import { useState, useEffect } from "react";
import { LocationSearch } from "./LocationSearch";
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
        // Save to the garden record (fire-and-forget — don't block the UI on this)
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {isSearching ? (
          <LocationSearch
            onSelect={handleLocationSelect}
            onCancel={() => setIsSearching(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-sans text-ink">
              {geoStatus === "pending" ? (
                <span className="text-ink-soft">Detecting location…</span>
              ) : (
                location?.label ?? "Unknown location"
              )}
            </span>
            {geoStatus !== "pending" && (
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                className="text-xs font-sans text-moss underline underline-offset-2 hover:text-moss-deep transition-colors duration-100"
              >
                Change
              </button>
            )}
          </div>
        )}

        {geoStatus === "denied" && !isSearching && location?.label === EXETER_LABEL && (
          <p className="text-xs font-sans text-ink-soft">
            Location access was denied — showing Exeter as default. Search above to set your location.
          </p>
        )}
      </div>

      {location && (
        <div className="rounded border border-sand-line bg-paper p-4">
          <p className="text-xs font-sans text-ink-soft">
            Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
          <p className="text-xs font-sans text-ink-soft mt-1">
            Weather forecast will appear here in Stage 3.
          </p>
        </div>
      )}
    </div>
  );
}
