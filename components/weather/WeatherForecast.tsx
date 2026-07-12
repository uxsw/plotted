"use client";

import { useState, useEffect } from "react";
import { CurrentConditions } from "./CurrentConditions";
import { HourlyStrip } from "./HourlyStrip";
import { DailyForecast } from "./DailyForecast";
import type { WeatherForecastData } from "@/lib/weather";

type ResolvedLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

type Props = {
  location: ResolvedLocation;
  onChangeLocation: () => void;
};

function ForecastSkeleton() {
  return (
    <div
      className="bg-paper border border-sand-line rounded-[10px] overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      {/* Location bar */}
      <div className="flex items-center px-4 py-2.5 border-b border-sand-line">
        <div className="h-3 w-36 rounded bg-sand-line" />
      </div>
      {/* Temp area */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex flex-col gap-2">
          <div className="h-12 w-20 rounded bg-sand-line" />
          <div className="h-3 w-24 rounded bg-sand-line" />
          <div className="h-3 w-16 rounded bg-sand-line" />
        </div>
        <div className="h-16 w-16 rounded-full bg-sand-line" />
      </div>
      {/* Stats */}
      <div className="flex gap-4 px-4 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-16 rounded bg-sand-line" />
        ))}
      </div>
    </div>
  );
}

export function WeatherForecast({ location, onChangeLocation }: Props) {
  const [data, setData] = useState<WeatherForecastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/weather?lat=${location.latitude}&lng=${location.longitude}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<WeatherForecastData>;
      })
      .then(setData)
      .catch(() => setError("Could not load the forecast right now."))
      .finally(() => setLoading(false));
  }, [location.latitude, location.longitude, retryCount]);

  if (loading) return <ForecastSkeleton />;

  if (error || !data) {
    return (
      <div className="bg-paper border border-sand-line rounded-[10px] px-4 py-5 flex flex-col gap-3">
        {/* Keep location controls accessible even on error */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans text-ink-soft truncate pr-2">
            {location.label}
          </span>
          <button
            type="button"
            onClick={onChangeLocation}
            className="text-xs font-sans text-moss underline underline-offset-2 hover:text-moss-deep transition-colors duration-100 shrink-0"
          >
            Change
          </button>
        </div>
        <p className="font-sans text-sm text-ink-soft">
          {error ?? "Could not load the forecast right now."}
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((n) => n + 1)}
          className="self-start font-sans text-sm text-moss underline underline-offset-2 hover:text-moss-deep transition-colors duration-100"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-sand-line rounded-[10px] overflow-hidden">
      <CurrentConditions
        current={data.current}
        locationLabel={location.label}
        onChangeLocation={onChangeLocation}
      />
      <HourlyStrip hourly={data.hourly} current={data.current} />
      <DailyForecast daily={data.daily} />
    </div>
  );
}
