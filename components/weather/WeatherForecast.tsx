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

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: WeatherForecastData }
  | { status: "error"; message: string };

function ForecastSkeleton() {
  return (
    <div
      className="bg-white border border-sand-line rounded-[10px] overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-center px-4 py-2.5 border-b border-sand-line">
        <div className="h-3 w-36 rounded bg-sand-line" />
      </div>
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex flex-col gap-2">
          <div className="h-12 w-20 rounded bg-sand-line" />
          <div className="h-3 w-24 rounded bg-sand-line" />
          <div className="h-3 w-16 rounded bg-sand-line" />
        </div>
        <div className="h-16 w-16 rounded-full bg-sand-line" />
      </div>
      <div className="flex gap-4 px-4 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-16 rounded bg-sand-line" />
        ))}
      </div>
    </div>
  );
}

export function WeatherForecast({ location, onChangeLocation }: Props) {
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/weather?lat=${location.latitude}&lng=${location.longitude}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<WeatherForecastData>;
      })
      .then((data) => {
        if (!cancelled) setFetchState({ status: "success", data });
      })
      .catch(() => {
        if (!cancelled) setFetchState({ status: "error", message: "Could not load the forecast right now." });
      });

    // Cleanup resets to loading before the next effect fires (i.e. before the
    // next fetch starts), so the skeleton shows immediately on location change
    // or retry — without needing a synchronous setState at the top of the effect.
    return () => {
      cancelled = true;
      setFetchState({ status: "loading" });
    };
  }, [location.latitude, location.longitude, retryCount]);

  if (fetchState.status === "loading") return <ForecastSkeleton />;

  if (fetchState.status === "error") {
    return (
      <div className="bg-paper border border-sand-line px-4 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans text-ink-soft truncate pr-2">
            {location.label}
          </span>
          <button
            type="button"
            onClick={onChangeLocation}
            className="text-xs font-sans text-marigold underline underline-offset-2 hover:text-marigold transition-colors duration-100 shrink-0"
          >
            Change
          </button>
        </div>
        <p className="font-sans text-sm text-ink-soft">{fetchState.message}</p>
        <button
          type="button"
          onClick={() => setRetryCount((n) => n + 1)}
          className="self-start font-sans text-sm text-marigold underline underline-offset-2 hover:text-marigold transition-colors duration-100"
        >
          Try again
        </button>
      </div>
    );
  }

  const { data } = fetchState;
  return (
    <div className="bg-white overflow-hidden u-island--compact">
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
